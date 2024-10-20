import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import ThresholdSettings from './components/ThresholdSettings';
import WeatherAnalysis from './components/WeatherAnalysis';

function App() {
  return (
    <BrowserRouter>
      <div className="min-vh-100 bg-light d-flex flex-column">
        <Navigation />
        <main className="container py-5 flex-grow-1">
          <div className="row justify-content-center">
            <div className="col-12 col-lg-10">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/settings" element={<ThresholdSettings />} />
                <Route path="/analysis" element={<WeatherAnalysis />} />
              </Routes>
            </div>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;