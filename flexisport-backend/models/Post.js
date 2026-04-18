const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  authorRef: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  authorName: { type: String, required: true },
  courtRef: { type: mongoose.Schema.Types.ObjectId, ref: "Court", default: null },
  postType: {
    type: String,
    enum: ["manual", "court_published", "status_update"],
    default: "manual"
  },
  date: { type: Date, default: Date.now }
}, { collection: "flexi-posts" });

module.exports = mongoose.model("Post", postSchema);
