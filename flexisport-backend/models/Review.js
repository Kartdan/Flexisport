const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  court: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Court",
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
}, { collection: "reviews" });

reviewSchema.index({ court: 1, author: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
