const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: String,
  date: { type: Date, default: Date.now }
}, { collection: "flexi-posts" });

module.exports = mongoose.model("Post", postSchema);
