async function analyzeWeatherPatterns(city, days = 30) {
  const data = await WeatherData.find({
    city,
    timestamp: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
  });

  return {
    temperatureTrends: calculateTrends(data),
    weatherPatterns: analyzePatterns(data),
    correlations: findCorrelations(data),
  };
}

function calculateTrends(data) {
  const temperatures = data.map((d) => ({
    temp: d.temp,
    timestamp: d.timestamp,
  }));
  temperatures.sort((a, b) => a.timestamp - b.timestamp);

  const avgTemp =
    temperatures.reduce((sum, d) => sum + d.temp, 0) / temperatures.length;
  const trend = temperatures.map((d, i) => ({
    day: new Date(d.timestamp).toLocaleDateString(),
    temp: d.temp,
    deviation: d.temp - avgTemp,
    trend: i > 0 ? d.temp - temperatures[i - 1].temp : 0,
  }));

  return {
    averageTemperature: avgTemp,
    trendData: trend,
    overallTrend: trend[trend.length - 1].temp - trend[0].temp,
  };
}

function analyzePatterns(data) {
  const patterns = data.reduce(
    (acc, d) => {
      const date = new Date(d.timestamp);
      const hour = date.getHours();
      const condition = d.main;

      // Hourly patterns
      acc.hourly[hour] = acc.hourly[hour] || { count: 0, conditions: {} };
      acc.hourly[hour].count++;
      acc.hourly[hour].conditions[condition] =
        (acc.hourly[hour].conditions[condition] || 0) + 1;

      // Daily patterns
      const dayKey = date.toLocaleDateString();
      acc.daily[dayKey] = acc.daily[dayKey] || [];
      acc.daily[dayKey].push(condition);

      return acc;
    },
    { hourly: {}, daily: {} }
  );

  return patterns;
}

function findCorrelations(data) {
  const correlations = {
    tempHumidity: calculateCorrelation(
      data.map((d) => d.temp),
      data.map((d) => d.humidity)
    ),
    tempWindSpeed: calculateCorrelation(
      data.map((d) => d.temp),
      data.map((d) => d.wind_speed)
    ),
    humidityWindSpeed: calculateCorrelation(
      data.map((d) => d.humidity),
      data.map((d) => d.wind_speed)
    ),
  };

  return correlations;
}

function calculateCorrelation(x, y) {
  const n = x.length;
  const sum_x = x.reduce((a, b) => a + b, 0);
  const sum_y = y.reduce((a, b) => a + b, 0);
  const sum_xy = x.reduce((acc, curr, i) => acc + curr * y[i], 0);
  const sum_xx = x.reduce((acc, curr) => acc + curr * curr, 0);
  const sum_yy = y.reduce((acc, curr) => acc + curr * curr, 0);

  const correlation =
    (n * sum_xy - sum_x * sum_y) /
    Math.sqrt((n * sum_xx - sum_x * sum_x) * (n * sum_yy - sum_y * sum_y));

  return correlation;
}

module.exports = { analyzeWeatherPatterns };
