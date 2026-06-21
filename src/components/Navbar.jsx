import { Link, useLocation } from 'react-router-dom';
import { Home, Wrench, Layers, User } from 'lucide-react';
import './Navbar.css';

function Navbar() {
  const location = useLocation();

  return (
    <nav className="main-navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <div className="logo-icon">
            <Layers size={22} />
          </div>
          <span className="logo-text">IANNC<span className="logo-accent">.ro</span></span>
        </Link>
        
        <div className="navbar-links">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            <Home size={18} /> Acasă
          </Link>
          <Link to="/tools/update-maker" className={`nav-link ${location.pathname.startsWith('/tools') ? 'active' : ''}`}>
            <Wrench size={18} /> Instrumente
          </Link>
          <a href="https://github.com/iannC69" target="_blank" rel="noreferrer" className="nav-link">
            <User size={18} /> GitHub
          </a>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
