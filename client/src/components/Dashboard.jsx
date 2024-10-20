// src/components/Dashboard.jsx
import { useState, useEffect } from 'react'
import axios from 'axios'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const CITIES = ['Delhi', 'Mumbai', 'Chennai', 'Bangalore', 'Kolkata', 'Hyderabad']
const api = axios.create({
  baseURL: 'http://localhost:5000/api'
});

export default function Dashboard() {
  const [selectedCity, setSelectedCity] = useState('Delhi')
  const [currentWeather, setCurrentWeather] = useState(null)
  const [historicalData, setHistoricalData] = useState({ hourly: [], daily: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const [current, history, summary] = await Promise.all([
          api.get(`/weather/${selectedCity}`),
          api.get(`/weather/${selectedCity}/history`),
          api.get(`/summary/${selectedCity}`)
        ])

        setCurrentWeather(current.data)
        setHistoricalData({
          hourly: history.data || [],
          daily: summary.data || []
        })
      } catch (error) {
        console.error('Error fetching weather data:', error)
        setError('Failed to fetch weather data. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 300000)
    return () => clearInterval(interval)
  }, [selectedCity])

  if (loading) {
    return <div className="text-center py-10">Loading weather data...</div>
  }

  if (error) {
    return <div className="text-center py-10 text-red-600">{error}</div>
  }

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-10">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="fw-bold">Weather Dashboard</h1>
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

          {loading && (
            <div className="text-center py-5">
              <div className="spinner-border text-success" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="alert alert-danger text-center" role="alert">{error}</div>
          )}

          {currentWeather && (
            <div className="row g-4">
              <div className="col-12 col-md-6">
                <div className="card h-100">
                  <div className="card-body">
                    <h2 className="card-title fw-semibold mb-4">Current Weather</h2>
                    <div className="d-flex flex-column gap-2">
                      <p className="mb-2">Temperature: {currentWeather.temp?.toFixed(1)}°C</p>
                      <p className="mb-2">Feels Like: {currentWeather.feels_like?.toFixed(1)}°C</p>
                      <p className="mb-0">Condition: {currentWeather.main}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="card h-100">
                  <div className="card-body">
                    <h2 className="card-title fw-semibold mb-4">Temperature History</h2>
                    <div style={{ height: "300px" }}>
                      {historicalData.hourly?.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={historicalData.hourly}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="timestamp" tickFormatter={(time) => new Date(time).toLocaleTimeString()} />
                            <YAxis />
                            <Tooltip labelFormatter={(time) => new Date(time).toLocaleString()} />
                            <Legend />
                            <Line type="monotone" dataKey="temp" stroke="#198754" name="Temperature" />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-center py-5">No historical data available</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}