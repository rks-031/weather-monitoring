import { useState, useEffect } from 'react';
import axios from 'axios';

const CITIES = ['Delhi', 'Mumbai', 'Chennai', 'Bangalore', 'Kolkata', 'Hyderabad'];
const api = axios.create({ baseURL: 'http://localhost:5000/api' });

export default function ThresholdSettings() {
  const [formData, setFormData] = useState({
    city: 'Delhi',
    maxTemp: 35,
    minTemp: 10,
    email: ''
  });

  const [existingThresholds, setExistingThresholds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchThresholds();
  }, []);

  const fetchThresholds = async () => {
    try {
      const response = await api.get('/thresholds');
      setExistingThresholds(response.data);
    } catch (error) {
      console.error('Error fetching thresholds:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/thresholds', formData);
      alert('Threshold settings saved successfully!');
      fetchThresholds();
      setFormData({
        city: 'Delhi',
        maxTemp: 35,
        minTemp: 10,
        email: ''
      });
    } catch (error) {
      alert('Error saving threshold settings');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/thresholds/${id}`);
      alert('Threshold deleted successfully!');
      fetchThresholds();
    } catch (error) {
      alert('Error deleting threshold');
    }
  };

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow">
            <div className="card-body">
              <h2 className="card-title text-center mb-4">Temperature Alert Settings</h2>
              <form onSubmit={handleSubmit} className="mb-4">
                <div className="mb-3">
                  <label className="form-label">City</label>
                  <select
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    className="form-select"
                  >
                    {CITIES.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Maximum Temperature (°C)</label>
                  <input
                    type="number"
                    value={formData.maxTemp}
                    onChange={(e) => setFormData({...formData, maxTemp: Number(e.target.value)})}
                    className="form-control"
                  />
                  <small className="text-muted">Alert will trigger if temperature exceeds this value for two consecutive readings</small>
                </div>

                <div className="mb-3">
                  <label className="form-label">Minimum Temperature (°C)</label>
                  <input
                    type="number"
                    value={formData.minTemp}
                    onChange={(e) => setFormData({...formData, minTemp: Number(e.target.value)})}
                    className="form-control"
                  />
                  <small className="text-muted">Alert will trigger if temperature falls below this value for two consecutive readings</small>
                </div>

                <div className="mb-4">
                  <label className="form-label">Email for Alerts</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="form-control"
                    required
                  />
                </div>

                <button type="submit" className="btn btn-success w-100">
                  Save Settings
                </button>
              </form>

              {loading ? (
                <div className="text-center">
                  <div className="spinner-border text-success" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="mb-3">Existing Thresholds</h3>
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>City</th>
                          <th>Max Temp</th>
                          <th>Min Temp</th>
                          <th>Email</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {existingThresholds.map((threshold) => (
                          <tr key={threshold._id}>
                            <td>{threshold.city}</td>
                            <td>{threshold.maxTemp}°C</td>
                            <td>{threshold.minTemp}°C</td>
                            <td>{threshold.email}</td>
                            <td>
                              <button 
                                onClick={() => handleDelete(threshold._id)}
                                className="btn btn-danger btn-sm"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                        {existingThresholds.length === 0 && (
                          <tr>
                            <td colSpan="5" className="text-center">No thresholds set</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}