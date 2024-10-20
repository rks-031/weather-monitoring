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

const thresholdBreaches = {};

async function fetchWeatherData(city) {
  try {
    const geoData = await axios.get(
      `http://api.openweathermap.org/geo/1.0/direct?q=${city},IN&limit=1&appid=${process.env.OPENWEATHER_API_KEY}`
    );

    const { lat, lon } = geoData.data[0];

    const [current, forecast, uv] = await Promise.all([
      axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${city},IN&appid=${process.env.OPENWEATHER_API_KEY}`
      ),
      axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city},IN&appid=${process.env.OPENWEATHER_API_KEY}`
      ),
      axios.get(
        `https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_API_KEY}`
      ),
    ]);

    const forecastData = processForecastData(forecast.data.list);
    return processCurrentWeather(
      current.data,
      uv.data.value,
      city,
      forecastData
    );
  } catch (error) {
    console.error(`Error fetching weather data for ${city}:`, error);
    throw error;
  }
}

function processForecastData(list) {
  return list.map((item) => ({
    date: new Date(item.dt * 1000),
    temp: kelvinToCelsius(item.main.temp),
    main: item.weather[0].main,
    humidity: item.main.humidity,
    wind_speed: item.wind.speed,
    pressure: item.main.pressure,
  }));
}

function processCurrentWeather(current, uvIndex, city, forecast) {
  return {
    city,
    main: current.weather[0].main,
    temp: kelvinToCelsius(current.main.temp),
    feels_like: kelvinToCelsius(current.main.feels_like),
    humidity: current.main.humidity,
    wind_speed: current.wind.speed,
    pressure: current.main.pressure,
    uv_index: uvIndex,
    timestamp: new Date(),
    forecast,
  };
}

function kelvinToCelsius(kelvin) {
  return kelvin - 273.15;
}

async function calculateDailySummary(city, date) {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const weatherData = await WeatherData.find({
      city,
      timestamp: { $gte: startOfDay, $lte: endOfDay },
    });

    if (weatherData.length === 0) return null;

    return calculateSummaryStats(weatherData);
  } catch (error) {
    console.error(`Error calculating daily summary for ${city}:`, error);
    throw error;
  }
}

function calculateSummaryStats(weatherData) {
  const weatherCounts = {};
  const stats = weatherData.reduce(
    (acc, data) => {
      weatherCounts[data.main] = (weatherCounts[data.main] || 0) + 1;
      acc.totalTemp += data.temp;
      acc.totalHumidity += data.humidity;
      acc.totalWindSpeed += data.wind_speed;
      acc.totalPressure += data.pressure;
      acc.temps.push(data.temp);
      return acc;
    },
    {
      totalTemp: 0,
      totalHumidity: 0,
      totalWindSpeed: 0,
      totalPressure: 0,
      temps: [],
    }
  );

  const count = weatherData.length;
  const dominantWeather = Object.entries(weatherCounts).sort(
    (a, b) => b[1] - a[1]
  )[0][0];

  return {
    city: weatherData[0].city,
    date: weatherData[0].timestamp,
    avgTemp: stats.totalTemp / count,
    maxTemp: Math.max(...stats.temps),
    minTemp: Math.min(...stats.temps),
    avgHumidity: stats.totalHumidity / count,
    avgWindSpeed: stats.totalWindSpeed / count,
    avgPressure: stats.totalPressure / count,
    dominantWeather,
    weatherDistribution: weatherCounts,
  };
}

async function checkThresholds(weatherData) {
  try {
    const thresholds = await Threshold.find({ city: weatherData.city });
    await Promise.all(
      thresholds.map((threshold) => processThresholds(weatherData, threshold))
    );
  } catch (error) {
    console.error("Error checking thresholds:", error);
    throw error;
  }
}

async function processThresholds(weatherData, threshold) {
  const highKey = `${weatherData.city}_high_${threshold._id}`;
  const lowKey = `${weatherData.city}_low_${threshold._id}`;

  if (weatherData.temp > threshold.maxTemp) {
    await processThresholdBreach(highKey, weatherData, threshold, "high");
  } else {
    thresholdBreaches[highKey] = null;
  }

  if (weatherData.temp < threshold.minTemp) {
    await processThresholdBreach(lowKey, weatherData, threshold, "low");
  } else {
    thresholdBreaches[lowKey] = null;
  }
}

async function processThresholdBreach(key, weatherData, threshold, type) {
  const currentState = thresholdBreaches[key] || {
    count: 0,
    lastUpdate: new Date(),
  };
  const timeDiff = new Date() - new Date(currentState.lastUpdate);

  if (timeDiff <= 300000) {
    currentState.count++;
    if (currentState.count >= 2) {
      await sendAlert(threshold.email, weatherData, type);
      thresholdBreaches[key] = null;
      return;
    }
  } else {
    currentState.count = 1;
  }

  currentState.lastUpdate = new Date();
  thresholdBreaches[key] = currentState;
}

async function sendAlert(email, weatherData, type) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Weather Alert for ${weatherData.city}`,
    html: generateAlertEmail(weatherData, type),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Alert sent to ${email} for ${weatherData.city}`);
  } catch (error) {
    console.error("Error sending email alert:", error);
    throw error;
  }
}

function generateAlertEmail(weatherData, type) {
  return `
    <h2>Temperature Alert</h2>
    <p>Consecutive ${type} temperature detected in ${weatherData.city}</p>
    <p>Current temperature: ${weatherData.temp.toFixed(1)}°C</p>
    <p>Humidity: ${weatherData.humidity}%</p>
    <p>Wind Speed: ${weatherData.wind_speed} m/s</p>
    <p>Pressure: ${weatherData.pressure} hPa</p>
    <p>UV Index: ${weatherData.uv_index}</p>
    <p>Weather Condition: ${weatherData.main}</p>
    <p>Time: ${new Date(weatherData.timestamp).toLocaleString()}</p>
  `;
}

module.exports = {
  fetchWeatherData,
  calculateDailySummary,
  checkThresholds,
};
