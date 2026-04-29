import { motion } from 'motion/react';

type Props = {
  text: string;
  x: number;
  y: number;
  onLand?: () => void;
};

export function GlyphDrop({ text, x, y, onLand }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -80 }}
      animate={{
        opacity: [0, 1, 1, 0],
        y: [-80, -8, 4, 24],
      }}
      transition={{
        duration: 0.9,
        times: [0, 0.4, 0.55, 1],
        ease: [0.5, 0, 0.75, 0],
      }}
      onAnimationComplete={() => onLand?.()}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        zIndex: 24,
        transform: 'translate(-50%, -50%)',
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-caption)',
        fontStyle: 'italic',
        color: 'oklch(0.96 0.01 220 / 0.85)',
        textShadow: '0 1px 0 oklch(0 0 0 / 0.5)',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        letterSpacing: 'var(--tracking-display)',
        userSelect: 'none',
      }}
    >
      {text}
    </motion.div>
  );
}
