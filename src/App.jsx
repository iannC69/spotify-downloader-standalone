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
import WildfireOverlay from './pages/WildfireOverlay';
import ConnectServer from './pages/ConnectServer';
import { PomodoroSessionProvider } from './context/PomodoroSessionContext';
import PomodoroMiniWidget from './components/PomodoroMiniWidget';
import SiteConfigProvider from './context/SiteConfigContext';
import { useSiteConfig } from './context/useSiteConfig';
import MaintenancePage from './components/MaintenancePage';
import AnnouncementBanner from './components/AnnouncementBanner';
import AnalyticsTracker from './components/AnalyticsTracker';
import { useUser } from '@clerk/clerk-react';

import { useLocation } from 'react-router-dom';

// Inner app that has access to SiteConfig + User
function AppInner() {
  const { siteConfig, loading } = useSiteConfig();
  const { user, isLoaded } = useUser();
  const isHackerMode = useKonamiCode();
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith('/admin');

  const isAdmin =
    user?.publicMetadata?.role === 'admin' ||
    user?.primaryEmailAddress?.emailAddress === 'contact@iannc.ro' ||
    user?.primaryEmailAddress?.emailAddress === 'solwolfs2@gmail.com';

  const maintenanceMode = siteConfig?.site?.maintenanceMode;
  const announcement = siteConfig?.site?.announcementEnabled ? siteConfig?.site?.announcement : '';

  // Admin routes render completely standalone (no platform-container, no Navbar)
  if (isAdminRoute) {
    return (
      <Routes>
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/games" element={<AdminGames />} />
      </Routes>
    );
  }

  // Show maintenance page to non-admins (only after loading)
  if (!loading && isLoaded && maintenanceMode && !isAdmin) {
    return <MaintenancePage />;
  }

  return (
    <>
      <AnalyticsTracker />
      <AnnouncementBanner text={announcement} />
      <MatrixRain active={isHackerMode} />
      <CommandPalette />
      <PomodoroMiniWidget />
      <div className="platform-container" style={announcement ? { paddingTop: '36px' } : {}}>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/sign-in/*" element={<AuthPage />} />
            <Route path="/sign-up/*" element={<AuthPage />} />
            <Route path="/tools/update-maker" element={<UpdateMaker />} />
            <Route path="/tools/todo-maker" element={<TodoMaker />} />
            <Route path="/downloader" element={<YoutubeDownloader />} />
            <Route path="/cutter" element={<Mp3Cutter />} />
            <Route path="/spotify" element={<SpotifyDownloader />} />
            <Route path="/pomodoro" element={<Pomodoro />} />
            <Route path="/link-hub" element={<LinkHubBuilder />} />
            <Route path="/discord-embed" element={<DiscordEmbedBuilder />} />
            <Route path="/qr-studio" element={<QRCodeStudio />} />
            <Route path="/wildfire-overlay" element={<WildfireOverlay />} />
            <Route path="/connect-cs2" element={<ConnectServer />} />
          </Routes>
        </main>
      </div>
    </>
  );
}

function App() {
  useEffect(() => {
    window.scrollTo(0, 0);

    const savedTheme = localStorage.getItem('iannc-theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      prevent: (node) => node.closest?.('[data-lenis-prevent]'),
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => { lenis.destroy(); };
  }, []);

  return (
    <Router>
      <SiteConfigProvider>
        <PomodoroSessionProvider>
          <AppInner />
        </PomodoroSessionProvider>
      </SiteConfigProvider>
    </Router>
  );
}

export default App;
