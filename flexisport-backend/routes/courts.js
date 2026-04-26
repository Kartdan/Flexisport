const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const Court = require("../models/Court");
const Review = require("../models/Review");
const Notification = require("../models/Notification");
const BlockedSlot = require("../models/BlockedSlot");
const { verifyToken, requireAdmin } = require("../middleware/auth");

const courtStorage = multer.diskStorage({
  destination: path.join(__dirname, "../uploads/courts"),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({
  storage: courtStorage,
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error("Only JPEG, PNG and WebP allowed"), false);
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    const filter = { status: "accepted" };
    if (req.query.sport) filter.sportCategories = req.query.sport;
    const courts = await Court.find(filter).populate("author", "username email fullName");

    const courtIds = courts.map((court) => court._id);
    const reviewStats = courtIds.length > 0
      ? await Review.aggregate([
          { $match: { court: { $in: courtIds } } },
          {
            $group: {
              _id: "$court",
              averageRating: { $avg: "$rating" },
              totalReviews: { $sum: 1 }
            }
          }
        ])
      : [];

    const statsByCourtId = reviewStats.reduce((acc, stat) => {
      acc[stat._id.toString()] = {
        averageRating: Number(stat.averageRating.toFixed(1)),
        totalReviews: stat.totalReviews
      };
      return acc;
    }, {});

    const courtsWithRatings = courts.map((court) => {
      const ratingStats = statsByCourtId[court._id.toString()] || { averageRating: 0, totalReviews: 0 };
      return {
        ...court.toObject(),
        averageRating: ratingStats.averageRating,
        totalReviews: ratingStats.totalReviews
      };
    });

    res.json(courtsWithRatings);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch courts" });
  }
});

router.get("/mine/list", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Only owners can access this" });
    }
    res.set("Cache-Control", "no-store");
    const courts = await Court.find({ author: req.user.id });
    res.json(courts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch your courts" });
  }
});

router.get("/admin/list", verifyToken, requireAdmin, async (req, res) => {
  try {
    const courts = await Court.find().populate("author", "username email fullName");
    res.json(courts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch courts" });
  }
});

router.patch("/admin/:id/status", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["pending", "accepted", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const court = await Court.findById(req.params.id).populate("author", "username email fullName");
    if (!court) return res.status(404).json({ error: "Court not found" });

    const previousStatus = court.status;
    court.status = status;
    await court.save();

    if (previousStatus !== status && court.author?._id) {
      const statusLabels = {
        pending: "Pending",
        accepted: "Approved",
        rejected: "Rejected"
      };

      await Notification.create({
        user: court.author._id,
        type: "court_status",
        title: "Court status updated",
        message: `Your court \"${court.name}\" was ${statusLabels[status] || status}.`,
        court: court._id,
        isRead: false
      });
    }

    res.json(court);
  } catch (err) {
    res.status(500).json({ error: "Failed to update court status" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    const court = await Court.findById(req.params.id).populate("author", "username email fullName");
    if (!court) return res.status(404).json({ error: "Court not found" });
    res.json(court);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch court" });
  }
});

router.post("/", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Only owners can create courts" });
    }

    const courtData = {
      ...req.body,
      author: req.user.id,
      status: "pending"
    };

    const court = new Court(courtData);
    const saved = await court.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: "Failed to create court" });
  }
});

router.post("/:id/photos", verifyToken, upload.array("photos", 10), async (req, res) => {
  try {
    const court = await Court.findById(req.params.id);
    if (!court) return res.status(404).json({ error: "Court not found" });
    if (court.author.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const photoUrls = req.files.map(f => `/uploads/courts/${f.filename}`);
    court.photos.push(...photoUrls);
    await court.save();
    res.json(court);
  } catch (err) {
    res.status(500).json({ error: "Failed to upload photos" });
  }
});

router.delete("/:id/photos", verifyToken, async (req, res) => {
  try {
    const court = await Court.findById(req.params.id);
    if (!court) return res.status(404).json({ error: "Court not found" });
    if (court.author.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const { photo } = req.body;
    if (!photo) return res.status(400).json({ error: "No photo provided" });

    court.photos = court.photos.filter(p => p !== photo);
    await court.save();

    // Remove the file from disk if it's a local upload path
    if (photo.startsWith("/uploads/")) {
      const filePath = path.join(__dirname, "..", photo);
      fs.unlink(filePath, () => {}); // ignore error if file already gone
    }

    res.json(court);
  } catch (err) {
    res.status(500).json({ error: "Failed to delete photo" });
  }
});

router.put("/:id", verifyToken, async (req, res) => {
  try {
    const court = await Court.findById(req.params.id);
    if (!court) return res.status(404).json({ error: "Court not found" });
    if (court.author.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const updated = await Court.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update court" });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const court = await Court.findById(req.params.id);
    if (!court) return res.status(404).json({ error: "Court not found" });
    if (court.author.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await Court.findByIdAndDelete(req.params.id);
    res.json({ message: "Court deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete court" });
  }
});

// --- Blocked Slots ---

// GET /api/courts/:id/blocked-slots  (authenticated — any logged-in user can view to display in calendar)
router.get("/:id/blocked-slots", verifyToken, async (req, res) => {
  try {
    const slots = await BlockedSlot.find({ court: req.params.id }).sort({ date: 1, startTime: 1 });
    res.json(slots);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch blocked slots" });
  }
});

// POST /api/courts/:id/blocked-slots  (owner only)
router.post("/:id/blocked-slots", verifyToken, async (req, res) => {
  try {
    const court = await Court.findById(req.params.id);
    if (!court) return res.status(404).json({ error: "Court not found" });
    if (court.author.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const { date, startTime, endTime, reason } = req.body;
    if (!date) return res.status(400).json({ error: "date is required" });

    // If one time is provided, both must be provided
    if ((startTime && !endTime) || (!startTime && endTime)) {
      return res.status(400).json({ error: "Provide both startTime and endTime, or neither for an all-day block" });
    }
    if (startTime && endTime && startTime >= endTime) {
      return res.status(400).json({ error: "startTime must be before endTime" });
    }

    const slot = await BlockedSlot.create({
      court: req.params.id,
      date,
      startTime: startTime || null,
      endTime: endTime || null,
      reason: reason || ""
    });
    res.status(201).json(slot);
  } catch (err) {
    res.status(500).json({ error: "Failed to create blocked slot" });
  }
});

// DELETE /api/courts/:id/blocked-slots/:slotId  (owner only)
router.delete("/:id/blocked-slots/:slotId", verifyToken, async (req, res) => {
  try {
    const court = await Court.findById(req.params.id);
    if (!court) return res.status(404).json({ error: "Court not found" });
    if (court.author.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await BlockedSlot.findOneAndDelete({ _id: req.params.slotId, court: req.params.id });
    res.json({ message: "Blocked slot removed" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete blocked slot" });
  }
});

module.exports = router;
