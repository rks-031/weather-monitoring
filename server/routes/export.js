const express = require("express");
const router = express.Router();
const { Parser } = require("json2csv");
const WeatherData = require("../models/WeatherData");

router.get("/export/csv", async (req, res) => {
  try {
    const data = await WeatherData.find({});
    const parser = new Parser();
    const csv = parser.parse(data);

    res.header("Content-Type", "text/csv");
    res.attachment("weather-data.csv");
    return res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
