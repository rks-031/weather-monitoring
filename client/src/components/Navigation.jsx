import { Link } from 'react-router-dom';

export default function Navigation() {
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light shadow">
      <div className="container">
        <Link to="/" className="navbar-brand">Weather Monitor</Link>
        <div className="navbar-nav ms-auto">
          <Link to="/" className="nav-link">Dashboard</Link>
          <Link to="/analysis" className="nav-link">Analysis & Export</Link>
          <Link to="/settings" className="nav-link">Settings</Link>
        </div>
      </div>
    </nav>
  );
}