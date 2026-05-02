const mongoose = require("mongoose");

const courtSchema = new mongoose.Schema({
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    required: true 
  },

  name: { type: String, required: true },

  sportCategories: {
    type: [String],
    required: true,
    enum: ["football", "basketball", "tennis", "handball", "volleyball", "padel"],
  },

  numberOfCourts: {
    type: Number,
    required: true,
    min: 1,
  },

  address: { type: String, required: true },

  description: { type: String, default: "" },

  phone: { type: String, default: "" },

  pricePerHour: { type: Number, required: true, min: 0 },

  surfaceType: {
    type: String,
    enum: ["grass", "clay", "synthetic", "hardcourt", "indoor", "sand", "parquet", "other"],
    default: "other"
  },

  facilities: {
    type: [String],
    default: [],
    enum: ["parking", "showers", "lighting", "locker_rooms", "wifi", "cafeteria", "equipment_rental"]
  },

  photos: {
    type: [String],
    default: []
  },

  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending"
  },

  operationalStatus: {
    type: String,
    enum: ["open", "closed", "maintenance", "unavailable"],
    default: "open"
  },

  suspended: {
    type: Boolean,
    default: false
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

  createdAt: { type: Date, default: Date.now },

  cancellationNoticeHours: {
    type: Number,
    default: 0,
    min: 0
  }

}, { collection: "courts" });

module.exports = mongoose.model("Court", courtSchema);
