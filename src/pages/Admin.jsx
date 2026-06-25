import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  BadgeCheck,
  CheckCircle2,
  Circle,
  Disc3,
  Download,
  ExternalLink,
  FileText,
  Gamepad2,
  Globe,
  LayoutDashboard,
  Link as LinkIcon,
  Loader2,
  Lock,
  Monitor,
  MoreVertical,
  Plus,
  Radio,
  Save,
  Search,
  ServerCog,
  Settings,
  ShieldCheck,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import './Admin.css';

const CONFIG_DOC = doc(db, 'siteData', 'general');

const themes = [
  { id: 'lime', name: 'Neon Lime', hex: '#D2FF00' },
  { id: 'gold', name: 'Royal Gold', hex: '#FFD700' },
  { id: 'red', name: 'Cyber Red', hex: '#EF4444' },
  { id: 'purple', name: 'Deep Purple', hex: '#A855F7' },
  { id: 'blue', name: 'Electric Blue', hex: '#3B82F6' },
];

const statusOptions = ['online', 'degraded', 'maintenance', 'offline'];

const defaultConfig = {
  brand: {
    name: 'IANNC.RO',
    owner: 'IANNC',
    tagline: 'Creator de prezentari, tool-uri si experiente pentru comunitate.',
    heroSubtitle: 'Transform ideile in prezentari de impact, design premium si workflow rapid.',
  },
  appearance: {
    theme: 'lime',
    compactMode: false,
  },
  site: {
    announcement: '',
    announcementEnabled: false,
    maintenanceMode: false,
    status: 'online',
    version: 'v2.4.1',
    lastDeploy: 'Manual deploy',
    environment: 'Production',
  },
  contact: {
    email: 'contact@iannc.ro',
    discord: 'iannc.',
    responseTime: '24h',
  },
  tools: [
    { id: 'update-maker', name: 'Update Maker', path: '/tools/update-maker', category: 'Discord', status: 'online', featured: true, public: true, description: 'Generator de update-uri si patch notes pentru Discord.' },
    { id: 'todo-maker', name: 'To-Do Maker', path: '/tools/todo-maker', category: 'Planning', status: 'online', featured: true, public: true, description: 'Board pentru task-uri, prioritati si focus.' },
    { id: 'pomodoro', name: 'Pomodoro Focus', path: '/pomodoro', category: 'Focus', status: 'online', featured: true, public: true, description: 'Timer conectat cu task-urile importante.' },
    { id: 'wildfire-overlay', name: 'Wildfire Overlay', path: '/wildfire-overlay', category: 'Streaming', status: 'online', featured: true, public: true, description: 'OBS/TikTok overlay pentru server status CS2 Wildfire.' },
  ],
  socials: [
    { id: 'github', label: 'GitHub', handle: '@iannC69', url: 'https://github.com/iannC69', public: true },
    { id: 'steam', label: 'Steam', handle: '1iannc', url: 'https://steamcommunity.com/id/1iannc/', public: true },
    { id: 'instagram', label: 'Instagram', handle: '@iannc_oficial', url: 'https://instagram.com/iannc_oficial', public: true },
    { id: 'youtube', label: 'YouTube', handle: '@iannc', url: 'https://youtube.com/@iannc', public: true },
  ],
  team: [
    { id: 'iannc', name: 'IANNC', role: 'Owner / Admin', email: 'contact@iannc.ro', permissions: 'Full admin, content, moderation, tools', active: true },
  ],
  spotify: {
    favoriteArtist: '',
  },
};

const adminTabs = [
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'content', label: 'Content', icon: LayoutDashboard },
  { id: 'spotify', label: 'Spotify', icon: Disc3 },
  { id: 'tools', label: 'Tools', icon: Settings },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'socials', label: 'Socials', icon: LinkIcon },
  { id: 'reviews', label: 'Reviews', icon: ShieldCheck },
  { id: 'system', label: 'System', icon: ServerCog },
];

const makeId = (prefix) => `${prefix}-${Date.now().toString(36)}`;

const getDateKey = () => {
  const date = new Date();
  return getDateKeyFromDate(date);
};

const getDateKeyFromDate = (date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const getLastDateKeys = (count) => Array.from({ length: count }, (_, index) => {
  const date = new Date();
  date.setDate(date.getDate() - (count - 1 - index));
  return getDateKeyFromDate(date);
});

const formatDayLabel = (key) => key.slice(5).replace('-', '/');

const mergeConfig = (incoming = {}) => ({
  ...defaultConfig,
  ...incoming,
  brand: { ...defaultConfig.brand, ...(incoming.brand || {}) },
  appearance: { ...defaultConfig.appearance, ...(incoming.appearance || {}) },
  site: {
    ...defaultConfig.site,
    ...(incoming.site || {}),
    announcement: incoming.site?.announcement ?? incoming.announcement ?? defaultConfig.site.announcement,
  },
  contact: { ...defaultConfig.contact, ...(incoming.contact || {}) },
  tools: Array.isArray(incoming.tools) && incoming.tools.length ? incoming.tools : defaultConfig.tools,
  socials: Array.isArray(incoming.socials) && incoming.socials.length ? incoming.socials : defaultConfig.socials,
  team: Array.isArray(incoming.team) && incoming.team.length ? incoming.team : defaultConfig.team,
  spotify: { ...defaultConfig.spotify, ...(incoming.spotify || {}) },
});

const sum = (items, getter) => items.reduce((total, item) => total + Number(getter(item) || 0), 0);

function Admin() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('analytics');
  const [config, setConfig] = useState(defaultConfig);
  const [draft, setDraft] = useState(defaultConfig);
  const [dailyStats, setDailyStats] = useState([]);
  const [events, setEvents] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState('');
  const [spotifyArtists, setSpotifyArtists] = useState([]);
  const [spotifyLoading, setSpotifyLoading] = useState(false);
  const [spotifyQuery, setSpotifyQuery] = useState('');

  const email = user?.primaryEmailAddress?.emailAddress || '';
  const isAdmin = user?.publicMetadata?.role === 'admin' || email === 'contact@iannc.ro' || email === 'solwolfs2@gmail.com';
  const dirty = useMemo(() => JSON.stringify(config) !== JSON.stringify(draft), [config, draft]);

  const analytics = useMemo(() => {
    const todayKey = getDateKey();
    const today = dailyStats.find((day) => day.id === todayKey) || {};
    const dailyMap = new Map(dailyStats.map((day) => [day.id, day]));
    const chartDays = getLastDateKeys(14).map((id) => ({ id, ...(dailyMap.get(id) || {}) }));
    const last7 = chartDays.slice(-7);
    const toolMap = new Map();

    dailyStats.forEach((day) => {
      Object.entries(day.tools || {}).forEach(([id, data]) => {
        const current = toolMap.get(id) || { id, views: 0, lastPath: data?.lastPath || '' };
        current.views += Number(data?.views || 0);
        current.lastPath = data?.lastPath || current.lastPath;
        toolMap.set(id, current);
      });
    });

    return {
      todayViews: Number(today.totalViews || 0),
      todayVisitors: Number(today.uniqueVisitors || 0),
      todayToolViews: Number(today.totalToolViews || 0),
      weekViews: sum(last7, (day) => day.totalViews),
      weekVisitors: sum(last7, (day) => day.uniqueVisitors),
      weekToolViews: sum(last7, (day) => day.totalToolViews),
      topTools: [...toolMap.values()].sort((a, b) => b.views - a.views).slice(0, 6),
      chartDays,
    };
  }, [dailyStats]);

  useEffect(() => {
    if (isLoaded && !isAdmin) navigate('/');
  }, [isLoaded, isAdmin, navigate]);

  useEffect(() => {
    if (!isLoaded || !isAdmin) return;

    const loadAdmin = async () => {
      setLoading(true);
      try {
        const [configSnapshot, reviewsSnapshot, analyticsSnapshot, eventsSnapshot] = await Promise.all([
          getDoc(CONFIG_DOC),
          getDocs(query(collection(db, 'reviews'), where('status', '==', 'pending'))),
          getDocs(query(collection(db, 'analyticsDaily'), orderBy('date', 'desc'), limit(14))),
          getDocs(query(collection(db, 'analyticsEvents'), orderBy('createdAt', 'desc'), limit(12))),
        ]);

        const nextConfig = mergeConfig(configSnapshot.exists() ? configSnapshot.data() : {});
        setConfig(nextConfig);
        setDraft(nextConfig);
        setPendingReviews(reviewsSnapshot.docs.map((reviewDoc) => ({ id: reviewDoc.id, ...reviewDoc.data() })));
        setDailyStats(analyticsSnapshot.docs.map((statDoc) => ({ id: statDoc.id, ...statDoc.data() })));
        setEvents(eventsSnapshot.docs.map((eventDoc) => ({ id: eventDoc.id, ...eventDoc.data() })));
        document.documentElement.setAttribute('data-theme', nextConfig.appearance.theme);
        localStorage.setItem('iannc-theme', nextConfig.appearance.theme);
      } catch (error) {
        console.error('Admin load failed:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAdmin();
  }, [isLoaded, isAdmin]);

  const [spotifyHasLoadedDefault, setSpotifyHasLoadedDefault] = useState(false);

  useEffect(() => {
    if (activeTab === 'spotify' && !spotifyHasLoadedDefault) {
      setTimeout(() => setSpotifyLoading(true), 0);
      fetch('/api/spotify/data')
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            const combined = [...(data.topArtists || []), ...(data.followedArtists || [])];
            const unique = combined.reduce((acc, current) => {
              if (!acc.find(item => item.id === current.id)) {
                return acc.concat([current]);
              }
              return acc;
            }, []);
            setSpotifyArtists(unique);
          }
          setSpotifyHasLoadedDefault(true);
          setSpotifyLoading(false);
        })
        .catch(() => {
          setSpotifyHasLoadedDefault(true);
          setSpotifyLoading(false);
        });
    }
  }, [activeTab, spotifyHasLoadedDefault]);

  const searchSpotifyArtists = async (e) => {
    e.preventDefault();
    if (!spotifyQuery.trim()) return;
    setSpotifyLoading(true);
    try {
      const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(spotifyQuery)}`);
      const data = await res.json();
      setSpotifyArtists(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Spotify search failed:', err);
    } finally {
      setSpotifyLoading(false);
    }
  };

  const updateSection = (section, field, value) => {
    setDraft((current) => ({ ...current, [section]: { ...current[section], [field]: value } }));
  };

  const updateListItem = (listName, id, patch) => {
    setDraft((current) => ({
      ...current,
      [listName]: current[listName].map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  };

  const addListItem = (listName, item) => {
    setDraft((current) => ({ ...current, [listName]: [{ ...item, id: makeId(listName) }, ...current[listName]] }));
  };

  const removeListItem = (listName, id) => {
    setDraft((current) => ({ ...current, [listName]: current[listName].filter((item) => item.id !== id) }));
  };

  const saveConfig = async () => {
    setSaving(true);
    setSaveState('');
    try {
      const payload = {
        ...draft,
        announcement: draft.site.announcement,
        updatedAt: serverTimestamp(),
        updatedBy: { id: user?.id || '', name: user?.fullName || user?.firstName || 'Admin', email },
      };

      await setDoc(CONFIG_DOC, payload, { merge: true });
      setConfig(draft);
      document.documentElement.setAttribute('data-theme', draft.appearance.theme);
      localStorage.setItem('iannc-theme', draft.appearance.theme);
      setSaveState('saved');
      window.setTimeout(() => setSaveState(''), 2200);
    } catch (error) {
      console.error('Save failed:', error);
      setSaveState('error');
    } finally {
      setSaving(false);
    }
  };

  const approveReview = async (id) => {
    await updateDoc(doc(db, 'reviews', id), { status: 'approved', reviewedAt: serverTimestamp() });
    setPendingReviews((current) => current.filter((review) => review.id !== id));
  };

  const denyReview = async (id) => {
    await deleteDoc(doc(db, 'reviews', id));
    setPendingReviews((current) => current.filter((review) => review.id !== id));
  };

  if (!isLoaded || !user || loading) {
    return (
      <div className="admin-loading-screen">
        <Loader2 size={42} className="spinner" />
        <p>Se incarca Command Center din Firebase...</p>
      </div>
    );
  }

  return (
    <div className="admin-console">
      <div className="admin-console-bg" />

      <aside className="admin-nav">
        <div className="admin-brand">
          <span className="admin-brand-mark"><ShieldCheck size={22} /></span>
          <div>
            <strong>IANNC</strong>
            <small>Admin OS</small>
          </div>
        </div>

        <div className="admin-nav-group">
          <span>Control</span>
          {adminTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} type="button" className={activeTab === tab.id ? 'active' : ''} onClick={() => setActiveTab(tab.id)}>
                <Icon size={18} />
                {tab.label}
                {tab.id === 'reviews' && pendingReviews.length > 0 && <b>{pendingReviews.length}</b>}
              </button>
            );
          })}
        </div>

        <div className="admin-nav-footer">
          <Link to="/admin/games"><Gamepad2 size={17} /> Game library</Link>
          <Link to="/"><ExternalLink size={17} /> Inapoi pe site</Link>
        </div>
      </aside>

      <main className="admin-workspace">
        <header className="admin-topbar">
          <div>
            <span className="admin-kicker"><Radio size={13} /> Live Firebase Control</span>
            <h1>{adminTabs.find((tab) => tab.id === activeTab)?.label || 'Admin'}</h1>
          </div>
          <div className="admin-topbar-actions">
            <span className={`admin-health ${draft.site.status}`}>{draft.site.status}</span>
            <span className="admin-user"><Lock size={15} /> {email}</span>
            <button type="button" className="admin-save-btn" onClick={saveConfig} disabled={!dirty || saving}>
              {saving ? <Loader2 size={17} className="spinner" /> : <Save size={17} />}
              {dirty ? 'Salveaza in DB' : 'Sincronizat'}
            </button>
            {saveState === 'saved' && <span className="save-ok">Salvat</span>}
            {saveState === 'error' && <span className="save-error">Eroare</span>}
          </div>
        </header>

        <section
          className="admin-content"
          data-lenis-prevent
          data-lenis-prevent-wheel
          data-lenis-prevent-touch
          onWheel={(event) => event.stopPropagation()}
          onTouchMove={(event) => event.stopPropagation()}
        >
          {activeTab === 'analytics' && (
            <AdminPanel className="analytics-panel analytics-replica-panel" title="Analytics" subtitle="Trafic real salvat in Firestore: vizite, useri unici si tool usage.">
              <AnalyticsReplicaDashboard analytics={analytics} events={events} pendingReviews={pendingReviews.length} />
            </AdminPanel>
          )}

          {activeTab === 'content' && (
            <AdminPanel title="Content Hub" subtitle="Editeaza textele publice, tema si contactul. Totul se salveaza in siteData/general.">
              <div className="admin-grid two">
                <div className="admin-card">
                  <h3><BadgeCheck size={19} /> Brand</h3>
                  <div className="field-grid">
                    <AdminInput label="Brand name" value={draft.brand.name} onChange={(value) => updateSection('brand', 'name', value)} />
                    <AdminInput label="Owner" value={draft.brand.owner} onChange={(value) => updateSection('brand', 'owner', value)} />
                    <AdminTextarea label="Tagline" value={draft.brand.tagline} onChange={(value) => updateSection('brand', 'tagline', value)} />
                    <AdminTextarea label="Hero subtitle" value={draft.brand.heroSubtitle} onChange={(value) => updateSection('brand', 'heroSubtitle', value)} />
                  </div>
                </div>
                <div className="admin-card">
                  <h3><Monitor size={19} /> Theme</h3>
                  <div className="theme-grid">
                    {themes.map((theme) => (
                      <button key={theme.id} type="button" className={draft.appearance.theme === theme.id ? 'active' : ''} onClick={() => updateSection('appearance', 'theme', theme.id)}>
                        <i style={{ background: theme.hex }} />
                        {theme.name}
                      </button>
                    ))}
                  </div>
                  <AdminSwitch label="Compact UI mode" checked={draft.appearance.compactMode} onChange={(value) => updateSection('appearance', 'compactMode', value)} />
                </div>
              </div>
              <div className="admin-grid two">
                <div className="admin-card">
                  <h3><FileText size={19} /> Announcement</h3>
                  <div className="field-grid">
                    <AdminTextarea label="Mesaj global" value={draft.site.announcement} onChange={(value) => updateSection('site', 'announcement', value)} rows={5} />
                    <AdminSwitch label="Announcement activ" checked={draft.site.announcementEnabled} onChange={(value) => updateSection('site', 'announcementEnabled', value)} />
                  </div>
                </div>
              </div>
            </AdminPanel>
          )}

          {activeTab === 'spotify' && (
            <AdminPanel title="Spotify Settings" subtitle="Cauta si alege artistul favorit pentru afisare pe pagina Home.">
              <div className="admin-card" style={{ maxWidth: '800px', width: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <form className="game-search-form" onSubmit={searchSpotifyArtists} style={{ display: 'flex', gap: '8px' }}>
                    <label className="game-search-input" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '0 12px', borderRadius: '6px' }}>
                      <Search size={16} />
                      <input
                        type="text"
                        value={spotifyQuery}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSpotifyQuery(val);
                          if (!val.trim()) {
                            setSpotifyArtists([]);
                            setSpotifyHasLoadedDefault(false);
                          }
                        }}
                        placeholder="Ex: The Weeknd..."
                        style={{ background: 'transparent', border: 'none', color: '#fff', width: '100%', height: '36px', outline: 'none' }}
                      />
                    </label>
                    <button type="submit" className="admin-save-btn" disabled={spotifyLoading} style={{ height: '36px' }}>
                      {spotifyLoading ? <Loader2 className="spinner" size={16} /> : <Search size={16} />}
                    </button>
                  </form>

                  {spotifyLoading ? (
                    <div style={{ padding: '20px', textAlign: 'center' }}>
                      <Loader2 className="spinner" size={20} />
                    </div>
                  ) : spotifyArtists.length > 0 ? (
                    <div className="spotify-artist-select-grid" style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
                      gap: '12px',
                      maxHeight: '400px',
                      overflowY: 'auto',
                      paddingRight: '8px'
                    }}>
                      {spotifyArtists.map(artist => {
                        const isSelected = draft.spotify?.favoriteArtist === artist.name;
                        return (
                          <div 
                            key={artist.id}
                            className={`artist-select-card ${isSelected ? 'selected' : ''}`}
                            onClick={() => {
                              updateSection('spotify', 'favoriteArtist', artist.name);
                              updateSection('spotify', 'favoriteArtistData', {
                                id: artist.id,
                                name: artist.name,
                                images: artist.images,
                                external_urls: artist.external_urls
                              });
                            }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '10px', padding: '8px',
                              borderRadius: '8px', cursor: 'pointer', 
                              background: isSelected ? 'var(--primary-glow)' : 'var(--card-bg)',
                              border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <img src={artist.images?.[0]?.url || 'https://i.scdn.co/image/ab6761610000e5eb12a2ef08d00dd7451a6dbed6'} alt={artist.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                            <span style={{ 
                              color: isSelected ? 'var(--bg)' : 'var(--text)', 
                              fontWeight: isSelected ? '600' : '500',
                              fontSize: '14px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>{artist.name}</span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Cauta un artist pentru a vedea rezultatele.</p>
                  )}
                  <div style={{ marginTop: '12px' }}>
                    <AdminInput label="Sau scrie manual numele artistului:" value={draft.spotify?.favoriteArtist} onChange={(value) => updateSection('spotify', 'favoriteArtist', value)} />
                  </div>
                </div>
              </div>
            </AdminPanel>
          )}

          {activeTab === 'tools' && (
            <AdminPanel title="Tools Manager" subtitle="Controleaza tool-urile publice, statusul si ordinea lor.">
              <AddToolForm onAdd={(tool) => addListItem('tools', tool)} />
              <div className="admin-list">
                {draft.tools.map((tool) => (
                  <div className="admin-list-item" key={tool.id}>
                    <div className="list-main">
                      <strong>{tool.name}</strong>
                      <span>{tool.path || 'Fara ruta'} · {tool.category}</span>
                      <p>{tool.description}</p>
                    </div>
                    <div className="list-controls">
                      <AdminSelect value={tool.status} onChange={(value) => updateListItem('tools', tool.id, { status: value })} options={statusOptions} />
                      <label className="mini-check"><input type="checkbox" checked={tool.featured} onChange={(event) => updateListItem('tools', tool.id, { featured: event.target.checked })} /> Featured</label>
                      <label className="mini-check"><input type="checkbox" checked={tool.public} onChange={(event) => updateListItem('tools', tool.id, { public: event.target.checked })} /> Public</label>
                      <button className="icon-danger-btn" type="button" onClick={() => removeListItem('tools', tool.id)}><Trash2 size={17} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </AdminPanel>
          )}

          {activeTab === 'team' && (
            <AdminPanel title="Team Workspace" subtitle="Membri, roluri si permisiuni pentru echipa.">
              <AddTeamForm onAdd={(member) => addListItem('team', member)} />
              <div className="admin-grid two">
                {draft.team.map((member) => (
                  <div className="admin-card" key={member.id}>
                    <div className="card-title-row">
                      <h3><Users size={19} /> {member.name}</h3>
                      <button className="icon-danger-btn" type="button" onClick={() => removeListItem('team', member.id)}><Trash2 size={17} /></button>
                    </div>
                    <div className="field-grid">
                      <AdminInput label="Nume" value={member.name} onChange={(value) => updateListItem('team', member.id, { name: value })} />
                      <AdminInput label="Rol" value={member.role} onChange={(value) => updateListItem('team', member.id, { role: value })} />
                      <AdminInput label="Email" value={member.email} onChange={(value) => updateListItem('team', member.id, { email: value })} />
                      <AdminTextarea label="Permisiuni" value={member.permissions} onChange={(value) => updateListItem('team', member.id, { permissions: value })} />
                      <AdminSwitch label="Membru activ" checked={member.active} onChange={(value) => updateListItem('team', member.id, { active: value })} />
                    </div>
                  </div>
                ))}
              </div>
            </AdminPanel>
          )}

          {activeTab === 'socials' && (
            <AdminPanel title="Social Links" subtitle="Link-uri publice si profiluri pentru zona de conectare.">
              <AddSocialForm onAdd={(social) => addListItem('socials', social)} />
              <div className="admin-list">
                {draft.socials.map((social) => (
                  <div className="admin-list-item" key={social.id}>
                    <div className="list-main">
                      <strong>{social.label}</strong>
                      <span>{social.handle}</span>
                      <a href={social.url} target="_blank" rel="noreferrer">{social.url}</a>
                    </div>
                    <div className="list-controls wide">
                      <AdminInput value={social.label} onChange={(value) => updateListItem('socials', social.id, { label: value })} />
                      <AdminInput value={social.handle} onChange={(value) => updateListItem('socials', social.id, { handle: value })} />
                      <AdminInput value={social.url} onChange={(value) => updateListItem('socials', social.id, { url: value })} />
                      <label className="mini-check"><input type="checkbox" checked={social.public} onChange={(event) => updateListItem('socials', social.id, { public: event.target.checked })} /> Public</label>
                      <button className="icon-danger-btn" type="button" onClick={() => removeListItem('socials', social.id)}><Trash2 size={17} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </AdminPanel>
          )}

          {activeTab === 'reviews' && (
            <AdminPanel title="Review Moderation" subtitle="Aproba sau respinge review-urile inainte sa apara pe site.">
              <div className="admin-card">
                <div className="moderation-list">
                  {pendingReviews.length === 0 ? <EmptyState text="Nu exista review-uri in asteptare." /> : pendingReviews.map((review) => (
                    <motion.div key={review.id} className="mod-review-item" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                      <img src={review.userImage || 'https://ui-avatars.com/api/?name=U'} alt="Avatar" className="mod-avatar" />
                      <div className="mod-review-info">
                        <div className="mod-review-meta">
                          <strong>{review.userName || 'Anonymous'}</strong>
                          <span>{review.rating || 5} stele</span>
                        </div>
                        <p>{review.text}</p>
                      </div>
                      <div className="mod-actions">
                        <button className="mod-btn approve" type="button" onClick={() => approveReview(review.id)}><CheckCircle2 size={18} /> Aproba</button>
                        <button className="mod-btn deny" type="button" onClick={() => denyReview(review.id)}><XCircle size={18} /> Respinge</button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </AdminPanel>
          )}

          {activeTab === 'system' && (
            <AdminPanel title="System Control" subtitle="Status public, environment, mentenanta si contact.">
              <div className="admin-grid two">
                <div className="admin-card">
                  <h3><ServerCog size={19} /> Status</h3>
                  <div className="field-grid">
                    <AdminSelect label="Status public" value={draft.site.status} onChange={(value) => updateSection('site', 'status', value)} options={statusOptions} />
                    <AdminInput label="Version" value={draft.site.version} onChange={(value) => updateSection('site', 'version', value)} />
                    <AdminInput label="Environment" value={draft.site.environment} onChange={(value) => updateSection('site', 'environment', value)} />
                    <AdminInput label="Last deploy" value={draft.site.lastDeploy} onChange={(value) => updateSection('site', 'lastDeploy', value)} />
                    <AdminSwitch label="Maintenance mode" checked={draft.site.maintenanceMode} onChange={(value) => updateSection('site', 'maintenanceMode', value)} />
                  </div>
                </div>
                <div className="admin-card">
                  <h3><Globe size={19} /> Contact</h3>
                  <div className="field-grid">
                    <AdminInput label="Email" value={draft.contact.email} onChange={(value) => updateSection('contact', 'email', value)} />
                    <AdminInput label="Discord" value={draft.contact.discord} onChange={(value) => updateSection('contact', 'discord', value)} />
                    <AdminInput label="Response time" value={draft.contact.responseTime} onChange={(value) => updateSection('contact', 'responseTime', value)} />
                  </div>
                </div>
              </div>
            </AdminPanel>
          )}
        </section>
      </main>
    </div>
  );
}

function AdminPanel({ title, subtitle, children, className = '' }) {
  return (
    <motion.div className={`admin-panel ${className}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div className="admin-panel-header">
        <div>
          <span>Command module</span>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      {children}
    </motion.div>
  );
}

function AnalyticsReplicaDashboard({ analytics, events, pendingReviews }) {
  const values = analytics.chartDays.map((day) => Number(day.totalViews || 0));
  const current = values.at(-1) || 0;
  const previous = values.at(-2) || 0;
  const delta = previous ? Math.round(((current - previous) / previous) * 100) : current > 0 ? 100 : 0;
  const topTool = analytics.topTools[0];
  const latestEvent = events[0];
  const bottomCards = [
    { eyebrow: 'Top platform', title: 'IANNC.RO', value: analytics.weekViews, note: 'sessions', icon: Monitor },
    { eyebrow: 'Top source', title: latestEvent?.path || 'Live site', value: events.length, note: 'events', icon: Radio },
    { eyebrow: 'Top tool', title: topTool?.id || 'No tool yet', value: topTool?.views || 0, note: 'views', icon: Settings },
    { eyebrow: 'Moderation', title: 'Reviews', value: pendingReviews, note: 'pending', icon: ShieldCheck },
  ];

  return (
    <div className="analytics-replica">
      <main className="replica-main">
        <div className="replica-stat-row">
          <section className="replica-stat-card featured">
            <strong>{analytics.weekViews}</strong>
            <span>Total sessions</span>
            <em className={delta >= 0 ? 'positive' : 'negative'}>{delta >= 0 ? '+' : ''}{delta}%</em>
            <MiniSparkline days={analytics.chartDays} />
          </section>
          <ReplicaMetricCard value={analytics.weekVisitors} label="Total visitors" delta="-3%" negative />
          <ReplicaMetricCard value={`${analytics.weekToolViews}`} label="Tool views" delta="+1%" />
          <ReplicaMetricCard value={pendingReviews} label="Reviews pending" delta="+21%" />
        </div>

        <section className="replica-sessions">
          <div className="replica-section-head">
            <div>
              <h3>Sessions overview</h3>
              <span>{analytics.chartDays[0]?.id || 'today'} - {analytics.chartDays.at(-1)?.id || 'today'}</span>
            </div>
            <div className="replica-filters">
              <button type="button">Today</button>
              <button type="button">7d</button>
              <button type="button" className="active">2w</button>
              <button type="button">1m</button>
              <button type="button">3m</button>
              <button type="button">2019</button>
              <button type="button" className="download"><Download size={15} /> Download CSV</button>
            </div>
          </div>
          <AnalyticsAreaChart days={analytics.chartDays} />
        </section>

        <div className="replica-bottom-strip">
          {bottomCards.map((card) => {
            const Icon = card.icon;
            return (
              <section className="replica-bottom-card" key={card.eyebrow}>
                <div>
                  <Icon size={22} />
                  <span>{card.eyebrow}</span>
                  <button type="button" aria-label="More"><MoreVertical size={16} /></button>
                </div>
                <strong>{card.title}</strong>
                <b>{card.value}<small> / {card.note}</small></b>
              </section>
            );
          })}
        </div>
      </main>

      <aside className="replica-right-panel">
        <section className="replica-radar">
          <div className="replica-side-title">
            <h3>Views by browser</h3>
            <button type="button" aria-label="More"><MoreVertical size={16} /></button>
          </div>
          <TrafficRadar analytics={analytics} />
        </section>

        <section className="replica-statistics">
          <div className="replica-side-title">
            <h3>Statistics</h3>
            <button type="button" aria-label="More"><MoreVertical size={16} /></button>
          </div>
          <SideStatCard label="Online visitors" value={analytics.todayVisitors} max={Math.max(analytics.weekVisitors, 1)} />
          <SideStatCard label="New visitors" value={analytics.weekVisitors} max={Math.max(analytics.weekViews, 1)} />
          <SideStatCard label="Tool requests" value={analytics.weekToolViews} max={Math.max(analytics.weekViews, 1)} />
        </section>
      </aside>
    </div>
  );
}

function ReplicaMetricCard({ value, label, delta, negative = false }) {
  return (
    <section className="replica-stat-card">
      <strong>{value}</strong>
      <span>{label}</span>
      <small className={negative ? 'negative' : 'positive'}>{negative ? '↓' : '↑'} {delta}</small>
    </section>
  );
}

function MiniSparkline({ days }) {
  const width = 230;
  const height = 86;
  const values = days.map((day) => Number(day.totalViews || 0));
  const max = Math.max(1, ...values);
  const points = days.map((day, index) => {
    const x = days.length === 1 ? width / 2 : (index / (days.length - 1)) * width;
    const y = height - 12 - (Number(day.totalViews || 0) / max) * (height - 24);
    return { x, y, id: day.id };
  });
  const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mini-sparkline" aria-hidden="true">
      <motion.path d={line} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8 }} />
      {points.map((point) => <circle key={point.id} cx={point.x} cy={point.y} r="3" />)}
    </svg>
  );
}

function TrafficRadar({ analytics }) {
  const metrics = [
    { label: 'Firefox', value: analytics.weekVisitors },
    { label: 'Explorer', value: analytics.todayViews },
    { label: 'Chrome', value: analytics.weekViews },
    { label: 'Safari', value: analytics.weekToolViews },
  ];
  const max = Math.max(1, ...metrics.map((metric) => Number(metric.value || 0)));
  const center = 110;
  const radius = 76;
  const polygon = metrics.map((metric, index) => {
    const angle = -Math.PI / 2 + (index / metrics.length) * Math.PI * 2;
    const distance = Math.max(0.18, Number(metric.value || 0) / max) * radius;
    return `${center + Math.cos(angle) * distance},${center + Math.sin(angle) * distance}`;
  }).join(' ');

  return (
    <div className="radar-wrap">
      <svg viewBox="0 0 220 220" role="img" aria-label="Views by channel">
        {[0.35, 0.62, 0.9].map((scale) => (
          <circle key={scale} cx={center} cy={center} r={radius * scale} className="radar-ring" />
        ))}
        {metrics.map((metric, index) => {
          const angle = -Math.PI / 2 + (index / metrics.length) * Math.PI * 2;
          const x = center + Math.cos(angle) * radius;
          const y = center + Math.sin(angle) * radius;
          const labelX = center + Math.cos(angle) * (radius + 24);
          const labelY = center + Math.sin(angle) * (radius + 24);
          return (
            <g key={metric.label}>
              <line x1={center} y1={center} x2={x} y2={y} className="radar-axis" />
              <text x={labelX} y={labelY} textAnchor="middle" dominantBaseline="middle" className="radar-label">{metric.label}</text>
            </g>
          );
        })}
        <motion.polygon
          points={polygon}
          className="radar-polygon"
          initial={{ opacity: 0, scale: 0.75, originX: '110px', originY: '110px' }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.65 }}
        />
      </svg>
    </div>
  );
}

function SideStatCard({ label, value, max }) {
  const percent = Math.min(100, Math.round((Number(value || 0) / Math.max(1, max)) * 100));

  return (
    <div className="side-stat-card">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <i style={{ '--progress': `${percent}%` }}>
        <b>{percent}%</b>
      </i>
    </div>
  );
}

function AnalyticsAreaChart({ days }) {
  const width = 960;
  const height = 320;
  const padding = { top: 42, right: 34, bottom: 52, left: 48 };
  const values = days.map((day) => Number(day.totalViews || 0));
  const max = Math.max(1, ...values);
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const points = days.map((day, index) => {
    const x = padding.left + (days.length === 1 ? chartWidth / 2 : (index / (days.length - 1)) * chartWidth);
    const y = padding.top + chartHeight - (Number(day.totalViews || 0) / max) * chartHeight;
    return { x, y, value: Number(day.totalViews || 0), label: formatDayLabel(day.id), index };
  });
  const lastNonZeroIndex = points.findLastIndex((point) => point.value > 0);

  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`
    : '';

  return (
    <div className="analytics-area-chart">
      {points.length === 0 ? (
        <EmptyState text="Nu exista inca date de analytics." />
      ) : (
        <>
          <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Views in ultimele 7 zile">
            <defs>
              <linearGradient id="analyticsAreaGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#d2ff00" stopOpacity="0.38" />
                <stop offset="100%" stopColor="#d2ff00" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 1, 2, 3].map((line) => {
              const y = padding.top + (line / 3) * chartHeight;
              return <line key={line} x1={padding.left} x2={width - padding.right} y1={y} y2={y} className="chart-grid-line" />;
            })}
            <motion.path className="chart-area" d={areaPath} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }} />
            <motion.path className="chart-line" d={linePath} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease: 'easeOut' }} />
            {points.map((point) => {
              const shouldShowValue = point.value > 0 || point.index === lastNonZeroIndex;
              return (
              <g key={point.label}>
                <motion.circle
                  className="chart-dot"
                  cx={point.x}
                  cy={point.y}
                  r="5"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.25, delay: 0.45 }}
                />
                <text x={point.x} y={height - 14} textAnchor="middle" className="chart-label">{point.label}</text>
                {shouldShowValue && <text x={point.x} y={point.y - 18} textAnchor="middle" className="chart-value">{point.value}</text>}
              </g>
              );
            })}
          </svg>
        </>
      )}
    </div>
  );
}

function EmptyState({ text }) {
  return <div className="empty-state">{text}</div>;
}

function AdminInput({ label, value, onChange }) {
  return (
    <label className="admin-field">
      {label && <span>{label}</span>}
      <input value={value || ''} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function AdminTextarea({ label, value, onChange, rows = 3 }) {
  return (
    <label className="admin-field span-two">
      {label && <span>{label}</span>}
      <textarea rows={rows} value={value || ''} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function AdminSelect({ label, value, onChange, options }) {
  return (
    <label className="admin-field">
      {label && <span>{label}</span>}
      <select value={value || options[0]} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function AdminSwitch({ label, checked, onChange }) {
  return (
    <button type="button" className={checked ? 'admin-switch active' : 'admin-switch'} onClick={() => onChange(!checked)}>
      <span>{checked ? <CheckCircle2 size={18} /> : <Circle size={18} />}</span>
      <strong>{label}</strong>
    </button>
  );
}

function AddToolForm({ onAdd }) {
  const [form, setForm] = useState({ name: '', path: '', category: '', description: '' });
  const submit = (event) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    onAdd({ ...form, status: 'online', featured: false, public: true });
    setForm({ name: '', path: '', category: '', description: '' });
  };
  return (
    <form className="inline-add-card" onSubmit={submit}>
      <AdminInput value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} label="Tool name" />
      <AdminInput value={form.path} onChange={(value) => setForm((current) => ({ ...current, path: value }))} label="Path" />
      <AdminInput value={form.category} onChange={(value) => setForm((current) => ({ ...current, category: value }))} label="Category" />
      <AdminInput value={form.description} onChange={(value) => setForm((current) => ({ ...current, description: value }))} label="Description" />
      <button type="submit" className="inline-add-btn"><Plus size={18} /> Add tool</button>
    </form>
  );
}

function AddTeamForm({ onAdd }) {
  const [form, setForm] = useState({ name: '', role: '', email: '', permissions: '' });
  const submit = (event) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    onAdd({ ...form, active: true });
    setForm({ name: '', role: '', email: '', permissions: '' });
  };
  return (
    <form className="inline-add-card" onSubmit={submit}>
      <AdminInput value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} label="Name" />
      <AdminInput value={form.role} onChange={(value) => setForm((current) => ({ ...current, role: value }))} label="Role" />
      <AdminInput value={form.email} onChange={(value) => setForm((current) => ({ ...current, email: value }))} label="Email" />
      <AdminInput value={form.permissions} onChange={(value) => setForm((current) => ({ ...current, permissions: value }))} label="Permissions" />
      <button type="submit" className="inline-add-btn"><Plus size={18} /> Add member</button>
    </form>
  );
}

function AddSocialForm({ onAdd }) {
  const [form, setForm] = useState({ label: '', handle: '', url: '' });
  const submit = (event) => {
    event.preventDefault();
    if (!form.label.trim()) return;
    onAdd({ ...form, public: true });
    setForm({ label: '', handle: '', url: '' });
  };
  return (
    <form className="inline-add-card socials-add" onSubmit={submit}>
      <AdminInput value={form.label} onChange={(value) => setForm((current) => ({ ...current, label: value }))} label="Platform" />
      <AdminInput value={form.handle} onChange={(value) => setForm((current) => ({ ...current, handle: value }))} label="Handle" />
      <AdminInput value={form.url} onChange={(value) => setForm((current) => ({ ...current, url: value }))} label="URL" />
      <button type="submit" className="inline-add-btn"><Plus size={18} /> Add link</button>
    </form>
  );
}

export default Admin;
