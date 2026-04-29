import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import type { Consequence, CompoundConsequence, Stone } from '../types';

const HORIZON_R: Record<string, number> = {
  immediate: 180,
  short: 360,
  long: 580,
};
const WAVE_SPEED_PX_PER_MS = 0.18;
const DECAY_PER_MS = 3.0e-4;
const REF_R = 200;

type Variant = 'calm' | 'tense' | 'heavy' | 'compound';

const VARIANTS: Record<Variant, { bg: string; border: string; text: string; shadow: string }> = {
  calm: {
    bg: 'var(--color-calm-bg)',
    border: 'var(--color-calm-border)',
    text: 'var(--color-calm-text)',
    shadow: 'var(--shadow-card)',
  },
  tense: {
    bg: 'var(--color-tense-bg)',
    border: 'var(--color-tense-border)',
    text: 'var(--color-tense-text)',
    shadow: 'var(--shadow-card)',
  },
  heavy: {
    bg: 'var(--color-heavy-bg)',
    border: 'var(--color-heavy-border)',
    text: 'var(--color-heavy-text)',
    shadow: 'var(--shadow-card)',
  },
  compound: {
    bg: 'oklch(0.85 0.16 85 / 0.08)',
    border: 'var(--color-compound-border)',
    text: 'var(--color-compound-text)',
    shadow: 'var(--shadow-compound)',
  },
};

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

type Props = {
  consequence: Consequence | CompoundConsequence;
  stone: Stone;
  isCompound?: boolean;
  viewportW: number;
  viewportH: number;
};

export function Card({ consequence, stone, isCompound, viewportW, viewportH }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const variant: Variant = isCompound ? 'compound' : (consequence.severity as Variant);
  const palette = VARIANTS[variant];

  let cx: number;
  let cy: number;
  if (isCompound && (consequence as CompoundConsequence).origin) {
    const o = (consequence as CompoundConsequence).origin;
    cx = o.x;
    cy = o.y;
  } else {
    const r = HORIZON_R[consequence.horizon] ?? 360;
    const rad = (consequence.angle * Math.PI) / 180;
    cx = stone.x + Math.cos(rad) * r;
    cy = stone.y + Math.sin(rad) * r;
  }
  const x = clamp(cx, 80 + 130, viewportW - 80 - 130);
  const y = clamp(cy, 80 + 28, viewportH - 80 - 28);

  // Freeze startDelay on first render — re-renders must NOT re-compute,
  // or the motion delay drifts when React re-renders mid-animation.
  const startDelayRef = useRef<number | null>(null);
  if (startDelayRef.current === null) {
    const tPassMs = isCompound
      ? 0
      : (HORIZON_R[consequence.horizon] ?? 360) / WAVE_SPEED_PX_PER_MS;
    const sinceMount = performance.now() - stone.t0;
    startDelayRef.current = Math.max(0, (tPassMs - 100 - sinceMount) / 1000);
  }
  const startDelay = startDelayRef.current;

  // Variable-font weight pulse: throttle to 15Hz
  useEffect(() => {
    if (!ref.current) return;
    let raf = 0;
    let lastUpdate = 0;
    const tick = () => {
      const now = performance.now();
      if (now - lastUpdate > 66) {
        const age = now - stone.t0;
        const radius = WAVE_SPEED_PX_PER_MS * age;
        const amp = Math.exp(-DECAY_PER_MS * age) / Math.max(1, Math.sqrt(radius / REF_R));
        const target_r = HORIZON_R[consequence.horizon] ?? 360;
        // Local amplitude near this card's radius — peaks when wave passes
        const dist = Math.abs(radius - target_r);
        const local = amp * Math.exp(-dist * dist / (60 * 60));
        const weight = Math.round(380 + clamp(local, 0, 1) * 240);
        if (ref.current) {
          ref.current.style.fontVariationSettings = `"wght" ${weight}, "SOFT" 70, "opsz" 24`;
        }
        lastUpdate = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [consequence.horizon, stone.t0]);

  const compoundMotion = isCompound
    ? {
        initial: { opacity: 0, scale: 0.85 },
        animate: { opacity: 1, scale: [0.85, 1.05, 1] },
        transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
      }
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: [0, 1, 1, 0], y: [8, 0, 0, 0] },
        transition: {
          duration: 2.4,
          times: [0, 0.083, 0.541, 1],
          ease: [0.16, 1, 0.3, 1],
          delay: startDelay,
        },
      };

  return (
    <motion.div
      ref={ref}
      {...compoundMotion}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
        maxWidth: 'var(--max-card-w)',
        padding: 'var(--pad-card-y) var(--pad-card-x)',
        background: palette.bg,
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
        border: `1px solid ${palette.border}`,
        borderRadius: 'var(--radius-card)',
        color: palette.text,
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-card)',
        fontStyle: 'italic',
        lineHeight: 'var(--leading-card)',
        letterSpacing: 'var(--tracking-display)',
        boxShadow: palette.shadow,
        pointerEvents: 'none',
        textAlign: 'center',
        whiteSpace: 'normal',
        userSelect: 'none',
      }}
    >
      {consequence.text}
    </motion.div>
  );
}
