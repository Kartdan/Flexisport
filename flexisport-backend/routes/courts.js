const express = require("express");
const Court = require("../models/Court");
const Review = require("../models/Review");
const Notification = require("../models/Notification");
const { verifyToken, requireAdmin } = require("../middleware/auth");
const upload = require("../middleware/upload");

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

    const base64Photos = req.files.map(f => {
      const base64 = f.buffer.toString("base64");
      return `data:${f.mimetype};base64,${base64}`;
    });
    court.photos.push(...base64Photos);
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

module.exports = router;
