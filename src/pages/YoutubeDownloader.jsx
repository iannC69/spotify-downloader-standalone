import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, Film, Loader2, AlertCircle, CheckCircle2,
  Zap, Clock, MonitorPlay, Headphones, Link2, RefreshCw, Save, ListVideo, Archive
} from 'lucide-react';
import './YoutubeDownloader.css';

const RESOLUTIONS = [
  { id: '4k',    label: '4K',    sub: '2160p',   minH: 2160, format: 'bestvideo[height<=2160][ext=mp4]+bestaudio[ext=m4a]/best[height<=2160]' },
  { id: '1440p', label: '2K',    sub: '1440p',   minH: 1440, format: 'bestvideo[height<=1440][ext=mp4]+bestaudio[ext=m4a]/best[height<=1440]' },
  { id: '1080p', label: '1080p', sub: 'Full HD', minH: 1080, format: 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080]' },
  { id: '720p',  label: '720p',  sub: 'HD',      minH: 720,  format: 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720]'  },
  { id: '480p',  label: '480p',  sub: 'SD',      minH: 480,  format: 'bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best[height<=480]'  },
  { id: '360p',  label: '360p',  sub: 'Low',     minH: 360,  format: 'bestvideo[height<=360][ext=mp4]+bestaudio[ext=m4a]/best[height<=360]'  },
];

const AUDIO_FORMATS = [
  { id: 'mp3_320', label: '320kbps MP3', sub: 'Best Quality', quality: '0',  audioFmt: 'mp3' },
  { id: 'mp3_192', label: '192kbps MP3', sub: 'Standard',     quality: '5',  audioFmt: 'mp3' },
  { id: 'mp3_128', label: '128kbps MP3', sub: 'Compressed',   quality: '9',  audioFmt: 'mp3' },
  { id: 'ogg',     label: 'OGG Vorbis',  sub: 'Open Format',  quality: '0',  audioFmt: 'vorbis' },
  { id: 'wav',     label: 'WAV',         sub: 'Lossless',     quality: '0',  audioFmt: 'wav' },
];

function formatDuration(secs) {
  if (!secs) return '--:--';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatViews(n) {
  if (!n) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K views`;
  return `${n} views`;
}

function isPlaylistUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.searchParams.has('list') || parsed.pathname.split('/').includes('playlist');
  } catch {
    return false;
  }
}

const YoutubeDownloader = () => {
  const [url, setUrl] = useState('');
  const [info, setInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [error, setError] = useState(null);

  const [mediaType, setMediaType] = useState('video'); // 'video' | 'audio'
  const [selectedRes, setSelectedRes] = useState('1080p');
  const [selectedAudio, setSelectedAudio] = useState('mp3_320');

  const [downloading, setDownloading] = useState(false);

  const [progress, setProgress] = useState(0);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [finalFilename, setFinalFilename] = useState('');
  const [outputName, setOutputName] = useState('');
  const [downloadScope, setDownloadScope] = useState('single');
  const [downloadStatus, setDownloadStatus] = useState('');
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [pendingScope, setPendingScope] = useState('single');

  const fetchInfo = async () => {
    if (!url) return;
    setLoadingInfo(true);
    setError(null);
    setInfo(null);
    setDownloadComplete(false);
    setProgress(0);

    try {
      const res = await fetch(`/api/ytdl/info?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch info');
      let playlist = null;
      if (isPlaylistUrl(url)) {
        const playlistRes = await fetch('/api/ytdl/collection-info?url=' + encodeURIComponent(url));
        if (playlistRes.ok) playlist = await playlistRes.json();
      }
      setInfo({ ...data, playlist });
      const safeName = (data.title || 'video').replace(/[^a-zA-Z0-9 _-]/g, '').trim().slice(0, 60);
      setOutputName(safeName);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingInfo(false);
    }
  };

  const openDownloadModal = (scope = 'single') => {
    setPendingScope(scope);
    setShowOptionsModal(true);
  };

  const startDownload = () => {
    const scope = pendingScope;
    setShowOptionsModal(false);
    if (!url) return;
    setDownloading(true);
    setError(null);
    setProgress(0);
    setDownloadComplete(false);
    setDownloadScope(scope);
    setDownloadStatus(scope === 'playlist' ? 'Se pregătește playlistul...' : 'Se pregătește descărcarea...');
    if (scope === 'playlist' && info?.playlist?.title) {
      setOutputName(info.playlist.title.replace(/[^a-zA-Z0-9 _-]/g, '').trim().slice(0, 60) || 'youtube_playlist');
    }

    let formatStr;

    if (mediaType === 'audio') {
      const af = AUDIO_FORMATS.find(a => a.id === selectedAudio) || AUDIO_FORMATS[0];
      formatStr = `audio:${af.audioFmt}:${af.quality}`;
    } else {
      const resOpt = RESOLUTIONS.find(r => r.id === selectedRes) || RESOLUTIONS[2];
      formatStr = `video:${resOpt.format}`;
    }

    const endpoint = scope === 'playlist' ? '/api/ytdl/collection-download' : '/api/ytdl/download';
    const eventSource = new EventSource(
      endpoint + '?url=' + encodeURIComponent(url) + '&format=' + encodeURIComponent(formatStr)
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.progress !== undefined) setProgress(data.progress);
        if (data.status) setDownloadStatus(data.status);
        if (data.currentItem && data.totalItems) {
          setDownloadStatus('Se descarcă piesa ' + data.currentItem + ' din ' + data.totalItems);
        }
        if (data.error) {
          eventSource.close();
          setDownloading(false);
          setError(data.error);
          return;
        }
        if (data.done) {
          eventSource.close();
          setDownloading(false);
          setDownloadComplete(true);
          if (data.finalFilename) {
            setFinalFilename(data.finalFilename);
          }
        }
      } catch (e) {
        console.error('Failed to parse event data:', e);
      }
    };

    eventSource.onerror = (err) => {
      console.error('EventSource failed:', err);
      eventSource.close();
      setDownloading(false);
      setError('Connection to server lost. Please try again.');
    };
  };

  const handleReset = () => {
    setInfo(null);
    setUrl('');
    setDownloadComplete(false);
    setProgress(0);
    setFinalFilename('');
    setError(null);
    setDownloadScope('single');
    setDownloadStatus('');
  };

  return (
    <div className="ytdl-page">
      <div className="ytdl-bg-glow" />

      <div className="ytdl-layout">
        <motion.header
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="ytdl-header"
        >
          <div className="ytdl-logo-ring">
            <Film size={34} fill="currentColor" />
          </div>
          <div className="ytdl-title-box">
            <h1 className="ytdl-title">YouTube Downloader</h1>
            <p className="ytdl-subtitle">Descarcă videoclipuri 4K și MP3-uri la calitate maximă</p>
          </div>
          {info && (
            <button className="ytdl-reset-btn" onClick={handleReset} title="Resetare">
              <RefreshCw size={18} />
            </button>
          )}
        </motion.header>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="ytdl-url-card"
        >
          <div className="ytdl-url-icon"><Link2 size={24} /></div>
          <input
            type="text"
            placeholder="Lipește aici link-ul de YouTube..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchInfo()}
            disabled={downloading || loadingInfo}
            className="ytdl-url-input"
          />
          <button
            className="ytdl-fetch-btn"
            onClick={fetchInfo}
            disabled={!url || downloading || loadingInfo}
          >
            {loadingInfo
              ? <><Loader2 className="spin" size={20} /> Se caută...</>
              : <><Zap size={20} fill="currentColor" /> Procesează</>
            }
          </button>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="ytdl-error"
            >
              <AlertCircle size={20} /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {loadingInfo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="ytdl-skeleton-card"
            >
              <div className="ytdl-skel-cover" />
              <div className="ytdl-skel-lines">
                <div className="ytdl-skel-line long" />
                <div className="ytdl-skel-line short" />
                <div className="ytdl-skel-line chips" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {info && !loadingInfo && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              className="ytdl-main-card"
            >
              <div className="ytdl-preview-section">
                <div className="ytdl-thumbnail-wrapper">
                  <img src={info.thumbnail} alt="thumbnail" className="ytdl-thumbnail" />
                  <span className="ytdl-duration-badge">{formatDuration(info.duration)}</span>
                </div>
                <div className="ytdl-video-meta">
                  <h2 className="ytdl-video-title">{info.title}</h2>
                  <div className="ytdl-video-channel">
                    <span style={{fontWeight: 700, color: '#f1f5f9'}}>{info.uploader}</span> • YouTube
                  </div>
                  <div className="ytdl-video-stats">
                    <span className="ytdl-stat-chip">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      {formatViews(info.view_count) || 'Multe'}
                    </span>
                    <span className="ytdl-stat-chip">
                      <Clock size={14} /> {formatDuration(info.duration)}
                    </span>
                  </div>
                  {info.playlist && (
                    <div className="ytdl-playlist-note">
                      <ListVideo size={16} />
                      <span>
                        Playlist: <strong>{info.playlist.title}</strong> · {info.playlist.downloadableCount} videoclipuri
                        {info.playlist.isTruncated && <span> (Limitat la primele 1000)</span>}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <AnimatePresence>
                {showOptionsModal && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="ytdl-modal-overlay"
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 20 }}
                      className="ytdl-modal"
                    >
                      <h3 className="ytdl-modal-title">Setări descărcare</h3>
                      <div className="ytdl-type-tabs">
                        <button
                          className={`ytdl-type-tab ${mediaType === 'video' ? 'active' : ''}`}
                          onClick={() => setMediaType('video')}
                        >
                          <MonitorPlay size={18} /> Video (MP4)
                        </button>
                        <button
                          className={`ytdl-type-tab ${mediaType === 'audio' ? 'active' : ''}`}
                          onClick={() => setMediaType('audio')}
                        >
                          <Headphones size={18} /> Audio
                        </button>
                      </div>
                      <div className="ytdl-formats-grid">
                        {mediaType === 'video' ? (
                          RESOLUTIONS.map(resOpt => (
                            <div
                              key={resOpt.id}
                              onClick={() => setSelectedRes(resOpt.id)}
                              className={`ytdl-format-card ${selectedRes === resOpt.id ? 'selected' : ''}`}
                            >
                              <div className="ytdl-format-label">{resOpt.label}</div>
                              <div className="ytdl-format-sub">{resOpt.sub}</div>
                            </div>
                          ))
                        ) : (
                          AUDIO_FORMATS.map(af => (
                            <div
                              key={af.id}
                              onClick={() => setSelectedAudio(af.id)}
                              className={`ytdl-format-card ${selectedAudio === af.id ? 'selected' : ''}`}
                            >
                              <div className="ytdl-format-label">{af.label}</div>
                              <div className="ytdl-format-sub">{af.sub}</div>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="ytdl-modal-actions">
                        <button className="ytdl-modal-cancel" onClick={() => setShowOptionsModal(false)}>
                          Anulează
                        </button>
                        <button className="ytdl-modal-confirm" onClick={startDownload}>
                          Începe descărcarea
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="ytdl-action-area">
                <AnimatePresence mode="wait">
                  {!downloadComplete && !downloading && (
                    <div className={info.playlist ? 'ytdl-dl-actions' : ''}>
                      <motion.button
                        key="btn-dl"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`ytdl-dl-btn ${info.playlist ? 'ytdl-single-dl-btn' : ''}`}
                        onClick={() => openDownloadModal('single')}
                      >
                        <Download size={22} /> {info.playlist ? 'Descarcă un videoclip' : 'Descarcă acum'}
                      </motion.button>
                      {info.playlist && (
                        <button className="ytdl-dl-btn ytdl-playlist-dl-btn" onClick={() => openDownloadModal('playlist')}>
                          <ListVideo size={22} /> Descarcă playlistul ({info.playlist.downloadableCount})
                        </button>
                      )}
                    </div>
                  )}

                  {downloading && (
                    <motion.div
                      key="progress"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="ytdl-progress-block"
                    >
                      <div className="ytdl-progress-header">
                        <span className="ytdl-progress-label">
                          <Loader2 className="spin" size={16} /> Se procesează și se descarcă...
                        </span>
                        <span>{progress.toFixed(1)}%</span>
                      </div>
                      {downloadStatus && <div className="ytdl-progress-detail">{downloadStatus}</div>}
                      <div className="ytdl-progress-track">
                        <motion.div
                          className="ytdl-progress-fill"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ ease: 'linear' }}
                        />
                      </div>
                    </motion.div>
                  )}

                  {downloadComplete && finalFilename && (
                    <motion.div
                      key="complete"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="ytdl-complete-block"
                    >
                      <div className="ytdl-complete-icon"><CheckCircle2 size={32} /></div>
                      <div className="ytdl-complete-info">
                        <span className="ytdl-complete-title">Gata! Salvează fișierul:</span>
                        <div className="ytdl-name-input-row">
                          <input
                            type="text"
                            value={outputName}
                            onChange={e => setOutputName(e.target.value)}
                            placeholder="nume_fisier"
                            className="ytdl-name-input"
                          />
                          <a
                            href={`/api/download-file?file=${encodeURIComponent(finalFilename)}&outName=${encodeURIComponent(outputName)}`}
                            download
                            className={`ytdl-save-btn ${!outputName.trim() ? 'disabled' : ''}`}
                            onClick={e => { if (!outputName.trim()) e.preventDefault(); }}
                          >
                            <Save size={18} /> Salvează
                          </a>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default YoutubeDownloader;
