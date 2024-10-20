// routes/export.js
const express = require("express");
const router = express.Router();
const { Parser } = require("json2csv");
const WeatherData = require("../models/WeatherData");

router.get("/export/:format/:city", async (req, res) => {
  try {
    const { format, city } = req.params;
    const data = await WeatherData.find({ city });

    if (format === "csv") {
      const parser = new Parser();
      const csv = parser.parse(data);
      res.header("Content-Type", "text/csv");
      res.attachment(`weather-data-${city}.csv`);
      return res.send(csv);
    }

    if (format === "json") {
      res.header("Content-Type", "application/json");
      res.attachment(`weather-data-${city}.json`);
      return res.send(JSON.stringify(data, null, 2));
    }

    res.status(400).send("Invalid format");
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
