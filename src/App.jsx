import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './pages/Home';
import UpdateMaker from './pages/UpdateMaker';
import TodoMaker from './pages/TodoMaker';
import Admin from './pages/Admin';
import AdminGames from './pages/AdminGames';
import CommandPalette from './components/CommandPalette';
import useKonamiCode from './hooks/useKonamiCode';
import MatrixRain from './components/MatrixRain';
import YoutubeDownloader from './pages/YoutubeDownloader';
import Mp3Cutter from './pages/Mp3Cutter';

import SpotifyDownloader from './pages/SpotifyDownloader';

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
              <Route path="/tools/todo-maker" element={<TodoMaker />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/games" element={<AdminGames />} />
              <Route path="/downloader" element={<YoutubeDownloader />} />
              <Route path="/cutter" element={<Mp3Cutter />} />
              <Route path="/spotify" element={<SpotifyDownloader />} />
            </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
