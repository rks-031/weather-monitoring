const mongoose = require("mongoose");

const weatherSchema = new mongoose.Schema({
  city: String,
  main: String,
  temp: Number,
  feels_like: Number,
  humidity: Number,
  wind_speed: Number,
  pressure: Number,
  uv_index: Number,
  timestamp: Date,
  forecast: [
    {
      date: Date,
      temp: Number,
      main: String,
      humidity: Number,
      wind_speed: Number,
      pressure: Number,
      uv_index: Number,
    },
  ],
});

module.exports = mongoose.model("WeatherData", weatherSchema);
