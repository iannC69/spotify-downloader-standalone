import { useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Copy, ExternalLink, Gamepad2, ShieldCheck } from 'lucide-react';
import Navbar from '../components/Navbar';
import './ToolStudio.css';
import './ConnectServer.css';

const copyText = async (text) => {
  await navigator.clipboard.writeText(text);
};

export default function ConnectServer() {
  const [params] = useSearchParams();
  const server = params.get('server') || '5.135.142.4:27015';
  const title = params.get('title') || 'CS2 Server';
  const steamUrl = useMemo(() => `steam://connect/${server}`, [server]);
  const consoleCommand = useMemo(() => `connect ${server}`, [server]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.location.href = steamUrl;
    }, 450);

    return () => window.clearTimeout(timer);
  }, [steamUrl]);

  return (
    <>
      <Navbar />
      <main className="connect-page">
        <section className="connect-card">
          <div className="connect-card-top">
            <span className="tool-studio-kicker"><Gamepad2 size={15} /> CS2 Direct Connect</span>
            <span className="connect-status"><ShieldCheck size={15} /> Safe link</span>
          </div>
          <h1>{title}</h1>
          <p>Apasa pe butonul principal ca sa intri pe server prin Steam. Daca browserul cere confirmare, accepta deschiderea Steam.</p>

          <div className="connect-server-box">
            <span>Server</span>
            <strong>{server}</strong>
          </div>

          <div className="connect-actions">
            <a className="connect-btn steam" href={steamUrl}>
              <ExternalLink size={16} /> Open in Steam
            </a>
            <button type="button" className="connect-btn command" onClick={() => copyText(consoleCommand)}>
              <Copy size={16} /> Copy command
            </button>
            <Link className="connect-btn ghost" to="/wildfire-overlay">
              <ArrowLeft size={16} /> Generator
            </Link>
          </div>

          <code className="connect-command">{consoleCommand}</code>
        </section>
      </main>
    </>
  );
}
