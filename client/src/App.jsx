import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import Dashboard from './components/Dashboard'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import ThresholdSettings from './components/ThresholdSettings'

function App() {
  return (
    <BrowserRouter>
      <div className="min-vh-100 bg-light d-flex flex-column">
        <Navigation />
        <main className="container py-5 flex-grow-1 d-flex align-items-center justify-content-center">
          <div className="w-100">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/settings" element={<ThresholdSettings />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  )
 }

export default App