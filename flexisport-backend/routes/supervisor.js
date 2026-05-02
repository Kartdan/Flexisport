const express = require("express");
const router = express.Router();
const Court = require("../models/Court");
const Tournament = require("../models/Tournament");
const ContactMessage = require("../models/ContactMessage");
const Post = require("../models/Post");
const User = require("../models/User");
const { verifyToken, requireSupervisorOrAdmin } = require("../middleware/auth");

// GET /api/supervisor/stats  — dashboard KPIs for supervisors
router.get("/stats", verifyToken, requireSupervisorOrAdmin, async (req, res) => {
  try {
    const [
      pendingCourts,
      activeCourts,
      publishedTournaments,
      pendingTournaments,
      unreadMessages,
      totalMessages,
      totalPosts,
      totalPlayers
    ] = await Promise.all([
      Court.countDocuments({ status: "pending" }),
      Court.countDocuments({ status: "accepted" }),
      Tournament.countDocuments({ publicationStatus: "published" }),
      Tournament.countDocuments({ status: "upcoming" }),
      ContactMessage.countDocuments({ recipientId: req.user.id, read: false }),
      ContactMessage.countDocuments({ recipientId: req.user.id }),
      Post.countDocuments(),
      User.countDocuments({ role: "player" })
    ]);

    res.json({
      pendingCourts,
      activeCourts,
      publishedTournaments,
      pendingTournaments,
      unreadMessages,
      totalMessages,
      totalPosts,
      totalPlayers
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

module.exports = router;
