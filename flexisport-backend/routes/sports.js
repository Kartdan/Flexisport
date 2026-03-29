const express = require("express");
const Sport = require("../models/Sport");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const filter = req.query.country
      ? { countryCodes: req.query.country.toUpperCase() }
      : {};
    const sports = await Sport.find(filter).sort({ name: 1 });
    res.set("Cache-Control", "no-store");
    res.json(sports);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch sports" });
  }
});

module.exports = router;
