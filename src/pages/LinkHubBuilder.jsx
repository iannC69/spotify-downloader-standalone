import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Copy, Download, ExternalLink, Link2, Plus, Trash2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import './ToolStudio.css';

const starterLinks = [
  { id: crypto.randomUUID(), label: 'Discord Community', url: 'https://discord.gg/inclounge' },
  { id: crypto.randomUUID(), label: 'YouTube', url: 'https://youtube.com/@iannc' },
  { id: crypto.randomUUID(), label: 'Steam Profile', url: 'https://steamcommunity.com/id/1iannc/' },
];

export default function LinkHubBuilder() {
  const [profile, setProfile] = useState({
    title: 'IANNC Hub',
    bio: 'Toate linkurile importante pentru comunitate, proiecte si social media.',
    avatar: 'https://github.com/iannC69.png',
    background: '#101827',
  });
  const [links, setLinks] = useState(starterLinks);
  const [draft, setDraft] = useState({ label: '', url: '' });
  const [toast, setToast] = useState('');

  const exportData = useMemo(() => ({
    type: 'iannc-link-hub',
    profile,
    links: links.map(({ label, url }) => ({ label, url })),
  }), [profile, links]);

  const showToast = message => {
    setToast(message);
    window.setTimeout(() => setToast(''), 1800);
  };

  const addLink = () => {
    if (!draft.label.trim() || !draft.url.trim()) return;
    setLinks(current => [...current, { id: crypto.randomUUID(), label: draft.label.trim(), url: draft.url.trim() }]);
    setDraft({ label: '', url: '' });
  };

  const removeLink = id => {
    setLinks(current => current.filter(link => link.id !== id));
  };

  const copyJson = async () => {
    await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
    showToast('Config copiat in clipboard.');
  };

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'iannc-link-hub.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Navbar />
      <main className="tool-studio-page">
        <div className="tool-studio-shell">
          <section className="tool-studio-hero">
            <div>
              <span className="tool-studio-kicker"><Link2 size={15} /> Link Hub Builder</span>
              <h1>Build a clean community link page.</h1>
              <p>Creeaza rapid un hub tip Linktree pentru Discord, YouTube, Steam, proiecte si orice link important.</p>
            </div>
            <Link to="/#proiecte" className="tool-studio-back"><ArrowLeft size={16} /> Inapoi la tools</Link>
          </section>

          <section className="tool-studio-grid">
            <div className="tool-panel">
              <h2>Hub settings</h2>
              <div className="tool-form-grid">
                <div className="tool-field">
                  <label>Titlu</label>
                  <input value={profile.title} onChange={e => setProfile({ ...profile, title: e.target.value })} />
                </div>
                <div className="tool-field">
                  <label>Bio</label>
                  <textarea value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} />
                </div>
                <div className="tool-field">
                  <label>Avatar URL</label>
                  <input value={profile.avatar} onChange={e => setProfile({ ...profile, avatar: e.target.value })} />
                </div>
                <div className="tool-field">
                  <label>Background</label>
                  <input type="color" value={profile.background} onChange={e => setProfile({ ...profile, background: e.target.value })} />
                </div>

                <div className="tool-inline">
                  <div className="tool-field">
                    <label>Link name</label>
                    <input value={draft.label} onChange={e => setDraft({ ...draft, label: e.target.value })} placeholder="Discord" />
                  </div>
                  <div className="tool-field">
                    <label>URL</label>
                    <input value={draft.url} onChange={e => setDraft({ ...draft, url: e.target.value })} placeholder="https://..." />
                  </div>
                </div>
                <button type="button" className="tool-btn primary" onClick={addLink}><Plus size={16} /> Add link</button>
              </div>

              <div className="tool-list">
                {links.map(link => (
                  <div className="tool-list-item" key={link.id}>
                    <div>
                      <strong>{link.label}</strong>
                      <span>{link.url}</span>
                    </div>
                    <button type="button" className="tool-btn danger" onClick={() => removeLink(link.id)} aria-label={`Remove ${link.label}`}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="tool-actions">
                <button type="button" className="tool-btn" onClick={copyJson}><Copy size={16} /> Copy JSON</button>
                <button type="button" className="tool-btn" onClick={downloadJson}><Download size={16} /> Download</button>
                {toast && <span className="studio-toast">{toast}</span>}
              </div>
            </div>

            <div className="tool-panel">
              <h2>Live preview</h2>
              <div className="preview-phone">
                <div className="linkhub-preview" style={{ '--hub-bg': profile.background }}>
                  <img className="linkhub-avatar" src={profile.avatar} alt={profile.title} />
                  <h3>{profile.title}</h3>
                  <p>{profile.bio}</p>
                  <div className="linkhub-preview-list">
                    {links.map(link => (
                      <a className="linkhub-preview-link" href={link.url} target="_blank" rel="noreferrer" key={link.id}>
                        {link.label}
                        <ExternalLink size={16} />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
