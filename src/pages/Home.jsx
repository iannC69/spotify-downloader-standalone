import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Gamepad2, GitBranch, Camera, Video,
  ArrowRight, BadgeCheck, Server,
  Cpu, ChevronDown, Layers, Mail, Code, Bot, Globe, ExternalLink, LayoutList,
  MonitorPlay, MemoryStick, CircuitBoard, Mouse, Keyboard, Headphones, Monitor, Scissors
} from 'lucide-react';
import Tilt from 'react-parallax-tilt';
import Navbar from '../components/Navbar';
import LiveStatus from '../components/LiveStatus';
import SpotifyProfile from '../components/SpotifyProfile';
import myGames from '../data/myGames.json';
import './Home.css';


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
                Salut, sunt <span className="text-gradient">IANNC</span> <BadgeCheck size={42} className="verified-badge" />
              </motion.h1>
              <motion.p className="hero-subtitle-left" variants={itemVariants}>
                Dezvoltator web full-stack și Community Manager.
                Aduc proiecte la viață prin cod curat, design premium și o conexiune reală cu audiența.
              </motion.p>

              <motion.div className="hero-action-buttons" variants={itemVariants}>
                <a href="#proiecte" className="btn btn-primary">Vezi Proiectele <ArrowRight size={18} /></a>
                <a href="#socials" className="btn btn-secondary">Contact <Mail size={18} /></a>
              </motion.div>
            </motion.div>

            {/* Right: Glass Bento Hero Card */}
            <motion.div
              className="hero-image-side"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            >
              <Tilt className="hero-glass-bento" tiltMaxAngleX={3} tiltMaxAngleY={3} glareEnable={true} glareMaxOpacity={0.1}>
                {/* Floating mini badges */}
                <motion.div className="floating-badge badge-react" animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
                  <Code size={20} />
                </motion.div>
                <motion.div className="floating-badge badge-bot" animate={{ y: [0, 15, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
                  <Bot size={24} />
                </motion.div>

                <div className="glass-bento-inner">
                  <div className="glass-bento-glow"></div>

                  <div className="bento-avatar-container">
                    <img
                      src="https://github.com/iannC69.png"
                      alt="IANNC Avatar"
                      className="bento-avatar-img"
                      onError={(e) => { e.target.src = 'https://cdn.akamai.steamstatic.com/steamcommunity/public/images/avatars/fe/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'; }}
                    />
                    <div className="bento-status-ring"></div>
                  </div>

                  <div className="bento-stats-container">
                    <div className="bento-stat-item">
                      <span className="stat-value">03</span>
                      <span className="stat-label">Live Apps</span>
                    </div>
                    <div className="bento-stat-item">
                      <span className="stat-value">99%</span>
                      <span className="stat-label">Uptime</span>
                    </div>
                  </div>

                </div>
              </Tilt>
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
            <motion.div className="projects-section-header" variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <div className="projects-heading-copy">
                <span className="projects-kicker">Projects / Tools</span>
                <h2 className="section-heading projects-heading">
                  <Code size={32} className="heading-icon-svg text-warning" /> Cod & Creații
                </h2>
                <p className="section-description compact-projects-copy">
                  Aplicații live, făcute pentru comunitate și workflow real: update-uri Discord, task management și platforme web active.
                </p>
              </div>

              <div className="projects-overview" aria-label="Rezumat proiecte">
                <div>
                  <strong>03</strong>
                  <span>Live</span>
                </div>
                <div>
                  <strong>04</strong>
                  <span>Tools</span>
                </div>
                <div>
                  <strong>01</strong>
                  <span>Website</span>
                </div>
              </div>
            </motion.div>

            <div className="projects-grid bento-projects">
              {/* Featured Project: Update Maker */}
              <Tilt className="tilt-wrapper" tiltMaxAngleX={4} tiltMaxAngleY={4} glareEnable={true} glareMaxOpacity={0.1} scale={1.02} transitionSpeed={1500}>
                <motion.div className="story-card project-card compact-project-card featured-project" variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <div className="project-card-top">
                    <span className="project-tag">LIVE APP</span>
                    <span className="project-status-pill">Online</span>
                  </div>
                  <div className="project-header">
                    <div className="project-icon-box primary">
                      <Bot size={24} />
                    </div>
                    <div>
                      <h4>Update Maker</h4>
                      <span>Discord patch notes</span>
                    </div>
                  </div>
                  <p>Generator de update-uri pentru Discord, cu template-uri, preview si export imagine.</p>
                  <div className="project-feature-row">
                    <span>Templates</span>
                    <span>Preview</span>
                    <span>Export PNG</span>
                  </div>
                  <Link to="/tools/update-maker" className="project-action-link">
                    Deschide <ArrowRight size={16} />
                  </Link>
                </motion.div>
              </Tilt>

              {/* Project: IncLounge.top */}
              <Tilt className="tilt-wrapper" tiltMaxAngleX={4} tiltMaxAngleY={4} glareEnable={true} glareMaxOpacity={0.1} scale={1.02} transitionSpeed={1500}>
                <motion.div className="story-card project-card compact-project-card" variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <div className="project-card-top">
                    <span className="project-tag purple">WEBSITE</span>
                    <span className="project-status-pill">Live</span>
                  </div>
                  <div className="project-header">
                    <div className="project-icon-box purple">
                      <Globe size={24} />
                    </div>
                    <div>
                      <h4>IncLounge.top</h4>
                      <span>Community hub</span>
                    </div>
                  </div>
                  <p>Platforma principala pentru comunitate, cu identitate proprie si acces rapid.</p>
                  <div className="project-feature-row">
                    <span>Website</span>
                    <span>Community</span>
                    <span>Brand</span>
                  </div>
                  <a href="https://inclounge.top" target="_blank" rel="noreferrer" className="project-action-link purple">
                    Viziteaza <ExternalLink size={16} />
                  </a>
                </motion.div>
              </Tilt>

              {/* Project: Todo Maker */}
              <Tilt className="tilt-wrapper" tiltMaxAngleX={4} tiltMaxAngleY={4} glareEnable={true} glareMaxOpacity={0.1} scale={1.02} transitionSpeed={1500}>
                <motion.div className="story-card project-card compact-project-card incoming-project" variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <Link to="/tools/todo-maker" className="todo-project-card-link" aria-label="Deschide To-Do List Maker">
                    <div className="project-card-top">
                      <span className="project-tag warning">LIVE TOOL</span>
                      <span className="project-status-pill">New</span>
                    </div>
                    <div className="project-header">
                      <div className="project-icon-box warning">
                        <LayoutList size={24} />
                      </div>
                      <div>
                        <h4>To-Do List Maker</h4>
                        <span>Jira-style board</span>
                      </div>
                    </div>
                    <p>Task management avansat cu sprinturi, epicuri, prioritati si roadmap.</p>
                    <div className="project-feature-row">
                      <span>Kanban</span>
                      <span>Backlog</span>
                      <span>Roadmap</span>
                    </div>
                    <span className="project-action-link warning">
                      Deschide <ArrowRight size={16} />
                    </span>
                  </Link>
                </motion.div>
              </Tilt>
              {/* Project: Youtube Downloader */}
              <Tilt className="tilt-wrapper" tiltMaxAngleX={4} tiltMaxAngleY={4} glareEnable={true} glareMaxOpacity={0.1} scale={1.02} transitionSpeed={1500}>
                <motion.div className="story-card project-card compact-project-card incoming-project" variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <Link to="/downloader" className="todo-project-card-link" aria-label="Deschide YouTube Downloader">
                    <div className="project-card-top">
                      <span className="project-tag danger">NEXT LEVEL TOOL</span>
                      <span className="project-status-pill">Live</span>
                    </div>
                    <div className="project-header">
                      <div className="project-icon-box danger">
                        <Video size={24} />
                      </div>
                      <div>
                        <h4>YouTube Downloader</h4>
                        <span>yt-dlp & ffmpeg engine</span>
                      </div>
                    </div>
                    <p>Extractor ultra rapid de video (4K MP4) și audio (320kbps MP3) din link-uri YouTube.</p>
                    <div className="project-feature-row">
                      <span>4K MP4</span>
                      <span>320kbps MP3</span>
                      <span>SSE Progress</span>
                    </div>
                    <span className="project-action-link danger">
                      Deschide <ArrowRight size={16} />
                    </span>
                  </Link>
                </motion.div>
              </Tilt>
              {/* Project: Mp3 Cutter */}
              <Tilt className="tilt-wrapper" tiltMaxAngleX={4} tiltMaxAngleY={4} glareEnable={true} glareMaxOpacity={0.1} scale={1.02} transitionSpeed={1500}>
                <motion.div className="story-card project-card compact-project-card incoming-project" variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <Link to="/cutter" className="todo-project-card-link" aria-label="Deschide MP3 Editor Cutter">
                    <div className="project-card-top">
                      <span className="project-tag cyan">AUDIO TOOL</span>
                      <span className="project-status-pill">New</span>
                    </div>
                    <div className="project-header">
                      <div className="project-icon-box cyan">
                        <Scissors size={24} />
                      </div>
                      <div>
                        <h4>MP3 Editor Cutter</h4>
                        <span>Decupează perfect</span>
                      </div>
                    </div>
                    <p>Taie și descarcă porțiunea exactă (HH:MM:SS) dorită dintr-o melodie de pe YouTube.</p>
                    <div className="project-feature-row">
                      <span>YouTube to MP3</span>
                      <span>Cut Interval</span>
                      <span>Fast</span>
                    </div>
                    <span className="project-action-link cyan">
                      Deschide <ArrowRight size={16} />
                    </span>
                  </Link>
                </motion.div>
              </Tilt>
              {/* Project: Spotify Downloader */}
              <Tilt className="tilt-wrapper" tiltMaxAngleX={4} tiltMaxAngleY={4} glareEnable={true} glareMaxOpacity={0.1} scale={1.02} transitionSpeed={1500}>
                <motion.div className="story-card project-card compact-project-card incoming-project" variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <Link to="/spotify" className="todo-project-card-link" aria-label="Deschide Spotify Downloader">
                    <div className="project-card-top">
                      <span className="project-tag spotify">MUSIC TOOL</span>
                      <span className="project-status-pill">New</span>
                    </div>
                    <div className="project-header">
                      <div className="project-icon-box spotify">
                        <Headphones size={24} />
                      </div>
                      <div>
                        <h4>Spotify Downloader</h4>
                        <span>Original metadata</span>
                      </div>
                    </div>
                    <p>Descarcă piese individuale de pe Spotify direct în MP3 cu toate tag-urile ID3 incluse.</p>
                    <div className="project-feature-row">
                      <span>Cover Art</span>
                      <span>320kbps</span>
                      <span>yt-dlp</span>
                    </div>
                    <span className="project-action-link spotify">
                      Deschide <ArrowRight size={16} />
                    </span>
                  </Link>
                </motion.div>
              </Tilt>
            </div>
          </div>
        </section>



        {/* 4. SPECS & SETUP (HARDWARE BENTO) */}
        <section className="story-section" ref={gearRef}>
          <div className="section-container" style={{ maxWidth: '1200px' }}>
            <motion.h2 className="section-heading" variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <Server size={36} className="heading-icon-svg text-primary" /> Arsenal & System Specs
            </motion.h2>

            <motion.div className="hardware-bento" variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>

              {/* GPU: Biggest Card */}
              <div className="hw-card gpu-card">
                <div className="hw-glow-red"></div>
                <div className="hw-icon-bg"><MonitorPlay size={120} /></div>
                <div className="hw-content">
                  <span className="hw-label">Graphics Processing</span>
                  <h3>Radeon RX 6750 XT</h3>
                  <p>12GB GDDR6 VRAM • AMD RDNA 2</p>
                </div>
              </div>

              {/* CPU: Wide Card */}
              <div className="hw-card cpu-card">
                <div className="hw-glow-orange"></div>
                <div className="hw-icon-bg"><Cpu size={80} /></div>
                <div className="hw-content">
                  <span className="hw-label">Central Processing</span>
                  <h3>AMD Ryzen 5 7600X</h3>
                  <p>6-Core, 12-Thread • 5.03GHz</p>
                </div>
              </div>

              {/* RAM */}
              <div className="hw-card ram-card">
                <div className="hw-icon"><MemoryStick size={28} /></div>
                <div className="hw-content">
                  <span className="hw-label">Memory</span>
                  <h4>32GB DDR5</h4>
                  <p>4800 MHz</p>
                </div>
              </div>

              {/* Motherboard */}
              <div className="hw-card mobo-card">
                <div className="hw-icon"><CircuitBoard size={28} /></div>
                <div className="hw-content">
                  <span className="hw-label">Motherboard</span>
                  <h4>MSI PRO B650-S</h4>
                  <p>WIFI AM5</p>
                </div>
              </div>

              {/* Peripherals Row */}
              <div className="hw-card peripheral-card">
                <Mouse size={28} className="text-primary" />
                <div className="periph-details">
                  <span className="periph-label">Mouse</span>
                  <h4>Razer Basilisk V3</h4>
                </div>
              </div>

              <div className="hw-card peripheral-card">
                <Keyboard size={28} className="text-warning" />
                <div className="periph-details">
                  <span className="periph-label">Keyboard</span>
                  <h4>Custom Qwerty</h4>
                </div>
              </div>

              <div className="hw-card peripheral-card">
                <Headphones size={28} className="text-danger" />
                <div className="periph-details">
                  <span className="periph-label">Audio</span>
                  <h4>Logitech PRO X</h4>
                </div>
              </div>

              <div className="hw-card peripheral-card">
                <Monitor size={28} className="text-success" />
                <div className="periph-details">
                  <span className="periph-label">Displays</span>
                  <h4>LG FHD + QG240Y S3</h4>
                </div>
              </div>

            </motion.div>
          </div>
        </section>

        {/* 5. GAMING LIBRARY (INTERACTIVE ACCORDION) */}
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

            <p className="section-description">O colecție interactivă cu jocurile principale. Fă hover pe un card pentru a explora experiența vizuală.</p>

            <motion.div className="games-accordion-container" variants={itemVariants}>
              {myGames.map((game, index) => (
                <Tilt
                  key={game.id || index}
                  className="game-accordion-item"
                  tiltMaxAngleX={5}
                  tiltMaxAngleY={5}
                  glareEnable={false}
                  glareMaxOpacity={0}
                  transitionSpeed={2000}
                  scale={1}
                >
                  <div className="game-accordion-inner">
                    <img src={game.imageUrl} alt={game.name} className="game-accordion-img" />
                    <div className="game-accordion-content">
                      <div className="game-accordion-header">
                        <span className="game-status-dot"></span>
                        <span className="game-name-vertical">{game.name}</span>
                      </div>
                      <div className="game-accordion-details">
                        <h3>{game.name}</h3>
                        <p style={{ color: '#D2FF00', fontSize: '14px', margin: '5px 0 10px 0', fontWeight: 'bold' }}>{game.playtimeHours} ore jucate</p>
                        <button className="btn-play-game">
                          <Gamepad2 size={16} /> Explore
                        </button>
                      </div>
                    </div>
                  </div>
                </Tilt>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* 6. SOCIALS & VIBE CHECK (MUSIC HUB & ASYMMETRIC SOCIALS) */}
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

            <div className="vibe-and-socials-container">
              {/* Nivelul 1: Spotify Web Profile */}
              <motion.div variants={itemVariants}>
                <SpotifyProfile />
              </motion.div>

              {/* Linie despartitoare fina */}
              <div className="section-divider"></div>

              {/* Nivelul 2: Social Media Zone */}
              <div className="socials-zone-title">
                <h3>Conectează-te cu mine</h3>
                <p>Urmărește activitatea mea pe rețelele sociale și platformele de gaming.</p>
              </div>
              <motion.div className="socials-horizontal-grid" variants={itemVariants}>
                <a href="https://github.com/iannC69" target="_blank" rel="noreferrer" className="social-bento-card github-card">
                  <GitBranch size={120} className="social-bg-icon" />
                  <div className="social-bento-content">
                    <GitBranch size={28} className="social-icon-top" />
                    <div className="social-text-bottom">
                      <span className="platform">GitHub</span>
                      <span className="handle">@iannC69</span>
                    </div>
                  </div>
                </a>

                <a href="https://steamcommunity.com/id/1iannc/" target="_blank" rel="noreferrer" className="social-bento-card steam-card">
                  <Gamepad2 size={120} className="social-bg-icon" />
                  <div className="social-bento-content">
                    <Gamepad2 size={28} className="social-icon-top" />
                    <div className="social-text-bottom">
                      <span className="platform">Steam</span>
                      <span className="handle">1iannc</span>
                    </div>
                  </div>
                </a>

                <a href="https://instagram.com/iannc_oficial" target="_blank" rel="noreferrer" className="social-bento-card insta-card">
                  <Camera size={120} className="social-bg-icon" />
                  <div className="social-bento-content">
                    <Camera size={28} className="social-icon-top" />
                    <div className="social-text-bottom">
                      <span className="platform">Instagram</span>
                      <span className="handle">@iannc_oficial</span>
                    </div>
                  </div>
                </a>

                <a href="https://youtube.com/@iannc" target="_blank" rel="noreferrer" className="social-bento-card youtube-card">
                  <Video size={120} className="social-bg-icon" />
                  <div className="social-bento-content">
                    <Video size={28} className="social-icon-top" />
                    <div className="social-text-bottom">
                      <span className="platform">YouTube</span>
                      <span className="handle">@iannc</span>
                    </div>
                  </div>
                </a>
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
                <a href="#" className="footer-link" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Acasă</a>
                <a href="#proiecte" className="footer-link">Proiecte</a>
                <a href="#socials" className="footer-link">Contact</a>
              </div>

              <div className="footer-column">
                <h4>Ecosistem</h4>
                <Link to="/tools/update-maker" className="footer-link">Update Maker</Link>
                <Link to="/tools/todo-maker" className="footer-link">To-Do Maker</Link>
                <Link to="/downloader" className="footer-link text-danger">YouTube Downloader</Link>
                <Link to="/cutter" className="footer-link" style={{color: '#a855f7'}}>MP3 Cutter</Link>
                <Link to="/spotify" className="footer-link" style={{color: '#1DB954'}}>Spotify Downloader</Link>
                <a href="https://inclounge.top" target="_blank" rel="noreferrer" className="footer-link">IncLounge</a>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} IANNC.RO. Toate drepturile rezervate.</p>
            <div className="footer-social-mini">
              <a href="https://github.com/iannC69" target="_blank" rel="noreferrer" title="GitHub"><GitBranch size={20} /></a>
              <a href="https://steamcommunity.com/id/1iannc/" target="_blank" rel="noreferrer" title="Steam"><Gamepad2 size={20} /></a>
              <a href="https://instagram.com/iannc_oficial" target="_blank" rel="noreferrer" title="Instagram"><Camera size={20} /></a>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}

export default Home;
