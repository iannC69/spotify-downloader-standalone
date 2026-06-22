import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, X } from 'lucide-react';
import { useState } from 'react';

export default function AnnouncementBanner({ text }) {
  const [dismissed, setDismissed] = useState(false);

  if (!text || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
          background: 'linear-gradient(90deg, rgba(210,255,0,0.12) 0%, rgba(210,255,0,0.06) 50%, rgba(210,255,0,0.12) 100%)',
          borderBottom: '1px solid rgba(210,255,0,0.25)',
          backdropFilter: 'blur(12px)',
          overflow: 'hidden',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          padding: '0.6rem 3rem',
          maxWidth: '900px',
          margin: '0 auto',
          position: 'relative',
        }}>
          <Megaphone size={15} style={{ color: '#D2FF00', flexShrink: 0 }} />
          <span style={{
            color: '#fff',
            fontSize: '0.82rem',
            fontWeight: '700',
            textAlign: 'center',
            lineHeight: '1.4',
          }}>
            {text}
          </span>
          <button
            onClick={() => setDismissed(true)}
            style={{
              position: 'absolute',
              right: '0.75rem',
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.4)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '0.25rem',
              borderRadius: '6px',
              transition: 'color 0.2s',
            }}
            title="Închide"
          >
            <X size={14} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
