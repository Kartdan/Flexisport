const mongoose = require("mongoose");

const tournamentSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  court: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Court",
    required: true
  },
  name: {
    type: String,
    required: true
  },
  sport: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  format: {
    type: String,
    required: true
  },
  experienceLevel: {
    type: String,
    default: "all_levels"
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  registrationDeadline: {
    type: Date,
    required: true
  },
  maxParticipants: {
    type: Number,
    required: true,
    min: 2
  },
  entryFee: {
    type: Number,
    required: true,
    min: 0
  },
  prizes: {
    type: String,
    default: ""
  },
  coverPhoto: {
    type: String,
    default: ""
  },
  status: {
    type: String,
    enum: ["upcoming", "ongoing", "completed", "cancelled"],
    default: "upcoming"
  },
  publicationStatus: {
    type: String,
    enum: ["published", "unpublished", "suspended"],
    default: "published"
  },
  registeredParticipants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Tournament", tournamentSchema);
