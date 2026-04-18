const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

app.set("etag", false);

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

mongoose.connect(process.env.MONGO_URI, {})
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

const postRoutes = require("./routes/posts");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const courtRoutes = require("./routes/courts");
const sportRoutes = require("./routes/sports");
const reviewRoutes = require("./routes/reviews");
const tournamentRoutes = require("./routes/tournaments");
const notificationRoutes = require("./routes/notifications");

app.use("/api/posts", postRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/courts", courtRoutes);
app.use("/api/sports", sportRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/tournaments", tournamentRoutes);
app.use("/api/notifications", notificationRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
