import { useRef, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import {
  Brain,
  ChevronLeft,
  ChevronRight,
  Flame,
  Headphones,
  Home,
  Layers,
  LayoutList,
  Link2,
  Mail,
  MessageSquare,
  QrCode,
  Scissors,
  User,
  Video,
  Wrench,
} from 'lucide-react';
import './Navbar.css';

function Navbar() {
  const location = useLocation();
  const isActive = path => location.pathname === path;
  const dockRef = useRef(null);
  const [showArrows, setShowArrows] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (dockRef.current) {
        setShowArrows(dockRef.current.scrollWidth > dockRef.current.clientWidth + 5);
      }
    };
    
    // Check initially and on resize
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, []);

  const scrollDock = (direction) => {
    if (dockRef.current) {
      const scrollAmount = 250;
      dockRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <nav className="main-navbar">
      <div className="navbar-container">
        <div className="navbar-shell">
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

          <div className="tool-dock-wrapper">
            {showArrows && (
              <button className="dock-scroll-btn left" onClick={() => scrollDock('left')} aria-label="Scroll left">
                <ChevronLeft size={16} />
              </button>
            )}
            <div className="navbar-tool-dock" aria-label="Tool shortcuts" ref={dockRef} style={{ maskImage: showArrows ? 'linear-gradient(to right, transparent, black 15px, black calc(100% - 15px), transparent)' : 'none', WebkitMaskImage: showArrows ? 'linear-gradient(to right, transparent, black 15px, black calc(100% - 15px), transparent)' : 'none' }}>
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
            <Link to="/link-hub" className={`tool-dock-link ${isActive('/link-hub') ? 'active' : ''}`}>
              <Link2 size={16} />
              <span>Link Hub</span>
            </Link>
            <Link to="/discord-embed" className={`tool-dock-link ${isActive('/discord-embed') ? 'active' : ''}`}>
              <MessageSquare size={16} />
              <span>Embed</span>
            </Link>
            <Link to="/qr-studio" className={`tool-dock-link ${isActive('/qr-studio') ? 'active' : ''}`}>
              <QrCode size={16} />
              <span>QR</span>
            </Link>
            <Link to="/wildfire-overlay" className={`tool-dock-link ${isActive('/wildfire-overlay') ? 'active' : ''}`}>
              <Flame size={16} />
              <span>Overlay</span>
            </Link>
            </div>
            {showArrows && (
              <button className="dock-scroll-btn right" onClick={() => scrollDock('right')} aria-label="Scroll right">
                <ChevronRight size={16} />
              </button>
            )}
          </div>

          <div className="navbar-main-links" aria-label="Navigatie principala">
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
              <Home size={17} />
              <span className="hide-on-mobile">Acasa</span>
            </Link>
            <a href="/#proiecte" className="nav-link">
              <Wrench size={17} />
              <span className="hide-on-mobile">Tools</span>
            </a>
            <a href="/#socials" className="nav-link">
              <Mail size={17} />
              <span className="hide-on-mobile">Contact</span>
            </a>
            <SignedOut>
              <Link to="/sign-in" className="nav-link nav-link-auth" style={{ background: 'var(--primary)', color: '#000', fontWeight: '800', border: 'none', marginLeft: '0.5rem' }}>
                <User size={17} />
                <span className="hide-on-mobile">Contul Meu</span>
              </Link>
            </SignedOut>
            <SignedIn>
              <div style={{ marginLeft: '1rem', display: 'flex', alignItems: 'center' }}>
                <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "nav-avatar-custom" } }} />
              </div>
            </SignedIn>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
