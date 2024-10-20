import { Link } from 'react-router-dom'

export default function Navigation() {
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light shadow mb-4">
      <div className="container">
        <Link to="/" className="navbar-brand fw-bold">Weather Monitor</Link>
        <div className="d-flex">
          <Link to="/" className="btn btn-outline-success me-2">Dashboard</Link>
          <Link to="/settings" className="btn btn-outline-success">Settings</Link>
        </div>
      </div>
    </nav>
  )
}