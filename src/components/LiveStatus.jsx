import { useState, useEffect } from 'react';
import './LiveStatus.css';

// Placehodler Discord ID (You must replace this when user provides their ID)
const DISCORD_ID = "156114103033790464";

export default function LiveStatus() {
  const [lanyardData, setLanyardData] = useState(null);
  
  useEffect(() => {
    let ws;
    
    const connect = () => {
      ws = new WebSocket('wss://api.lanyard.rest/socket');
      
      ws.onopen = () => {
        ws.send(JSON.stringify({
          op: 2,
          d: { subscribe_to_id: DISCORD_ID }
        }));
      };
      
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.t === 'INIT_STATE' || message.t === 'PRESENCE_UPDATE') {
          setLanyardData(message.d);
        }
      };
      
      ws.onclose = () => setTimeout(connect, 3000);
    };
    
    connect();
    
    return () => {
      if (ws) ws.close();
    };
  }, []);
  
  if (!lanyardData) {
    return (
      <div className="status-badge magnetic">
        <span className="status-dot" style={{animation: 'none', background: '#64748b', boxShadow: 'none'}}></span>
        Connecting to Gateway...
      </div>
    );
  }

  let activityText = 'Online & Ready';
  let activityColor = '#39d353'; // Default Green (Online)
  
  if (lanyardData.discord_status === 'dnd') activityColor = '#f04747';
  if (lanyardData.discord_status === 'idle') activityColor = '#faa61a';
  if (lanyardData.discord_status === 'offline') activityColor = '#747f8d';

  if (lanyardData.listening_to_spotify && lanyardData.spotify) {
    activityText = `Listening to ${lanyardData.spotify.song}`;
    activityColor = '#1db954'; // Spotify Green
  } else if (lanyardData.activities && lanyardData.activities.length > 0) {
    const playing = lanyardData.activities.find(a => a.type === 0);
    if (playing) {
      activityText = `Playing ${playing.name}`;
      activityColor = '#5865F2'; // Discord Blurple
    } else {
      const custom = lanyardData.activities.find(a => a.type === 4);
      if (custom && custom.state) {
        activityText = custom.state;
      }
    }
  }

  return (
    <div className="status-badge magnetic">
      <span className="status-dot" style={{ backgroundColor: activityColor, boxShadow: `0 0 10px ${activityColor}` }}></span>
      {activityText}
    </div>
  );
}
