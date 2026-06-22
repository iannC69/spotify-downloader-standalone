import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, Plus, Trash2, AlertCircle, Gamepad2,
  LayoutDashboard, SlidersHorizontal, Settings, Users, 
  LinkIcon, ShieldCheck, Lock, ExternalLink, Database,
  Star, Clock, TrendingUp, Library
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Link as RouterLink } from 'react-router-dom';
import myGamesData from '../data/myGames.json';
import './Admin.css';

const adminTabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, to: '/admin' },
  { id: 'site', label: 'Site control', icon: SlidersHorizontal, to: '/admin' },
  { id: 'tools', label: 'Tools', icon: Settings, to: '/admin' },
  { id: 'team', label: 'Team', icon: Users, to: '/admin' },
  { id: 'socials', label: 'Socials', icon: LinkIcon, to: '/admin' },
  { id: 'moderation', label: 'Moderation', icon: ShieldCheck, to: '/admin' },
];

function AdminGames() {
  const { user } = useUser();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [myGames, setMyGames] = useState(myGamesData);
  const [playtime, setPlaytime] = useState({});

  const email = user?.primaryEmailAddress?.emailAddress || '';

  const searchIGDB = async (e) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/igdb/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Eroare la căutare. Ai pus cheile Twitch în .env?');
      setSearchResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addGame = async (game) => {
    try {
      let imageUrl = '';
      if (game.cover && game.cover.url) {
        imageUrl = game.cover.url.replace('t_thumb', 't_1080p').replace('//', 'https://');
      }
      const newGame = {
        id: game.id,
        name: game.name,
        playtimeHours: playtime[game.id] || 0,
        imageUrl: imageUrl || 'https://placehold.co/600x900/111214/D2FF00?text=No+Cover'
      };
      const res = await fetch('/api/games/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGame)
      });
      if (res.ok) {
        setMyGames(prev => {
          const filtered = prev.filter(g => g.id !== game.id);
          return [newGame, ...filtered];
        });
        alert(`${game.name} adăugat cu succes!`);
      } else {
        const err = await res.json();
        alert('Eroare: ' + err.error);
      }
    } catch (e) {
      console.error(e);
      alert('Eroare la adăugare');
    }
  };

  const deleteGame = async (id) => {
    if (!window.confirm('Ești sigur că vrei să ștergi acest joc?')) return;
    try {
      const res = await fetch('/api/games/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) setMyGames(prev => prev.filter(g => g.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const totalHours = myGames.reduce((sum, g) => sum + (g.playtimeHours || 0), 0);

  return (
    <div className="admin-container">
      <div className="admin-bg">
        <div className="admin-grid-lines" />
      </div>

      <div className="admin-shell">
        <motion.header
          className="admin-hero"
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <span className="admin-kicker"><Lock size={15} /> Game Library Manager</span>
            <h1><Gamepad2 size={38} /> Game Library</h1>
            <p>Caută în baza IGDB și gestionează portofoliul de jocuri afișat pe site.</p>
          </div>

          <div className="admin-save-panel">
            <div className="admin-user-pill">
              <ShieldCheck size={17} />
              <span>{email}</span>
            </div>
            <Link to="/admin" className="admin-save-btn" style={{ textDecoration: 'none', opacity: 0.85 }}>
              ← Back to Command Center
            </Link>
          </div>
        </motion.header>

        <div className="admin-layout">
          {/* SIDEBAR */}
          <aside className="admin-sidebar">
            {adminTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <RouterLink
                  key={tab.id}
                  to={tab.to}
                  className="admin-tab"
                  style={{ textDecoration: 'none' }}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </RouterLink>
              );
            })}
            <RouterLink to="/admin/games" className="admin-tab active" style={{ textDecoration: 'none' }}>
              <Gamepad2 size={18} />
              <span>Game library</span>
              <ExternalLink size={14} />
            </RouterLink>
          </aside>

          {/* MAIN CONTENT */}
          <main className="admin-main">
            <motion.section
              className="admin-section"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              {/* STATS ROW */}
              <div className="admin-metrics" style={{ marginBottom: '2rem' }}>
                <div className="metric-card">
                  <Library size={22} />
                  <strong>{myGames.length}</strong>
                  <span>Jocuri publicate</span>
                </div>
                <div className="metric-card">
                  <Clock size={22} />
                  <strong>{totalHours}h</strong>
                  <span>Total ore jucate</span>
                </div>
                <div className="metric-card">
                  <Database size={22} />
                  <strong>IGDB</strong>
                  <span>Sursa date</span>
                </div>
                <div className="metric-card">
                  <TrendingUp size={22} />
                  <strong>{myGames.length > 0 ? Math.round(totalHours / myGames.length) : 0}h</strong>
                  <span>Medie per joc</span>
                </div>
              </div>

              {error && (
                <div style={{ background: 'rgba(255,68,68,0.1)', borderLeft: '4px solid #ff4444', padding: '1rem', marginBottom: '2rem', borderRadius: '12px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <AlertCircle size={20} style={{ color: '#ff4444', flexShrink: 0 }} />
                  <span style={{ color: '#fff', fontSize: '0.9rem' }}>{error}</span>
                </div>
              )}

              <div className="admin-grid two">
                {/* PANOUL STÂNG: Căutare IGDB */}
                <div className="admin-card">
                  <div className="card-title-row">
                    <h3><Search size={20} /> Caută în IGDB</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '20px' }}>Baza de date mondială</span>
                  </div>

                  <form onSubmit={searchIGDB} style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Ex: The Witcher 3, GTA V..."
                      style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '15px', outline: 'none' }}
                    />
                    <button type="submit" className="admin-save-btn" disabled={loading} style={{ padding: '0 20px', whiteSpace: 'nowrap' }}>
                      {loading ? 'Caută...' : <><Search size={16} /> Caută</>}
                    </button>
                  </form>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '500px', overflowY: 'auto' }}>
                    {searchResults.length === 0 && !loading && (
                      <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '3rem 0', fontSize: '0.9rem' }}>
                        {query ? 'Niciun rezultat găsit.' : 'Tastează un joc și apasă Caută.'}
                      </div>
                    )}
                    {searchResults.map(game => (
                      <motion.div
                        key={game.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.04)' }}
                      >
                        {game.cover?.url ? (
                          <img src={game.cover.url.replace('t_thumb', 't_cover_small').replace('//', 'https://')} alt="cover" style={{ width: '50px', height: '66px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: '50px', height: '66px', background: '#111', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Gamepad2 size={18} style={{ color: '#555' }} />
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{game.name}</h4>
                          <input
                            type="number"
                            placeholder="Ore jucate"
                            value={playtime[game.id] || ''}
                            onChange={(e) => setPlaytime({ ...playtime, [game.id]: parseInt(e.target.value) || 0 })}
                            style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', width: '110px', fontSize: '13px', outline: 'none' }}
                          />
                        </div>
                        <button
                          onClick={() => addGame(game)}
                          style={{ background: '#D2FF00', border: 'none', color: '#000', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, fontWeight: '900', transition: 'all 0.2s' }}
                          title="Adaugă"
                        >
                          <Plus size={20} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* PANOUL DREPT: Library */}
                <div className="admin-card">
                  <div className="card-title-row">
                    <h3><Star size={20} /> Publicate pe site</h3>
                    <span style={{ background: 'rgba(210, 255, 0, 0.1)', color: '#D2FF00', padding: '4px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.85rem', border: '1px solid rgba(210,255,0,0.2)' }}>
                      {myGames.length} jocuri
                    </span>
                  </div>

                  {myGames.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '3rem 0', fontSize: '0.9rem' }}>
                      Librăria este goală. Caută un joc în stânga.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px', maxHeight: '580px', overflowY: 'auto' }}>
                      {myGames.map(game => (
                        <motion.div
                          key={game.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', aspectRatio: '2/3', background: '#000', cursor: 'pointer' }}
                          whileHover={{ scale: 1.03 }}
                          transition={{ duration: 0.2 }}
                        >
                          <img src={game.imageUrl} alt={game.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 10px 10px', background: 'linear-gradient(transparent, rgba(0,0,0,0.95) 70%)' }}>
                            <h4 style={{ margin: '0 0 3px 0', fontSize: '12px', lineHeight: '1.3', fontWeight: '700' }}>{game.name}</h4>
                            <span style={{ fontSize: '11px', color: '#D2FF00', fontWeight: '700' }}>{game.playtimeHours}h</span>
                          </div>
                          <button
                            onClick={() => deleteGame(game.id)}
                            style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(255,68,68,0.9)', backdropFilter: 'blur(10px)', border: 'none', color: 'white', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                            title="Șterge"
                          >
                            <Trash2 size={14} />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.section>
          </main>
        </div>
      </div>
    </div>
  );
}

export default AdminGames;
