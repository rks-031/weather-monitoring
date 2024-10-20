import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';

const CITIES = ['Delhi', 'Mumbai', 'Chennai', 'Bangalore', 'Kolkata', 'Hyderabad'];

export default function WeatherAnalysis() {
  const [selectedCity, setSelectedCity] = useState('Delhi');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalysis();
  }, [selectedCity]);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/analysis/${selectedCity}`);
      setAnalysis(response.data);
    } catch (error) {
      console.error('Error fetching analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/export/${format}/${selectedCity}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `weather-data-${selectedCity}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  return (
    <div className="container">
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <h2>Weather Analysis & Export</h2>
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
      </div>

      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="mb-0">Export Data</h3>
                <div>
                  <button 
                    className="btn btn-success me-2 m-2 p-2" 
                    onClick={() => handleExport('csv')}
                  >
                    Export as CSV
                  </button>
                  <button 
                    className="btn btn-success" 
                    onClick={() => handleExport('json')}
                  >
                    Export as JSON
                  </button>
                </div>
              </div>
              <p>Download historical weather data for {selectedCity} in your preferred format.</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading analysis...</span>
          </div>
        </div>
      ) : analysis ? (
        <>
          <div className="row mb-4">
            <div className="col-12">
              <div className="card">
                <div className="card-body">
                  <h3>Temperature Trends</h3>
                  <div style={{ height: "300px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analysis.temperatureTrends.trendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="temp" stroke="#198754" name="Temperature" />
                        <Line type="monotone" dataKey="deviation" stroke="#0d6efd" name="Deviation" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-4">
              <div className="card h-100">
                <div className="card-body">
                  <h3>Weather Patterns</h3>
                  <div className="mb-3">
                    <h5>Hourly Patterns</h5>
                    <ul className="list-unstyled">
                      {Object.entries(analysis.weatherPatterns.hourly).map(([hour, data]) => (
                        <li key={hour} className="mb-2">
                          {hour}:00 - Most common: {
                            Object.entries(data.conditions)
                              .sort((a, b) => b[1] - a[1])[0][0]
                          }
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6 mb-4">
              <div className="card h-100">
                <div className="card-body">
                  <h3>Correlations</h3>
                  <ul className="list-unstyled">
                    <li className="mb-2">Temperature-Humidity: 
                      <span className="ms-2 badge bg-secondary">
                        {analysis.correlations.tempHumidity.toFixed(2)}
                      </span>
                    </li>
                    <li className="mb-2">Temperature-Wind Speed: 
                      <span className="ms-2 badge bg-secondary">
                        {analysis.correlations.tempWindSpeed.toFixed(2)}
                      </span>
                    </li>
                    <li className="mb-2">Humidity-Wind Speed: 
                      <span className="ms-2 badge bg-secondary">
                        {analysis.correlations.humidityWindSpeed.toFixed(2)}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-5">No analysis data available</div>
      )}
    </div>
  );
}