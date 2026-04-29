import { useMemo } from 'react';
import { motion } from 'motion/react';

type Props = {
  originX: number;
  originY: number;
};

export function Particles({ originX, originY }: Props) {
  const dirs = useMemo(() => {
    const out: { dx: number; dy: number; delay: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const dist = 60 + Math.random() * 30;
      out.push({
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist,
        delay: i * 0.025,
      });
    }
    return out;
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 19,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {dirs.map((d, i) => (
        <motion.div
          key={i}
          initial={{ x: originX, y: originY, opacity: 0, scale: 1 }}
          animate={{
            x: originX + d.dx,
            y: originY + d.dy,
            opacity: [0, 1, 0],
            scale: [1, 0.8, 0.4],
          }}
          transition={{
            duration: 0.85,
            times: [0, 0.2, 1],
            ease: [0.16, 1, 0.3, 1],
            delay: d.delay,
          }}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'oklch(0.92 0.14 85)',
            boxShadow: '0 0 14px oklch(0.85 0.16 85 / 0.7)',
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </div>
  );
}
