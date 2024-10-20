const mongoose = require("mongoose");

const thresholdSchema = new mongoose.Schema({
  city: String,
  maxTemp: Number,
  minTemp: Number,
  email: String,
});

module.exports = mongoose.model("Threshold", thresholdSchema);
