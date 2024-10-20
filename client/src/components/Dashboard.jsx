import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import axios from 'axios';

const CITIES = ['Delhi', 'Mumbai', 'Chennai', 'Bangalore', 'Kolkata', 'Hyderabad'];
const api = axios.create({ baseURL: 'http://localhost:5000/api' });

export default function Dashboard() {
  const [selectedCity, setSelectedCity] = useState('Delhi');
  const [currentWeather, setCurrentWeather] = useState(null);
  const [historicalData, setHistoricalData] = useState({ hourly: [], daily: [] });
  const [forecastData, setForecastData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [current, history, summary] = await Promise.all([
          api.get(`/weather/${selectedCity}`),
          api.get(`/weather/${selectedCity}/history`),
          api.get(`/summary/${selectedCity}`)
        ]);

        setCurrentWeather(current.data);
        setHistoricalData({
          hourly: history.data,
          daily: summary.data
        });
        setForecastData(current.data.forecast || []);
      } catch (error) {
        console.error('Error fetching weather data:', error);
        setError('Failed to fetch weather data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, [selectedCity]);

  return (
    <div className="container">
      <div className="row mb-4">
        <div className="col-12 d-flex justify-content-between align-items-center">
          <h1 className="mb-0">Weather Dashboard</h1>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="form-select w-auto"
          >
            {CITIES.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" role="alert">{error}</div>
      )}

      {currentWeather && (
        <>
          <div className="row g-4 mb-4">
            <div className="col-md-6">
              <div className="card h-100">
                <div className="card-body">
                  <h2 className="card-title">Current Weather</h2>
                  <div className="mt-3">
                    <p>Temperature: {currentWeather.temp?.toFixed(1)}°C</p>
                    <p>Feels Like: {currentWeather.feels_like?.toFixed(1)}°C</p>
                    <p>Humidity: {currentWeather.humidity}%</p>
                    <p>Wind Speed: {currentWeather.wind_speed} m/s</p>
                    <p>Condition: {currentWeather.main}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card h-100">
                <div className="card-body">
                  <h2 className="card-title">Daily Summary</h2>
                  {historicalData.daily[0] && (
                    <div className="mt-3">
                      <p>Average Temperature: {historicalData.daily[0].avgTemp?.toFixed(1)}°C</p>
                      <p>Max Temperature: {historicalData.daily[0].maxTemp?.toFixed(1)}°C</p>
                      <p>Min Temperature: {historicalData.daily[0].minTemp?.toFixed(1)}°C</p>
                      <p>Average Humidity: {historicalData.daily[0].avgHumidity?.toFixed(1)}%</p>
                      <p>Average Wind Speed: {historicalData.daily[0].avgWindSpeed?.toFixed(1)} m/s</p>
                      <p>Dominant Weather: {historicalData.daily[0].dominantWeather}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-12">
              <div className="card">
                <div className="card-body">
                  <h2 className="card-title">Temperature History</h2>
                  <div style={{ height: "300px" }} className="mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={historicalData.hourly}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="timestamp" tickFormatter={(time) => new Date(time).toLocaleTimeString()} />
                        <YAxis />
                        <Tooltip labelFormatter={(time) => new Date(time).toLocaleString()} />
                        <Legend />
                        <Line type="monotone" dataKey="temp" stroke="#198754" name="Temperature" />
                        <Line type="monotone" dataKey="humidity" stroke="#0d6efd" name="Humidity" />
                        <Line type="monotone" dataKey="wind_speed" stroke="#dc3545" name="Wind Speed" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12">
              <div className="card">
                <div className="card-body">
                  <h2 className="card-title">Weather Distribution</h2>
                  <div style={{ height: "300px" }} className="mt-4">
                    {historicalData.daily[0]?.weatherDistribution && (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={Object.entries(historicalData.daily[0].weatherDistribution).map(([key, value]) => ({
                          condition: key,
                          count: value
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="condition" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="count" fill="#198754" name="Occurrences" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {forecastData.length > 0 && (
              <div className="col-12">
                <div className="card">
                  <div className="card-body">
                    <h2 className="card-title">5-Day Forecast</h2>
                    <div style={{ height: "300px" }} className="mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={forecastData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tickFormatter={(time) => new Date(time).toLocaleDateString()} />
                          <YAxis />
                          <Tooltip labelFormatter={(time) => new Date(time).toLocaleString()} />
                          <Legend />
                          <Line type="monotone" dataKey="temp" stroke="#198754" name="Temperature" />
                          <Line type="monotone" dataKey="humidity" stroke="#0d6efd" name="Humidity" />
                          <Line type="monotone" dataKey="wind_speed" stroke="#dc3545" name="Wind Speed" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}