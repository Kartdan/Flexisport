const express = require("express");
const User = require("../models/User");

const router = express.Router();

// GET all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }); // exclude passwords
    res.json(users);
  } catch (err) {
    console.error("❌ Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

module.exports = router;
