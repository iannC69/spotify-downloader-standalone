import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, Loader2, AlertCircle, CheckCircle2,
  Zap, Disc, Music2, Clock, Link2, RefreshCw, Save, Archive,
  LogIn, LogOut, ListMusic, ChevronRight, User
} from 'lucide-react';
import './SpotifyDownloader.css';

function formatDuration(ms) {
  if (!ms) return '--:--';
  const secs = Math.floor(ms / 1000);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function getDownloadLabel(kind) {
  if (kind === 'playlist') return 'Descarcă playlistul complet';
  if (kind === 'album') return 'Descarcă albumul complet';
  return 'Descarcă piesa';
}

function getCollectionLabel(kind) {
  if (kind === 'playlist') return 'Playlist';
  if (kind === 'album') return 'Album';
  return 'Piesă';
}

const AUDIO_FORMATS = [
  { id: 'mp3_320', label: '320kbps MP3', sub: 'Cea mai bună calitate', quality: '0', formatStr: 'mp3:0' },
  { id: 'mp3_256', label: '256kbps MP3', sub: 'Calitate înaltă', quality: '2', formatStr: 'mp3:2' },
  { id: 'mp3_192', label: '192kbps MP3', sub: 'Standard', quality: '5', formatStr: 'mp3:5' },
  { id: 'mp3_128', label: '128kbps MP3', sub: 'Comprimat', quality: '9', formatStr: 'mp3:9' },
];

const SpotifyDownloader = () => {
  const [url, setUrl] = useState('');
  const [info, setInfo] = useState(null);

  const [loadingInfo, setLoadingInfo] = useState(false);
  const [error, setError] = useState(null);

  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState('');
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [finalFilename, setFinalFilename] = useState('');
  const [outputName, setOutputName] = useState('');

  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [selectedAudio, setSelectedAudio] = useState('mp3_320');

  // Auth / playlists state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(true);
  const [showPlaylists, setShowPlaylists] = useState(false);

  // Check login status on mount
  useEffect(() => {
    const checkLogin = async () => {
      setLoadingPlaylists(true);
      try {
        const res = await fetch('/api/spotify/data');
        if (!res.ok) { setIsLoggedIn(false); return; }
        const data = await res.json();
        if (data.profile) {
          setIsLoggedIn(true);
          setUserProfile(data.profile);
          setUserPlaylists(data.playlists || []);
        } else {
          setIsLoggedIn(false);
        }
      } catch {
        setIsLoggedIn(false);
      } finally {
        setLoadingPlaylists(false);
      }
    };
    checkLogin();
  }, []);

  const handleSelectPlaylist = useCallback(async (playlistUrl) => {
    setUrl(playlistUrl);
    setInfo(null);
    setDownloadComplete(false);
    setProgress(0);
    setError(null);
    setDownloadStatus('');
    setShowPlaylists(false);

    // auto-fetch info
    setLoadingInfo(true);
    try {
      const res = await fetch('/api/spotify/collection-info?url=' + encodeURIComponent(playlistUrl));
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch info');
      setInfo(data);
      const nameSource = data.kind === 'track' ? data.artist + ' - ' + data.title : data.title;
      const safeName = nameSource.replace(/[^a-zA-Z0-9 _-]/g, '').trim().slice(0, 80);
      setOutputName(safeName);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingInfo(false);
    }
  }, []);

  const fetchInfo = async () => {
    if (!url) return;
    setLoadingInfo(true);
    setError(null);
    setInfo(null);
    setDownloadComplete(false);
    setProgress(0);

    try {
      const res = await fetch('/api/spotify/collection-info?url=' + encodeURIComponent(url));
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch info');
      setInfo(data);
      const nameSource = data.kind === 'track' ? data.artist + ' - ' + data.title : data.title;
      const safeName = nameSource.replace(/[^a-zA-Z0-9 _-]/g, '').trim().slice(0, 80);
      setOutputName(safeName);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingInfo(false);
    }
  };

  const openDownloadModal = () => {
    if (!info) return;
    setShowOptionsModal(true);
  };

  const startDownload = () => {
    setShowOptionsModal(false);
    if (!info) return;
    setDownloading(true);
    setError(null);
    setProgress(0);
    setDownloadStatus('Se pregătește descărcarea...');
    setDownloadComplete(false);

    const af = AUDIO_FORMATS.find(a => a.id === selectedAudio) || AUDIO_FORMATS[0];

    const eventSource = new EventSource(
      '/api/spotify/collection-download?url=' + encodeURIComponent(url) + '&format=' + encodeURIComponent(af.formatStr)
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.progress !== undefined) setProgress(data.progress);
        if (data.status) setDownloadStatus(data.status);
        if (data.currentItem && data.totalItems) {
          setDownloadStatus('Piesa ' + data.currentItem + ' din ' + data.totalItems + (data.currentTitle ? ': ' + data.currentTitle : ''));
        }
        if (data.raw) {
           const text = data.raw.trim();
           if (text && !text.includes('%')) {
             setDownloadStatus(text.slice(0, 60) + (text.length > 60 ? '...' : ''));
           }
        }
        if (data.error) {
           setError(data.error);
           setDownloading(false);
           eventSource.close();
        }
        if (data.done && !data.error) {
          eventSource.close();
          setDownloading(false);
          setDownloadComplete(true);
          if (data.finalFilename) {
            setFinalFilename(data.finalFilename);
          }
        }
      } catch (e) {
        console.error('Failed to parse SSE', e);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      setDownloading(false);
      setError('Connection to server lost during download.');
    };
  };

  const handleReset = () => {
    setInfo(null);
    setUrl('');
    setDownloadComplete(false);
    setProgress(0);
    setFinalFilename('');
    setError(null);
    setDownloadStatus('');
  };

  return (
    <div className="spdl-page">
      {/* Animated background */}
      <div className="spdl-bg">
        <div className="spdl-bg-orb spdl-orb-1" />
        <div className="spdl-bg-orb spdl-orb-2" />
        <div className="spdl-bg-orb spdl-orb-3" />
        <div className="spdl-grid-overlay" />
      </div>

      <div className="spdl-layout">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="spdl-header"
        >
          <div className="spdl-logo-ring">
            <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor" color="#000">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.24 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.24 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
          </div>
          <div>
            <h1 className="spdl-title">Spotify Downloader</h1>
            <p className="spdl-subtitle">Download high-quality MP3s with full metadata</p>
          </div>
          <div className="spdl-header-actions">
            {info && (
              <button className="spdl-reset-btn" onClick={handleReset} title="Reset">
                <RefreshCw size={16} />
              </button>
            )}
            {!loadingPlaylists && (
              isLoggedIn && userProfile ? (
                <button
                  className="spdl-profile-btn"
                  onClick={() => setShowPlaylists(v => !v)}
                  title="Playlisturile mele"
                >
                  {userProfile.images?.[0]?.url
                    ? <img src={userProfile.images[0].url} alt={userProfile.display_name} className="spdl-avatar" />
                    : <User size={16} />
                  }
                  <span className="spdl-profile-name">{userProfile.display_name}</span>
                  <ChevronRight size={14} className={`spdl-chevron ${showPlaylists ? 'rotated' : ''}`} />
                </button>
              ) : (
                <a href="/api/spotify/login" className="spdl-login-btn">
                  <LogIn size={16} />
                  Conectează-te
                </a>
              )
            )}
          </div>
        </motion.header>

        {/* User Playlists Panel */}
        <AnimatePresence>
          {isLoggedIn && showPlaylists && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: '1.5rem' }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="spdl-playlists-panel"
            >
              <div className="spdl-playlists-header">
                <ListMusic size={16} />
                <span>Playlisturile mele ({userPlaylists.length})</span>
              </div>
              <div className="spdl-playlists-grid">
                {userPlaylists.map(pl => (
                  <button
                    key={pl.id}
                    className="spdl-playlist-card"
                    onClick={() => handleSelectPlaylist(pl.external_urls?.spotify || `https://open.spotify.com/playlist/${pl.id}`)}
                  >
                    <div className="spdl-playlist-img">
                      {pl.images?.[0]?.url
                        ? <img src={pl.images[0].url} alt={pl.name} />
                        : <ListMusic size={28} />
                      }
                    </div>
                    <div className="spdl-playlist-info">
                      <span className="spdl-playlist-name">{pl.name}</span>
                      <span className="spdl-playlist-count">{pl.tracks?.total ?? 0} piese</span>
                    </div>
                    <Download size={14} className="spdl-playlist-dl-icon" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* URL Input */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="spdl-url-card"
        >
          <div className="spdl-url-icon"><Link2 size={20} /></div>
          <input
            type="text"
            placeholder="Lipește un link Spotify: piesă, playlist sau album..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchInfo()}
            disabled={downloading || loadingInfo}
            className="spdl-url-input"
          />
          <button
            className="spdl-fetch-btn"
            onClick={fetchInfo}
            disabled={!url || downloading || loadingInfo}
          >
            {loadingInfo
              ? <><Loader2 className="spin" size={18} /> Fetching</>
              : <><Zap size={18} /> Fetch Info</>
            }
          </button>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="spdl-error"
            >
              <AlertCircle size={18} /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Card - shown after info fetched */}
        <AnimatePresence>
          {info && !loadingInfo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="spdl-main-card"
            >
              {/* Track Preview */}
              <div className="spdl-preview-section">
                <div className="spdl-cover">
                  {info.coverUrl ? (
                    <img src={info.coverUrl} alt={info.title} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: '#282828', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b3b3b3' }}>
                      <Music2 size={48} />
                    </div>
                  )}
                  {info.kind !== 'track' && <span className="spdl-cover-count">{info.trackCount}</span>}
                </div>
                <div className="spdl-track-meta">
                  <span className="spdl-kicker">{getCollectionLabel(info.kind)} · gata pentru download</span>
                  <h2 className="spdl-track-title">{info.title}</h2>
                  <span className="spdl-track-artist">{info.artist}</span>
                  <div className="spdl-meta-chips">
                    <span className="spdl-meta-chip"><Music2 size={12} /> {getCollectionLabel(info.kind)}</span>
                    {info.album && <span className="spdl-meta-chip"><Disc size={12} /> {info.album}</span>}
                    {info.duration_ms > 0 && <span className="spdl-meta-chip"><Clock size={12} /> {formatDuration(info.duration_ms)}</span>}
                    {info.trackCount > 1 && <span className="spdl-meta-chip"><Disc size={12} /> {info.downloadableCount} piese{info.isTruncated ? ' (primele 1000)' : ''}</span>}
                  </div>
                </div>
              </div>

              {info.kind !== 'track' && (
                <div className="spdl-collection-preview">
                  <div className="spdl-collection-heading">
                    <span>Primele piese</span>
                    <small>{info.downloadableCount} de {info.trackCount} pregătite pentru download</small>
                  </div>
                  <ol>
                    {info.previewTracks?.map((track, index) => (
                      <li key={`${track.title}-${index}`}>
                        <span>{track.title}</span>
                        <small>{track.artist}{track.duration_ms ? ` · ${formatDuration(track.duration_ms)}` : ''}</small>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {info.kind !== 'track' && (
                <div className="spdl-archive-note">
                  <Archive size={18} />
                  <span>Vei primi o singură arhivă ZIP cu piesele etichetate.</span>
                  <strong>{info.downloadableCount} piese</strong>
                </div>
              )}

              {/* Options Modal */}
              <AnimatePresence>
                {showOptionsModal && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="spdl-modal-overlay"
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 20 }}
                      className="spdl-modal"
                    >
                      <h3 className="spdl-modal-title">Setări descărcare</h3>
                      
                      <div className="spdl-formats-grid">
                        {AUDIO_FORMATS.map(af => (
                          <div
                            key={af.id}
                            onClick={() => setSelectedAudio(af.id)}
                            className={`spdl-format-card ${selectedAudio === af.id ? 'selected' : ''}`}
                          >
                            <div className="spdl-format-label">{af.label}</div>
                            <div className="spdl-format-sub">{af.sub}</div>
                          </div>
                        ))}
                      </div>

                      <div className="spdl-modal-actions">
                        <button className="spdl-modal-cancel" onClick={() => setShowOptionsModal(false)}>
                          Anulează
                        </button>
                        <button className="spdl-modal-confirm" onClick={startDownload}>
                          Începe descărcarea
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {!downloadComplete && !downloading && (
                  <motion.button
                    key="btn"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="spdl-dl-btn"
                    onClick={openDownloadModal}
                  >
                    {info.kind === 'track' ? <Download size={20} /> : <Archive size={20} />} {getDownloadLabel(info.kind)}
                  </motion.button>
                )}

                {downloading && (
                  <motion.div
                    key="progress"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="spdl-progress-block"
                  >
                    <div className="spdl-progress-header">
                      <span className="spdl-progress-label">
                        <Loader2 className="spin" size={14} /> {downloadStatus || 'Se descarcă...'}
                      </span>
                      <span className="spdl-progress-pct">{progress.toFixed(1)}%</span>
                    </div>
                    <div className="spdl-progress-track">
                      <motion.div
                        className="spdl-progress-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ ease: 'linear' }}
                      />
                    </div>
                  </motion.div>
                )}

                {downloadComplete && finalFilename && (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="spdl-complete-block"
                  >
                    <div className="spdl-complete-icon"><CheckCircle2 size={22} /></div>
                    <div className="spdl-complete-info">
                      <span className="spdl-complete-title">
                        {info.kind === 'track' ? 'Gata! Alege un nume și salvează:' : 'Gata! Alege un nume pentru arhiva ZIP:'}
                      </span>
                      <div className="spdl-name-input-row">
                        <input
                          type="text"
                          value={outputName}
                          onChange={e => setOutputName(e.target.value)}
                          placeholder="output_filename"
                          className="spdl-name-input"
                        />
                        <a
                          href={`/api/download-file?file=${encodeURIComponent(finalFilename)}&outName=${encodeURIComponent(outputName)}`}
                          download
                          className={`spdl-save-btn ${!outputName.trim() ? 'disabled' : ''}`}
                          onClick={e => { if (!outputName.trim()) e.preventDefault(); }}
                        >
                          <Save size={16} /> Salvează
                        </a>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading skeleton */}
        <AnimatePresence>
          {loadingInfo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="spdl-skeleton-card"
            >
              <div className="spdl-skel spdl-skel-cover" />
              <div className="spdl-skel-lines">
                <div className="spdl-skel spdl-skel-line spdl-skel-line-long" />
                <div className="spdl-skel spdl-skel-line spdl-skel-line-short" />
                <div className="spdl-skel spdl-skel-line spdl-skel-line-chips" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SpotifyDownloader;
