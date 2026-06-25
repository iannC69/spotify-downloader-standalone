import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Gamepad2, GitBranch, Camera, Video,
  ArrowRight, BadgeCheck, Server,
  Cpu, ChevronDown, Layers, Mail, Code, Bot, Globe, ExternalLink, LayoutList,
  MonitorPlay, MemoryStick, CircuitBoard, Mouse, Keyboard, Headphones, Monitor, Scissors, Brain, Armchair,
  Link2, MessageSquare, QrCode, Sparkles, Flame
} from 'lucide-react';
import Tilt from 'react-parallax-tilt';
import { doc, getDoc } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import LiveStatus from '../components/LiveStatus';
import SpotifyProfile from '../components/SpotifyProfile';
import ContactAndReviews from '../components/ContactAndReviews';
import myGames from '../data/myGames.json';
import { db } from '../firebase';
import './Home.css';


function Home() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const [siteConfig, setSiteConfig] = useState(null);
  // Reference for intersection/animation
  const gearRef = useRef(null);
  const publicTools = siteConfig?.tools?.filter((tool) => tool.public) || [];
  const liveTools = publicTools.filter((tool) => tool.status === 'online');
  const ownerName = siteConfig?.brand?.owner || 'IANNC';
  const heroSubtitle = siteConfig?.brand?.heroSubtitle || 'Creator de prezentari si Community Manager. Transform ideile in prezentari de impact, design premium si experiente vizuale captivante.';
  const announcement = siteConfig?.site?.announcementEnabled ? siteConfig?.site?.announcement : '';

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

  useEffect(() => {
    let mounted = true;

    const loadSiteConfig = async () => {
      try {
        const snapshot = await getDoc(doc(db, 'siteData', 'general'));
        if (mounted && snapshot.exists()) {
          setSiteConfig(snapshot.data());
        }
      } catch (error) {
        console.warn('Could not load public site config:', error);
      }
    };

    loadSiteConfig();

    return () => {
      mounted = false;
    };
  }, []);

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
                Salut, sunt <span className="text-gradient">{ownerName}</span> <BadgeCheck size={42} className="verified-badge" />
              </motion.h1>
              <motion.p className="hero-subtitle-left" variants={itemVariants}>
                {heroSubtitle}
              </motion.p>

              <motion.div className="hero-action-buttons" variants={itemVariants}>
                <a href="#proiecte" className="btn btn-primary">Vezi Proiectele <ArrowRight size={18} /></a>
                <a href="#contact" className="btn btn-secondary">Contact <Mail size={18} /></a>
              </motion.div>
              {announcement && (
                <motion.div className="global-announcement" variants={itemVariants}>
                  <Sparkles size={18} />
                  <span>{announcement}</span>
                </motion.div>
              )}
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
                  <strong>{liveTools.length || '09'}</strong>
                  <span>Live</span>
                </div>
                <div>
                  <strong>{publicTools.length || '09'}</strong>
                  <span>Tools</span>
                </div>
                <div>
                  <strong>{siteConfig?.site?.version || 'v2'}</strong>
                  <span>{siteConfig?.site?.status || 'Online'}</span>
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

              {/* Project: Pomodoro */}
              <Tilt className="tilt-wrapper" tiltMaxAngleX={4} tiltMaxAngleY={4} glareEnable={true} glareMaxOpacity={0.1} scale={1.02} transitionSpeed={1500}>
                <motion.div className="story-card project-card compact-project-card incoming-project" variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <Link to="/pomodoro" className="todo-project-card-link" aria-label="Deschide Pomodoro Focus">
                    <div className="project-card-top">
                      <span className="project-tag" style={{ color: '#d8b4fe', background: 'rgba(168, 85, 247, 0.18)' }}>FOCUS TOOL</span>
                      <span className="project-status-pill">New</span>
                    </div>
                    <div className="project-header">
                      <div className="project-icon-box" style={{ color: '#fff', background: '#a855f7', boxShadow: '0 10px 25px rgba(168, 85, 247, 0.2)' }}>
                        <Brain size={24} />
                      </div>
                      <div>
                        <h4>Lofi Pomodoro</h4>
                        <span>Deep work sessions</span>
                      </div>
                    </div>
                    <p>Timer focus avansat cu 3 moduri și live Lofi Radio integrat direct pentru studiu și muncă.</p>
                    <div className="project-feature-row">
                      <span>25/5 Timer</span>
                      <span>Lofi Radio</span>
                      <span>Aesthetic</span>
                    </div>
                    <span className="project-action-link" style={{ color: '#fff', background: '#a855f7' }}>
                      Deschide <ArrowRight size={16} />
                    </span>
                  </Link>
                </motion.div>
              </Tilt>

              {/* Project: Link Hub Builder */}
              <Tilt className="tilt-wrapper" tiltMaxAngleX={4} tiltMaxAngleY={4} glareEnable={true} glareMaxOpacity={0.1} scale={1.02} transitionSpeed={1500}>
                <motion.div className="story-card project-card compact-project-card incoming-project" variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <Link to="/link-hub" className="todo-project-card-link" aria-label="Deschide Link Hub Builder">
                    <div className="project-card-top">
                      <span className="project-tag cyan">SOCIAL TOOL</span>
                      <span className="project-status-pill">New</span>
                    </div>
                    <div className="project-header">
                      <div className="project-icon-box cyan">
                        <Link2 size={24} />
                      </div>
                      <div>
                        <h4>Link Hub Builder</h4>
                        <span>Linktree-style pages</span>
                      </div>
                    </div>
                    <p>Creeaza rapid un hub cu Discord, YouTube, Steam, proiecte si social links.</p>
                    <div className="project-feature-row">
                      <span>Live Preview</span>
                      <span>Export JSON</span>
                      <span>Branding</span>
                    </div>
                    <span className="project-action-link cyan">
                      Deschide <ArrowRight size={16} />
                    </span>
                  </Link>
                </motion.div>
              </Tilt>

              {/* Project: Discord Embed Builder */}
              <Tilt className="tilt-wrapper" tiltMaxAngleX={4} tiltMaxAngleY={4} glareEnable={true} glareMaxOpacity={0.1} scale={1.02} transitionSpeed={1500}>
                <motion.div className="story-card project-card compact-project-card incoming-project" variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <Link to="/discord-embed" className="todo-project-card-link" aria-label="Deschide Discord Embed Builder">
                    <div className="project-card-top">
                      <span className="project-tag purple">DISCORD TOOL</span>
                      <span className="project-status-pill">New</span>
                    </div>
                    <div className="project-header">
                      <div className="project-icon-box purple">
                        <MessageSquare size={24} />
                      </div>
                      <div>
                        <h4>Discord Embed Builder</h4>
                        <span>Visual JSON builder</span>
                      </div>
                    </div>
                    <p>Construieste embed-uri cu fields, buttons, culori, preview si export JSON.</p>
                    <div className="project-feature-row">
                      <span>Preview</span>
                      <span>Buttons</span>
                      <span>JSON</span>
                    </div>
                    <span className="project-action-link purple">
                      Deschide <ArrowRight size={16} />
                    </span>
                  </Link>
                </motion.div>
              </Tilt>

              {/* Project: QR Code Studio */}
              <Tilt className="tilt-wrapper" tiltMaxAngleX={4} tiltMaxAngleY={4} glareEnable={true} glareMaxOpacity={0.1} scale={1.02} transitionSpeed={1500}>
                <motion.div className="story-card project-card compact-project-card incoming-project" variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <Link to="/qr-studio" className="todo-project-card-link" aria-label="Deschide QR Code Studio">
                    <div className="project-card-top">
                      <span className="project-tag warning">UTILITY TOOL</span>
                      <span className="project-status-pill">New</span>
                    </div>
                    <div className="project-header">
                      <div className="project-icon-box warning">
                        <QrCode size={24} />
                      </div>
                      <div>
                        <h4>QR Code Studio</h4>
                        <span>Custom QR generator</span>
                      </div>
                    </div>
                    <p>Genereaza QR pentru URL, Discord, Spotify, Wi-Fi, contact card si text custom.</p>
                    <div className="project-feature-row">
                      <span>Wi-Fi</span>
                      <span>vCard</span>
                      <span>PNG</span>
                    </div>
                    <span className="project-action-link warning">
                      Deschide <ArrowRight size={16} />
                    </span>
                  </Link>
                </motion.div>
              </Tilt>

              {/* Project: Wildfire Overlay */}
              <Tilt className="tilt-wrapper" tiltMaxAngleX={4} tiltMaxAngleY={4} glareEnable={true} glareMaxOpacity={0.1} scale={1.02} transitionSpeed={1500}>
                <motion.div className="story-card project-card compact-project-card incoming-project" variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <Link to="/wildfire-overlay" className="todo-project-card-link" aria-label="Deschide Wildfire Overlay">
                    <div className="project-card-top">
                      <span className="project-tag wildfire">STREAM TOOL</span>
                      <span className="project-status-pill">Live</span>
                    </div>
                    <div className="project-header">
                      <div className="project-icon-box wildfire">
                        <Flame size={24} />
                      </div>
                      <div>
                        <h4>Wildfire Overlay</h4>
                        <span>CS2 stream HUD</span>
                      </div>
                    </div>
                    <p>Overlay pentru TikTok/OBS cu server status CS2, player count, map si link configurabil pentru Browser Source.</p>
                    <div className="project-feature-row">
                      <span>OBS URL</span>
                      <span>GameDig</span>
                      <span>Live HUD</span>
                    </div>
                    <span className="project-action-link wildfire">
                      Deschide <ArrowRight size={16} />
                    </span>
                  </Link>
                </motion.div>
              </Tilt>
            </div>
          </div>
        </section>

        {/* CONTACT & REVIEWS SECTION */}
        <ContactAndReviews />



        {/* 4. SPECS & SETUP (HARDWARE BENTO) */}
        <section className="story-section hardware-showcase-section" ref={gearRef}>
          <div className="section-container" style={{ maxWidth: '1200px' }}>
            <motion.h2 className="section-heading" variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <Server size={36} className="heading-icon-svg text-primary" /> Arsenal & System Specs
            </motion.h2>

            <motion.div className="hardware-command-deck" variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <Tilt className="hardware-visual-card" tiltMaxAngleX={5} tiltMaxAngleY={7} glareEnable={false} scale={1.01} transitionSpeed={1800}>
                <div className="hardware-photo-backdrop" aria-hidden="true">
                  <img src="/assets/setup_bg.png" alt="" />
                </div>
                <div className="hardware-scene" aria-hidden="true">
                  <div className="setup-turntable">
                    <div className="monitor-rig">
                      <div className="monitor-screen primary-screen">
                        <div className="screen-topbar"></div>
                        <div className="screen-graph"></div>
                      </div>
                      <div className="monitor-screen side-screen">
                        <div className="screen-topbar"></div>
                        <div className="screen-lines"></div>
                      </div>
                    </div>
                    <div className="pc-tower-model">
                      <div className="tower-slot"></div>
                      <div className="tower-window">
                        <Cpu size={30} />
                      </div>
                      <div className="tower-vents"></div>
                    </div>
                    <div className="desk-plane">
                      <div className="keyboard-model"></div>
                      <div className="mouse-model"></div>
                      <div className="controller-model">
                        <Gamepad2 size={32} />
                      </div>
                      <div className="headset-model">
                        <Headphones size={34} />
                      </div>
                    </div>
                    <div className="chair-model">
                      <Armchair size={42} />
                    </div>
                  </div>

                  <div className="floating-hw-chip chip-gpu">
                    <MonitorPlay size={16} />
                    RX 6750 XT
                  </div>
                  <div className="floating-hw-chip chip-cpu">
                    <Cpu size={16} />
                    Ryzen 5
                  </div>
                </div>

                <div className="hardware-visual-copy">
                  <h3>Gaming, code si community work intr-un singur setup.</h3>
                  <p>Dual displays, periferice rapide si un build AMD facut pentru workflow, gaming si prezentari vizuale.</p>
                </div>
              </Tilt>

              <div className="hardware-info-stack">
                <div className="hardware-core-grid">
                  <div className="hardware-spec-tile highlight">
                    <MonitorPlay size={22} />
                    <span>Graphics</span>
                    <strong>Radeon RX 6750 XT</strong>
                    <small>12GB GDDR6 VRAM / AMD RDNA 2</small>
                  </div>
                  <div className="hardware-spec-tile">
                    <Cpu size={22} />
                    <span>Processor</span>
                    <strong>AMD Ryzen 5 7600X</strong>
                    <small>6-Core, 12-Thread / 5.03GHz</small>
                  </div>
                  <div className="hardware-spec-tile">
                    <MemoryStick size={22} />
                    <span>Memory</span>
                    <strong>32GB DDR5</strong>
                    <small>4800 MHz</small>
                  </div>
                  <div className="hardware-spec-tile">
                    <CircuitBoard size={22} />
                    <span>Motherboard</span>
                    <strong>MSI PRO B650-S</strong>
                    <small>WIFI AM5</small>
                  </div>
                </div>

                <div className="peripheral-showcase">
                  <div className="peripheral-showcase-header">
                    <Gamepad2 size={18} />
                    <span>Peripherals</span>
                  </div>
                  <div className="peripheral-device-grid">
                    <div className="device-pill">
                      <Mouse size={18} />
                      <div>
                        <span>Mouse</span>
                        <strong>Razer Basilisk V3</strong>
                      </div>
                    </div>
                    <div className="device-pill">
                      <Keyboard size={18} />
                      <div>
                        <span>Keyboard</span>
                        <strong>Custom Qwerty</strong>
                      </div>
                    </div>
                    <div className="device-pill">
                      <Headphones size={18} />
                      <div>
                        <span>Audio</span>
                        <strong>Logitech PRO X</strong>
                      </div>
                    </div>
                    <div className="device-pill">
                      <Monitor size={18} />
                      <div>
                        <span>Displays</span>
                        <strong>LG FHD + QG240Y S3</strong>
                      </div>
                    </div>
                    <div className="device-pill">
                      <Gamepad2 size={18} />
                      <div>
                        <span>Controller</span>
                        <strong>Wireless Controller</strong>
                      </div>
                    </div>
                    <div className="device-pill">
                      <Armchair size={18} />
                      <div>
                        <span>Chair</span>
                        <strong>Ergonomic Gaming Chair</strong>
                      </div>
                    </div>
                    <div className="device-pill">
                      <Camera size={18} />
                      <div>
                        <span>Photo Slots</span>
                        <strong>Setup / Chair / Controller</strong>
                      </div>
                    </div>
                    <div className="device-pill">
                      <Layers size={18} />
                      <div>
                        <span>Desk Layer</span>
                        <strong>Extended mat + cable zone</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div className="hardware-bento" variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              {/* GPU: Biggest Card */}
              <Tilt className="hw-card gpu-card" tiltMaxAngleX={3} tiltMaxAngleY={3} glareEnable={false} scale={1.008} transitionSpeed={1800}>
                <div className="hw-card-surface"></div>
                <div className="hw-icon-bg"><MonitorPlay size={120} /></div>
                <div className="hw-content">
                  <span className="hw-label">Graphics Processing</span>
                  <h3>Radeon RX 6750 XT</h3>
                  <p>12GB GDDR6 VRAM • AMD RDNA 2</p>
                </div>
              </Tilt>

              {/* CPU: Wide Card */}
              <Tilt className="hw-card cpu-card" tiltMaxAngleX={3} tiltMaxAngleY={3} glareEnable={false} scale={1.006} transitionSpeed={1800}>
                <div className="hw-card-surface"></div>
                <div className="hw-icon-bg"><Cpu size={80} /></div>
                <div className="hw-content">
                  <span className="hw-label">Central Processing</span>
                  <h3>AMD Ryzen 5 7600X</h3>
                  <p>6-Core, 12-Thread • 5.03GHz</p>
                </div>
              </Tilt>

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
                <span className="socials-kicker">Hai să colaborăm</span>
                <h3 className="socials-title-main">Rămâi <span className="text-gradient" style={{ background: 'linear-gradient(135deg, #D2FF00, #a3f000)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Conectat</span></h3>
                <p className="socials-title-copy">Găsești codul meu, proiectele, gameplay-ul și viața de zi cu zi mai jos. Alege platforma preferată pentru a mă contacta.</p>
              </div>
              <motion.div className="socials-bento-grid" variants={itemVariants}>
                {/* Email Card (Wide) */}
                <div 
                  className="social-bento-card mail-card" 
                  style={{ cursor: 'pointer' }}
                  onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <Mail size={160} className="social-bg-icon" />
                  <div className="social-bento-content">
                    <div className="social-icon-wrapper">
                      <Mail size={28} className="social-icon-top" />
                    </div>
                    <div className="social-text-bottom">
                      <span className="platform">Contact Direct</span>
                      <span className="handle">Deschide Formularul</span>
                      <p className="social-card-meta">Cel mai rapid mod pentru colaborări, proiecte sau întrebări de business. Click pentru detalii.</p>
                      <span className="social-card-action" style={{ transition: 'all 0.3s ease' }}>
                        Trimite un mesaj <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </div>

                {/* GitHub Card */}
                <a href="https://github.com/iannC69" target="_blank" rel="noreferrer" className="social-bento-card github-card">
                  <GitBranch size={160} className="social-bg-icon" />
                  <div className="social-bento-content">
                    <div className="social-icon-wrapper">
                      <GitBranch size={28} className="social-icon-top" />
                    </div>
                    <div className="social-text-bottom">
                      <span className="platform">GitHub</span>
                      <span className="handle">@iannC69</span>
                      <p className="social-card-meta">Cod open-source, tool-uri și repo-uri publice.</p>
                      <span className="social-card-action">Vezi profilul <ExternalLink size={14} /></span>
                    </div>
                  </div>
                </a>

                {/* Steam Card */}
                <a href="https://steamcommunity.com/id/1iannc/" target="_blank" rel="noreferrer" className="social-bento-card steam-card">
                  <Gamepad2 size={160} className="social-bg-icon" />
                  <div className="social-bento-content">
                    <div className="social-icon-wrapper">
                      <Gamepad2 size={28} className="social-icon-top" />
                    </div>
                    <div className="social-text-bottom">
                      <span className="platform">Steam</span>
                      <span className="handle">1iannc</span>
                      <p className="social-card-meta">Gaming library, activity și profilul meu Steam.</p>
                      <span className="social-card-action">Vezi profilul <ExternalLink size={14} /></span>
                    </div>
                  </div>
                </a>

                {/* Instagram Card */}
                <a href="https://instagram.com/iannc_oficial" target="_blank" rel="noreferrer" className="social-bento-card insta-card">
                  <Camera size={160} className="social-bg-icon" />
                  <div className="social-bento-content">
                    <div className="social-icon-wrapper">
                      <Camera size={28} className="social-icon-top" />
                    </div>
                    <div className="social-text-bottom">
                      <span className="platform">Instagram</span>
                      <span className="handle">@iannc_oficial</span>
                      <p className="social-card-meta">Vibe, story-uri și crâmpeie din viața de zi cu zi.</p>
                      <span className="social-card-action">Urmărește-mă <ExternalLink size={14} /></span>
                    </div>
                  </div>
                </a>

                {/* YouTube Card */}
                <a href="https://youtube.com/@iannc" target="_blank" rel="noreferrer" className="social-bento-card youtube-card">
                  <Video size={160} className="social-bg-icon" />
                  <div className="social-bento-content">
                    <div className="social-icon-wrapper">
                      <Video size={28} className="social-icon-top" />
                    </div>
                    <div className="social-text-bottom">
                      <span className="platform">YouTube</span>
                      <span className="handle">@iannc</span>
                      <p className="social-card-meta">Conținut video, tutoriale și devlogs pentru comunitate.</p>
                      <span className="social-card-action">Aboanează-te <ExternalLink size={14} /></span>
                    </div>
                  </div>
                </a>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* ULTRA PREMIUM FOOTER */}
        <footer className="ultra-footer">
          <div className="footer-glow"></div>
          <div className="footer-container">
            {/* Main Links */}
            <div className="footer-content">
              <div className="footer-brand">
                <p style={{ margin: 0, color: '#fff', fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
                  Ready for liftoff?
                </p>
                <p style={{ color: '#94a3b8', fontSize: '1rem', marginTop: '0.5rem', marginBottom: '2rem', maxWidth: '300px' }}>
                  Hai să construim împreună ecosistemul tău digital.
                </p>
                <button className="footer-cta-btn" onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>
                  Contact <ArrowRight size={18} />
                </button>
              </div>

              <div className="footer-links-group">
                <div className="footer-column">
                  <h4>Navigație</h4>
                  <a href="#" className="footer-link" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Acasă</a>
                  <a href="#proiecte" className="footer-link">Proiecte</a>
                  <a href="#contact" className="footer-link" onClick={(e) => { e.preventDefault(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }); }}>Contact</a>
                </div>
                <div className="footer-column">
                  <h4>Ecosistem</h4>
                  <Link to="/tools/update-maker" className="footer-link">Update Maker</Link>
                  <Link to="/tools/todo-maker" className="footer-link">To-Do Maker</Link>
                  <Link to="/downloader" className="footer-link text-danger">YouTube Downloader</Link>
                  <Link to="/spotify" className="footer-link" style={{ color: '#1DB954' }}>Spotify Downloader</Link>
                </div>
                <div className="footer-column">
                  <h4>Altele</h4>
                  <Link to="/pomodoro" className="footer-link" style={{ color: '#c084fc' }}>Pomodoro Focus</Link>
                  <Link to="/qr-studio" className="footer-link">QR Code Studio</Link>
                  <Link to="/link-hub" className="footer-link">Link Hub Builder</Link>
                  <Link to="/wildfire-overlay" className="footer-link" style={{ color: '#ff8800' }}>Wildfire Overlay</Link>
                  <a href="https://inclounge.top" target="_blank" rel="noreferrer" className="footer-link">IncLounge</a>
                </div>
              </div>
            </div>

            {/* Massive Brand Name */}
            <div className="footer-massive-brand">
              IANNC
            </div>

            {/* Bottom */}
            <div className="footer-bottom">
              <p>&copy; {new Date().getFullYear()} IANNC.RO. Toate drepturile rezervate.</p>
              <div className="footer-social-mini">
                <a href="https://github.com/iannC69" target="_blank" rel="noreferrer" title="GitHub"><GitBranch size={18} /></a>
                <a href="https://steamcommunity.com/id/1iannc/" target="_blank" rel="noreferrer" title="Steam"><Gamepad2 size={18} /></a>
                <a href="https://instagram.com/iannc_oficial" target="_blank" rel="noreferrer" title="Instagram"><Camera size={18} /></a>
                <a href="https://youtube.com/@iannc" target="_blank" rel="noreferrer" title="YouTube"><Video size={18} /></a>
              </div>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}

export default Home;
