import { useState, useEffect } from 'react';
import './LiveStatus.css';

const LASTFM_USER = "iannc6";
const LASTFM_API_KEY = "cffd84db160ad28e809fa6541f226bc3";

export default function LiveStatus() {
  const [song, setSong] = useState(null);
  
  useEffect(() => {
    const fetchLastFm = async () => {
      try {
        const res = await fetch(`https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${LASTFM_USER}&api_key=${LASTFM_API_KEY}&format=json&limit=1`);
        const data = await res.json();
        
        if (data.recenttracks && data.recenttracks.track.length > 0) {
          const track = data.recenttracks.track[0];
          // Check if it's currently playing
          if (track['@attr'] && track['@attr'].nowplaying === 'true') {
            setSong({
              title: track.name,
              artist: track.artist['#text'],
              albumArt: track.image[3]['#text'] // extralarge (300x300)
            });
            return;
          }
        }
        setSong(null);
      } catch (err) {
        console.error("Last.fm Error", err);
      }
    };

    fetchLastFm();
    const interval = setInterval(fetchLastFm, 10000); // Polling every 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Global Dynamic Background Logic
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    let bgElement = document.getElementById('spotify-global-bg');
    if (!bgElement) {
      bgElement = document.createElement('div');
      bgElement.id = 'spotify-global-bg';
      document.body.insertBefore(bgElement, document.body.firstChild);
    }

    if (song && song.albumArt) {
      bgElement.style.opacity = '1';
      bgElement.style.backgroundImage = `url(${song.albumArt})`;
    } else {
      bgElement.style.opacity = '0';
    }

    return () => {
      if (bgElement) bgElement.style.opacity = '0';
    };
  }, [song]);
  
  if (song) {
    const activityText = `${song.title} - ${song.artist}`;
    return (
      <div className="status-badge magnetic spotify-active">
        <div className="album-art-mini">
          <img src={song.albumArt} alt="Album Art" />
        </div>
        <div className="audio-eq">
          <span></span><span></span><span></span><span></span>
        </div>
        <div className="spotify-text-marquee">
          <span>{activityText}</span>
        </div>
      </div>
    );
  }

  // Fallback if not listening to anything
  return (
    <div className="status-badge magnetic">
      <span className="status-dot" style={{ backgroundColor: '#747f8d', boxShadow: `0 0 10px #747f8d` }}></span>
      Offline / No Music Playing
    </div>
  );
}
