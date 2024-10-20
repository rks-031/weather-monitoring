const mongoose = require("mongoose");

const weatherSchema = new mongoose.Schema({
  city: String,
  main: String,
  temp: Number,
  feels_like: Number,
  timestamp: Date,
});

module.exports = mongoose.model("WeatherData", weatherSchema);
