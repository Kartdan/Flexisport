const mongoose = require("mongoose");

const sportSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  emoji: { type: String, default: "" },
  countryCodes: { type: [String], default: [] }
}, { collection: "sports" });

module.exports = mongoose.model("Sport", sportSchema);
