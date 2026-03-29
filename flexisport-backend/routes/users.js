const express = require("express");
const User = require("../models/User");
const { verifyToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

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
