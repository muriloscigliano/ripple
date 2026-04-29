import { motion } from 'motion/react';
import { cursorPulse } from '../motion/presets';

type Props = {
  x: number | null;
  y: number | null;
};

export function Cursor({ x, y }: Props) {
  if (x === null || y === null) return null;
  return (
    <motion.div
      variants={cursorPulse}
      animate="pulse"
      style={{
        position: 'absolute',
        left: x - 16,
        top: y - 16,
        width: 32,
        height: 32,
        borderRadius: '50%',
        border: '1px solid var(--color-hairline-active)',
        boxShadow:
          '0 0 24px oklch(0.78 0.10 195 / 0.25), inset 0 0 12px oklch(0.78 0.10 195 / 0.10)',
        zIndex: 15,
        pointerEvents: 'none',
        backdropFilter: 'blur(2px)',
      }}
    />
  );
}
