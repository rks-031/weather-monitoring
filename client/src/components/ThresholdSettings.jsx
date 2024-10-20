import { useState } from 'react'
import axios from 'axios'

const CITIES = ['Delhi', 'Mumbai', 'Chennai', 'Bangalore', 'Kolkata', 'Hyderabad']

export default function ThresholdSettings() {
  const [formData, setFormData] = useState({
    city: 'Delhi',
    maxTemp: 35,
    minTemp: 10,
    email: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await axios.post('/api/thresholds', formData)
      alert('Threshold settings saved successfully!')
    } catch (error) {
      alert('Error saving threshold settings')
    }
  }

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="card shadow">
            <div className="card-body p-4">
              <h1 className="card-title text-center fw-bold mb-4">Temperature Alert Settings</h1>
              <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
                <div>
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

                <div>
                  <label className="form-label">Maximum Temperature (°C)</label>
                  <input
                    type="number"
                    value={formData.maxTemp}
                    onChange={(e) => setFormData({...formData, maxTemp: Number(e.target.value)})}
                    className="form-control"
                  />
                </div>

                <div>
                  <label className="form-label">Minimum Temperature (°C)</label>
                  <input
                    type="number"
                    value={formData.minTemp}
                    onChange={(e) => setFormData({...formData, minTemp: Number(e.target.value)})}
                    className="form-control"
                  />
                </div>

                <div>
                  <label className="form-label">Email for Alerts</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="form-control"
                  />
                </div>

                <button type="submit" className="btn btn-success w-100 mt-3">
                  Save Settings
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}