import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  Gamepad2, GitBranch, Camera, Video, 
  ArrowRight, ShieldCheck, BadgeCheck, Activity, Map, Server, 
  Cpu, ChevronDown, Layers, Mail, Code, Bot, Globe, ExternalLink, LayoutList
} from 'lucide-react';
import Tilt from 'react-parallax-tilt';
import Navbar from '../components/Navbar';
import LiveStatus from '../components/LiveStatus';
import InteractiveTerminal from '../components/InteractiveTerminal';
import SteamWidget from '../components/SteamWidget';
import './Home.css';

// Lista de jocuri pe care IANNC o poate edita ușor
const playedGames = [
  'CS2',
  'Fortnite',
  'First Light 007',
  'Minecraft'
];

// O funcție mică ca să tragă o poză mișto dacă recunoaște jocul, sau un placeholder automat.
const getGameCover = (gameName) => {
  const name = gameName.toLowerCase();
  if (name.includes('cs2') || name.includes('csgo')) return 'https://cdn.cloudflare.steamstatic.com/steam/apps/730/library_600x900_2x.jpg';
  if (name.includes('fortnite')) return 'https://cdn2.unrealengine.com/egs-fortnite-core-1200x1600-b33a82ee20fb.jpg';
  if (name.includes('minecraft')) return 'https://m.media-amazon.com/images/M/MV5BMjA5MWZlMGMtMjFhOS00ODg1LWIxMDQtOTMyYWQyYTNlOWRmXkEyXkFqcGdeQXVyNTgyNTA4MjM@._V1_FMjpg_UX1000_.jpg';
  if (name.includes('first light')) return 'https://images.igdb.com/igdb/image/upload/t_cover_big/co685n.png'; // Placeholder general
  
  // Dacă adaugă un joc nou, face o copertă automată cu numele pe ea.
  return `https://placehold.co/600x900/111214/D2FF00?text=${encodeURIComponent(gameName)}`;
};

function Home() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);

  // Reference for intersection/animation
  const gearRef = useRef(null);

  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.15 } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
  };

  return (
    <>
      <Navbar />
      
      <div className="home-container">
        
        {/* Animated Background (Pure Green Depth) */}
        <div className="animated-bg">
          <motion.div style={{ y }} className="bg-stars"></motion.div>
          <div className="bg-glow glow-1"></div>
          <div className="bg-glow glow-2"></div>
        </div>

        {/* 1. HERO SECTION (Asymmetric Left-Right) */}
        <section className="story-section hero-section">
          <div className="hero-split">
            {/* Left: Text & Titles */}
            <motion.div 
              className="hero-text-side"
              initial="hidden"
              animate="visible"
              variants={sectionVariants}
            >
              <motion.div variants={itemVariants}>
                <LiveStatus />
              </motion.div>
              <motion.h1 className="hero-title-left" variants={itemVariants}>
                Salut, <br/>
                sunt IANNC <BadgeCheck size={42} className="verified-badge" />
              </motion.h1>
              <motion.p className="hero-subtitle-left" variants={itemVariants}>
                Dezvoltator web full-stack și Community Manager.
                Aduc proiecte la viață prin cod curat, design premium și o conexiune reală cu audiența.
              </motion.p>
              
              <motion.div className="hero-action-buttons" variants={itemVariants}>
                <a href="#projects" className="btn btn-primary">Vezi Proiectele <ArrowRight size={18} /></a>
                <a href="#socials" className="btn btn-secondary">Contact <Mail size={18} /></a>
              </motion.div>
            </motion.div>

            {/* Right: Floating Avatar */}
            <motion.div 
              className="hero-image-side"
              initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="hero-image-wrapper">
                <div className="hero-image-glow"></div>
                <img 
                  src="https://github.com/iannC69.png" 
                  alt="IANNC Avatar" 
                  className="hero-image-floating"
                  onError={(e) => { e.target.src = 'https://cdn.akamai.steamstatic.com/steamcommunity/public/images/avatars/fe/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'; }}
                />
              </div>
            </motion.div>
          </div>
          
          <motion.div 
            className="scroll-indicator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, 10, 0] }}
            transition={{ opacity: { delay: 1 }, y: { repeat: Infinity, duration: 2, ease: "easeInOut" } }}
          >
            <p>Scroll down</p>
            <ChevronDown size={24} />
          </motion.div>
        </section>

        {/* 2. PROIECTE & INCOMING */}
        {/* 2. PROIECTE */}
        <section id="proiecte" className="story-section">
          <div className="section-container">
            <motion.h2 className="section-heading" variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <Code size={36} className="heading-icon-svg text-warning" /> Cod & Creații
            </motion.h2>
            
            <div className="projects-grid bento-projects">
              {/* Featured Project: Update Maker */}
              <Tilt className="tilt-wrapper" tiltMaxAngleX={4} tiltMaxAngleY={4} glareEnable={true} glareMaxOpacity={0.1} scale={1.02} transitionSpeed={1500}>
                <motion.div className="story-card project-card featured-project" variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <span className="project-tag">LIVE APP</span>
                  <div className="project-header">
                    <Bot size={32} className="text-primary" />
                    <h4>Update Maker</h4>
                  </div>
                  <p>Generator automat de Patch Notes pentru serverele de Discord. Formatează update-urile și menține comunitatea informată cu un design impecabil.</p>
                  <Link to="/tools/update-maker" className="btn btn-primary" style={{alignSelf: 'flex-start', marginBottom: '0.5rem'}}>
                    Deschide Aplicația <ArrowRight size={16}/>
                  </Link>
                  <InteractiveTerminal />
                </motion.div>
              </Tilt>

              {/* Project: IncLounge.top */}
              <Tilt className="tilt-wrapper" tiltMaxAngleX={4} tiltMaxAngleY={4} glareEnable={true} glareMaxOpacity={0.1} scale={1.02} transitionSpeed={1500}>
                <motion.div className="story-card project-card" variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <span className="project-tag" style={{color: '#a855f7', background: 'rgba(168,85,247,0.2)'}}>WEBSITE</span>
                  <div className="project-header">
                    <Globe size={32} className="text-purple" style={{color: '#a855f7'}} />
                    <h4>IncLounge.top</h4>
                  </div>
                  <p>Platforma principală web, un hub exclusiv deținut și administrat direct. Design modern, performanță rapidă și o comunitate în continuă creștere.</p>
                  <a href="https://inclounge.top" target="_blank" rel="noreferrer" className="btn btn-secondary" style={{marginTop: 'auto', alignSelf: 'flex-start'}}>
                    Vizitează Site-ul <ExternalLink size={16}/>
                  </a>
                </motion.div>
              </Tilt>

              {/* Incoming Project: Todo App */}
              <Tilt className="tilt-wrapper" tiltMaxAngleX={4} tiltMaxAngleY={4} glareEnable={true} glareMaxOpacity={0.1} scale={1.02} transitionSpeed={1500}>
                <motion.div className="story-card project-card incoming-project" variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <span className="project-tag text-warning" style={{background: 'rgba(254, 231, 92, 0.2)'}}>IN DEVELOPMENT</span>
                  <div className="incoming-content">
                    <LayoutList size={48} className="text-warning pulse-icon" style={{marginBottom: '1rem'}} />
                    <h4 className="text-warning">To-Do List Maker</h4>
                    <p>Aplicație de productivitate extrem de rapidă. Task management regândit pentru eficiență maximă.</p>
                    
                    <Link to="/tools/todo-maker" className="btn btn-secondary" style={{marginTop: '1rem', marginBottom: '1.5rem', borderColor: '#fee75c', color: '#fee75c'}}>
                      Testează Beta <ArrowRight size={16}/>
                    </Link>

                    <div className="loading-bar">
                      <div className="loading-progress"></div>
                    </div>
                  </div>
                </motion.div>
              </Tilt>
            </div>
          </div>
        </section>

        {/* 3. COMUNITATE (WILDFIRE) */}
        <motion.section 
          className="story-section"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={sectionVariants}
        >
          <div className="section-container">
            <motion.h2 className="section-heading" variants={itemVariants}>
              <ShieldCheck size={36} className="heading-icon-svg text-danger" /> Ecosistem & Comunitate
            </motion.h2>
            
            <motion.div className="story-card cs2-banner" variants={itemVariants}>
              <div className="cs2-bg-image"></div>
              <div className="cs2-content">
                <div className="cs2-header-wrapper">
                  <div className="cs2-header">
                    <ShieldCheck size={56} color="#E84A5F" className="wildfire-logo" />
                    <div>
                      <h3>CS2.WILDFIRE.RO</h3>
                      <p className="cs2-role">Community Manager Oficial</p>
                    </div>
                  </div>
                  <a href="https://discord.gg/wildfire" target="_blank" rel="noreferrer" className="btn btn-discord btn-large">
                    <img src="https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6ca814282eca7172c6_icon_clyde_white_RGB.svg" alt="Discord" width="22" height="22" />
                    Intră pe Server
                  </a>
                </div>
                <div className="cs2-stats">
                  <div className="stat-pill"><Map size={18} /> Mirage Only</div>
                  <div className="stat-pill"><Activity size={18} /> 128 Tickrate</div>
                  <div className="stat-pill"><Server size={18} /> Performanță Maximă</div>
                </div>
              </div>
            </motion.div>
            
            <SteamWidget />
          </div>
        </motion.section>

        {/* 4. SPECS & SETUP (NEXT-LEVEL DATA TABLE) */}
        <section className="story-section" ref={gearRef}>
          <div className="section-container" style={{maxWidth: '1200px'}}>
            <motion.h2 className="section-heading" variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <Server size={36} className="heading-icon-svg text-primary" /> Arsenal & System Specs
            </motion.h2>
            
            <motion.div className="tech-specs-bento" variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              
              {/* Core System Table */}
              <div className="spec-panel">
                <div className="spec-panel-header">
                  <Cpu size={24} className="text-primary" />
                  <h3>Workstation Core</h3>
                </div>
                <div className="spec-table">
                  <div className="spec-row">
                    <span className="spec-label">Processor</span>
                    <span className="spec-value text-warning">AMD Ryzen 5 7600X <span className="spec-sub">(6-Core, 5.03GHz)</span></span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Graphics</span>
                    <span className="spec-value text-primary">Radeon RX 6750 XT <span className="spec-sub">(12GB GDDR6)</span></span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Memory</span>
                    <span className="spec-value">32 GB DDR5 <span className="spec-sub">(@ 4800 MHz)</span></span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Motherboard</span>
                    <span className="spec-value">MSI PRO B650-S <span className="spec-sub">(WIFI AM5)</span></span>
                  </div>
                </div>
              </div>

              {/* Peripherals Table */}
              <div className="spec-panel">
                <div className="spec-panel-header">
                  <Gamepad2 size={24} className="text-primary" />
                  <h3>Gaming Peripherals</h3>
                </div>
                <div className="spec-table">
                  <div className="spec-row">
                    <span className="spec-label">Mouse</span>
                    <span className="spec-value text-primary">Razer Basilisk V3 <span className="spec-sub">(Hyperscroll)</span></span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Keyboard</span>
                    <span className="spec-value text-warning">Custom Qwerty <span className="spec-sub">(Mechanical)</span></span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Headset</span>
                    <span className="spec-value text-danger">Logitech PRO X <span className="spec-sub">(Blue Vo!ce)</span></span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Displays</span>
                    <span className="spec-value">LG FHD + QG240Y S3 <span className="spec-sub">(Dual Setup)</span></span>
                  </div>
                </div>
              </div>

            </motion.div>
          </div>
        </section>

        {/* 5. GAMING LIBRARY (DYNAMIC) */}
        <motion.section 
          className="story-section"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={sectionVariants}
        >
          <div className="section-container">
            <motion.h2 className="section-heading" variants={itemVariants}>
              <Gamepad2 size={36} className="heading-icon-svg text-danger" /> Gaming Library
            </motion.h2>
            
            <p className="section-description">Aici poți adăuga manual orice joc în cod, iar aplicația preia automat imaginea copertei de pe internet.</p>

            <motion.div className="game-covers-grid" variants={itemVariants}>
              {playedGames.map((game, index) => (
                <div className="game-cover-card" key={index}>
                  <img src={getGameCover(game)} alt={game} className="game-cover-img" />
                  <div className="game-cover-overlay">
                    <span className="game-name">{game}</span>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* 6. SOCIALS & VIBE CHECK */}
        <motion.section 
          id="socials"
          className="story-section pb-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={sectionVariants}
        >
          <div className="section-container">
            <motion.h2 className="section-heading" variants={itemVariants}>
              <Layers size={36} className="heading-icon-svg text-primary" /> Vibe & Conectare
            </motion.h2>

            <div className="vibe-split">
              {/* Spotify Box */}
              <motion.div className="story-card spotify-box" variants={itemVariants}>
                <iframe 
                  style={{ borderRadius: '16px', border: 'none' }} 
                  src="https://open.spotify.com/embed/playlist/6gkgc2xiT9xmD14DJGrllv?utm_source=generator&theme=0" 
                  width="100%" 
                  height="352" 
                  allowFullScreen="" 
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                  loading="lazy">
                </iframe>
              </motion.div>

              {/* Social Media Links Block */}
              <motion.div className="social-block" variants={itemVariants}>
                <div className="social-block-header">
                  <h3>Găsește-mă online</h3>
                  <p>Lasă-mi un mesaj, hai pe server sau urmărește codul pe GitHub.</p>
                </div>
                
                <div className="big-social-links">
                  <a href="https://github.com/iannC69" target="_blank" rel="noreferrer" className="big-social-btn git">
                    <GitBranch size={28} />
                    <div className="social-text">
                      <span className="platform">GitHub</span>
                      <span className="handle">@iannC69</span>
                    </div>
                  </a>

                  <a href="https://steamcommunity.com/id/1iannc/" target="_blank" rel="noreferrer" className="big-social-btn steam">
                    <Gamepad2 size={28} />
                    <div className="social-text">
                      <span className="platform">Steam</span>
                      <span className="handle">1iannc</span>
                    </div>
                  </a>

                  <a href="https://instagram.com/iannc_oficial" target="_blank" rel="noreferrer" className="big-social-btn insta">
                    <Camera size={28} />
                    <div className="social-text">
                      <span className="platform">Instagram</span>
                      <span className="handle">@iannc_oficial</span>
                    </div>
                  </a>
                  
                  <a href="https://youtube.com/@iannc" target="_blank" rel="noreferrer" className="big-social-btn youtube">
                    <Video size={28} />
                    <div className="social-text">
                      <span className="platform">YouTube</span>
                      <span className="handle">@iannc</span>
                    </div>
                  </a>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* ULTRA PREMIUM FOOTER */}
        <footer className="ultra-footer">
          <div className="footer-container">
            {/* Brand Section */}
            <div className="footer-brand">
              <h2 className="footer-logo">IANNC<span className="text-primary">.RO</span></h2>
              <p className="footer-bio">Dezvoltator Web & Community Manager. Construind ecosisteme digitale performante cu pasiune și cafea.</p>
              <div className="footer-status">
                <div className="status-dot"></div>
                <span>Toate Sistemele Operaționale</span>
              </div>
            </div>

            {/* Quick Links */}
            <div className="footer-links-group">
              <div className="footer-column">
                <h4>Navigație</h4>
                <a href="#" className="footer-link" onClick={(e) => { e.preventDefault(); window.scrollTo({top: 0, behavior: 'smooth'}); }}>Acasă</a>
                <a href="#proiecte" className="footer-link">Proiecte</a>
                <a href="#socials" className="footer-link">Contact</a>
              </div>
              
              <div className="footer-column">
                <h4>Ecosistem</h4>
                <Link to="/tools/update-maker" className="footer-link">Update Maker</Link>
                <Link to="/tools/todo-maker" className="footer-link">To-Do Maker</Link>
                <a href="https://inclounge.top" target="_blank" rel="noreferrer" className="footer-link">IncLounge</a>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} IANNC.RO. Toate drepturile rezervate.</p>
            <div className="footer-social-mini">
              <a href="https://github.com/iannC69" target="_blank" rel="noreferrer" title="GitHub"><GitBranch size={20}/></a>
              <a href="https://steamcommunity.com/id/1iannc/" target="_blank" rel="noreferrer" title="Steam"><Gamepad2 size={20}/></a>
              <a href="https://instagram.com/iannc_oficial" target="_blank" rel="noreferrer" title="Instagram"><Camera size={20}/></a>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}

export default Home;
