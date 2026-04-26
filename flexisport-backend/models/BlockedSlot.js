const mongoose = require("mongoose");

// A blocked slot means the court owner has reserved a specific date/time for non-booking use
// (e.g. tournament, maintenance window, private event).
// startTime/endTime are optional — if both are absent the entire day is blocked.
const blockedSlotSchema = new mongoose.Schema({
  court: { type: mongoose.Schema.Types.ObjectId, ref: "Court", required: true },
  date: { type: String, required: true },      // "YYYY-MM-DD"
  startTime: { type: String, default: null },  // "HH:MM" or null for all-day
  endTime: { type: String, default: null },    // "HH:MM" or null for all-day
  reason: { type: String, default: "" }
}, { timestamps: true });

blockedSlotSchema.index({ court: 1, date: 1 });

module.exports = mongoose.model("BlockedSlot", blockedSlotSchema);
