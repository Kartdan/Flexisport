const express = require("express");
const User = require("../models/User");

const router = express.Router();

// SIGNUP route
router.post("/signup", async (req, res) => {
  try {
    const { fullName, username, email, password } = req.body;  // 👈 include fullName

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Create new user
    const newUser = new User({ fullName, username, email, password });
    const savedUser = await newUser.save();

    res.json({
      message: "✅ User registered successfully",
      user: {
        id: savedUser._id,
        fullName: savedUser.fullName,   // 👈 return full name
        username: savedUser.username,
        email: savedUser.email,
      }
    });
  } catch (err) {
    console.error("❌ Error signing up:", err);
    res.status(500).json({ error: "Failed to sign up" });
  }
});


module.exports = router;
