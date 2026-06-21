import { useState } from 'react';
import { Search, Plus, Trash2, ArrowLeft, Gamepad2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import myGamesData from '../data/myGames.json';
import './Home.css';

function AdminGames() {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [myGames, setMyGames] = useState(myGamesData);
  const [playtime, setPlaytime] = useState({});

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
      // Transformăm t_thumb de la IGDB în t_1080p pentru o rezoluție maximă
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
          return [newGame, ...filtered]; // adaugă la început
        });
        alert(`Jocul ${game.name} a fost adăugat cu succes în portofoliu!`);
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
    if (!window.confirm('Ești sigur că vrei să ștergi acest joc din portofoliu?')) return;
    try {
      const res = await fetch('/api/games/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      
      if (res.ok) {
        setMyGames(prev => prev.filter(g => g.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <Navbar />
      <div className="home-container" style={{ paddingTop: '100px', minHeight: '100vh', paddingBottom: '100px' }}>
        <div className="section-container" style={{ maxWidth: '1200px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <Link to="/" className="btn btn-secondary" style={{ padding: '0.75rem' }}><ArrowLeft size={20}/></Link>
            <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Gamepad2 className="text-primary" size={36} /> Admin Panel: IGDB
            </h1>
          </div>

          <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '3rem', maxWidth: '600px' }}>
            Caută orice joc existent în baza de date mondială IGDB (deținută de Twitch) și adaugă-l manual în portofoliul tău public. Setează orele jucate înainte să apeși pe Plus.
          </p>

          {error && (
            <div style={{ background: 'rgba(255,68,68,0.1)', borderLeft: '4px solid #ff4444', padding: '1rem', marginBottom: '2rem', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <AlertCircle className="text-danger" size={24} />
              <span style={{ color: '#fff' }}>{error}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'start' }}>
            
            {/* PANOUL STÂNG: Căutare IGDB */}
            <div className="admin-panel" style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Baza de Date Globală</h2>
              <form onSubmit={searchIGDB} style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ex: The Witcher 3, GTA V..."
                  style={{ flex: 1, padding: '14px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '16px' }}
                />
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '0 24px', borderRadius: '12px' }}>
                  {loading ? 'Se caută...' : <Search size={20} />}
                </button>
              </form>

              <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {searchResults.map(game => (
                  <div key={game.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    {game.cover?.url ? (
                      <img src={game.cover.url.replace('t_thumb', 't_cover_small').replace('//', 'https://')} alt="cover" style={{ width: '60px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                    ) : (
                      <div style={{ width: '60px', height: '80px', background: '#111', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '10px', color: '#555' }}>No Image</span>
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>{game.name}</h4>
                      <input 
                        type="number" 
                        placeholder="Ore jucate..." 
                        value={playtime[game.id] || ''}
                        onChange={(e) => setPlaytime({...playtime, [game.id]: parseInt(e.target.value) || 0})}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', width: '120px', fontSize: '14px' }}
                      />
                    </div>
                    <button onClick={() => addGame(game)} className="btn btn-secondary" style={{ padding: '12px', borderRadius: '12px' }} title="Adaugă în portofoliu">
                      <Plus size={24} />
                    </button>
                  </div>
                ))}
                
                {searchResults.length === 0 && !loading && !error && query && (
                  <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', margin: '2rem 0' }}>Nu am găsit niciun joc cu numele ăsta.</p>
                )}
              </div>
            </div>

            {/* PANOUL DREPT: Librăria mea */}
            <div className="admin-panel" style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Publicate pe Site</h2>
                <span style={{ background: 'rgba(210, 255, 0, 0.1)', color: '#D2FF00', padding: '4px 12px', borderRadius: '20px', fontWeight: 'bold' }}>
                  {myGames.length}
                </span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {myGames.map(game => (
                  <div key={game.id} style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', aspectRatio: '2/3', background: '#000' }}>
                    <img src={game.imageUrl} alt={game.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8, transition: '0.3s ease' }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 12px', background: 'linear-gradient(transparent, rgba(0,0,0,0.95) 80%)' }}>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', lineHeight: '1.2' }}>{game.name}</h4>
                      <span style={{ fontSize: '12px', color: '#D2FF00', fontWeight: '600' }}>{game.playtimeHours} ore</span>
                    </div>
                    <button 
                      onClick={() => deleteGame(game.id)}
                      style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(255,68,68,0.9)', border: 'none', color: 'white', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
                      title="Șterge"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
              {myGames.length === 0 && (
                <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', margin: '2rem 0' }}>Librăria este goală. Caută un joc în stânga și apasă Plus.</p>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

export default AdminGames;
