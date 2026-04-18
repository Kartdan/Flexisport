const mongoose = require("mongoose");

const tournamentQuestionAnswerSchema = new mongoose.Schema(
  {
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TournamentQuestion",
      required: true
    },
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
    answeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    answer: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 1200
    },
    isOwnerResponse: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("TournamentQuestionAnswer", tournamentQuestionAnswerSchema);
