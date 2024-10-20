const axios = require("axios");
const nodemailer = require("nodemailer");
const Threshold = require("../models/Threshold");
const WeatherData = require("../models/WeatherData");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function fetchWeatherData(city) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city},IN&appid=${process.env.OPENWEATHER_API_KEY}`;
  const response = await axios.get(url);
  return {
    city,
    main: response.data.weather[0].main,
    temp: response.data.main.temp - 273.15,
    feels_like: response.data.main.feels_like - 273.15,
    timestamp: new Date(),
  };
}

async function calculateDailySummary(city, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const weatherData = await WeatherData.find({
    city,
    timestamp: { $gte: startOfDay, $lte: endOfDay },
  });

  const temps = weatherData.map((data) => data.temp);
  const weatherConditions = weatherData.map((data) => data.main);

  const dominantWeather = weatherConditions.reduce((acc, curr) => {
    acc[curr] = (acc[curr] || 0) + 1;
    return acc;
  }, {});

  return {
    city,
    date: startOfDay,
    avgTemp: temps.reduce((a, b) => a + b, 0) / temps.length,
    maxTemp: Math.max(...temps),
    minTemp: Math.min(...temps),
    dominantWeather: Object.entries(dominantWeather).sort(
      (a, b) => b[1] - a[1]
    )[0][0],
  };
}

async function checkThresholds(weatherData) {
  const thresholds = await Threshold.find({ city: weatherData.city });

  for (const threshold of thresholds) {
    if (
      weatherData.temp > threshold.maxTemp ||
      weatherData.temp < threshold.minTemp
    ) {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: threshold.email,
        subject: `Weather Alert for ${weatherData.city}`,
        text: `Temperature threshold breached! Current temperature: ${weatherData.temp}°C`,
      };

      await transporter.sendMail(mailOptions);
    }
  }
}

module.exports = {
  fetchWeatherData,
  calculateDailySummary,
  checkThresholds,
};
