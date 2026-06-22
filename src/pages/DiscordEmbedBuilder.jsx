import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Copy, Download, MessageSquare, Plus, Trash2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import './ToolStudio.css';

const createId = () => crypto.randomUUID();

export default function DiscordEmbedBuilder() {
  const [embed, setEmbed] = useState({
    botName: 'IANNC Updates',
    title: 'Server Update v1.2',
    description: 'Am adaugat imbunatatiri noi, fix-uri importante si tool-uri pentru comunitate.',
    color: '#ccff00',
    footer: 'IANNC.RO',
  });
  const [fields, setFields] = useState([
    { id: createId(), name: 'Added', value: 'New tools section' },
    { id: createId(), name: 'Fixed', value: 'Better mobile layout' },
  ]);
  const [buttons, setButtons] = useState([
    { id: createId(), label: 'Open website', url: 'https://iannc.ro' },
  ]);
  const [fieldDraft, setFieldDraft] = useState({ name: '', value: '' });
  const [buttonDraft, setButtonDraft] = useState({ label: '', url: '' });
  const [toast, setToast] = useState('');

  const payload = useMemo(() => ({
    username: embed.botName,
    embeds: [
      {
        title: embed.title,
        description: embed.description,
        color: parseInt(embed.color.replace('#', ''), 16),
        fields: fields.map(({ name, value }) => ({ name, value, inline: true })),
        footer: { text: embed.footer },
      },
    ],
    components: buttons.length ? [
      {
        type: 1,
        components: buttons.map(button => ({
          type: 2,
          style: 5,
          label: button.label,
          url: button.url,
        })),
      },
    ] : [],
  }), [embed, fields, buttons]);

  const showToast = message => {
    setToast(message);
    window.setTimeout(() => setToast(''), 1800);
  };

  const addField = () => {
    if (!fieldDraft.name.trim() || !fieldDraft.value.trim()) return;
    setFields(current => [...current, { id: createId(), name: fieldDraft.name.trim(), value: fieldDraft.value.trim() }]);
    setFieldDraft({ name: '', value: '' });
  };

  const addButton = () => {
    if (!buttonDraft.label.trim() || !buttonDraft.url.trim()) return;
    setButtons(current => [...current, { id: createId(), label: buttonDraft.label.trim(), url: buttonDraft.url.trim() }]);
    setButtonDraft({ label: '', url: '' });
  };

  const copyJson = async () => {
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    showToast('Embed JSON copiat.');
  };

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'discord-embed.json';
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
              <span className="tool-studio-kicker"><MessageSquare size={15} /> Discord Embed Builder</span>
              <h1>Design Discord embeds visually.</h1>
              <p>Construieste embed-uri pentru update-uri, anunturi si comunitate cu preview live si export JSON.</p>
            </div>
            <Link to="/#proiecte" className="tool-studio-back"><ArrowLeft size={16} /> Inapoi la tools</Link>
          </section>

          <section className="tool-studio-grid">
            <div className="tool-panel">
              <h2>Embed editor</h2>
              <div className="tool-form-grid">
                <div className="tool-inline">
                  <div className="tool-field">
                    <label>Bot name</label>
                    <input value={embed.botName} onChange={e => setEmbed({ ...embed, botName: e.target.value })} />
                  </div>
                  <div className="tool-field">
                    <label>Color</label>
                    <input type="color" value={embed.color} onChange={e => setEmbed({ ...embed, color: e.target.value })} />
                  </div>
                </div>
                <div className="tool-field">
                  <label>Title</label>
                  <input value={embed.title} onChange={e => setEmbed({ ...embed, title: e.target.value })} />
                </div>
                <div className="tool-field">
                  <label>Description</label>
                  <textarea value={embed.description} onChange={e => setEmbed({ ...embed, description: e.target.value })} />
                </div>
                <div className="tool-field">
                  <label>Footer</label>
                  <input value={embed.footer} onChange={e => setEmbed({ ...embed, footer: e.target.value })} />
                </div>

                <h3>Fields</h3>
                <div className="tool-inline">
                  <div className="tool-field">
                    <label>Name</label>
                    <input value={fieldDraft.name} onChange={e => setFieldDraft({ ...fieldDraft, name: e.target.value })} />
                  </div>
                  <div className="tool-field">
                    <label>Value</label>
                    <input value={fieldDraft.value} onChange={e => setFieldDraft({ ...fieldDraft, value: e.target.value })} />
                  </div>
                </div>
                <button type="button" className="tool-btn primary" onClick={addField}><Plus size={16} /> Add field</button>

                <div className="tool-list">
                  {fields.map(field => (
                    <div className="tool-list-item" key={field.id}>
                      <div>
                        <strong>{field.name}</strong>
                        <span>{field.value}</span>
                      </div>
                      <button type="button" className="tool-btn danger" onClick={() => setFields(current => current.filter(item => item.id !== field.id))}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>

                <h3>Buttons</h3>
                <div className="tool-inline">
                  <div className="tool-field">
                    <label>Label</label>
                    <input value={buttonDraft.label} onChange={e => setButtonDraft({ ...buttonDraft, label: e.target.value })} />
                  </div>
                  <div className="tool-field">
                    <label>URL</label>
                    <input value={buttonDraft.url} onChange={e => setButtonDraft({ ...buttonDraft, url: e.target.value })} />
                  </div>
                </div>
                <button type="button" className="tool-btn primary" onClick={addButton}><Plus size={16} /> Add button</button>

                <div className="tool-list">
                  {buttons.map(button => (
                    <div className="tool-list-item" key={button.id}>
                      <div>
                        <strong>{button.label}</strong>
                        <span>{button.url}</span>
                      </div>
                      <button type="button" className="tool-btn danger" onClick={() => setButtons(current => current.filter(item => item.id !== button.id))}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="tool-panel">
              <h2>Discord preview</h2>
              <div className="discord-preview">
                <div className="discord-message">
                  <div className="discord-avatar"></div>
                  <div>
                    <div className="discord-author">{embed.botName}</div>
                    <div className="discord-embed" style={{ '--embed-color': embed.color }}>
                      <h3>{embed.title}</h3>
                      <p>{embed.description}</p>
                      <div className="discord-fields">
                        {fields.map(field => (
                          <div className="discord-field" key={field.id}>
                            <strong>{field.name}</strong>
                            <span>{field.value}</span>
                          </div>
                        ))}
                      </div>
                      <p>{embed.footer}</p>
                    </div>
                    <div className="discord-buttons">
                      {buttons.map(button => <span key={button.id}>{button.label}</span>)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="tool-actions">
                <button type="button" className="tool-btn" onClick={copyJson}><Copy size={16} /> Copy JSON</button>
                <button type="button" className="tool-btn" onClick={downloadJson}><Download size={16} /> Download</button>
                {toast && <span className="studio-toast">{toast}</span>}
              </div>
              <pre className="tool-json-output">{JSON.stringify(payload, null, 2)}</pre>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
