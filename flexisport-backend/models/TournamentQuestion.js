const mongoose = require("mongoose");

const tournamentQuestionSchema = new mongoose.Schema(
  {
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true
    },
    court: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Court",
      required: true
    },
    askedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    question: {
      type: String,
      required: true,
      trim: true,
      maxlength: 600
    },
    visibility: {
      type: String,
      default: "public",
      enum: ["public"]
    },
    status: {
      type: String,
      default: "open",
      enum: ["open", "answered", "closed"]
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("TournamentQuestion", tournamentQuestionSchema);
