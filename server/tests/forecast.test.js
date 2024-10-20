describe("Forecast Tests", () => {
  it("should retrieve 5-day forecast data", async () => {
    const data = await fetchWeatherData("Delhi");
    expect(data.forecast).to.have.lengthOf(40); // 5 days * 8 readings per day
    expect(data.forecast[0]).to.have.all.keys([
      "date",
      "temp",
      "main",
      "humidity",
      "wind_speed",
      "pressure",
    ]);
  });
});
