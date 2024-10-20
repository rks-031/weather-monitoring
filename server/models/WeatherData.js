const mongoose = require("mongoose");

const weatherSchema = new mongoose.Schema({
  city: String,
  main: String,
  temp: Number,
  feels_like: Number,
  humidity: Number,
  wind_speed: Number,
  timestamp: Date,
  forecast: [
    {
      date: Date,
      temp: Number,
      main: String,
      humidity: Number,
      wind_speed: Number,
    },
  ],
});

module.exports = mongoose.model("WeatherData", weatherSchema);
