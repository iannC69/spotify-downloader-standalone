import { motion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock3,
  DatabaseZap,
  Mail,
  ServerCog,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  Wrench,
} from 'lucide-react';
import { useSiteConfig } from '../context/useSiteConfig';
import './MaintenancePage.css';

const operations = [
  { label: 'Backup & data sync', status: 'done' },
  { label: 'Firebase rules check', status: 'done' },
  { label: 'Deploying new modules', status: 'active' },
  { label: 'Final health checks', status: 'waiting' },
];

const statusCards = [
  { icon: DatabaseZap, label: 'Database', value: 'Protected' },
  { icon: ShieldCheck, label: 'Security', value: 'Active' },
  { icon: ServerCog, label: 'Services', value: 'Updating' },
];

export default function MaintenancePage() {
  const { siteConfig } = useSiteConfig();
  const version = siteConfig?.site?.version || 'v2.4.1';
  const environment = siteConfig?.site?.environment || 'Production';
  const contactEmail = siteConfig?.contact?.email || 'contact@iannc.ro';
  const currentYear = new Date().getFullYear();

  return (
    <main className="maintenance-page">
      <div className="maintenance-stars" />
      <div className="maintenance-grid" />
      <div className="maintenance-orb orb-one" />
      <div className="maintenance-orb orb-two" />
      <div className="maintenance-path path-a" />
      <div className="maintenance-path path-b" />

      <section className="maintenance-shell">
        <motion.div
          className="maintenance-copy"
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="maintenance-top-cluster">
            <div className="maintenance-pill">
              <span className="live-pulse" />
              Maintenance mode activ
            </div>
            <div className="maintenance-system-row">
              <div className="maintenance-icon-wrap" aria-hidden="true">
                <motion.div
                  className="maintenance-ring ring-one"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
                />
                <div className="maintenance-icon-core">
                  <Wrench size={28} />
                </div>
              </div>
              <span className="maintenance-kicker">IANNC.RO systems</span>
            </div>
          </div>

          <div>
            <h1>
              Revenim
              <span>mai buni.</span>
            </h1>
            <p>
              Facem update-uri importante la platforma, tool-uri si zona de comunitate.
              Site-ul este temporar blocat pentru utilizatori, iar echipa verifica totul inainte de go-live.
            </p>
          </div>

          <div className="maintenance-actions">
            <a href={`mailto:${contactEmail}`} className="maintenance-primary">
              <Mail size={18} />
              Contact rapid
            </a>
            <span className="maintenance-eta">
              <Clock3 size={17} />
              Revenire estimata: cat mai curand
            </span>
          </div>

          <div className="maintenance-inline-status">
            {statusCards.map((card) => {
              const Icon = card.icon;
              return (
                <div className="status-mini-card" key={card.label}>
                  <Icon size={20} />
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.aside
          className="maintenance-panel"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="panel-topline">
            <div>
              <span>System status</span>
              <strong>{environment}</strong>
            </div>
            <div className="panel-version">{version}</div>
          </div>

          <div className="maintenance-progress-card">
            <div className="progress-heading">
              <span><Activity size={15} /> Deploy progress</span>
              <strong>68%</strong>
            </div>
            <div className="progress-track">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '68%' }}
                transition={{ duration: 1.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </div>

          <div className="operations-list">
            {operations.map((operation, index) => (
              <motion.div
                className={`operation-row ${operation.status}`}
                key={operation.label}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + index * 0.08 }}
              >
                <span className="operation-dot">
                  {operation.status === 'done' ? <CheckCircle2 size={16} /> : <span />}
                </span>
                <strong>{operation.label}</strong>
                <small>{operation.status === 'done' ? 'Done' : operation.status === 'active' ? 'In progress' : 'Waiting'}</small>
              </motion.div>
            ))}
          </div>

          <div className="maintenance-terminal">
            <div className="terminal-head">
              <span />
              <span />
              <span />
              <b><TerminalSquare size={14} /> live-check</b>
            </div>
            <code>firebase.config: synced</code>
            <code>public_access: paused</code>
            <code>admin_access: enabled <ArrowRight size={13} /></code>
          </div>
        </motion.aside>
      </section>

      <footer className="maintenance-footer">
        <Sparkles size={14} />
        <span>IANNC.RO · {currentYear} · Multumim pentru rabdare</span>
      </footer>
    </main>
  );
}
