const express = require("express");
const Post = require("../models/Post");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

router.post("/", verifyToken, async (req, res) => {
  try {
    const newPost = new Post({
      title: req.body.title,
      content: req.body.content,
      authorRef: req.user.id,
      authorName: req.body.authorName || req.user.fullName || req.user.username || "Unknown",
      courtRef: req.body.courtRef || null,
      postType: req.body.postType || "manual",
    });

    const savedPost = await newPost.save();
    res.json(savedPost);
  } catch (err) {
    console.error("❌ Error creating post:", err);
    res.status(500).json({ error: "Failed to create post" });
  }
});

router.get("/", async (req, res) => {
  try {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    const posts = await Post.find()
      .sort({ date: -1 })
      .populate("authorRef", "fullName username role");
    res.json(posts);
  } catch (err) {
    console.error("❌ Error fetching posts:", err);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

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
