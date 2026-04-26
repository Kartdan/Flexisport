const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ["tournament_question", "tournament_answer", "court_status", "tournament_publication_status", "tournament_details_updated", "booking_created", "booking_cancelled", "user_flagged", "user_unflagged", "booking_access_restored"]
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tournament",
    required: false
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TournamentQuestion",
    required: false
  },
  court: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Court",
    required: false
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Notification", notificationSchema);
