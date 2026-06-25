import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  BarChart3,
  Clock3,
  Database,
  ExternalLink,
  Flame,
  Gamepad2,
  LayoutDashboard,
  Link as LinkIcon,
  Loader2,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import myGamesData from '../data/myGames.json';
import './Admin.css';
import './AdminGames.css';

const adminLinks = [
  { label: 'Analytics', icon: BarChart3, to: '/admin' },
  { label: 'Content', icon: LayoutDashboard, to: '/admin' },
  { label: 'Tools', icon: Settings, to: '/admin' },
  { label: 'Team', icon: Users, to: '/admin' },
  { label: 'Socials', icon: LinkIcon, to: '/admin' },
  { label: 'Reviews', icon: ShieldCheck, to: '/admin' },
];

const recommendedGames = [
  {
    id: 'rec-marvel-rivals',
    name: 'Marvel Rivals',
    category: 'Hero shooter',
    trend: 'Trending squad',
    playtimeHours: 0,
    imageUrl: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2767030/library_600x900_2x.jpg',
  },
  {
    id: 'rec-elden-ring',
    name: 'Elden Ring',
    category: 'Soulslike RPG',
    trend: 'Premium pick',
    playtimeHours: 0,
    imageUrl: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/library_600x900_2x.jpg',
  },
  {
    id: 'rec-cyberpunk-2077',
    name: 'Cyberpunk 2077',
    category: 'Open world',
    trend: 'Visual showcase',
    playtimeHours: 0,
    imageUrl: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/library_600x900_2x.jpg',
  },
  {
    id: 'rec-valorant',
    name: 'VALORANT',
    category: 'Tactical FPS',
    trend: 'Competitive',
    playtimeHours: 0,
    imageUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2mvt.jpg',
  },
  {
    id: 'rec-apex-legends',
    name: 'Apex Legends',
    category: 'Battle royale',
    trend: 'Fast sessions',
    playtimeHours: 0,
    imageUrl: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1172470/library_600x900_2x.jpg',
  },
  {
    id: 'rec-hades-2',
    name: 'Hades II',
    category: 'Roguelike',
    trend: 'Community favorite',
    playtimeHours: 0,
    imageUrl: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1145350/library_600x900_2x.jpg',
  },
];

function AdminGames() {
  const { user } = useUser();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [myGames, setMyGames] = useState(myGamesData);
  const [playtime, setPlaytime] = useState({});

  const email = user?.primaryEmailAddress?.emailAddress || 'Admin session';

  const totalHours = useMemo(
    () => myGames.reduce((sum, game) => sum + (Number(game.playtimeHours) || 0), 0),
    [myGames],
  );

  const averageHours = myGames.length > 0 ? Math.round(totalHours / myGames.length) : 0;

  const searchIGDB = async (event) => {
    event.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/igdb/search?q=${encodeURIComponent(query.trim())}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Eroare la cautare. Verifica cheile Twitch din .env.');
      }

      setSearchResults(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getCoverUrl = (game, size = 't_1080p') => {
    if (game.imageUrl) {
      return game.imageUrl;
    }

    if (!game.cover?.url) {
      return 'https://placehold.co/600x900/111214/D2FF00?text=No+Cover';
    }

    return game.cover.url.replace('t_thumb', size).replace('//', 'https://');
  };

  const addGame = async (game) => {
    const newGame = {
      id: game.id,
      name: game.name,
      playtimeHours: Number(playtime[game.id]) || Number(game.playtimeHours) || 0,
      imageUrl: getCoverUrl(game),
    };

    try {
      const response = await fetch('/api/games/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGame),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Jocul nu a putut fi salvat.');
      }

      setMyGames((prev) => [newGame, ...prev.filter((item) => item.id !== game.id)]);
      setPlaytime((prev) => ({ ...prev, [game.id]: '' }));
    } catch (err) {
      setError(err.message || 'Eroare la adaugare.');
    }
  };

  const deleteGame = async (id) => {
    if (!window.confirm('Esti sigur ca vrei sa stergi acest joc?')) return;

    try {
      const response = await fetch('/api/games/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Jocul nu a putut fi sters.');
      }

      setMyGames((prev) => prev.filter((game) => game.id !== id));
    } catch (err) {
      setError(err.message || 'Eroare la stergere.');
    }
  };

  return (
    <div className="admin-console game-admin-console">
      <div className="admin-console-bg" />

      <aside className="admin-nav">
        <Link to="/admin" className="admin-brand" aria-label="Admin home">
          <span className="admin-brand-mark">
            <ShieldCheck size={22} />
          </span>
          <span>
            <strong>IANNC.RO</strong>
            <small>Control center</small>
          </span>
        </Link>

        <nav className="admin-nav-group" aria-label="Admin sections">
          <span>Admin menu</span>
          {adminLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.label} to={item.to}>
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
          <Link to="/admin/games" className="active">
            <Gamepad2 size={18} />
            Game library
            <ExternalLink size={14} />
          </Link>
        </nav>

        <div className="admin-nav-footer">
          <Link to="/">
            <LayoutDashboard size={18} />
            Back to site
          </Link>
        </div>
      </aside>

      <main className="admin-workspace">
        <header className="admin-topbar">
          <div>
            <span className="admin-kicker">
              <Gamepad2 size={15} />
              Game Library Manager
            </span>
            <h1>Game Library</h1>
          </div>

          <div className="admin-topbar-actions">
            <span className="admin-user">
              <ShieldCheck size={16} />
              {email}
            </span>
            <Link to="/admin" className="admin-save-btn">
              Command Center
            </Link>
          </div>
        </header>

        <section className="admin-content">
          <motion.div
            className="admin-panel game-admin-panel"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="admin-panel-header">
              <div>
                <span>IGDB synced library</span>
                <h2>Controleaza jocurile publicate pe site.</h2>
                <p>
                  Cauta rapid in IGDB, seteaza orele jucate si publica biblioteca pe profil
                  fara sa atingi manual JSON-ul.
                </p>
              </div>
            </div>

            <div className="analytics-hero-grid game-metrics-grid">
              <div className="metric-card">
                <Gamepad2 size={22} />
                <strong>{myGames.length}</strong>
                <span>Jocuri publicate</span>
              </div>
              <div className="metric-card">
                <Clock3 size={22} />
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
                <strong>{averageHours}h</strong>
                <span>Medie pe joc</span>
              </div>
            </div>

            {error && (
              <div className="game-error">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <div className="game-library-layout">
              <section className="admin-card game-search-card">
                <div className="card-title-row">
                  <h3>
                    <Sparkles size={20} />
                    Recomandari & cautare
                  </h3>
                  <span className="game-pill">Trending style</span>
                </div>

                <form className="game-search-form" onSubmit={searchIGDB}>
                  <label className="game-search-input">
                    <Search size={18} />
                    <input
                      type="text"
                      value={query}
                      onChange={(event) => {
                        setQuery(event.target.value);
                        if (!event.target.value.trim()) setSearchResults([]);
                      }}
                      placeholder="Ex: The Witcher 3, GTA V..."
                    />
                  </label>
                  <button type="submit" className="admin-save-btn" disabled={loading}>
                    {loading ? <Loader2 className="spinner" size={16} /> : <Search size={16} />}
                    Cauta
                  </button>
                </form>

                <div className="game-results-list">
                  {!query.trim() && searchResults.length === 0 && !loading && (
                    <div className="recommended-games-block">
                      <div className="recommended-games-head">
                        <span>
                          <Flame size={16} />
                          Recommended picks
                        </span>
                        <small>Adauga rapid jocuri populare in librarie</small>
                      </div>

                      <div className="recommended-games-grid">
                        {recommendedGames.map((game) => {
                          const isPublished = myGames.some((item) => item.id === game.id);

                          return (
                            <motion.article
                              key={game.id}
                              className="recommended-game-card"
                              whileHover={{ y: -3 }}
                              transition={{ duration: 0.18 }}
                            >
                              <img src={game.imageUrl} alt={game.name} />
                              <div className="recommended-game-shade" />
                              <div className="recommended-game-info">
                                <span className="recommended-trend">
                                  <Flame size={12} />
                                  {game.trend}
                                </span>
                                <strong>{game.name}</strong>
                                <small>{game.category}</small>
                              </div>
                              <button
                                type="button"
                                className={isPublished ? 'recommended-add is-added' : 'recommended-add'}
                                onClick={() => addGame(game)}
                                disabled={isPublished}
                                aria-label={`Adauga ${game.name}`}
                              >
                                {isPublished ? 'Adaugat' : <Plus size={16} />}
                              </button>
                            </motion.article>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {query.trim() && searchResults.length === 0 && !loading && (
                    <div className="empty-state">
                      Niciun rezultat gasit.
                    </div>
                  )}

                  {searchResults.map((game) => (
                    <motion.article
                      key={game.id}
                      className="game-result-row"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      {game.cover?.url ? (
                        <img
                          className="game-result-cover"
                          src={getCoverUrl(game, 't_cover_small')}
                          alt={game.name}
                        />
                      ) : (
                        <div className="game-result-placeholder">
                          <Gamepad2 size={18} />
                        </div>
                      )}

                      <div className="game-result-meta">
                        <strong>{game.name}</strong>
                        <label>
                          <Clock3 size={14} />
                          <input
                            type="number"
                            min="0"
                            placeholder="Ore jucate"
                            value={playtime[game.id] || ''}
                            onChange={(event) =>
                              setPlaytime((prev) => ({
                                ...prev,
                                [game.id]: event.target.value,
                              }))
                            }
                          />
                        </label>
                      </div>

                      <button
                        type="button"
                        className="game-add-btn"
                        onClick={() => addGame(game)}
                        aria-label={`Adauga ${game.name}`}
                      >
                        <Plus size={19} />
                      </button>
                    </motion.article>
                  ))}
                </div>
              </section>

              <section className="admin-card game-library-card">
                <div className="card-title-row">
                  <h3>
                    <Star size={20} />
                    Publicate pe site
                  </h3>
                  <span className="game-count-pill">{myGames.length} jocuri</span>
                </div>

                {myGames.length === 0 ? (
                  <div className="empty-state">
                    Libraria este goala. Cauta un joc in panoul din stanga.
                  </div>
                ) : (
                  <div className="published-games-grid">
                    {myGames.map((game) => (
                      <motion.article
                        key={game.id}
                        className="published-game-card"
                        whileHover={{ y: -4 }}
                        transition={{ duration: 0.18 }}
                      >
                        <img src={game.imageUrl} alt={game.name} />
                        <div className="published-game-overlay">
                          <strong>{game.name}</strong>
                          <span>{game.playtimeHours || 0}h jucate</span>
                        </div>
                        <button
                          type="button"
                          className="published-game-delete"
                          onClick={() => deleteGame(game.id)}
                          aria-label={`Sterge ${game.name}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </motion.article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}

export default AdminGames;
