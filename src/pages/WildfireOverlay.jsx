import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Clock3,
  Copy,
  Download,
  ExternalLink,
  Flame,
  Gamepad2,
  Globe2,
  Map,
  Palette,
  RadioTower,
  RefreshCw,
  Save,
  Server,
  Terminal,
  Users,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import './ToolStudio.css';
import './WildfireOverlay.css';

const DEFAULT_STATUS = {
  online: false,
  name: 'CS2.WILDFIRE.RO',
  players: 0,
  bots: 0,
  reportedPlayers: 0,
  listedPlayers: 0,
  maxPlayers: 0,
  map: '--',
  source: 'offline',
};

const buildQuery = (config) => {
  const params = new URLSearchParams({
    title: config.title,
    host: config.host,
    port: config.port,
    type: config.type,
    accent: config.accent.replace('#', ''),
    shadow: config.shadow.replace('#', ''),
    poll: config.pollMs,
    position: config.position,
    scale: config.scale,
  });

  return params.toString();
};

const getOverlayConfigPayload = (config) => ({
  title: config.title,
  host: config.host,
  port: config.port,
  type: config.type,
  accent: config.accent,
  shadow: config.shadow,
  pollMs: config.pollMs,
  position: config.position,
  scale: config.scale,
});

const copyText = async (text, setToast, message = 'Copiat in clipboard.') => {
  await navigator.clipboard.writeText(text);
  setToast(message);
  window.setTimeout(() => setToast(''), 1800);
};

const isLocalUrl = (url) => /^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?/i.test(url);

export default function WildfireOverlay() {
  const [config, setConfig] = useState({
    title: 'CS2.WILDFIRE.RO',
    host: '5.135.142.4',
    port: '27015',
    type: 'csgo',
    apiBase: 'http://localhost:3000',
    profileId: 'default',
    accent: '#ff8800',
    shadow: '#000000',
    pollMs: '5000',
    position: 'top-left',
    scale: '1',
  });
  const [status, setStatus] = useState(DEFAULT_STATUS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detectingTunnel, setDetectingTunnel] = useState(false);
  const [toast, setToast] = useState('');

  const query = useMemo(() => buildQuery(config), [config]);
  const profileId = useMemo(() => (config.profileId || 'default').replace(/[^a-z0-9_-]/gi, '').slice(0, 40) || 'default', [config.profileId]);
  const generatedObsUrl = useMemo(() => `${config.apiBase.replace(/\/$/, '')}/?${query}`, [config.apiBase, query]);
  const profileObsUrl = useMemo(() => `${config.apiBase.replace(/\/$/, '')}/?profile=${encodeURIComponent(profileId)}`, [config.apiBase, profileId]);
  const profileApiUrl = useMemo(() => `${config.apiBase.replace(/\/$/, '')}/api/config/${encodeURIComponent(profileId)}`, [config.apiBase, profileId]);
  const apiUrl = useMemo(() => `${config.apiBase.replace(/\/$/, '')}/api/status?${query}`, [config.apiBase, query]);
  const tunnelCommand = 'cd asets/tiktok_overlay && npm run dev';
  const tiktokUrlReady = !isLocalUrl(profileObsUrl) && profileObsUrl.startsWith('https://');
  const serverAddress = useMemo(() => `${config.host.trim()}:${config.port.trim()}`, [config.host, config.port]);
  const steamConnectUrl = useMemo(() => `steam://connect/${serverAddress}`, [serverAddress]);
  const consoleConnectCommand = useMemo(() => `connect ${serverAddress}`, [serverAddress]);
  const publicConnectUrl = useMemo(() => {
    const params = new URLSearchParams({
      server: serverAddress,
      title: config.title || 'CS2 Server',
    });
    return `${window.location.origin}/connect-cs2?${params.toString()}`;
  }, [config.title, serverAddress]);
  const displayPlayers = Number(status.players ?? 0);
  const displayBots = Number(status.bots ?? 0);
  const displayMaxPlayers = Number(status.maxPlayers ?? 0);
  const displayReportedPlayers = Number(status.reportedPlayers ?? displayPlayers);
  const overlayCss = useMemo(() => {
    return `:root {
  --hud-accent: ${config.accent};
  --hud-shadow: ${config.shadow};
}

.hud-line {
  color: var(--hud-accent);
  text-shadow:
    -1px -1px 0 var(--hud-shadow),
    1px -1px 0 var(--hud-shadow),
    -1px 1px 0 var(--hud-shadow),
    1px 1px 0 var(--hud-shadow),
    3px 3px 4px rgba(0, 0, 0, 0.9);
}`;
  }, [config.accent, config.shadow]);

  const obsNotes = useMemo(() => [
    'Introdu IP-ul, portul si tipul serverului tau.',
    'Personalizeaza titlul, culoarea, pozitia si marimea HUD-ului.',
    'Apasa Save permanent config ca setarile sa fie salvate pe serverul overlay.',
    'Pentru OBS poti folosi localhost. Pentru TikTok ai nevoie de link public HTTPS.',
  ], []);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('Server status unavailable');
      const data = await response.json();
      setStatus({ ...DEFAULT_STATUS, ...data, source: data.online ? 'live' : 'offline' });
    } catch {
      setStatus((current) => ({
        ...DEFAULT_STATUS,
        name: config.title || current.name || DEFAULT_STATUS.name,
        source: 'offline',
      }));
    } finally {
      setLoading(false);
    }
  }, [apiUrl, config.title]);

  useEffect(() => {
    const initialTimer = window.setTimeout(fetchStatus, 0);
    const timer = window.setInterval(fetchStatus, Math.max(2500, Number(config.pollMs) || 5000));
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [config.pollMs, fetchStatus]);

  const updateConfig = (key, value) => setConfig((current) => ({ ...current, [key]: value }));

  const saveOverlayConfig = useCallback(async () => {
    setSaving(true);
    try {
      const response = await fetch(profileApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getOverlayConfigPayload(config)),
      });

      if (!response.ok) throw new Error('Config save failed');
      setToast('Config salvat. Link-ul OBS ramane acelasi.');
      window.setTimeout(() => setToast(''), 1800);
      return true;
    } catch {
      setToast('Porneste serverul overlay pe API base, apoi salveaza din nou.');
      window.setTimeout(() => setToast(''), 2400);
      return false;
    } finally {
      setSaving(false);
    }
  }, [config, profileApiUrl]);

  const detectTunnelUrl = useCallback(async () => {
    setDetectingTunnel(true);
    try {
      const localApiBase = 'http://localhost:3000';
      const response = await fetch(`${localApiBase}/api/tunnel-url`);
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.message || 'Tunnel not ready');

      setConfig((current) => ({ ...current, apiBase: data.url }));
      setToast('Tunnel detectat. Acum poti copia TikTok URL.');
      window.setTimeout(() => setToast(''), 2200);
    } catch {
      setToast('Tunnel-ul nu e gata. Ruleaza npm run dev si asteapta link-ul trycloudflare.');
      window.setTimeout(() => setToast(''), 2800);
    } finally {
      setDetectingTunnel(false);
    }
  }, []);

  const copySavedFixedOverlayUrl = async (message = 'Fixed overlay URL copiat.') => {
    const saved = await saveOverlayConfig();
    if (!saved) return;
    await copyText(profileObsUrl, setToast, message);
  };

  const downloadConfig = () => {
    const blob = new Blob([JSON.stringify({ tool: 'wildfire-overlay', profile: profileId, config: getOverlayConfigPayload(config), obsUrl: profileObsUrl, generatedObsUrl }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'wildfire-overlay-config.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Navbar />
      <main className="tool-studio-page wildfire-page">
        <div className="tool-studio-shell wildfire-shell">
          <section className="tool-studio-hero wildfire-hero">
            <div>
              <span className="tool-studio-kicker"><Flame size={15} /> Wildfire Overlay</span>
              <h1>CS2 live HUD pentru stream.</h1>
              <p>Creeaza rapid un overlay public pentru serverul tau: setezi IP-ul, portul, stilul HUD-ului si copiezi link-ul direct in OBS sau TikTok Live Studio.</p>
            </div>
            <Link to="/#proiecte" className="tool-studio-back"><ArrowLeft size={16} /> Inapoi la tools</Link>
          </section>

          <section className="wildfire-layout">
            <div className="tool-panel wildfire-control-panel">
              <div className="wildfire-panel-heading">
                <div>
                  <h2>Overlay control</h2>
                  <span>{status.source === 'live' ? 'Live server connected' : status.source === 'offline' ? 'Server offline / cache' : 'Demo preview'}</span>
                </div>
                <button type="button" className="tool-btn" onClick={fetchStatus} disabled={loading}>
                  <RefreshCw size={16} className={loading ? 'spin-soft' : ''} /> Refresh
                </button>
              </div>

              <div className="tool-form-grid">
                <div className="tool-inline">
                  <div className="tool-field">
                    <label>Overlay title</label>
                    <input value={config.title} onChange={(event) => updateConfig('title', event.target.value)} />
                  </div>
                  <div className="tool-field">
                    <label>Profile</label>
                    <input value={config.profileId} onChange={(event) => updateConfig('profileId', event.target.value)} />
                  </div>
                </div>

                <div className="tool-inline">
                  <div className="tool-field">
                    <label>API base</label>
                    <input value={config.apiBase} onChange={(event) => updateConfig('apiBase', event.target.value)} />
                  </div>
                  <button type="button" className="tool-btn wildfire-detect-tunnel-btn" onClick={detectTunnelUrl} disabled={detectingTunnel}>
                    <Globe2 size={16} /> {detectingTunnel ? 'Detecting...' : 'Detect tunnel'}
                  </button>
                </div>

                <div className="tool-inline three">
                  <div className="tool-field">
                    <label>Host</label>
                    <input value={config.host} onChange={(event) => updateConfig('host', event.target.value)} />
                  </div>
                  <div className="tool-field">
                    <label>Port</label>
                    <input value={config.port} onChange={(event) => updateConfig('port', event.target.value)} />
                  </div>
                  <div className="tool-field">
                    <label>GameDig type</label>
                    <input value={config.type} onChange={(event) => updateConfig('type', event.target.value)} />
                  </div>
                </div>

                <div className="tool-inline three">
                  <div className="tool-field">
                    <label>Accent</label>
                    <input type="color" value={config.accent} onChange={(event) => updateConfig('accent', event.target.value)} />
                  </div>
                  <div className="tool-field">
                    <label>Outline</label>
                    <input type="color" value={config.shadow} onChange={(event) => updateConfig('shadow', event.target.value)} />
                  </div>
                  <div className="tool-field">
                    <label>Poll ms</label>
                    <input type="number" min="2500" step="500" value={config.pollMs} onChange={(event) => updateConfig('pollMs', event.target.value)} />
                  </div>
                </div>

                <div className="tool-inline">
                  <div className="tool-field">
                    <label>Position</label>
                    <select value={config.position} onChange={(event) => updateConfig('position', event.target.value)}>
                      <option value="top-left">Top left</option>
                      <option value="top-right">Top right</option>
                      <option value="bottom-left">Bottom left</option>
                      <option value="bottom-right">Bottom right</option>
                    </select>
                  </div>
                  <div className="tool-field">
                    <label>Scale</label>
                    <input type="number" min="0.6" max="2" step="0.05" value={config.scale} onChange={(event) => updateConfig('scale', event.target.value)} />
                  </div>
                </div>
              </div>

              <div className="wildfire-actions">
                <button type="button" className="tool-btn primary" onClick={() => copySavedFixedOverlayUrl('Fixed OBS URL copiat.')} disabled={saving}>
                  <Copy size={16} /> Copy fixed OBS URL
                </button>
                <button type="button" className="tool-btn" onClick={saveOverlayConfig} disabled={saving}>
                  <Save size={16} /> {saving ? 'Saving...' : 'Save config'}
                </button>
                <a className="tool-btn" href={profileObsUrl} target="_blank" rel="noreferrer">
                  <ExternalLink size={16} /> Open overlay
                </a>
                <button type="button" className="tool-btn" onClick={downloadConfig}>
                  <Download size={16} /> Download config
                </button>
                {toast && <span className="studio-toast">{toast}</span>}
              </div>

              <div className="wildfire-url-box">
                <span>Fixed OBS/TikTok URL</span>
                <code>{profileObsUrl}</code>
              </div>

              <div className="wildfire-url-box subtle">
                <span>Generated URL with all settings</span>
                <code>{generatedObsUrl}</code>
              </div>

              <div className="wildfire-tiktok-card">
                <div className="wildfire-panel-heading">
                  <div>
                    <h2>TikTok Live Studio</h2>
                    <span>{tiktokUrlReady ? 'HTTPS link ready' : 'TikTok nu accepta localhost'}</span>
                  </div>
                  <Globe2 size={22} />
                </div>

                <p>
                  TikTok cere un link public HTTPS. Ruleaza <b>npm run dev</b>, asteapta URL-ul
                  <b> https://...trycloudflare.com</b>, apoi apasa Detect tunnel sau pune URL-ul manual in API base.
                </p>

                <div className="wildfire-connect-output">
                  <span>Comanda overlay + tunnel</span>
                  <code>{tunnelCommand}</code>
                </div>

                <div className={`wildfire-tiktok-state ${tiktokUrlReady ? 'ready' : 'blocked'}`}>
                  <span>{tiktokUrlReady ? 'TikTok URL' : 'TikTok status'}</span>
                  <strong>{tiktokUrlReady ? profileObsUrl : 'Inlocuieste localhost cu un URL HTTPS public.'}</strong>
                </div>

                <div className="wildfire-connect-actions">
                  <button type="button" className="wildfire-connect-btn command" onClick={() => copyText(tunnelCommand, setToast, 'Comanda tunnel copiata.')}>
                    <Terminal size={16} /> Copy dev command
                  </button>
                  <button type="button" className="wildfire-connect-btn discord" onClick={() => copySavedFixedOverlayUrl('TikTok URL copiat.')} disabled={!tiktokUrlReady || saving}>
                    <Copy size={16} /> Copy TikTok URL
                  </button>
                </div>
              </div>

              <div className="wildfire-connect-card">
                <div className="wildfire-panel-heading">
                  <div>
                    <h2>CS2 direct connect</h2>
                    <span>Link rapid pentru serverul introdus mai sus</span>
                  </div>
                  <Gamepad2 size={22} />
                </div>
                <div className="wildfire-connect-output">
                  <span>Discord click link</span>
                  <code>{publicConnectUrl}</code>
                </div>
                <div className="wildfire-connect-output">
                  <span>Fallback console command</span>
                  <code>{consoleConnectCommand}</code>
                </div>
                <div className="wildfire-connect-actions">
                  <button type="button" className="wildfire-connect-btn discord" onClick={() => copyText(publicConnectUrl, setToast, 'Link-ul pentru Discord a fost copiat.')}>
                    <Copy size={16} /> Copy Discord link
                  </button>
                  <button type="button" className="wildfire-connect-btn command" onClick={() => copyText(consoleConnectCommand, setToast, 'Comanda connect copiata.')}>
                    <Copy size={16} /> Copy command
                  </button>
                  <a className="wildfire-connect-btn steam" href={steamConnectUrl}>
                    <ExternalLink size={16} /> Open in Steam
                  </a>
                </div>
              </div>
            </div>

            <div className="wildfire-preview-stack">
              <div className="tool-panel wildfire-preview-panel">
                <div className="wildfire-panel-heading">
                  <div>
                    <h2>Live preview</h2>
                    <span>Transparent HUD style</span>
                  </div>
                  <span className={`wildfire-status-pill ${status.source}`}>{status.source}</span>
                </div>

                <div className={`wildfire-stage ${config.position}`} style={{ '--hud-accent': config.accent, '--hud-shadow': config.shadow }}>
                  <div className="wildfire-stream-frame">
                    <div className="wildfire-game-grid" />
                    <div className="wildfire-hud" style={{ transform: `scale(${config.scale})` }}>
                      <strong>{status.name || config.title}</strong>
                      <span><Users size={18} /> Players: <b>{status.online ? `${displayPlayers}/${displayMaxPlayers}` : 'OFFLINE'}</b></span>
                      <span><Map size={18} /> Map: <b>{status.map || '--'}</b></span>
                      <span><Clock3 size={18} /> Clock: <b>{new Date().toLocaleTimeString('ro-RO')}</b></span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="wildfire-info-grid">
                <div className="tool-panel wildfire-mini-card">
                  <Server size={20} />
                  <span>Server</span>
                  <strong>{config.host}:{config.port}</strong>
                </div>
                <div className="tool-panel wildfire-mini-card">
                  <Gamepad2 size={20} />
                  <span>Human players</span>
                  <strong>{status.online ? `${displayPlayers}/${displayMaxPlayers}` : 'OFFLINE'}</strong>
                </div>
                <div className="tool-panel wildfire-mini-card">
                  <RadioTower size={20} />
                  <span>Bots filtered</span>
                  <strong>{displayBots}</strong>
                </div>
                <div className="tool-panel wildfire-mini-card">
                  <Palette size={20} />
                  <span>Reported total</span>
                  <strong>{displayReportedPlayers}</strong>
                </div>
              </div>
            </div>
          </section>

          <section className="wildfire-export-grid">
            <div className="tool-panel">
              <h2>Cum il folosesti</h2>
              <div className="wildfire-steps">
                {obsNotes.map((note, index) => (
                  <div className="wildfire-step" key={note}>
                    <b>{index + 1}</b>
                    <span>{note}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="tool-panel">
              <div className="wildfire-panel-heading">
                <div>
                  <h2>Quick CSS</h2>
                  <span>Optional custom browser-source CSS</span>
                </div>
                <button type="button" className="tool-btn" onClick={() => copyText(overlayCss, setToast, 'CSS copiat.')}>
                  <Copy size={16} /> Copy
                </button>
              </div>
              <pre
                className="wildfire-code-block"
                data-lenis-prevent
                data-lenis-prevent-wheel
                data-lenis-prevent-touch
                onWheel={(event) => event.stopPropagation()}
                onTouchMove={(event) => event.stopPropagation()}
              >
                {overlayCss}
              </pre>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
