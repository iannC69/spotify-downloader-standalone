import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, Loader2, AlertCircle, UploadCloud, Link as LinkIcon, Play, Pause, Volume2, RotateCcw, X } from 'lucide-react';
// jsmediatags loaded dynamically to avoid Vite ESM issues
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import './Mp3Cutter.css';

// Native IndexedDB Helper
const DB_NAME = 'Mp3CutterDB';
const STORE_NAME = 'audioFiles';

const initDB = () => new Promise((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, 1);
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME);
    }
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

const saveToIDB = async (key, val) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(val, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('IDB Save failed', e);
  }
};

const getFromIDB = async (key) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('IDB Get failed', e);
    return null;
  }
};

const deleteFromIDB = async (key) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('IDB Delete failed', e);
  }
};

const Mp3Cutter = () => {
  const [url, setUrl] = useState('');
  const [mode, setMode] = useState('youtube');
  const [localFile, setLocalFile] = useState(null);
  const fileInputRef = useRef(null);

  const [info, setInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [error, setError] = useState(null);

  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(15);
  const [duration, setDuration] = useState(0);
  const [startInput, setStartInput] = useState('0:00.0');
  const [endInput, setEndInput] = useState('0:15.0');

  const [fadeIn, setFadeIn] = useState(0);
  const [fadeOut, setFadeOut] = useState(0);
  const [volume, setVolume] = useState(1);
  const [outputName, setOutputName] = useState('nexus_cut_audio');
  const [isPlaying, setIsPlaying] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [dlProgress, setDlProgress] = useState(0);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [finalFileUrl, setFinalFileUrl] = useState('');

  const containerRef = useRef(null);
  const wavesurfer = useRef(null);
  const activeRegion = useRef(null);
  const pendingAudioUrl = useRef(null);
  const [waveReady, setWaveReady] = useState(false);
  const [serverFilename, setServerFilename] = useState('');
  const [dlPercent, setDlPercent] = useState(0);

  const formatTime = useCallback((seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const t = Math.floor((seconds % 1) * 10);
    return `${m}:${s.toString().padStart(2, '0')}.${t}`;
  }, []);

  const parseTime = (str) => {
    const match = str.match(/^(\d+):(\d{2})(?:\.(\d))?$/);
    if (!match) return null;
    return parseInt(match[1], 10) * 60 + parseInt(match[2], 10) + (match[3] ? parseInt(match[3], 10) / 10 : 0);
  };

  const initWaveSurfer = useCallback((audioUrl) => {
    if (!containerRef.current) return;
    if (wavesurfer.current) wavesurfer.current.destroy();
    setWaveReady(false);
    setIsPlaying(false);

    // 123apps style colors
    const neonGreen = '#00ff7f';

    wavesurfer.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: neonGreen,
      progressColor: neonGreen,
      cursorColor: 'transparent',
      cursorWidth: 0,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 110,
      normalize: true,
      plugins: [RegionsPlugin.create()]
    });

    wavesurfer.current.load(audioUrl);

    wavesurfer.current.on('ready', () => {
      setWaveReady(true);
      const total = wavesurfer.current.getDuration();
      setDuration(total);
      const end = Math.min(15, total);
      setStartTime(0);
      setEndTime(end);
      setStartInput(formatTime(0));
      setEndInput(formatTime(end));

      const wsRegions = wavesurfer.current.getActivePlugins()[0];
      const region = wsRegions.addRegion({
        start: 0,
        end: end,
        color: 'transparent',
        drag: true,
        resize: true
      });
      const lastRegion = { start: 0, end: end };
      activeRegion.current = region;

      region.on('update-end', () => {
        const isStartChanged = Math.abs(region.start - lastRegion.start) > 0.01;

        if (isStartChanged) {
          wavesurfer.current.setTime(region.start);
        } else {
          wavesurfer.current.setTime(Math.max(region.start, region.end - 2));
        }
        region.play();

        setStartTime(region.start);
        setEndTime(region.end);
        setStartInput(formatTime(region.start));
        setEndInput(formatTime(region.end));

        lastRegion.start = region.start;
        lastRegion.end = region.end;
      });
    });

    wavesurfer.current.on('play', () => setIsPlaying(true));
    wavesurfer.current.on('pause', () => setIsPlaying(false));
    wavesurfer.current.on('finish', () => setIsPlaying(false));
  }, [formatTime]);

  // Fires after every render — picks up pendingAudioUrl once container exists
  useEffect(() => {
    if (info && !loadingInfo && pendingAudioUrl.current && containerRef.current) {
      initWaveSurfer(pendingAudioUrl.current);
      pendingAudioUrl.current = null;
    }
  });

  useEffect(() => {
    return () => { if (wavesurfer.current) wavesurfer.current.destroy(); };
  }, []);

  // Live audio preview for Fade In/Out
  useEffect(() => {
    if (!wavesurfer.current) return;
    const ws = wavesurfer.current;

    const handleTimeUpdate = (currentTime) => {
      if (!isPlaying || !activeRegion.current) return;
      const { start, end } = activeRegion.current;
      let vol = 1;

      if (currentTime < start || currentTime > end) {
        vol = 0; // Mute outside selection
      } else if (fadeIn > 0 && currentTime < start + fadeIn) {
        vol = (currentTime - start) / fadeIn;
      } else if (fadeOut > 0 && currentTime > end - fadeOut) {
        vol = (end - currentTime) / fadeOut;
      }

      // Apply easing curve to fade volume, then multiply by master volume
      const easedVol = Math.pow(Math.max(0, Math.min(1, vol)), 2);
      // HTML5 Audio volume must be between 0 and 1. We clamp it for preview, 
      // but the exported file will properly amplify beyond 100% via FFmpeg.
      ws.setVolume(Math.min(1, Math.max(0, easedVol * volume)));
    };

    ws.on('timeupdate', handleTimeUpdate);
    return () => {
      ws.un('timeupdate', handleTimeUpdate);
      ws.setVolume(1); // Reset volume when unmounting
    };
  }, [isPlaying, fadeIn, fadeOut, volume]);

  // Inject global CSS for wavesurfer handles (shadow DOM)
  useEffect(() => {
    const styleId = 'ws-handle-override';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        /* Wavesurfer region handle bars */
        .waveform-editor-box div[part="region"] {
          border-left: 3px solid #00e5ff !important;
          border-right: 3px solid #00e5ff !important;
          background: rgba(0,229,255,0.06) !important;
        }
        .waveform-editor-box div[part="region-handle-left"],
        .waveform-editor-box div[part="region-handle-right"] {
          width: 4px !important;
          background: #00e5ff !important;
          border-radius: 0 !important;
          cursor: ew-resize !important;
          box-shadow: 0 0 10px 2px rgba(0,229,255,0.5) !important;
        }
      `;
      document.head.appendChild(style);
    }
    return () => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
    };
  }, []);

  const handlePlayPause = () => {
    if (!wavesurfer.current || !activeRegion.current) return;
    if (isPlaying) {
      wavesurfer.current.pause();
    } else {
      // Seek to region start then play so it always starts from selection
      wavesurfer.current.setTime(activeRegion.current.start);
      activeRegion.current.play();
    }
  };

  const handleStartInput = (val) => {
    setStartInput(val);
    const parsed = parseTime(val);
    if (parsed !== null && parsed >= 0 && parsed <= duration && activeRegion.current) {
      let newStart = parsed;
      let newEnd = endTime;

      if (newStart >= newEnd) {
        newEnd = Math.min(newStart + 15, duration);
        setEndTime(newEnd);
        setEndInput(formatTime(newEnd));
      }

      setStartTime(newStart);
      activeRegion.current.setOptions({ start: newStart, end: newEnd });
      if (wavesurfer.current) {
        wavesurfer.current.setTime(newStart);
        activeRegion.current.play();
      }
    }
  };

  const handleEndInput = (val) => {
    setEndInput(val);
    const parsed = parseTime(val);
    if (parsed !== null && parsed >= 0 && parsed <= duration && activeRegion.current) {
      let newEnd = parsed;
      let newStart = startTime;

      if (newEnd <= newStart) {
        newStart = Math.max(newEnd - 15, 0);
        setStartTime(newStart);
        setStartInput(formatTime(newStart));
      }

      setEndTime(newEnd);
      activeRegion.current.setOptions({ start: newStart, end: newEnd });
      if (wavesurfer.current) {
        wavesurfer.current.setTime(Math.max(newStart, newEnd - 2));
        activeRegion.current.play();
      }
    }
  };

  const processLocalFile = useCallback((file) => {
    setLocalFile(file);
    setServerFilename('');
    setDownloadComplete(false);
    setFinalFileUrl('');
    setError(null);
    setWaveReady(false);

    const defaultThumb = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 24 24" fill="none" stroke="%2300bcd4" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="background:%230b1120"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>';
    pendingAudioUrl.current = URL.createObjectURL(file);
    setInfo({ title: file.name, thumbnail: defaultThumb });

    // Use jsmediatags — built for browser, no Node Buffer polyfills required
    const extractCover = async () => {
      try {
        await import('jsmediatags/dist/jsmediatags.min.js');
        const lib = window.jsmediatags;
        if (!lib?.read) throw new Error('jsmediatags browser bundle did not load');
        lib.read(file, {
          onSuccess(tag) {
            const tags = tag.tags;
            let coverUrl = null;
            let title = file.name;

            if (tags.title) {
              title = tags.artist ? `${tags.artist} — ${tags.title}` : tags.title;
            }

            if (tags.picture) {
              const { data, format } = tags.picture;
              const bytes = new Uint8Array(data);
              const blob = new Blob([bytes], { type: format });
              coverUrl = URL.createObjectURL(blob);
            }

            setInfo(prev => prev ? {
              ...prev,
              title: title,
              ...(coverUrl ? { thumbnail: coverUrl } : {})
            } : prev);
          },
          onError(err) {
            console.warn('jsmediatags read failed:', err);
          }
        });
      } catch (e) {
        console.warn('jsmediatags import failed:', e);
      }
    };
    extractCover();
  }, []);

  useEffect(() => {
    const restore = async () => {
      const savedLocal = await getFromIDB('CutterLocal');
      if (savedLocal && savedLocal.buffer) {
        setMode('local');
        const file = new File([savedLocal.buffer], savedLocal.name || 'local_audio.mp3', { type: savedLocal.type || 'audio/mp3' });
        processLocalFile(file);
      } else {
        const savedYt = await getFromIDB('CutterYouTube');
        if (savedYt && savedYt.info) {
          setMode('youtube');
          setUrl(savedYt.url || '');
          setInfo(savedYt.info);
          setServerFilename(savedYt.serverFilename);
          setDlPercent(100);
          pendingAudioUrl.current = `/downloads/${savedYt.serverFilename}`;
        }
      }
    };
    restore();
  }, [processLocalFile]);

  const switchMode = async (newMode) => {
    if (mode === newMode) return;
    
    setWaveReady(false);
    setDownloadComplete(false);
    setFinalFileUrl('');
    setStartTime(0); setEndTime(15);
    setStartInput('0:00.0'); setEndInput('0:15.0');
    setFadeIn(0); setFadeOut(0); setVolume(1); setIsPlaying(false);
    pendingAudioUrl.current = null;
    activeRegion.current = null;
    if (wavesurfer.current) { wavesurfer.current.destroy(); wavesurfer.current = null; }

    setMode(newMode);

    const saved = await getFromIDB(newMode === 'local' ? 'CutterLocal' : 'CutterYouTube');
    if (newMode === 'local') {
        if (saved && saved.buffer) {
           const file = new File([saved.buffer], saved.name || 'local.mp3', { type: saved.type || 'audio/mp3' });
           processLocalFile(file);
        } else {
           setLocalFile(null); setInfo(null);
        }
    } else {
        if (saved && saved.info) {
           setUrl(saved.url || '');
           setInfo(saved.info);
           setServerFilename(saved.serverFilename);
           setDlPercent(100);
           pendingAudioUrl.current = `/downloads/${saved.serverFilename}`;
        } else {
           setInfo(null); setUrl(''); setServerFilename('');
        }
    }
  };

  const handleFileChange = async (e) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    processLocalFile(file);
    try {
      const buffer = await file.arrayBuffer();
      await saveToIDB('CutterLocal', {
        buffer,
        name: file.name,
        type: file.type
      });
    } catch (err) {
      console.warn('Failed to save buffer to IDB', err);
    }
  };

  const fetchYoutube = async () => {
    if (!url) return;
    setLoadingInfo(true);
    setError(null);
    setInfo(null);
    setDownloadComplete(false);
    setDlPercent(0);
    setWaveReady(false);
    pendingAudioUrl.current = null;
    if (wavesurfer.current) wavesurfer.current.destroy();

    try {
      const res = await fetch(`/api/ytdl/info?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch info');
      setInfo(data);
      setDlPercent(5);

      const eventSource = new EventSource(`/api/ytdl/download?url=${encodeURIComponent(url)}&format=mp3`);
      eventSource.onmessage = (event) => {
        try {
          const d = JSON.parse(event.data);
          if (d.progress) setDlPercent(d.progress);
          if (d.done) {
            eventSource.close();
            setServerFilename(d.finalFilename);
            setLoadingInfo(false);
            pendingAudioUrl.current = `/downloads/${d.finalFilename}`;
            setDlPercent(100);

            saveToIDB('CutterYouTube', {
              url: url,
              serverFilename: d.finalFilename,
              info: data
            }).catch(() => { });
          }
        } catch (e) { console.error(e); }
      };
      eventSource.onerror = () => {
        eventSource.close();
        setLoadingInfo(false);
        setError('Eroare la descărcarea melodiei.');
      };
    } catch (err) {
      setError(err.message);
      setLoadingInfo(false);
    }
  };

  const executeCut = async () => {
    if (startTime === null || endTime === null) return;
    setDownloading(true);
    setError(null);
    setDlProgress(0);
    setDownloadComplete(false);

    try {
      const iv = setInterval(() => setDlProgress(p => p < 90 ? p + 5 : p), 500);
      const dur = (endTime - startTime).toFixed(2);
      let apiUrl = `/api/ytdl/cut-local?start=${startTime.toFixed(2)}&end=${endTime.toFixed(2)}&fadeIn=${fadeIn}&fadeOut=${fadeOut}&volume=${volume}&duration=${dur}`;
      let opts = { method: 'POST' };

      if (mode === 'youtube' && serverFilename) {
        apiUrl += `&sourceFile=${encodeURIComponent(serverFilename)}`;
      } else if (mode === 'local' && localFile) {
        const ext = localFile.name.match(/\.([^.]+)$/)?.[1] || 'mp3';
        apiUrl += `&ext=${ext}`;
        opts.body = localFile;
      } else {
        throw new Error('Sursă invalidă.');
      }

      const res = await fetch(apiUrl, opts);
      clearInterval(iv);
      setDlProgress(100);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Eroare.');
      setDownloading(false);
      setDownloadComplete(true);
      setFinalFileUrl(data.finalFilename);
    } catch (err) {
      setDownloading(false);
      setError(err.message);
    }
  };

  const resetAll = () => {
    setInfo(null); setUrl(''); setLocalFile(null); setServerFilename('');
    setWaveReady(false); setDownloadComplete(false); setFinalFileUrl('');
    setError(null); setDlPercent(0); setDlProgress(0);
    setStartTime(0); setEndTime(15);
    setStartInput('0:00.0'); setEndInput('0:15.0');
    setFadeIn(0); setFadeOut(0); setVolume(1); setIsPlaying(false);
    pendingAudioUrl.current = null;
    activeRegion.current = null;
    if (wavesurfer.current) { wavesurfer.current.destroy(); wavesurfer.current = null; }
    if (mode === 'local') {
      deleteFromIDB('CutterLocal').catch(() => { });
    } else {
      deleteFromIDB('CutterYouTube').catch(() => { });
    }
  };

  const resetSelection = () => {
    if (!wavesurfer.current || !activeRegion.current) return;
    const total = wavesurfer.current.getDuration();
    setStartTime(0);
    setEndTime(total);
    setStartInput(formatTime(0));
    setEndInput(formatTime(total));
    setFadeIn(0);
    setFadeOut(0);
    setVolume(1);
    activeRegion.current.update({ start: 0, end: total });
  };
  const selectionSecs = Math.max(0, endTime - startTime).toFixed(1);

  return (
    <div className="cutter-page">
      <div className="cutter-bg-glow" />

      <div className="cutter-app-wrapper">
        <AnimatePresence mode="wait">
          {!info && (
            <motion.div
              key="intro-menu"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              className="cutter-intro-container"
            >
              {/* Header */}
              <div className="cutter-app-header">
                <div className="cutter-app-logo">
                  <Scissors size={24} />
                </div>
                <div>
                  <h1>MP3 Editor Cutter</h1>
                  <p>Tăie orice melodie cu precizie la secundă</p>
                </div>
              </div>

              {/* Mode tabs */}
              <div className="cutter-mode-tabs">
                <button className={`mode-tab ${mode === 'youtube' ? 'active' : ''}`} onClick={() => switchMode('youtube')}>
                  <LinkIcon size={15} /> YouTube URL
                </button>
                <button className={`mode-tab ${mode === 'local' ? 'active' : ''}`} onClick={() => switchMode('local')}>
                  <UploadCloud size={15} /> Fișier Local
                </button>
              </div>

              {/* Input area */}
              <div className="cutter-input-area">
                {mode === 'youtube' ? (
                  <div className="yt-input-row">
                    <input
                      type="text"
                      className="yt-url-input"
                      placeholder="https://youtube.com/watch?v=..."
                      value={url ?? ''}
                      onChange={e => setUrl(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && fetchYoutube()}
                      disabled={loadingInfo}
                    />
                    <button className="btn-load" onClick={fetchYoutube} disabled={!url || loadingInfo}>
                      {loadingInfo ? <Loader2 className="spin" size={18} /> : 'Încarcă'}
                    </button>
                  </div>
                ) : (
                  <div className="upload-drop-zone" onClick={() => fileInputRef.current?.click()}>
                    <input ref={fileInputRef} type="file" accept="audio/*,video/*" onChange={handleFileChange} style={{ display: 'none' }} />
                    <UploadCloud size={44} className="upload-drop-icon" />
                    <p className="upload-drop-title">Trage fișierul aici sau apasă pentru a selecta</p>
                    <p className="upload-drop-sub">MP3 · WAV · M4A · OGG · FLAC</p>
                  </div>
                )}
              </div>

              {/* YouTube download progress */}
              {loadingInfo && (
                <motion.div className="yt-dl-progress" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="yt-dl-info">
                    {info && <img src={info.thumbnail} alt="" className="yt-dl-thumb" />}
                    <div>
                      <p className="yt-dl-title">{info?.title || 'Se identifică melodia...'}</p>
                      <p className="yt-dl-sub">Se descarcă pentru editare vizuală... {dlPercent.toFixed(0)}%</p>
                    </div>
                  </div>
                  <div className="dl-bar-bg"><div className="dl-bar-fill" style={{ width: `${dlPercent}%` }} /></div>
                </motion.div>
              )}

              {/* Error */}
              {error && (
                <motion.div className="cutter-error-bar" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <AlertCircle size={16} /> {error}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ==================== EDITOR ==================== */}
        <AnimatePresence>
          {info && !loadingInfo && (
            <motion.div
              className="cutter-editor-overlay"
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="cutter-editor-fullscreen">

                {/* Track header with cover art */}
                <div className="editor-track-header">
                  <img src={info.thumbnail} alt="cover" className="editor-track-cover" />
                  <div className="editor-track-meta">
                    <div className="editor-track-title">{info.title}</div>
                    <div className="editor-track-duration">
                      {waveReady ? formatTime(duration) : '...'} • {mode === 'youtube' ? 'YouTube' : 'Fișier Local'}
                    </div>
                  </div>
                  <div className="editor-track-actions">
                    <button className="btn-track-action" onClick={resetSelection} title="Resetare selecție">
                      <RotateCcw size={15} />
                    </button>
                    <button className="btn-track-action danger" onClick={resetAll} title="Închide editorul">
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Waveform */}
                <div className="editor-middle-area">
                  <div className="waveform-editor-box">
                    {!waveReady && (
                      <div className="wave-loading-overlay">
                        <Loader2 className="spin" size={28} />
                        <span>Se generează forma de undă...</span>
                      </div>
                    )}
                    <div ref={containerRef} className="wave-canvas" style={{ opacity: waveReady ? 1 : 0 }} />

                    {/* Fade amplitude masks */}
                    {waveReady && duration > 0 && (
                      <div className="fade-visual-overlays">
                        {fadeIn > 0 && (
                          <div className="fade-in-mask" style={{
                            left: `${(startTime / duration) * 100}%`,
                            width: `${(fadeIn / duration) * 100}%`
                          }}>
                            <div className="fade-mask-top" />
                            <div className="fade-mask-bottom" />
                          </div>
                        )}
                        {fadeOut > 0 && (
                          <div className="fade-out-mask" style={{
                            left: `${((endTime - fadeOut) / duration) * 100}%`,
                            width: `${(fadeOut / duration) * 100}%`
                          }}>
                            <div className="fade-mask-top" />
                            <div className="fade-mask-bottom" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Time markers under waveform */}
                  {waveReady && (
                    <div className="wave-time-markers">
                      <span>{formatTime(0)}</span>
                      <span>{formatTime(duration / 4)}</span>
                      <span>{formatTime(duration / 2)}</span>
                      <span>{formatTime(duration * 3 / 4)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  )}
                </div>

                {/* Controls */}
                {waveReady && (
                  <motion.div
                    className="editor-controls-section"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.3 }}
                  >
                    {/* Main row: Play + Time + Duration + Save */}
                    <div className="controls-main-row">
                      <button className="btn-play-main" onClick={handlePlayPause}>
                        {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
                      </button>

                      <div className="time-pill">
                        <input
                          type="text"
                          value={startInput ?? '0:00.0'}
                          onChange={e => handleStartInput(e.target.value)}
                          onBlur={() => setStartInput(formatTime(startTime))}
                        />
                        <span className="time-pill-divider"><Scissors size={12} /></span>
                        <input
                          type="text"
                          value={endInput ?? '0:00.0'}
                          onChange={e => handleEndInput(e.target.value)}
                          onBlur={() => setEndInput(formatTime(endTime))}
                        />
                      </div>

                      <div className="selection-badge">{selectionSecs}s selectat</div>

                      <div className="controls-spacer" />

                      <div className="save-area">
                        {downloading ? (
                          <div className="save-progress-inline">
                            <div className="save-progress-bar">
                              <div className="save-progress-bar-fill" style={{ width: `${dlProgress}%` }} />
                            </div>
                            <span className="save-progress-text">{dlProgress}%</span>
                          </div>
                        ) : downloadComplete && finalFileUrl ? (
                          <>
                            <input
                              type="text"
                              value={outputName}
                              onChange={e => setOutputName(e.target.value)}
                              className="editor-filename-input"
                              placeholder="nume_fisier"
                            />
                            <a
                              href={`/api/download-file?file=${finalFileUrl}&outName=${encodeURIComponent(outputName)}`}
                              download
                              className="btn-save-main success"
                            >
                              <Scissors size={15} /> Descarcă
                            </a>
                          </>
                        ) : (
                          <button className="btn-save-main" onClick={executeCut}>
                            <Scissors size={15} /> Procesează
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Sliders row: Fade In / Fade Out / Volume */}
                    <div className="controls-sliders-row">
                      <div className="slider-group">
                        <div className="slider-group-header">
                          <span className="slider-group-label">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 20 L12 4 L12 20"/></svg>
                            Fade In
                          </span>
                          <span className="slider-group-value">{fadeIn}s</span>
                        </div>
                        <input
                          type="range" min="0" max="5" step="0.5"
                          value={fadeIn}
                          onChange={e => setFadeIn(parseFloat(e.target.value))}
                          className="slider-input"
                        />
                      </div>

                      <div className="slider-group">
                        <div className="slider-group-header">
                          <span className="slider-group-label">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 20 L12 4 L12 20"/></svg>
                            Fade Out
                          </span>
                          <span className="slider-group-value">{fadeOut}s</span>
                        </div>
                        <input
                          type="range" min="0" max="5" step="0.5"
                          value={fadeOut}
                          onChange={e => setFadeOut(parseFloat(e.target.value))}
                          className="slider-input purple"
                        />
                      </div>

                      <div className="slider-group">
                        <div className="slider-group-header">
                          <span className="slider-group-label">
                            <Volume2 size={13} /> Volum
                          </span>
                          <span className="slider-group-value">{Math.round(volume * 100)}%</span>
                        </div>
                        <input
                          type="range" min="0" max="2" step="0.05"
                          value={volume}
                          onChange={e => setVolume(parseFloat(e.target.value))}
                          className="slider-input green"
                        />
                      </div>
                    </div>

                    {/* Error inside editor */}
                    {error && (
                      <motion.div className="cutter-error-bar" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <AlertCircle size={16} /> {error}
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Mp3Cutter;
