import { motion } from 'motion/react';

type Props = {
  text: string;
  x: number;
  y: number;
};

export function GhostText({ text, x, y }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: [0, 0.55, 0.45, 0], scale: [0.96, 1.0, 1.02, 1.06] }}
      transition={{
        duration: 4.0,
        times: [0, 0.2, 0.6, 1],
        ease: [0.22, 0.61, 0.36, 1],
      }}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        zIndex: 6,
        transform: 'translate(-50%, -50%)',
        fontFamily: 'var(--font-display)',
        fontSize: 28,
        fontStyle: 'italic',
        fontVariationSettings: '"wght" 360, "SOFT" 80',
        color: 'oklch(0.96 0.06 195 / 0.55)',
        textShadow: '0 0 28px oklch(0.78 0.12 195 / 0.55)',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        letterSpacing: '0.01em',
        userSelect: 'none',
        mixBlendMode: 'screen',
      }}
    >
      {text}
    </motion.div>
  );
}
