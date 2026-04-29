import { motion } from 'motion/react';
import { titleFloat } from '../motion/presets';

export function Title() {
  const letters = 'Ripple Pond'.split('');
  return (
    <div
      style={{
        position: 'absolute',
        top: 24,
        left: 28,
        zIndex: 20,
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--text-title)',
        letterSpacing: 'var(--tracking-tight)',
        color: 'var(--color-ink-whisper)',
        userSelect: 'none',
        pointerEvents: 'none',
        display: 'flex',
        gap: '0.02em',
        textTransform: 'uppercase',
      }}
    >
      {letters.map((ch, i) => (
        <motion.span
          key={i}
          variants={titleFloat}
          animate="float"
          transition={{ delay: i * 0.08 }}
          style={{ display: 'inline-block', whiteSpace: 'pre' }}
        >
          {ch}
        </motion.span>
      ))}
    </div>
  );
}
