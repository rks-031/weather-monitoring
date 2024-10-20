// utils/weatherUtils.js
const axios = require("axios");
const nodemailer = require("nodemailer");
const Threshold = require("../models/Threshold");
const WeatherData = require("../models/WeatherData");

async function fetchWeatherData(city) {
  const [current, forecast] = await Promise.all([
    axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city},IN&appid=${process.env.OPENWEATHER_API_KEY}`
    ),
    axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?q=${city},IN&appid=${process.env.OPENWEATHER_API_KEY}`
    ),
  ]);

  const forecastData = forecast.data.list.map((item) => ({
    date: new Date(item.dt * 1000),
    temp: item.main.temp - 273.15,
    main: item.weather[0].main,
    humidity: item.main.humidity,
    wind_speed: item.wind.speed,
  }));

  return {
    city,
    main: current.data.weather[0].main,
    temp: current.data.main.temp - 273.15,
    feels_like: current.data.main.feels_like - 273.15,
    humidity: current.data.main.humidity,
    wind_speed: current.data.wind.speed,
    timestamp: new Date(),
    forecast: forecastData,
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

  const weatherCounts = {};
  let totalTemp = 0,
    totalHumidity = 0,
    totalWindSpeed = 0;
  const temps = [];

  weatherData.forEach((data) => {
    weatherCounts[data.main] = (weatherCounts[data.main] || 0) + 1;
    totalTemp += data.temp;
    totalHumidity += data.humidity;
    totalWindSpeed += data.wind_speed;
    temps.push(data.temp);
  });

  const count = weatherData.length;
  return {
    city,
    date: startOfDay,
    avgTemp: totalTemp / count,
    maxTemp: Math.max(...temps),
    minTemp: Math.min(...temps),
    avgHumidity: totalHumidity / count,
    avgWindSpeed: totalWindSpeed / count,
    dominantWeather: Object.entries(weatherCounts).sort(
      (a, b) => b[1] - a[1]
    )[0][0],
    weatherDistribution: weatherCounts,
  };
}

let previousTemps = {};

async function checkThresholds(weatherData) {
  const thresholds = await Threshold.find({ city: weatherData.city });

  for (const threshold of thresholds) {
    const prevTemp = previousTemps[weatherData.city];
    const currentTemp = weatherData.temp;

    const isConsecutiveHigh =
      currentTemp > threshold.maxTemp && prevTemp > threshold.maxTemp;
    const isConsecutiveLow =
      currentTemp < threshold.minTemp && prevTemp < threshold.minTemp;

    if (isConsecutiveHigh || isConsecutiveLow) {
      await sendAlert(
        threshold.email,
        weatherData,
        isConsecutiveHigh ? "high" : "low"
      );
    }

    previousTemps[weatherData.city] = currentTemp;
  }
}

async function sendAlert(email, weatherData, type) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Weather Alert for ${weatherData.city}`,
    html: `
      <h2>Temperature Alert</h2>
      <p>Consecutive ${type} temperature detected in ${weatherData.city}</p>
      <p>Current temperature: ${weatherData.temp.toFixed(1)}°C</p>
      <p>Current humidity: ${weatherData.humidity}%</p>
      <p>Wind speed: ${weatherData.wind_speed} m/s</p>
      <p>Weather condition: ${weatherData.main}</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = {
  fetchWeatherData,
  calculateDailySummary,
  checkThresholds,
};
