import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { ArrowLeft, Download, QrCode } from 'lucide-react';
import Navbar from '../components/Navbar';
import './ToolStudio.css';

const escapeWifi = value => value.replace(/[\\;,":]/g, match => `\\${match}`);

export default function QRCodeStudio() {
  const canvasRef = useRef(null);
  const [mode, setMode] = useState('url');
  const [form, setForm] = useState({
    url: 'https://iannc.ro',
    discord: 'https://discord.gg/inclounge',
    spotify: 'https://open.spotify.com/playlist/6gkgc2xiT9xmD14DJGrllv',
    wifiSsid: 'IncLounge',
    wifiPassword: 'super-secret',
    wifiSecurity: 'WPA',
    name: 'IANNC',
    phone: '',
    email: 'contact@iannc.ro',
    custom: 'Salut de la IANNC.RO',
    foreground: '#05070a',
    background: '#ffffff',
    size: 320,
  });

  const qrValue = useMemo(() => {
    if (mode === 'discord') return form.discord;
    if (mode === 'spotify') return form.spotify;
    if (mode === 'wifi') {
      return `WIFI:T:${form.wifiSecurity};S:${escapeWifi(form.wifiSsid)};P:${escapeWifi(form.wifiPassword)};;`;
    }
    if (mode === 'contact') {
      return [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${form.name}`,
        form.phone ? `TEL:${form.phone}` : '',
        form.email ? `EMAIL:${form.email}` : '',
        'END:VCARD',
      ].filter(Boolean).join('\n');
    }
    if (mode === 'custom') return form.custom;
    return form.url;
  }, [mode, form]);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, qrValue || ' ', {
      width: Number(form.size),
      margin: 2,
      color: {
        dark: form.foreground,
        light: form.background,
      },
      errorCorrectionLevel: 'H',
    });
  }, [qrValue, form.foreground, form.background, form.size]);

  const updateForm = patch => setForm(current => ({ ...current, ...patch }));

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const anchor = document.createElement('a');
    anchor.href = canvas.toDataURL('image/png');
    anchor.download = `iannc-qr-${mode}.png`;
    anchor.click();
  };

  return (
    <>
      <Navbar />
      <main className="tool-studio-page">
        <div className="tool-studio-shell">
          <section className="tool-studio-hero">
            <div>
              <span className="tool-studio-kicker"><QrCode size={15} /> QR Code Studio</span>
              <h1>Generate polished QR codes fast.</h1>
              <p>Genereaza QR-uri pentru linkuri, Discord, Spotify, Wi-Fi, contact card sau text custom, cu culori personalizate.</p>
            </div>
            <Link to="/#proiecte" className="tool-studio-back"><ArrowLeft size={16} /> Inapoi la tools</Link>
          </section>

          <section className="tool-studio-grid">
            <div className="tool-panel">
              <h2>QR settings</h2>
              <div className="tool-form-grid">
                <div className="tool-field">
                  <label>Mode</label>
                  <select value={mode} onChange={e => setMode(e.target.value)}>
                    <option value="url">URL</option>
                    <option value="discord">Discord Invite</option>
                    <option value="spotify">Spotify Link</option>
                    <option value="wifi">Wi-Fi</option>
                    <option value="contact">Contact Card</option>
                    <option value="custom">Custom Text</option>
                  </select>
                </div>

                {mode === 'url' && (
                  <div className="tool-field">
                    <label>URL</label>
                    <input value={form.url} onChange={e => updateForm({ url: e.target.value })} />
                  </div>
                )}
                {mode === 'discord' && (
                  <div className="tool-field">
                    <label>Discord invite</label>
                    <input value={form.discord} onChange={e => updateForm({ discord: e.target.value })} />
                  </div>
                )}
                {mode === 'spotify' && (
                  <div className="tool-field">
                    <label>Spotify link</label>
                    <input value={form.spotify} onChange={e => updateForm({ spotify: e.target.value })} />
                  </div>
                )}
                {mode === 'wifi' && (
                  <>
                    <div className="tool-inline">
                      <div className="tool-field">
                        <label>Network</label>
                        <input value={form.wifiSsid} onChange={e => updateForm({ wifiSsid: e.target.value })} />
                      </div>
                      <div className="tool-field">
                        <label>Security</label>
                        <select value={form.wifiSecurity} onChange={e => updateForm({ wifiSecurity: e.target.value })}>
                          <option value="WPA">WPA/WPA2</option>
                          <option value="WEP">WEP</option>
                          <option value="nopass">No password</option>
                        </select>
                      </div>
                    </div>
                    <div className="tool-field">
                      <label>Password</label>
                      <input value={form.wifiPassword} onChange={e => updateForm({ wifiPassword: e.target.value })} />
                    </div>
                  </>
                )}
                {mode === 'contact' && (
                  <>
                    <div className="tool-field">
                      <label>Name</label>
                      <input value={form.name} onChange={e => updateForm({ name: e.target.value })} />
                    </div>
                    <div className="tool-inline">
                      <div className="tool-field">
                        <label>Phone</label>
                        <input value={form.phone} onChange={e => updateForm({ phone: e.target.value })} />
                      </div>
                      <div className="tool-field">
                        <label>Email</label>
                        <input value={form.email} onChange={e => updateForm({ email: e.target.value })} />
                      </div>
                    </div>
                  </>
                )}
                {mode === 'custom' && (
                  <div className="tool-field">
                    <label>Custom text</label>
                    <textarea value={form.custom} onChange={e => updateForm({ custom: e.target.value })} />
                  </div>
                )}

                <div className="tool-inline">
                  <div className="tool-field">
                    <label>Foreground</label>
                    <input type="color" value={form.foreground} onChange={e => updateForm({ foreground: e.target.value })} />
                  </div>
                  <div className="tool-field">
                    <label>Background</label>
                    <input type="color" value={form.background} onChange={e => updateForm({ background: e.target.value })} />
                  </div>
                </div>
                <div className="tool-field">
                  <label>Size</label>
                  <input type="range" min="220" max="520" step="20" value={form.size} onChange={e => updateForm({ size: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="tool-panel qr-preview-card">
              <h2>QR preview</h2>
              <div className="qr-canvas-frame" style={{ background: form.background }}>
                <canvas ref={canvasRef} aria-label="Generated QR code" />
              </div>
              <button type="button" className="tool-btn primary" onClick={downloadPng}><Download size={16} /> Download PNG</button>
              <pre className="tool-json-output">{qrValue}</pre>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
