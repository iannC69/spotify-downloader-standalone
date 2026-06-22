import { useState, useEffect } from 'react';
import './SpotifyProfile.css';

export default function SpotifyProfile() {
  const [spotifyData, setSpotifyData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/spotify/data')
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setSpotifyData(data);
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleLogin = () => {
    window.location.href = '/api/spotify/login';
  };

  if (loading) {
    return <div className="spotify-container loading">Se încarcă Vibe-ul tău muzical...</div>;
  }

  if (error || !spotifyData) {
    return (
      <div className="spotify-container error-state">
        <div className="spotify-auth-prompt">
          <h3>Conectează-te cu Spotify</h3>
          <p>Pentru a afișa live Top Artiști, Playlist-urile tale și Profilul, trebuie să ne conectăm la API-ul Spotify.</p>
          <button className="spotify-login-btn" onClick={handleLogin}>
            Login to Spotify
          </button>
        </div>
      </div>
    );
  }

  const { profile, topArtists, playlists } = spotifyData;

  return (
    <div
      className="spotify-container"
      style={{ backgroundImage: `url(${topArtists?.[0]?.images?.[0]?.url || 'https://i.scdn.co/image/ab6761610000e5eb4293385d324db8558179afd9'})` }}
    >
      {/* HEADER: User Profile */}
      <div className="spotify-header">
        <img
          src={profile?.images?.[0]?.url || profile?.images?.[1]?.url || 'https://i.scdn.co/image/ab6761610000e5eb12a2ef08d00dd7451a6dbed6'}
          alt="Profile"
          className="spotify-avatar"
        />
        <div className="spotify-header-info">
          <span className="spotify-label">Profile</span>
          <h2 className="spotify-username">{profile?.display_name || 'IANNC'}</h2>
          <div className="spotify-stats">
            <span>{profile?.followers?.total || 0} Followers</span>
            <span className="dot-separator">•</span>
            <span>{playlists?.length || 0} Public Playlists</span>
          </div>
        </div>
      </div>

      {/* TOP ARTISTS GRID */}
      <div className="spotify-section">
        <h3 className="spotify-section-title">Top Artists this month</h3>
        <div className="spotify-artists-grid">
          {topArtists?.map(artist => (
            <a href={artist.external_urls.spotify} target="_blank" rel="noreferrer" key={artist.id} className="spotify-artist-card">
              <img src={artist.images[0]?.url || artist.images[1]?.url} alt={artist.name} />
              <div className="artist-card-content">
                <h4>{artist.name}</h4>
                <span>Artist</span>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* PLAYLISTS GRID (Using iFrames for actual playback) */}
      <div className="spotify-section">
        <h3 className="spotify-section-title">Your Playlists</h3>
        <div className="spotify-playlists-grid">

          {playlists?.map(playlist => (
            <a href={playlist.external_urls.spotify} target="_blank" rel="noreferrer" key={playlist.id} className="spotify-playlist-card">
              <div className="playlist-img-wrapper">
                <img src={playlist.images[0]?.url} alt={playlist.name} />
                <div className="play-button-overlay">▶</div>
              </div>
              <h4>{playlist.name}</h4>
              <span>{playlist.owner.display_name}</span>
            </a>
          ))}

        </div>
      </div>
    </div>
  );
}
