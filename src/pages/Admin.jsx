import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  BadgeCheck,
  CheckCircle2,
  Circle,
  Construction,
  ExternalLink,
  FileText,
  Gamepad2,
  Globe,
  LayoutDashboard,
  Link as LinkIcon,
  Loader2,
  Lock,
  Megaphone,
  Monitor,
  Plus,
  Save,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
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
    {
      id: 'update-maker',
      name: 'Update Maker',
      path: '/tools/update-maker',
      category: 'Discord',
      status: 'online',
      featured: true,
      public: true,
      description: 'Generator de update-uri si patch notes pentru Discord.',
    },
    {
      id: 'todo-maker',
      name: 'To-Do Maker',
      path: '/tools/todo-maker',
      category: 'Planning',
      status: 'online',
      featured: true,
      public: true,
      description: 'Board simplu pentru task-uri, prioritati si focus.',
    },
    {
      id: 'pomodoro',
      name: 'Pomodoro Focus',
      path: '/pomodoro',
      category: 'Focus',
      status: 'online',
      featured: true,
      public: true,
      description: 'Timer conectat cu task-urile importante.',
    },
  ],
  socials: [
    { id: 'github', label: 'GitHub', handle: '@iannC69', url: 'https://github.com/iannC69', public: true },
    { id: 'steam', label: 'Steam', handle: '1iannc', url: 'https://steamcommunity.com/id/1iannc/', public: true },
    { id: 'instagram', label: 'Instagram', handle: '@iannc_oficial', url: 'https://instagram.com/iannc_oficial', public: true },
    { id: 'youtube', label: 'YouTube', handle: '@iannc', url: 'https://youtube.com/@iannc', public: true },
  ],
  team: [
    {
      id: 'iannc',
      name: 'IANNC',
      role: 'Owner / Admin',
      email: 'contact@iannc.ro',
      permissions: 'Full admin, content, moderation, tools',
      active: true,
    },
  ],
};

const adminTabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'site', label: 'Site control', icon: SlidersHorizontal },
  { id: 'tools', label: 'Tools', icon: Settings },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'socials', label: 'Socials', icon: LinkIcon },
  { id: 'moderation', label: 'Moderation', icon: ShieldCheck },
];

const statusOptions = ['online', 'degraded', 'maintenance', 'offline'];

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
});

const makeId = (prefix) => `${prefix}-${Date.now().toString(36)}`;

function Admin() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [config, setConfig] = useState(defaultConfig);
  const [draft, setDraft] = useState(defaultConfig);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [saveState, setSaveState] = useState('');
  const [pendingReviews, setPendingReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  const email = user?.primaryEmailAddress?.emailAddress || '';
  const isAdmin = user?.publicMetadata?.role === 'admin' || email === 'contact@iannc.ro' || email === 'solwolfs2@gmail.com';
  const dirty = useMemo(() => JSON.stringify(config) !== JSON.stringify(draft), [config, draft]);

  // Lock body scroll so admin panel fills full viewport
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.style.margin = '0';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const metrics = useMemo(() => {
    const onlineTools = draft.tools.filter((tool) => tool.status === 'online').length;
    const publicTools = draft.tools.filter((tool) => tool.public).length;
    const activeMembers = draft.team.filter((member) => member.active).length;

    return [
      { label: 'Tools online', value: `${onlineTools}/${draft.tools.length}`, icon: Settings },
      { label: 'Public tools', value: publicTools, icon: Globe },
      { label: 'Team active', value: activeMembers, icon: Users },
      { label: 'Review queue', value: pendingReviews.length, icon: ShieldCheck },
    ];
  }, [draft.tools, draft.team, pendingReviews.length]);

  useEffect(() => {
    if (isLoaded && !isAdmin) {
      navigate('/');
    }
  }, [isLoaded, isAdmin, navigate]);

  useEffect(() => {
    if (!isLoaded || !isAdmin) return;

    const loadConfig = async () => {
      setLoadingConfig(true);
      try {
        const snapshot = await getDoc(CONFIG_DOC);
        const nextConfig = mergeConfig(snapshot.exists() ? snapshot.data() : {});
        setConfig(nextConfig);
        setDraft(nextConfig);
        document.documentElement.setAttribute('data-theme', nextConfig.appearance.theme);
        localStorage.setItem('iannc-theme', nextConfig.appearance.theme);
      } catch (error) {
        console.error('Error loading admin config:', error);
      } finally {
        setLoadingConfig(false);
      }
    };

    const fetchPendingReviews = async () => {
      setLoadingReviews(true);
      try {
        const reviewsQuery = query(collection(db, 'reviews'), where('status', '==', 'pending'));
        const snapshot = await getDocs(reviewsQuery);
        setPendingReviews(snapshot.docs.map((reviewDoc) => ({ id: reviewDoc.id, ...reviewDoc.data() })));
      } catch (error) {
        console.error('Error fetching pending reviews:', error);
      } finally {
        setLoadingReviews(false);
      }
    };

    loadConfig();
    fetchPendingReviews();
  }, [isLoaded, isAdmin]);

  const updateSection = (section, field, value) => {
    setDraft((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }));
  };

  const updateListItem = (listName, id, patch) => {
    setDraft((current) => ({
      ...current,
      [listName]: current[listName].map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  };

  const addListItem = (listName, item) => {
    setDraft((current) => ({
      ...current,
      [listName]: [{ ...item, id: makeId(listName) }, ...current[listName]],
    }));
  };

  const removeListItem = (listName, id) => {
    setDraft((current) => ({
      ...current,
      [listName]: current[listName].filter((item) => item.id !== id),
    }));
  };

  const saveConfig = async () => {
    setSavingConfig(true);
    setSaveState('');
    try {
      const payload = {
        ...draft,
        announcement: draft.site.announcement,
        updatedAt: serverTimestamp(),
        updatedBy: {
          id: user?.id || '',
          name: user?.fullName || user?.firstName || 'Admin',
          email,
        },
      };

      await setDoc(CONFIG_DOC, payload, { merge: true });
      setConfig(draft);
      document.documentElement.setAttribute('data-theme', draft.appearance.theme);
      localStorage.setItem('iannc-theme', draft.appearance.theme);
      setSaveState('saved');
      window.setTimeout(() => setSaveState(''), 2200);
    } catch (error) {
      console.error('Error saving admin config:', error);
      setSaveState('error');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleApproveReview = async (id) => {
    try {
      await updateDoc(doc(db, 'reviews', id), { status: 'approved', reviewedAt: serverTimestamp() });
      setPendingReviews((current) => current.filter((review) => review.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  const handleDenyReview = async (id) => {
    try {
      await deleteDoc(doc(db, 'reviews', id));
      setPendingReviews((current) => current.filter((review) => review.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  if (!isLoaded || !user || loadingConfig) {
    return (
      <div className="admin-loading-screen">
        <Loader2 size={40} className="spinner text-primary" />
        <p>Se verifica accesul si se incarca datele din Firebase...</p>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-bg">
        <div className="admin-grid-lines" />
      </div>

      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">
          <div className="admin-sidebar-logo-icon">
            <ShieldCheck size={20} />
          </div>
          <div className="admin-sidebar-logo-text">
            <strong>IANNC</strong>
            <span>Command Center</span>
          </div>
        </div>

        <span className="admin-sidebar-section-label">Navigation</span>

        {adminTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? 'admin-tab active' : 'admin-tab'}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={17} />
              <span>{tab.label}</span>
            </button>
          );
        })}

        <span className="admin-sidebar-section-label" style={{ marginTop: '0.5rem' }}>Content</span>

        <Link to="/admin/games" className="admin-tab admin-link-tab">
          <Gamepad2 size={17} />
          <span>Game library</span>
          <ExternalLink size={13} />
        </Link>

        <div className="admin-sidebar-footer">
          <div className="admin-tab" style={{ cursor: 'default', opacity: 0.5, fontSize: '0.75rem' }}>
            <Activity size={15} />
            <span>{draft.site.status === 'online' ? '🟢 Online' : '🔴 ' + draft.site.status}</span>
          </div>
          <Link to="/" className="admin-tab" style={{ textDecoration: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem' }}>
            <ExternalLink size={15} />
            <span>Înapoi pe site</span>
          </Link>
        </div>
      </aside>

      {/* MAIN SHELL */}
      <div className="admin-shell">
        {/* TOPBAR */}
        <motion.header
          className="admin-hero"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <span className="admin-kicker"><Lock size={12} /> Firebase workspace</span>
            <h1><Settings size={24} /> Command Center</h1>
          </div>

          <div className="admin-save-panel">
            <div className="admin-user-pill">
              <ShieldCheck size={15} />
              <span>{email}</span>
            </div>
            <button className="admin-save-btn" type="button" onClick={saveConfig} disabled={!dirty || savingConfig}>
              {savingConfig ? <Loader2 size={16} className="spinner" /> : <Save size={16} />}
              {dirty ? 'Salvează' : 'Sincronizat'}
            </button>
            {saveState === 'saved' && <span className="save-state ok">✓ Salvat</span>}
            {saveState === 'error' && <span className="save-state error">Eroare!</span>}
          </div>
        </motion.header>

        {/* CONTENT */}
        <div className="admin-layout">
          <main className="admin-main">
            {activeTab === 'overview' && (
              <AdminSection title="Overview" icon={LayoutDashboard} eyebrow="Live control">
                <div className="admin-metrics">
                  {metrics.map((metric) => {
                    const Icon = metric.icon;
                    return (
                      <div className="metric-card" key={metric.label}>
                        <Icon size={22} />
                        <strong>{metric.value}</strong>
                        <span>{metric.label}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="admin-grid two">
                  <div className="admin-card">
                    <div className="card-title-row">
                      <h3><Activity size={20} /> Server status</h3>
                      <span className={`status-dot ${draft.site.status}`}>{draft.site.status}</span>
                    </div>
                    <div className="field-grid">
                      <AdminSelect
                        label="Status public"
                        value={draft.site.status}
                        onChange={(value) => updateSection('site', 'status', value)}
                        options={statusOptions}
                      />
                      <AdminInput
                        label="Version"
                        value={draft.site.version}
                        onChange={(value) => updateSection('site', 'version', value)}
                      />
                      <AdminInput
                        label="Environment"
                        value={draft.site.environment}
                        onChange={(value) => updateSection('site', 'environment', value)}
                      />
                      <AdminInput
                        label="Last deploy"
                        value={draft.site.lastDeploy}
                        onChange={(value) => updateSection('site', 'lastDeploy', value)}
                      />
                    </div>
                  </div>

                  <div className="admin-card">
                    <div className="card-title-row">
                      <h3><Sparkles size={20} /> Quick switches</h3>
                      <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>Se salvează instant</span>
                    </div>
                    <div className="switch-list">
                      <QuickSwitch
                        label="Announcement activ"
                        description="Afișează bannerul global pe toate paginile."
                        icon={<Megaphone size={18} />}
                        checked={draft.site.announcementEnabled}
                        onChange={async (value) => {
                          updateSection('site', 'announcementEnabled', value);
                          await setDoc(CONFIG_DOC, { site: { announcementEnabled: value } }, { merge: true });
                        }}
                      />
                      <QuickSwitch
                        label="Maintenance mode"
                        description="Blochează accesul pe site pentru utilizatorii non-admin."
                        icon={<Construction size={18} />}
                        danger
                        checked={draft.site.maintenanceMode}
                        onChange={async (value) => {
                          updateSection('site', 'maintenanceMode', value);
                          await setDoc(CONFIG_DOC, { site: { maintenanceMode: value } }, { merge: true });
                        }}
                      />
                      <QuickSwitch
                        label="Compact UI mode"
                        description="Layout mai dens pentru utilizatorii avansați."
                        icon={<SlidersHorizontal size={18} />}
                        checked={draft.appearance.compactMode}
                        onChange={async (value) => {
                          updateSection('appearance', 'compactMode', value);
                          await setDoc(CONFIG_DOC, { appearance: { compactMode: value } }, { merge: true });
                        }}
                      />
                    </div>
                  </div>
                </div>
              </AdminSection>
            )}

            {activeTab === 'site' && (
              <AdminSection title="Site control" icon={SlidersHorizontal} eyebrow="Brand, tema si mesaje">
                <div className="admin-grid two">
                  <div className="admin-card">
                    <h3><BadgeCheck size={20} /> Brand content</h3>
                    <div className="field-grid">
                      <AdminInput label="Brand name" value={draft.brand.name} onChange={(value) => updateSection('brand', 'name', value)} />
                      <AdminInput label="Owner" value={draft.brand.owner} onChange={(value) => updateSection('brand', 'owner', value)} />
                      <AdminTextarea label="Tagline" value={draft.brand.tagline} onChange={(value) => updateSection('brand', 'tagline', value)} />
                      <AdminTextarea label="Hero subtitle" value={draft.brand.heroSubtitle} onChange={(value) => updateSection('brand', 'heroSubtitle', value)} />
                    </div>
                  </div>

                  <div className="admin-card">
                    <h3><Monitor size={20} /> Global appearance</h3>
                    <div className="theme-swatches">
                      {themes.map((theme) => (
                        <button
                          key={theme.id}
                          type="button"
                          className={draft.appearance.theme === theme.id ? 'theme-swatch active' : 'theme-swatch'}
                          onClick={() => updateSection('appearance', 'theme', theme.id)}
                        >
                          <span className="swatch-color" style={{ backgroundColor: theme.hex }} />
                          <span className="swatch-name">{theme.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="admin-card">
                  <h3><FileText size={20} /> Global announcement</h3>
                  <AdminTextarea
                    label="Mesaj global"
                    value={draft.site.announcement}
                    onChange={(value) => updateSection('site', 'announcement', value)}
                    rows={5}
                  />
                </div>
              </AdminSection>
            )}

            {activeTab === 'tools' && (
              <AdminSection title="Tools manager" icon={Settings} eyebrow="Control pentru ecosistem">
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
                        <label className="mini-check">
                          <input type="checkbox" checked={tool.featured} onChange={(event) => updateListItem('tools', tool.id, { featured: event.target.checked })} />
                          Featured
                        </label>
                        <label className="mini-check">
                          <input type="checkbox" checked={tool.public} onChange={(event) => updateListItem('tools', tool.id, { public: event.target.checked })} />
                          Public
                        </label>
                        <button className="icon-danger-btn" type="button" onClick={() => removeListItem('tools', tool.id)} title="Sterge tool">
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </AdminSection>
            )}

            {activeTab === 'team' && (
              <AdminSection title="Team workspace" icon={Users} eyebrow="Oameni, roluri si acces">
                <AddTeamForm onAdd={(member) => addListItem('team', member)} />
                <div className="admin-grid two">
                  {draft.team.map((member) => (
                    <div className="admin-card team-card" key={member.id}>
                      <div className="card-title-row">
                        <h3><Users size={20} /> {member.name}</h3>
                        <button className="icon-danger-btn" type="button" onClick={() => removeListItem('team', member.id)} title="Sterge membru">
                          <Trash2 size={17} />
                        </button>
                      </div>
                      <div className="field-grid">
                        <AdminInput label="Nume" value={member.name} onChange={(value) => updateListItem('team', member.id, { name: value })} />
                        <AdminInput label="Rol" value={member.role} onChange={(value) => updateListItem('team', member.id, { role: value })} />
                        <AdminInput label="Email" value={member.email} onChange={(value) => updateListItem('team', member.id, { email: value })} />
                        <AdminTextarea label="Permisiuni" value={member.permissions} onChange={(value) => updateListItem('team', member.id, { permissions: value })} />
                      </div>
                      <AdminSwitch label="Membru activ" checked={member.active} onChange={(value) => updateListItem('team', member.id, { active: value })} />
                    </div>
                  ))}
                </div>
              </AdminSection>
            )}

            {activeTab === 'socials' && (
              <AdminSection title="Social links" icon={LinkIcon} eyebrow="Tot ce apare public">
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
                        <label className="mini-check">
                          <input type="checkbox" checked={social.public} onChange={(event) => updateListItem('socials', social.id, { public: event.target.checked })} />
                          Public
                        </label>
                        <button className="icon-danger-btn" type="button" onClick={() => removeListItem('socials', social.id)} title="Sterge link">
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </AdminSection>
            )}

            {activeTab === 'moderation' && (
              <AdminSection title="Review moderation" icon={ShieldCheck} eyebrow="Queue public">
                <div className="admin-card">
                  <div className="card-title-row">
                    <h3><ShieldCheck size={20} /> Review-uri in asteptare</h3>
                    <span className="mod-badge">{pendingReviews.length} pending</span>
                  </div>
                  <div className="moderation-list">
                    {loadingReviews ? (
                      <div className="mod-empty"><Loader2 size={22} className="spinner" /> Se incarca...</div>
                    ) : pendingReviews.length === 0 ? (
                      <div className="mod-empty">Nu exista review-uri in asteptare.</div>
                    ) : (
                      pendingReviews.map((review) => (
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
                            <button className="mod-btn approve" type="button" onClick={() => handleApproveReview(review.id)}>
                              <CheckCircle2 size={19} /> Aproba
                            </button>
                            <button className="mod-btn deny" type="button" onClick={() => handleDenyReview(review.id)}>
                              <XCircle size={19} /> Respinge
                            </button>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              </AdminSection>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function AdminSection({ title, eyebrow, icon: Icon, children }) {
  return (
    <motion.section className="admin-section" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div className="section-admin-header">
        <span>{eyebrow}</span>
        <h2><Icon size={26} /> {title}</h2>
      </div>
      {children}
    </motion.section>
  );
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
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function AdminSwitch({ label, description, checked, onChange }) {
  return (
    <button type="button" className={checked ? 'admin-switch active' : 'admin-switch'} onClick={() => onChange(!checked)}>
      <span className="switch-icon">{checked ? <CheckCircle2 size={19} /> : <Circle size={19} />}</span>
      <span>
        <strong>{label}</strong>
        {description && <small>{description}</small>}
      </span>
    </button>
  );
}

function QuickSwitch({ label, description, icon, checked, onChange, danger }) {
  const [loading, setLoading] = useState(false);
  const accentColor = danger ? (checked ? '#ef4444' : 'rgba(239,68,68,0.5)') : (checked ? '#D2FF00' : 'rgba(255,255,255,0.2)');
  const bgColor = danger ? (checked ? 'rgba(239,68,68,0.08)' : 'transparent') : (checked ? 'rgba(210,255,0,0.06)' : 'transparent');

  const handleClick = async () => {
    setLoading(true);
    try { await onChange(!checked); } finally { setLoading(false); }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '1rem',
        background: bgColor,
        border: `1px solid ${checked ? accentColor : 'rgba(255,255,255,0.07)'}`,
        borderRadius: '14px',
        cursor: loading ? 'wait' : 'pointer',
        transition: 'all 0.25s ease',
        textAlign: 'left',
        fontFamily: 'inherit',
        opacity: loading ? 0.7 : 1,
      }}
    >
      {/* Icon */}
      <span style={{
        width: '38px',
        height: '38px',
        borderRadius: '10px',
        background: checked ? (danger ? 'rgba(239,68,68,0.15)' : 'rgba(210,255,0,0.12)') : 'rgba(255,255,255,0.04)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: accentColor,
        flexShrink: 0,
        transition: 'all 0.25s',
      }}>
        {loading ? <Loader2 size={16} className="spinner" /> : icon}
      </span>

      {/* Text */}
      <span style={{ flex: 1, minWidth: 0 }}>
        <strong style={{ display: 'block', color: '#fff', fontSize: '0.875rem', fontWeight: 700, marginBottom: '2px' }}>{label}</strong>
        <small style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', lineHeight: 1.4 }}>{description}</small>
      </span>

      {/* Toggle */}
      <span style={{
        flexShrink: 0,
        width: '44px',
        height: '24px',
        borderRadius: '999px',
        background: checked ? accentColor : 'rgba(255,255,255,0.1)',
        position: 'relative',
        transition: 'background 0.25s',
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        <span style={{
          position: 'absolute',
          top: '2px',
          left: checked ? '22px' : '2px',
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          background: checked ? '#000' : 'rgba(255,255,255,0.5)',
          transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        }} />
      </span>
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
