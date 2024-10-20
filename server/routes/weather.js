const express = require("express");
const router = express.Router();
const WeatherData = require("../models/WeatherData");
const DailySummary = require("../models/DailySummary");
const Threshold = require("../models/Threshold");

router.get("/weather/:city", async (req, res) => {
  try {
    const data = await WeatherData.find({ city: req.params.city })
      .sort({ timestamp: -1 })
      .limit(1);
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/weather/:city/history", async (req, res) => {
  try {
    const data = await WeatherData.find({ city: req.params.city })
      .sort({ timestamp: -1 })
      .limit(24);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/summary/:city", async (req, res) => {
  try {
    const data = await DailySummary.find({ city: req.params.city })
      .sort({ date: -1 })
      .limit(7);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/thresholds", async (req, res) => {
  try {
    const threshold = await Threshold.create(req.body);
    res.json(threshold);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/thresholds", async (req, res) => {
  try {
    const thresholds = await Threshold.find();
    res.json(thresholds);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/thresholds/:id", async (req, res) => {
  try {
    await Threshold.findByIdAndDelete(req.params.id);
    res.json({ message: "Threshold deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
