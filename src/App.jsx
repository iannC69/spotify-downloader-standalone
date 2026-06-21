import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './pages/Home';
import UpdateMaker from './pages/UpdateMaker';
import Admin from './pages/Admin';
import CommandPalette from './components/CommandPalette';

function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('iannc-theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  return (
    <Router>
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
