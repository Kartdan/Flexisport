const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");
const Tournament = require("../models/Tournament");
const { verifyToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();
const ALLOWED_SPORTS = ["football", "basketball", "tennis", "handball", "volleyball", "padel"];

async function computeGamesPlayedBySport(userId) {
  const playerObjectId = new mongoose.Types.ObjectId(userId);
  const games = await Tournament.aggregate([
    {
      $match: {
        status: "completed",
        registeredParticipants: { $in: [playerObjectId] }
      }
    },
    {
      $group: {
        _id: "$sport",
        count: { $sum: 1 }
      }
    }
  ]);

  const stats = {};
  ALLOWED_SPORTS.forEach((sport) => {
    stats[sport] = 0;
  });

  games.forEach((game) => {
    if (ALLOWED_SPORTS.includes(game._id)) {
      stats[game._id] = game.count;
    }
  });

  return stats;
}

router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const gamesPlayedBySport = await computeGamesPlayedBySport(user._id);
    res.json({
      ...user.toObject(),
      gamesPlayedBySport
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

router.put("/me", verifyToken, async (req, res) => {
  try {
    const updates = {};
    const nextFullName = typeof req.body.fullName === "string" ? req.body.fullName.trim() : "";
    const nextUsername = typeof req.body.username === "string" ? req.body.username.trim() : "";
    const nextEmail = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";

    if (!nextFullName || !nextUsername || !nextEmail) {
      return res.status(400).json({ error: "Full name, username and email are required" });
    }

    updates.fullName = nextFullName;
    updates.username = nextUsername;
    updates.email = nextEmail;

    if (!Array.isArray(req.body.preferredSports)) {
      return res.status(400).json({ error: "Preferred sports must be an array" });
    }

    const preferredSports = req.body.preferredSports
      .map((sport) => (typeof sport === "string" ? sport.trim().toLowerCase() : ""))
      .filter((sport) => ALLOWED_SPORTS.includes(sport));

    updates.preferredSports = Array.from(new Set(preferredSports));

    updates.personalDescription = typeof req.body.personalDescription === "string"
      ? req.body.personalDescription.trim().slice(0, 1000)
      : "";

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
      context: "query",
      select: "-password"
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const gamesPlayedBySport = await computeGamesPlayedBySport(user._id);
    res.json({
      ...user.toObject(),
      gamesPlayedBySport
    });
  } catch (err) {
    if (err && err.code === 11000) {
      if (err.keyPattern?.email) {
        return res.status(400).json({ error: "Email is already in use" });
      }
      if (err.keyPattern?.username) {
        return res.status(400).json({ error: "Username is already in use" });
      }
      return res.status(400).json({ error: "Duplicate value" });
    }
    res.status(500).json({ error: "Failed to update profile" });
  }
});

router.get("/", async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 });
    res.json(users);
  } catch (err) {
    console.error("❌ Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.get("/supervisors", verifyToken, requireAdmin, async (req, res) => {
  try {
    const supervisors = await User.find({ role: "supervisor" }, { password: 0 });
    res.set("Cache-Control", "no-store");
    res.json(supervisors);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch supervisors" });
  }
});

router.patch("/supervisors/:id/status", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["pending", "accepted", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: "supervisor" },
      { supervisorStatus: status },
      { new: true, select: "-password" }
    );

    if (!user) {
      return res.status(404).json({ error: "Supervisor not found" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to update supervisor status" });
  }
});

module.exports = router;
