const WeatherData = require("./models/WeatherData");
const DailySummary = require("./models/DailySummary");
const exportRoutes = require("./routes/export");
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cron = require("node-cron");
const weatherRoutes = require("./routes/weather");
const {
  fetchWeatherData,
  calculateDailySummary,
  checkThresholds,
} = require("./utils/weatherUtils");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", weatherRoutes);
app.use("/api", exportRoutes);

// Analysis endpoint
app.get("/api/analysis/:city", async (req, res) => {
  try {
    const { analyzeWeatherPatterns } = require("./utils/analysis");
    const analysis = await analyzeWeatherPatterns(req.params.city);
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB successfully");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

const CITIES = [
  "Delhi",
  "Mumbai",
  "Chennai",
  "Bangalore",
  "Kolkata",
  "Hyderabad",
];

// Schedule weather data collection
cron.schedule("*/5 * * * *", async () => {
  for (const city of CITIES) {
    try {
      const weatherData = await fetchWeatherData(city);
      const newWeatherData = await WeatherData.create(weatherData);
      await checkThresholds(newWeatherData);
    } catch (error) {
      console.error(`Error fetching data for ${city}:`, error);
    }
  }
});

// Schedule daily summary calculation
cron.schedule("0 0 * * *", async () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  for (const city of CITIES) {
    try {
      const summary = await calculateDailySummary(city, yesterday);
      if (summary) {
        await DailySummary.create(summary);
      }
    } catch (error) {
      console.error(`Error calculating summary for ${city}:`, error);
    }
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
