import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Droplet, Monitor, Terminal, Activity, Zap, Cpu, Gamepad2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './Admin.css';

const themes = [
  { id: 'lime', name: 'Neon Lime', hex: '#D2FF00' },
  { id: 'gold', name: 'Royal Gold', hex: '#FFD700' },
  { id: 'red', name: 'Cyber Red', hex: '#EF4444' },
  { id: 'purple', name: 'Deep Purple', hex: '#A855F7' },
  { id: 'blue', name: 'Electric Blue', hex: '#3B82F6' },
];

function Admin() {
  const [currentTheme, setCurrentTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('iannc-theme') || 'lime';
    }
    return 'lime';
  });

  const changeTheme = (themeId) => {
    setCurrentTheme(themeId);
    localStorage.setItem('iannc-theme', themeId);
    document.documentElement.setAttribute('data-theme', themeId);
  };

  return (
    <>
      <Navbar />
      <div className="admin-container">
        
        {/* Animated Background */}
        <div className="admin-bg">
          <div className="admin-grid-lines"></div>
          <div className="admin-glow glow-primary"></div>
        </div>

        <div className="admin-content">
          <motion.div 
            className="admin-header"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1><Settings size={40} className="text-primary pulse-icon" /> Command Center</h1>
            <p>Sistem global de configurare și telemetrie a ecosistemului.</p>
          </motion.div>

          <div className="admin-dashboard">
            
            {/* Color Theming Module */}
            <motion.div 
              className="admin-card theme-card"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="card-header">
                <h2><Droplet size={24} className="text-primary"/> Global Theme Engine</h2>
              </div>
              <div className="card-body">
                <p className="card-desc">Selectează culoarea de accent pentru întregul sistem. Setarea se aplică instant și este salvată global.</p>
                
                <div className="theme-swatches">
                  {themes.map((theme) => (
                    <div 
                      key={theme.id}
                      className={`theme-swatch ${currentTheme === theme.id ? 'active' : ''}`}
                      onClick={() => changeTheme(theme.id)}
                    >
                      <div className="swatch-color" style={{ backgroundColor: theme.hex }}></div>
                      <span className="swatch-name">{theme.name}</span>
                      {currentTheme === theme.id && <div className="swatch-indicator">Active</div>}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* System Telemetry Module */}
            <motion.div 
              className="admin-card telemetry-card"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="card-header">
                <h2><Monitor size={24} className="text-primary"/> System Telemetry</h2>
              </div>
              <div className="card-body">
                <div className="telemetry-grid">
                  <div className="t-stat">
                    <Activity size={20} className="t-icon" />
                    <div className="t-info">
                      <span className="t-label">Server Status</span>
                      <span className="t-val text-primary">Online / Healthy</span>
                    </div>
                  </div>
                  <div className="t-stat">
                    <Zap size={20} className="t-icon" />
                    <div className="t-info">
                      <span className="t-label">Latency</span>
                      <span className="t-val">12ms (Bucharest)</span>
                    </div>
                  </div>
                  <div className="t-stat">
                    <Cpu size={20} className="t-icon" />
                    <div className="t-info">
                      <span className="t-label">Core Load</span>
                      <span className="t-val">3% - Optimal</span>
                    </div>
                  </div>
                  <div className="t-stat">
                    <Terminal size={20} className="t-icon" />
                    <div className="t-info">
                      <span className="t-label">Last Deploy</span>
                      <span className="t-val">v2.4.1 (Stable)</span>
                    </div>
                  </div>
                </div>

                <div className="mock-terminal">
                  <div className="terminal-header">
                    <span></span><span></span><span></span>
                    <p>admin@iannc-core:~</p>
                  </div>
                  <div className="terminal-body">
                    <code><span className="text-primary">root@system:</span> systemctl status web-core</code>
                    <code>[OK] Web Core service is running flawlessly.</code>
                    <code><span className="text-primary">root@system:</span> tail -f access.log</code>
                    <code>{'>'} Traffic normal. No anomalies detected.</code>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Game Library Admin Module */}
            <motion.div 
              className="admin-card"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="card-header">
                <h2><Gamepad2 size={24} className="text-primary"/> IGDB Game Library</h2>
              </div>
              <div className="card-body">
                <p className="card-desc">Caută și adaugă manual jocuri în portofoliul tău public, folosind baza de date globală Twitch (IGDB).</p>
                
                <div style={{ marginTop: '1.5rem' }}>
                  <Link to="/admin/games" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    Deschide Admin Librărie Jocuri
                  </Link>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </>
  );
}

export default Admin;
