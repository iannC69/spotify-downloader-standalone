import { motion } from 'framer-motion';
import { Construction, Wrench, Zap, Clock } from 'lucide-react';

const LIME = '#D2FF00';
const YEAR = new Date().getFullYear();
const WAVEFORM = [0.6, 1.1, 0.8, 1.4, 0.7, 1.2, 0.9];

const steps = [
  { label: 'Backup & database migration', done: true },
  { label: 'Cache invalidation', done: true },
  { label: 'Service deployment', done: false },
  { label: 'Health checks & go-live', done: false },
];

function Orb({ x, y, size, color, delay = 0 }) {
  return (
    <motion.div
      style={{
        position: 'absolute',
        left: x, top: y,
        width: size, height: size,
        borderRadius: '50%',
        background: color,
        filter: 'blur(90px)',
        pointerEvents: 'none',
      }}
      animate={{ scale: [1, 1.18, 1], opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay }}
    />
  );
}


export default function MaintenancePage() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#06070b',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
    }}>
      {/* ── Background ── */}
      <Orb x="-200px" y="-200px" size="700px" color="rgba(210,255,0,0.06)" delay={0} />
      <Orb x="60%" y="50%" size="500px" color="rgba(59,130,246,0.05)" delay={2} />
      <Orb x="10%" y="60%" size="350px" color="rgba(210,255,0,0.035)" delay={1} />

      {/* Grid */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`,
        backgroundSize: '56px 56px',
        maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, #000 30%, transparent 100%)',
      }} />

      {/* Scanlines */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px)',
      }} />

      {/* ── Main card ── */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '620px',
          padding: '0 2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2.25rem',
        }}
      >
        {/* Icon */}
        <div style={{ position: 'relative', width: '100px', height: '100px' }}>
          {[0, 1].map((i) => (
            <motion.div
              key={i}
              style={{
                position: 'absolute',
                inset: `${i * 12}px`,
                borderRadius: '50%',
                border: `1px solid rgba(210,255,0,${0.25 - i * 0.1})`,
              }}
              animate={{ scale: [1, 1.08 - i * 0.02, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
            />
          ))}
          <div style={{
            position: 'absolute', inset: '22px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(210,255,0,0.12), rgba(210,255,0,0.04))',
            border: '1px solid rgba(210,255,0,0.3)',
            boxShadow: `0 0 40px rgba(210,255,0,0.15), inset 0 1px 0 rgba(210,255,0,0.25)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <motion.div animate={{ rotate: [0, 8, -8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
              <Construction size={28} style={{ color: LIME }} />
            </motion.div>
          </div>
          {/* Mini orbit */}
          <motion.div
            style={{
              position: 'absolute', top: 2, right: 6,
              width: '26px', height: '26px', borderRadius: '8px',
              background: 'rgba(210,255,0,0.1)',
              border: '1px solid rgba(210,255,0,0.22)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          >
            <Wrench size={12} style={{ color: LIME }} />
          </motion.div>
        </div>

        {/* Live badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.55rem',
            background: 'rgba(210,255,0,0.07)',
            border: '1px solid rgba(210,255,0,0.22)',
            borderRadius: '999px', padding: '0.45rem 1.2rem',
            color: LIME, fontSize: '0.68rem', fontWeight: 800,
            letterSpacing: '0.2em', textTransform: 'uppercase',
          }}
        >
          <motion.span
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            style={{ width: 7, height: 7, borderRadius: '50%', background: LIME, display: 'inline-block' }}
          />
          Mentenanță în desfășurare
        </motion.div>

        {/* Title — big and clear */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            margin: 0,
            lineHeight: 1,
            letterSpacing: '-0.04em',
          }}>
            <span style={{
              display: 'block',
              fontSize: 'clamp(3rem, 8vw, 5.5rem)',
              fontWeight: 900,
              color: '#ffffff',
              textShadow: '0 0 60px rgba(255,255,255,0.08)',
            }}>
              Revenim
            </span>
            <span style={{
              display: 'block',
              fontSize: 'clamp(3rem, 8vw, 5.5rem)',
              fontWeight: 900,
              color: LIME,
              textShadow: `0 0 40px rgba(210,255,0,0.4), 0 0 80px rgba(210,255,0,0.15)`,
              marginTop: '0.05em',
            }}>
              în curând.
            </span>
          </h1>
          <p style={{
            margin: '1.25rem 0 0',
            color: 'rgba(255,255,255,0.42)',
            fontSize: '1.05rem',
            lineHeight: 1.65,
            fontWeight: 500,
            maxWidth: '440px',
          }}>
            Lucrăm la îmbunătățiri importante pentru tine.
            Site-ul va reveni disponibil în cel mai scurt timp.
          </p>
        </div>

        {/* Steps card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '22px',
            padding: '1.5rem',
            backdropFilter: 'blur(20px)',
            display: 'flex', flexDirection: 'column', gap: '1rem',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={13} style={{ color: LIME }} />
              <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                Status operațiuni
              </span>
            </div>
            <span style={{
              background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.2)',
              borderRadius: '999px', padding: '0.2rem 0.65rem',
              color: '#facc15', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase',
            }}>
              2 / 4 done
            </span>
          </div>

          {steps.map((step, i) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.08 }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}
            >
              {/* Dot */}
              <div style={{
                width: '22px', height: '22px', flexShrink: 0,
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: step.done ? 'rgba(210,255,0,0.1)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${step.done ? 'rgba(210,255,0,0.35)' : 'rgba(255,255,255,0.1)'}`,
                boxShadow: step.done ? `0 0 12px rgba(210,255,0,0.15)` : 'none',
              }}>
                {step.done ? (
                  <svg width="11" height="11" viewBox="0 0 11 11">
                    <path d="M2 5.5l2.5 2.5L9 3" stroke={LIME} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <motion.div
                    animate={{ opacity: [0.25, 0.9, 0.25] }}
                    transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.25 }}
                    style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.25)' }}
                  />
                )}
              </div>

              {/* Label */}
              <span style={{
                flex: 1,
                fontSize: '0.875rem', fontWeight: 600,
                color: step.done ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.28)',
                textDecoration: step.done ? 'line-through' : 'none',
                textDecorationColor: 'rgba(255,255,255,0.2)',
              }}>
                {step.label}
              </span>

              {/* Tag */}
              <span style={{
                padding: '0.2rem 0.6rem', borderRadius: '999px',
                fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em',
                background: step.done ? 'rgba(34,197,94,0.08)' : 'rgba(234,179,8,0.08)',
                color: step.done ? '#4ade80' : '#facc15',
                border: `1px solid ${step.done ? 'rgba(34,197,94,0.18)' : 'rgba(234,179,8,0.18)'}`,
              }}>
                {step.done ? 'Finalizat' : 'În curs'}
              </span>
            </motion.div>
          ))}

          {/* Progress bar */}
          <div style={{ marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: '0.68rem', fontWeight: 600 }}>Progres general</span>
              <span style={{ color: LIME, fontSize: '0.68rem', fontWeight: 800 }}>50%</span>
            </div>
            <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '50%' }}
                transition={{ duration: 2, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  height: '100%', borderRadius: '999px',
                  background: `linear-gradient(90deg, ${LIME}, #8fdb00)`,
                  boxShadow: `0 0 10px rgba(210,255,0,0.4)`,
                }}
              />
            </div>
          </div>
        </motion.div>

        {/* Waveform loader */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {WAVEFORM.map((h, i) => (
            <motion.div
              key={i}
              animate={{ scaleY: [0.25, h * 1.1, 0.25] }}
              transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.12, ease: 'easeInOut' }}
              style={{
                width: '3px',
                height: `${h * 18}px`,
                borderRadius: '999px',
                background: LIME,
                boxShadow: `0 0 6px rgba(210,255,0,0.5)`,
                transformOrigin: 'center',
              }}
            />
          ))}
          <span style={{ marginLeft: '0.5rem', color: 'rgba(255,255,255,0.28)', fontSize: '0.8rem', fontWeight: 600 }}>
            Procesare activă...
          </span>
        </div>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        style={{
          position: 'absolute', bottom: '1.75rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          color: 'rgba(255,255,255,0.15)',
          fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.04em',
        }}
      >
        <Clock size={11} />
        <span>IANNC.RO · {YEAR} · Îți mulțumim pentru răbdare</span>
      </motion.div>
    </div>
  );
}
