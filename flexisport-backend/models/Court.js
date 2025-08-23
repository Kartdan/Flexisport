// models/Court.js
const mongoose = require("mongoose");

const courtSchema = new mongoose.Schema({
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",   // ✅ Link to User model
    required: true 
  },

  pitchTypes: {
    type: [String],
    required: true,
    enum: ["football", "basket", "tennis", "handball", "volleyball"],
  },

  numberOfPitchTypes: {
    type: Number,
    required: true,
    min: 1,
  },

  location: { type: String, required: true },

  prices: {
    football: { type: Number, default: 0 },
    basket: { type: Number, default: 0 },
    tennis: { type: Number, default: 0 },
    handball: { type: Number, default: 0 },
    volleyball: { type: Number, default: 0 },
  },

  schedules: [
    {
      day: { 
        type: String, 
        required: true, 
        enum: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"] 
      },
      startTime: { type: String, required: true },
      endTime: { type: String, required: true },
    }
  ],

  createdAt: { type: Date, default: Date.now }

}, { collection: "courts" });

module.exports = mongoose.model("Court", courtSchema);
