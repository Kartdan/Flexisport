const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {})
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Court schema
const courtSchema = new mongoose.Schema({
  name: String,
  location: String,
  surface: String,
  indoor: Boolean
});

const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: String,
  date: { type: Date, default: Date.now }
}, { collection: "flexi-posts" });

const Post = mongoose.model("Post", postSchema);
const Court = mongoose.model("Court", courtSchema);

// Routes

// COURTS
app.get("/courts", async (req, res) => {
  const courts = await Court.find();
  res.json(courts);
});

app.get("/courts/:id", async (req, res) => {
  const court = await Court.findById(req.params.id);
  res.json(court);
});

app.post("/courts", async (req, res) => {
  const newCourt = new Court(req.body);
  const savedCourt = await newCourt.save();
  res.json(savedCourt);
});

app.put("/courts/:id", async (req, res) => {
  const updatedCourt = await Court.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updatedCourt);
});

app.delete("/courts/:id", async (req, res) => {
  await Court.findByIdAndDelete(req.params.id);
  res.json({ message: "Court deleted" });
});

// POSTS
app.post("/posts", async (req, res) => {
  try {
    const newPost = new Post({
      title: req.body.title || "Test Title",
      content: req.body.content || "This is a test post.",
      author: req.body.author || "Admin",
    });

    const savedPost = await newPost.save();
    res.json(savedPost);
  } catch (err) {
    console.error("Error creating post:", err);
    res.status(500).json({ error: "Failed to create post" });
  }
});

app.get("/posts", async (req, res) => {
  const posts = await Post.find();
  res.json(posts);
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
