const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    required: true,
    enum: ['admin', 'supervisor', 'player', 'owner'], 
    default: 'player' 
  },
  createdAt: { type: Date, default: Date.now }
}, { collection: "users" });

module.exports = mongoose.model("User", userSchema);