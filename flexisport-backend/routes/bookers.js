const express = require("express");
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Court = require("../models/Court");
const Flag = require("../models/Flag");
const Notification = require("../models/Notification");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

// GET /api/bookers
// Returns unique users who have ever booked the requesting owner's courts, with booking count and flag status
router.get("/", verifyToken, async (req, res) => {
  try {
    // Find all courts owned by this user
    const courts = await Court.find({ author: req.user.id }, "_id name");
    const courtIds = courts.map(c => c._id);

    if (courtIds.length === 0) return res.json([]);

    // Aggregate unique bookers across all those courts
    const bookers = await Booking.aggregate([
      { $match: { court: { $in: courtIds } } },
      {
        $group: {
          _id: "$user",
          bookingCount: { $sum: 1 },
          lastBooking: { $max: "$date" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo"
        }
      },
      { $unwind: "$userInfo" },
      {
        $project: {
          _id: 1,
          bookingCount: 1,
          lastBooking: 1,
          "userInfo._id": 1,
          "userInfo.fullName": 1,
          "userInfo.username": 1,
          "userInfo.email": 1
        }
      },
      { $sort: { lastBooking: -1 } }
    ]);

    // Get all flags this owner has set
    const flags = await Flag.find({ owner: req.user.id }, "flaggedUser isFlagged note denyBooking");
    const flagMap = {};
    flags.forEach(f => {
      flagMap[f.flaggedUser.toString()] = { isFlagged: f.isFlagged, note: f.note || "", denyBooking: f.denyBooking };
    });

    const result = bookers.map(b => {
      const f = flagMap[b._id.toString()];
      return {
        user: b.userInfo,
        bookingCount: b.bookingCount,
        lastBooking: b.lastBooking,
        isFlagged: f ? f.isFlagged : false,
        flagNote: f ? f.note : null,
        denyBooking: f ? f.denyBooking : false
      };
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch bookers" });
  }
});

// GET /api/bookers/:userId/bookings
// Returns all bookings that userId has made on the requesting owner's courts
router.get("/:userId/bookings", verifyToken, async (req, res) => {
  try {
    const courts = await Court.find({ author: req.user.id }, "_id name");
    const courtIds = courts.map(c => c._id);

    if (courtIds.length === 0) return res.json([]);

    const bookings = await Booking.find({
      user: req.params.userId,
      court: { $in: courtIds }
    })
      .populate("court", "name address")
      .sort({ date: -1, startTime: -1 });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch bookings for user" });
  }
});

// POST /api/bookers/:userId/flag  —  toggle the suspicious flag on a user
router.post("/:userId/flag", verifyToken, async (req, res) => {
  try {
    const { note } = req.body;
    const existing = await Flag.findOne({ owner: req.user.id, flaggedUser: req.params.userId });
    const isNew = !existing || !existing.isFlagged;

    const flag = await Flag.findOneAndUpdate(
      { owner: req.user.id, flaggedUser: req.params.userId },
      { $set: { isFlagged: true, note: note || "" } },
      { upsert: true, new: true }
    );

    if (isNew) {
      let message = "You have been flagged by a court owner.";
      if (note) message += ` Reason: ${note}`;
      await Notification.create({
        user: req.params.userId,
        type: "user_flagged",
        title: "Account Flagged",
        message
      });
    }

    res.json({ isFlagged: true, flagNote: flag.note, denyBooking: flag.denyBooking });
  } catch (err) {
    res.status(500).json({ error: "Failed to flag user" });
  }
});

// DELETE /api/bookers/:userId/flag  —  remove the suspicious flag (keeps deny if set)
router.delete("/:userId/flag", verifyToken, async (req, res) => {
  try {
    const flag = await Flag.findOneAndUpdate(
      { owner: req.user.id, flaggedUser: req.params.userId },
      { $set: { isFlagged: false, note: "" } },
      { new: true }
    );
    // Clean up document if no restrictions remain
    if (flag && !flag.denyBooking) {
      await Flag.deleteOne({ _id: flag._id });
    }
    await Notification.create({
      user: req.params.userId,
      type: "user_unflagged",
      title: "Flag Removed",
      message: "A court owner has removed the flag from your account."
    });
    res.json({ isFlagged: false });
  } catch (err) {
    res.status(500).json({ error: "Failed to unflag user" });
  }
});

// POST /api/bookers/:userId/deny  —  deny a user from booking (independent of flag)
router.post("/:userId/deny", verifyToken, async (req, res) => {
  try {
    const flag = await Flag.findOneAndUpdate(
      { owner: req.user.id, flaggedUser: req.params.userId },
      { $set: { denyBooking: true } },
      { upsert: true, new: true }
    );
    await Notification.create({
      user: req.params.userId,
      type: "user_flagged",
      title: "Booking Access Denied",
      message: "A court owner has denied your ability to book their courts."
    });
    res.json({ isFlagged: flag.isFlagged, denyBooking: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to deny user" });
  }
});

// DELETE /api/bookers/:userId/deny  —  restore booking access
router.delete("/:userId/deny", verifyToken, async (req, res) => {
  try {
    const flag = await Flag.findOneAndUpdate(
      { owner: req.user.id, flaggedUser: req.params.userId },
      { $set: { denyBooking: false } },
      { new: true }
    );
    // Clean up document if no restrictions remain
    if (flag && !flag.isFlagged) {
      await Flag.deleteOne({ _id: flag._id });
    }
    await Notification.create({
      user: req.params.userId,
      type: "booking_access_restored",
      title: "Booking Access Restored",
      message: "A court owner has restored your ability to book their courts."
    });
    res.json({ denyBooking: false });
  } catch (err) {
    res.status(500).json({ error: "Failed to restore booking access" });
  }
});

module.exports = router;
