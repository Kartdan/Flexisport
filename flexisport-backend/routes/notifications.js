const express = require("express");
const Notification = require("../models/Notification");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

router.get("/mine", verifyToken, async (req, res) => {
  try {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.set("Surrogate-Control", "no-store");
    res.set("ETag", `W/"notifications-${req.user.id}-${Date.now()}"`);

    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate("tournament", "name")
      .populate("court", "name")
      .populate("question", "question");

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

router.patch("/:id/read", verifyToken, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    if (notification.user.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    notification.isRead = true;
    await notification.save();

    res.json(notification);
  } catch (err) {
    res.status(500).json({ error: "Failed to update notification" });
  }
});

router.patch("/read-all", verifyToken, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user.id, isRead: false }, { $set: { isRead: true } });
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update notifications" });
  }
});

module.exports = router;
