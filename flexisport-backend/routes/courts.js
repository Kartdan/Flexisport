const express = require("express");
const Court = require("../models/Court");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { author, pitchTypes, numberOfPitchTypes, location, prices, schedules } = req.body;

    const newCourt = new Court({
      author,
      pitchTypes,
      numberOfPitchTypes,
      location,
      prices,
      schedules
    });

    const savedCourt = await newCourt.save();
    res.json(savedCourt);

  } catch (err) {
    console.error("Error creating court:", err);
    res.status(500).json({ error: "Failed to create court" });
  }
});

router.get("/", async (req, res) => {
  try {
    const courts = await Court.find().populate("author", "username email");
    res.json(courts);
  } catch (err) {
    console.error("Error fetching courts:", err);
    res.status(500).json({ error: "Failed to fetch courts" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const court = await Court.findById(req.params.id);
    if (!court) return res.status(404).json({ error: "Court not found" });
    res.json(court);
  } catch (err) {
    console.error("❌ Error fetching court:", err);
    res.status(500).json({ error: "Failed to fetch court" });
  }
});


router.put("/:id", async (req, res) => {
  try {
    const updatedCourt = await Court.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedCourt) return res.status(404).json({ error: "Court not found" });
    res.json(updatedCourt);
  } catch (err) {
    console.error("Error updating court:", err);
    res.status(500).json({ error: "Failed to update court" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deletedCourt = await Court.findByIdAndDelete(req.params.id);
    if (!deletedCourt) return res.status(404).json({ error: "Court not found" });
    res.json({ message: "✅ Court deleted" });
  } catch (err) {
    console.error("❌ Error deleting court:", err);
    res.status(500).json({ error: "Failed to delete court" });
  }
});

module.exports = router;
