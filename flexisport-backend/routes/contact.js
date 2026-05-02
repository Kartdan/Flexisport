const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const ContactMessage = require("../models/ContactMessage");
const User = require("../models/User");
const { verifyToken, requireAdmin, requireSupervisorOrAdmin } = require("../middleware/auth");

// Build nodemailer transporter from env (only if SMTP config is present)
function getTransporter() {
  if (!process.env.MAIL_HOST || !process.env.MAIL_USER || !process.env.MAIL_PASS) return null;
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT || "587"),
    secure: process.env.MAIL_PORT === "465",
    auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS }
  });
}

// Public: get accepted supervisors (name + email + preferredSports + personalDescription)
router.get("/supervisors", async (req, res) => {
  try {
    const supervisors = await User.find(
      { role: "supervisor", supervisorStatus: "accepted", suspended: { $ne: true } },
      { fullName: 1, email: 1, preferredSports: 1, personalDescription: 1, avatar: 1 }
    );
    res.json(supervisors);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch supervisors" });
  }
});

// Public: submit a contact message (must include recipientId)
router.post("/", async (req, res) => {
  try {
    const { name, email, subject, message, recipientId } = req.body;
    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return res.status(400).json({ error: "All fields are required" });
    }
    if (!recipientId) {
      return res.status(400).json({ error: "Please select a supervisor to send the message to" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email address" });
    }
    if (message.trim().length > 2000) {
      return res.status(400).json({ error: "Message too long (max 2000 characters)" });
    }

    // Validate recipient is an accepted, non-suspended supervisor
    const recipient = await User.findOne({
      _id: recipientId,
      role: "supervisor",
      supervisorStatus: "accepted",
      suspended: { $ne: true }
    });
    if (!recipient) {
      return res.status(400).json({ error: "Invalid recipient. Please select an available supervisor." });
    }

    // Optionally attach userId if auth header present
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (_) {}
    }

    const msg = await ContactMessage.create({
      name: name.trim().slice(0, 200),
      email: email.trim().toLowerCase(),
      subject: subject.trim().slice(0, 300),
      message: message.trim().slice(0, 2000),
      userId,
      recipientId: recipient._id,
      recipientEmail: recipient.email,
      recipientName: recipient.fullName
    });

    // Send email to supervisor (if SMTP is configured)
    const transporter = getTransporter();
    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"FlexiSport Contact" <${process.env.MAIL_USER}>`,
          replyTo: `"${name.trim()}" <${email.trim()}>`,
          to: recipient.email,
          subject: `[FlexiSport] ${subject.trim().slice(0, 300)}`,
          text: `You received a new message via FlexiSport:\n\nFrom: ${name.trim()} <${email.trim()}>\n\n${message.trim()}\n\n---\nReply directly to this email to respond to the sender.`
        });
      } catch (mailErr) {
        console.error("Email send failed (message still saved):", mailErr.message);
      }
    }

    res.status(201).json({ message: "Message sent successfully", id: msg._id });
  } catch (err) {
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Admin: list all contact messages
router.get("/", verifyToken, requireAdmin, async (req, res) => {
  try {
    const messages = await ContactMessage.find()
      .sort({ createdAt: -1 })
      .populate("userId", "fullName username")
      .populate("recipientId", "fullName email");
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Admin: mark a message as read/unread
router.patch("/:id/read", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { read } = req.body;
    const msg = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { read: !!read },
      { new: true }
    );
    if (!msg) return res.status(404).json({ error: "Message not found" });
    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: "Failed to update message" });
  }
});

// Admin: delete a message
router.delete("/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const msg = await ContactMessage.findByIdAndDelete(req.params.id);
    if (!msg) return res.status(404).json({ error: "Message not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete message" });
  }
});

// Supervisor: get messages addressed to me
router.get("/mine", verifyToken, requireSupervisorOrAdmin, async (req, res) => {
  try {
    const messages = await ContactMessage.find({ recipientId: req.user.id })
      .sort({ createdAt: -1 })
      .populate("userId", "fullName username");
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Supervisor: mark own message as read/unread
router.patch("/mine/:id/read", verifyToken, requireSupervisorOrAdmin, async (req, res) => {
  try {
    const msg = await ContactMessage.findOne({ _id: req.params.id, recipientId: req.user.id });
    if (!msg) return res.status(404).json({ error: "Message not found" });
    msg.read = !!req.body.read;
    await msg.save();
    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: "Failed to update message" });
  }
});

module.exports = router;
