const express = require("express");
const Post = require("../models/Post");

const router = express.Router();

// Create post
router.post("/", async (req, res) => {
  try {
    const newPost = new Post({
      title: req.body.title || "Untitled Post",
      content: req.body.content || "No content provided",
      author: req.body.author || "Anonymous",
    });

    const savedPost = await newPost.save();
    res.json(savedPost);
  } catch (err) {
    console.error("❌ Error creating post:", err);
    res.status(500).json({ error: "Failed to create post" });
  }
});

// Get all posts
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find();
    res.json(posts);
  } catch (err) {
    console.error("❌ Error fetching posts:", err);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

// Get single post by ID
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json(post);
  } catch (err) {
    console.error("❌ Error fetching post:", err);
    res.status(500).json({ error: "Failed to fetch post" });
  }
});

// Update post
router.put("/:id", async (req, res) => {
  try {
    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedPost) return res.status(404).json({ error: "Post not found" });
    res.json(updatedPost);
  } catch (err) {
    console.error("❌ Error updating post:", err);
    res.status(500).json({ error: "Failed to update post" });
  }
});

// Delete post
router.delete("/:id", async (req, res) => {
  try {
    const deletedPost = await Post.findByIdAndDelete(req.params.id);
    if (!deletedPost) return res.status(404).json({ error: "Post not found" });
    res.json({ message: "✅ Post deleted" });
  } catch (err) {
    console.error("❌ Error deleting post:", err);
    res.status(500).json({ error: "Failed to delete post" });
  }
});

module.exports = router;
