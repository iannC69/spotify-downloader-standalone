import { Link, useLocation } from 'react-router-dom';
import {
  Brain,
  ExternalLink,
  Headphones,
  Home,
  Layers,
  LayoutList,
  Mail,
  Scissors,
  User,
  Video,
  Wrench,
} from 'lucide-react';
import './Navbar.css';

function Navbar() {
  const location = useLocation();
  const isActive = path => location.pathname === path;

  return (
    <nav className="main-navbar">
      <div className="navbar-container">
        <div className="navbar-shell">
          <div className="navbar-main-row">
            <Link to="/" className="navbar-logo" aria-label="IANNC home">
              <div className="logo-mark">
                <div className="logo-icon">
                  <Layers size={21} />
                </div>
              </div>
              <div className="logo-copy">
                <span className="logo-text">IANNC<span className="logo-accent">.RO</span></span>
                <small>Portfolio & tools</small>
              </div>
            </Link>

            <div className="navbar-main-links" aria-label="Navigatie principala">
              <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
                <Home size={17} />
                <span>Acasa</span>
              </Link>
              <a href="/#proiecte" className="nav-link">
                <Wrench size={17} />
                <span>Tools</span>
              </a>
              <a href="/#socials" className="nav-link">
                <Mail size={17} />
                <span>Contact</span>
              </a>
              <a href="https://github.com/iannC69" target="_blank" rel="noreferrer" className="nav-link nav-link-external">
                <User size={17} />
                <span>GitHub</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </div>

          <div className="navbar-tool-dock" aria-label="Tool shortcuts">
            <Link to="/tools/update-maker" className={`tool-dock-link ${isActive('/tools/update-maker') ? 'active' : ''}`}>
              <Wrench size={16} />
              <span>Update</span>
            </Link>
            <Link to="/tools/todo-maker" className={`tool-dock-link ${isActive('/tools/todo-maker') ? 'active' : ''}`}>
              <LayoutList size={16} />
              <span>To-Do</span>
            </Link>
            <Link to="/downloader" className={`tool-dock-link ${isActive('/downloader') ? 'active' : ''}`}>
              <Video size={16} />
              <span>YouTube</span>
            </Link>
            <Link to="/cutter" className={`tool-dock-link ${isActive('/cutter') ? 'active' : ''}`}>
              <Scissors size={16} />
              <span>Cutter</span>
            </Link>
            <Link to="/spotify" className={`tool-dock-link ${isActive('/spotify') ? 'active' : ''}`}>
              <Headphones size={16} />
              <span>Spotify</span>
            </Link>
            <Link to="/pomodoro" className={`tool-dock-link ${isActive('/pomodoro') ? 'active' : ''}`}>
              <Brain size={16} />
              <span>Pomodoro</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
