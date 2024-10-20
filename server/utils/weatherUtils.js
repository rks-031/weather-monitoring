const axios = require("axios");
const nodemailer = require("nodemailer");
const Threshold = require("../models/Threshold");
const WeatherData = require("../models/WeatherData");

// Initialize email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Track consecutive threshold breaches
const thresholdBreaches = {};

async function fetchWeatherData(city) {
  try {
    // Get coordinates first for UV data
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

    const forecastData = forecast.data.list.map((item) => ({
      date: new Date(item.dt * 1000),
      temp: item.main.temp - 273.15,
      main: item.weather[0].main,
      humidity: item.main.humidity,
      wind_speed: item.wind.speed,
      pressure: item.main.pressure,
    }));

    return {
      city,
      main: current.data.weather[0].main,
      temp: current.data.main.temp - 273.15,
      feels_like: current.data.main.feels_like - 273.15,
      humidity: current.data.main.humidity,
      wind_speed: current.data.wind.speed,
      pressure: current.data.main.pressure,
      uv_index: uv.data.value,
      timestamp: new Date(),
      forecast: forecastData,
    };
  } catch (error) {
    console.error(`Error fetching weather data for ${city}:`, error);
    throw error;
  }
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

    if (weatherData.length === 0) {
      return null;
    }

    // Calculate weather condition counts
    const weatherCounts = {};
    let totalTemp = 0;
    let totalHumidity = 0;
    let totalWindSpeed = 0;
    let totalPressure = 0;
    let temps = [];

    weatherData.forEach((data) => {
      weatherCounts[data.main] = (weatherCounts[data.main] || 0) + 1;
      totalTemp += data.temp;
      totalHumidity += data.humidity;
      totalWindSpeed += data.wind_speed;
      totalPressure += data.pressure;
      temps.push(data.temp);
    });

    const count = weatherData.length;

    // Find dominant weather condition
    const dominantWeather = Object.entries(weatherCounts).sort(
      (a, b) => b[1] - a[1]
    )[0][0];

    return {
      city,
      date: startOfDay,
      avgTemp: totalTemp / count,
      maxTemp: Math.max(...temps),
      minTemp: Math.min(...temps),
      avgHumidity: totalHumidity / count,
      avgWindSpeed: totalWindSpeed / count,
      avgPressure: totalPressure / count,
      dominantWeather,
      weatherDistribution: weatherCounts,
    };
  } catch (error) {
    console.error(`Error calculating daily summary for ${city}:`, error);
    throw error;
  }
}

async function checkThresholds(weatherData) {
  try {
    const thresholds = await Threshold.find({ city: weatherData.city });

    for (const threshold of thresholds) {
      const highKey = `${weatherData.city}_high_${threshold._id}`;
      const lowKey = `${weatherData.city}_low_${threshold._id}`;

      // Check high temperature breach
      if (weatherData.temp > threshold.maxTemp) {
        await processThresholdBreach(highKey, weatherData, threshold, "high");
      } else {
        thresholdBreaches[highKey] = null;
      }

      // Check low temperature breach
      if (weatherData.temp < threshold.minTemp) {
        await processThresholdBreach(lowKey, weatherData, threshold, "low");
      } else {
        thresholdBreaches[lowKey] = null;
      }
    }
  } catch (error) {
    console.error("Error checking thresholds:", error);
    throw error;
  }
}

async function processThresholdBreach(key, weatherData, threshold, type) {
  if (!thresholdBreaches[key]) {
    thresholdBreaches[key] = {
      count: 1,
      lastUpdate: new Date(),
    };
  } else {
    const timeDiff = new Date() - new Date(thresholdBreaches[key].lastUpdate);
    if (timeDiff <= 300000) {
      // Within 5 minutes
      thresholdBreaches[key].count++;
      if (thresholdBreaches[key].count >= 2) {
        await sendAlert(threshold.email, weatherData, type);
        thresholdBreaches[key] = null;
      }
    } else {
      thresholdBreaches[key] = {
        count: 1,
        lastUpdate: new Date(),
      };
    }
  }
}

async function sendAlert(email, weatherData, type) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Weather Alert for ${weatherData.city}`,
    html: `
      <h2>Temperature Alert</h2>
      <p>Consecutive ${type} temperature detected in ${weatherData.city}</p>
      <p>Current temperature: ${weatherData.temp.toFixed(1)}°C</p>
      <p>Humidity: ${weatherData.humidity}%</p>
      <p>Wind Speed: ${weatherData.wind_speed} m/s</p>
      <p>Pressure: ${weatherData.pressure} hPa</p>
      <p>UV Index: ${weatherData.uv_index}</p>
      <p>Weather Condition: ${weatherData.main}</p>
      <p>Time: ${new Date(weatherData.timestamp).toLocaleString()}</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Alert sent to ${email} for ${weatherData.city}`);
  } catch (error) {
    console.error("Error sending email alert:", error);
    throw error;
  }
}

module.exports = {
  fetchWeatherData,
  calculateDailySummary,
  checkThresholds,
};
