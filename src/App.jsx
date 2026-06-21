import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './pages/Home';
import UpdateMaker from './pages/UpdateMaker';
import Admin from './pages/Admin';
import CommandPalette from './components/CommandPalette';
import useKonamiCode from './hooks/useKonamiCode';
import MatrixRain from './components/MatrixRain';

function App() {
  useEffect(() => {
    // Scroll la top la fiecare refresh
    window.scrollTo(0, 0);

    const savedTheme = localStorage.getItem('iannc-theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  const isHackerMode = useKonamiCode();

  return (
    <Router>
      <MatrixRain active={isHackerMode} />
      <CommandPalette />
      <div className="platform-container">
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tools/update-maker" element={<UpdateMaker />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
