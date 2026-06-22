import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Lenis from 'lenis';
import Home from './pages/Home';
import AuthPage from './pages/AuthPage';
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
import Pomodoro from './pages/Pomodoro';
import LinkHubBuilder from './pages/LinkHubBuilder';
import DiscordEmbedBuilder from './pages/DiscordEmbedBuilder';
import QRCodeStudio from './pages/QRCodeStudio';
import { PomodoroSessionProvider } from './context/PomodoroSessionContext';
import PomodoroMiniWidget from './components/PomodoroMiniWidget';

function App() {
  useEffect(() => {
    // Scroll la top la fiecare refresh
    window.scrollTo(0, 0);

    const savedTheme = localStorage.getItem('iannc-theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }

    // Initialize Lenis for buttery smooth scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easeOutExpo
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  const isHackerMode = useKonamiCode();

  return (
    <Router>
      <PomodoroSessionProvider>
        <MatrixRain active={isHackerMode} />
        <CommandPalette />
        <PomodoroMiniWidget />
        <div className="platform-container">
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/sign-in/*" element={<AuthPage />} />
              <Route path="/sign-up/*" element={<AuthPage />} />
              <Route path="/tools/update-maker" element={<UpdateMaker />} />
              <Route path="/tools/todo-maker" element={<TodoMaker />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/games" element={<AdminGames />} />
              <Route path="/downloader" element={<YoutubeDownloader />} />
              <Route path="/cutter" element={<Mp3Cutter />} />
              <Route path="/spotify" element={<SpotifyDownloader />} />
              <Route path="/pomodoro" element={<Pomodoro />} />
              <Route path="/link-hub" element={<LinkHubBuilder />} />
              <Route path="/discord-embed" element={<DiscordEmbedBuilder />} />
              <Route path="/qr-studio" element={<QRCodeStudio />} />
            </Routes>
          </main>
        </div>
      </PomodoroSessionProvider>
    </Router>
  );
}

export default App;
