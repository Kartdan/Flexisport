const express = require("express");
const Review = require("../models/Review");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

router.get("/court/:courtId", async (req, res) => {
  try {
    const reviews = await Review.find({ court: req.params.courtId })
      .populate("author", "fullName username")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

router.get("/court/:courtId/summary", async (req, res) => {
  try {
    const result = await Review.aggregate([
      { $match: { court: require("mongoose").Types.ObjectId.createFromHexString(req.params.courtId) } },
      { $group: { _id: null, averageRating: { $avg: "$rating" }, totalReviews: { $sum: 1 } } }
    ]);
    res.json(result[0] || { averageRating: 0, totalReviews: 0 });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch review summary" });
  }
});

router.post("/court/:courtId", verifyToken, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    const review = await Review.findOneAndUpdate(
      { court: req.params.courtId, author: req.user.id },
      { rating, comment, court: req.params.courtId, author: req.user.id },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const populated = await review.populate("author", "fullName username");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ error: "Failed to save review" });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ error: "Review not found" });
    if (review.author.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: "Review deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete review" });
  }
});

module.exports = router;
