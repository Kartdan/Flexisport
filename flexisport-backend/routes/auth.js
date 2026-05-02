const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Notification = require("../models/Notification");
const rateLimit = require("express-rate-limit");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again in 15 minutes." }
});

router.post("/register", authLimiter, async (req, res) => {
  try {
    const { fullName, username, email, password, role } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: "Email or username already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = {
      fullName,
      username,
      email,
      password: hashedPassword,
      role: role || 'player'
    };

    if (role === 'supervisor') {
      userData.supervisorStatus = 'pending';
    }

    const user = new User(userData);
    await user.save();

    // Notify all admins that a new supervisor is awaiting approval
    if (role === 'supervisor') {
      const admins = await User.find({ role: 'admin' }, { _id: 1 });
      if (admins.length > 0) {
        const notifications = admins.map(admin => ({
          user: admin._id,
          type: 'supervisor_registered',
          title: 'New Supervisor Registration',
          message: `${fullName} (${email}) has registered as a supervisor and is awaiting your approval.`
        }));
        await Notification.insertMany(notifications);
      }
    }

    res.status(201).json({ message: "Registration successful" });
  } catch (err) {
    res.status(500).json({ error: "Server error during registration" });
  }
});

router.post("/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    if (user.suspended) {
      return res.status(403).json({ error: "Your account has been suspended. Please contact support." });
    }

    if (user.role === 'supervisor') {
      if (user.supervisorStatus === 'pending') {
        return res.status(403).json({ error: "Your account is pending approval by an administrator." });
      }
      if (user.supervisorStatus === 'rejected') {
        return res.status(403).json({ error: "Your account has been rejected by an administrator." });
      }
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role,
        supervisorStatus: user.supervisorStatus || null,
        avatar: user.avatar || null
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Server error during login" });
  }
});


module.exports = router;
