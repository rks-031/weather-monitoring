// tests/weather.test.js
const chai = require("chai");
const chaiHttp = require("chai-http");
const app = require("../server");
const { WeatherData, DailySummary, Threshold } = require("../models");
const {
  fetchWeatherData,
  calculateDailySummary,
  checkThresholds,
} = require("../utils/weatherUtils");

chai.use(chaiHttp);
const expect = chai.expect;

describe("Weather Monitoring System Tests", () => {
  before(async () => {
    await WeatherData.deleteMany({});
    await DailySummary.deleteMany({});
    await Threshold.deleteMany({});
  });

  describe("System Setup", () => {
    it("should connect to OpenWeatherMap API", async () => {
      const data = await fetchWeatherData("Delhi");
      expect(data).to.have.property("temp");
      expect(data).to.have.property("humidity");
      expect(data).to.have.property("wind_speed");
    });
  });

  describe("Data Retrieval and Processing", () => {
    it("should fetch and store weather data", async () => {
      const res = await chai.request(app).get("/api/weather/Delhi");
      expect(res).to.have.status(200);
      expect(res.body).to.have.property("temp");
    });

    it("should convert temperature correctly", () => {
      const kelvin = 300;
      const celsius = kelvin - 273.15;
      const data = { temp: kelvin };
      const converted = convertTemperature(data);
      expect(converted.temp).to.equal(celsius);
    });
  });

  describe("Daily Summary", () => {
    it("should calculate daily aggregates correctly", async () => {
      const testData = [
        { temp: 25, humidity: 60, wind_speed: 5, main: "Clear" },
        { temp: 30, humidity: 65, wind_speed: 6, main: "Clear" },
        { temp: 28, humidity: 62, wind_speed: 5.5, main: "Rain" },
      ];

      for (const data of testData) {
        await WeatherData.create({
          ...data,
          city: "TestCity",
          timestamp: new Date(),
        });
      }

      const summary = await calculateDailySummary("TestCity", new Date());
      expect(summary.avgTemp).to.equal(27.67);
      expect(summary.dominantWeather).to.equal("Clear");
    });
  });

  describe("Threshold Alerts", () => {
    it("should detect consecutive threshold breaches", async () => {
      const threshold = await Threshold.create({
        city: "TestCity",
        maxTemp: 30,
        minTemp: 10,
        email: "test@example.com",
      });

      const data1 = { temp: 32, city: "TestCity" };
      const data2 = { temp: 33, city: "TestCity" };

      await checkThresholds(data1);
      const alert = await checkThresholds(data2);
      expect(alert).to.be.true;
    });
  });
});
