const mongoose = require("mongoose");

const dailySummarySchema = new mongoose.Schema({
  city: String,
  date: Date,
  avgTemp: Number,
  maxTemp: Number,
  minTemp: Number,
  avgHumidity: Number,
  avgWindSpeed: Number,
  dominantWeather: String,
  weatherDistribution: Map,
});

module.exports = mongoose.model("DailySummary", dailySummarySchema);
