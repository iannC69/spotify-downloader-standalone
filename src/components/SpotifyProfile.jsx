import { useEffect, useMemo, useState, useContext } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Disc3,
  ExternalLink,
  ListMusic,
  Play,
  Sparkles,
  UserCheck,
  Users,
} from 'lucide-react';
import { SiteConfigContext } from '../context/siteConfigInstance';
import './SpotifyProfile.css';

const fallbackProfileImage = 'https://i.scdn.co/image/ab6761610000e5eb12a2ef08d00dd7451a6dbed6';
const fallbackHeroImage = 'https://i.scdn.co/image/ab6761610000e5eb4293385d324db8558179afd9';

const getImage = (images, fallback = fallbackHeroImage) => (
  images?.[0]?.url || images?.[1]?.url || images?.[2]?.url || fallback
);

function ViewMoreButton({ count, isExpanded, label, onClick, visibleCount }) {
  if (count <= visibleCount) return null;

  return (
    <div className="spotify-grid-footer">
      <button className="spotify-view-more-btn" type="button" onClick={onClick}>
        <span>{isExpanded ? 'Show less' : `View all ${count} ${label}`}</span>
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
    </div>
  );
}

export default function SpotifyProfile() {
  const [spotifyData, setSpotifyData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({
    topArtists: false,
    playlists: false,
    followedArtists: false,
  });

  const { siteConfig } = useContext(SiteConfigContext);

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

  const profile = spotifyData?.profile;
  const profileName = profile?.display_name || 'IANNC';
  const profilePossessive = `${profileName}'s`;
  const topArtists = useMemo(() => spotifyData?.topArtists || [], [spotifyData?.topArtists]);
  const playlists = useMemo(() => spotifyData?.playlists || [], [spotifyData?.playlists]);
  const followedArtists = useMemo(() => spotifyData?.followedArtists || [], [spotifyData?.followedArtists]);
  const followedWarning = spotifyData?.spotifyWarnings?.followedArtists;

  const favoriteArtistName = siteConfig?.spotify?.favoriteArtist;
  const favoriteArtistData = siteConfig?.spotify?.favoriteArtistData;

  const featuredArtist = useMemo(() => {
    if (favoriteArtistData && favoriteArtistData.name === favoriteArtistName) {
      return favoriteArtistData;
    }
    if (favoriteArtistName && favoriteArtistName.trim() !== '') {
      const searchName = favoriteArtistName.toLowerCase().trim();
      const found = topArtists.find(a => a.name.toLowerCase() === searchName) || 
                    followedArtists.find(a => a.name.toLowerCase() === searchName);
      if (found) return found;
    }
    return topArtists[0];
  }, [favoriteArtistName, favoriteArtistData, topArtists, followedArtists]);

  const featuredPlaylist = playlists[0];
  const visibleTopArtists = expanded.topArtists ? topArtists : topArtists.slice(0, 6);
  const visiblePlaylists = expanded.playlists ? playlists : playlists.slice(0, 4);
  const visibleFollowedArtists = expanded.followedArtists ? followedArtists : followedArtists.slice(0, 6);

  const heroImage = useMemo(() => (
    getImage(featuredArtist?.images, getImage(featuredPlaylist?.images, fallbackHeroImage))
  ), [featuredArtist, featuredPlaylist]);

  const toggleExpanded = section => {
    setExpanded(current => ({
      ...current,
      [section]: !current[section],
    }));
  };

  if (loading) {
    return (
      <div className="spotify-container spotify-state-card">
        <Disc3 className="spotify-state-icon" size={28} />
        <span>Se incarca vibe-ul tau muzical...</span>
      </div>
    );
  }

  if (error || !spotifyData) {
    return (
      <div className="spotify-container spotify-state-card">
        <div className="spotify-auth-prompt">
          <Disc3 size={34} />
          <h3>Conecteaza Spotify</h3>
          <p>Afisam profilul, top artistii si playlisturile direct din API-ul Spotify.</p>
          <button className="spotify-login-btn" onClick={handleLogin}>
            Login to Spotify
            <ExternalLink size={17} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <section
      className="spotify-container"
      style={{ '--spotify-hero-image': `url(${heroImage})` }}
      aria-label="Spotify profile"
    >
      <div className="spotify-shell-top">
        <div className="spotify-profile-card">
          <div className="spotify-avatar-frame">
            <img
              src={getImage(profile?.images, fallbackProfileImage)}
              alt={profileName}
              className="spotify-avatar"
            />
          </div>

          <div className="spotify-header-info">
            <span className="spotify-label">Spotify Profile</span>
            <h2 className="spotify-username">{profileName}</h2>
            <div className="spotify-stats">
              <span>
                <Users size={15} />
                {profile?.followers?.total || 0} followers
              </span>
              <span>
                <ListMusic size={15} />
                {playlists.length} playlists
              </span>
              <span>
                <Sparkles size={15} />
                {topArtists.length} top artists
              </span>
              <span>
                <UserCheck size={15} />
                {followedArtists.length} followed
              </span>
            </div>

            {profile?.external_urls?.spotify && (
              <a
                href={profile.external_urls.spotify}
                target="_blank"
                rel="noreferrer"
                className="spotify-profile-link"
              >
                Go to profile
                <ExternalLink size={16} />
              </a>
            )}
          </div>
        </div>

        {featuredArtist && (
          <a
            href={featuredArtist.external_urls.spotify}
            target="_blank"
            rel="noreferrer"
            className="spotify-feature-card"
          >
            <img src={getImage(featuredArtist.images)} alt={featuredArtist.name} />
            <div>
              <span>Favorite artist</span>
              <strong>{featuredArtist.name}</strong>
              <small>Open on Spotify</small>
            </div>
            <Play size={18} fill="currentColor" />
          </a>
        )}
      </div>

      <div className="spotify-content-grid">
        <div className="spotify-panel artists-panel">
          <div className="spotify-section-heading">
            <div>
              <span>Listening identity</span>
              <h3>{profilePossessive} top artists</h3>
            </div>
            <Disc3 size={22} />
          </div>

          <div className="spotify-artists-grid">
            {visibleTopArtists.map((artist, index) => (
              <a
                href={artist.external_urls.spotify}
                target="_blank"
                rel="noreferrer"
                key={artist.id}
                className="spotify-artist-card"
              >
                <img src={getImage(artist.images)} alt={artist.name} />
                <div className="artist-card-content">
                  <span>#{index + 1}</span>
                  <h4>{artist.name}</h4>
                  <small>Artist</small>
                </div>
              </a>
            ))}
          </div>

          <ViewMoreButton
            count={topArtists.length}
            visibleCount={6}
            label="top artists"
            isExpanded={expanded.topArtists}
            onClick={() => toggleExpanded('topArtists')}
          />
        </div>

        <div className="spotify-panel playlists-panel">
          <div className="spotify-section-heading">
            <div>
              <span>{profilePossessive} library</span>
              <h3>{profilePossessive} playlists</h3>
            </div>
            <ListMusic size={22} />
          </div>

          <div className="spotify-playlists-grid">
            {visiblePlaylists.map(playlist => (
              <a
                href={playlist.external_urls.spotify}
                target="_blank"
                rel="noreferrer"
                key={playlist.id}
                className="spotify-playlist-card"
              >
                <img src={getImage(playlist.images)} alt={playlist.name} />
                <div className="playlist-info">
                  <h4>{playlist.name}</h4>
                  <span>{playlist.owner?.display_name || 'Spotify'}</span>
                </div>
                <div className="playlist-play-icon">
                  <Play size={14} fill="currentColor" />
                </div>
              </a>
            ))}
          </div>

          <ViewMoreButton
            count={playlists.length}
            visibleCount={4}
            label="playlists"
            isExpanded={expanded.playlists}
            onClick={() => toggleExpanded('playlists')}
          />
        </div>

        <div className="spotify-panel followed-panel">
          <div className="spotify-section-heading">
            <div>
              <span>{profilePossessive} follows</span>
              <h3>Artists {profileName} follows</h3>
            </div>
            <UserCheck size={22} />
          </div>

          {followedWarning && (
            <p className="spotify-panel-note">{followedWarning}</p>
          )}

          {followedArtists.length > 0 ? (
            <>
              <div className="spotify-followed-grid">
                {visibleFollowedArtists.map(artist => (
                  <a
                    href={artist.external_urls.spotify}
                    target="_blank"
                    rel="noreferrer"
                    key={artist.id}
                    className="spotify-followed-card"
                  >
                    <img src={getImage(artist.images)} alt={artist.name} />
                    <div>
                      <h4>{artist.name}</h4>
                      <span>{artist.followers?.total?.toLocaleString() || 0} followers</span>
                    </div>
                    <ExternalLink size={15} />
                  </a>
                ))}
              </div>

              <ViewMoreButton
                count={followedArtists.length}
                visibleCount={6}
                label="followed artists"
                isExpanded={expanded.followedArtists}
                onClick={() => toggleExpanded('followedArtists')}
              />
            </>
          ) : !followedWarning && (
            <p className="spotify-panel-note">Nu am gasit artisti urmariti in contul conectat.</p>
          )}
        </div>
      </div>
    </section>
  );
}
