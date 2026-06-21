import { motion } from 'framer-motion';
import { Target, Clock, Trophy, Flame } from 'lucide-react';
import './SteamWidget.css';

export default function SteamWidget() {
  return (
    <motion.div 
      className="steam-widget"
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
    >
      <div className="steam-header">
        <div className="steam-user">
          <div className="steam-avatar">
            <img src="https://github.com/iannC69.png" alt="IANNC Steam" />
            <span className="status-ring in-game"></span>
          </div>
          <div className="steam-info">
            <h4>IANNC</h4>
            <p className="steam-status text-primary">In-Game: Counter-Strike 2</p>
          </div>
        </div>
        <div className="steam-logo">
          <svg viewBox="0 0 24 24" fill="rgba(255,255,255,0.2)" height="32" width="32">
            <path d="M12 0C5.373 0 0 5.373 0 12c0 4.965 3.018 9.213 7.336 10.98l2.678-3.864c-.183-.342-.284-.73-.284-1.136 0-1.895 1.543-3.438 3.438-3.438.487 0 .95.106 1.365.295l3.85-5.545c.01-.15.02-.298.02-.452 0-3.125-2.535-5.66-5.66-5.66-3.126 0-5.66 2.535-5.66 5.66 0 .524.072 1.03.205 1.51l-4.14 1.704C1.042 9.42 1.95 6.096 4.09 3.553 6.07 1.187 8.924 0 12 0zm1.17 17.58c-1.127 0-2.04.914-2.04 2.04 0 1.127.914 2.04 2.04 2.04 1.127 0 2.04-.914 2.04-2.04 0-1.127-.914-2.04-2.04-2.04zm3.844-6.398l-3.815 5.5c-.378-.17-.797-.263-1.23-.263-1.644 0-2.977 1.332-2.976 2.976 0 .22.025.435.07.643l-2.658 3.834C3.89 22.56 1.487 19.336.548 15.42l3.96-1.63c.523 1.996 2.33 3.473 4.475 3.473 2.536 0 4.59-2.054 4.59-4.59 0-.156-.01-.31-.028-.46l3.818-5.5c.376.17.794.264 1.226.264 1.644 0 2.976-1.332 2.976-2.976S20.233 1.03 18.59 1.03c-1.643 0-2.976 1.333-2.976 2.977 0 .43.093.847.262 1.222l-5.5 3.818c-.456-.25-1.004-.4-1.58-.4-1.895 0-3.438 1.543-3.438 3.438 0 .576.15 1.124.4 1.58l-5.5 3.818A2.97 2.97 0 0 1 8.983 12c0-2.535-2.054-4.59-4.59-4.59C2.247 7.41.4 8.887-.123 10.884l-3.96-1.63C-3.144 5.337-.74 2.112 1.77.29L4.43 4.125a2.97 2.97 0 0 1 .643-.071c1.644 0 2.977 1.333 2.977 2.977 0 .432-.093.85-.262 1.228l5.5 3.815a3.42 3.42 0 0 1 1.58-.403z"/>
          </svg>
        </div>
      </div>
      
      <div className="steam-stats-grid">
        <div className="steam-stat-box">
          <Clock size={16} />
          <div className="stat-value">2,845h</div>
          <div className="stat-label">Timp Jucat</div>
        </div>
        <div className="steam-stat-box">
          <Trophy size={16} style={{color: '#FFD700'}} />
          <div className="stat-value" style={{color: '#FFD700'}}>Level 10</div>
          <div className="stat-label">Faceit Rank</div>
        </div>
        <div className="steam-stat-box">
          <Target size={16} style={{color: '#EF4444'}} />
          <div className="stat-value">1.45</div>
          <div className="stat-label">K/D Ratio</div>
        </div>
      </div>
      
      <div className="steam-footer">
        <Flame size={14} style={{color: '#F59E0B'}} /> 
        <span>Core Member @ CS2.WILDFIRE.RO</span>
      </div>
    </motion.div>
  );
}
