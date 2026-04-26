const mongoose = require("mongoose");

const flagSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  flaggedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  isFlagged: {
    type: Boolean,
    default: false
  },
  note: {
    type: String,
    trim: true,
    default: ""
  },
  denyBooking: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

flagSchema.index({ owner: 1, flaggedUser: 1 }, { unique: true });

module.exports = mongoose.model("Flag", flagSchema);
