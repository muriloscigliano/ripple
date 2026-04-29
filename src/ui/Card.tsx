import { useEffect, useRef, useState, useMemo } from 'react';
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

const FADE_IN_S = 0.55;
const HOLD_S = 4.6;
const FADE_OUT_S = 1.4;

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
    bg: 'oklch(0.85 0.16 85 / 0.10)',
    border: 'var(--color-compound-border)',
    text: 'var(--color-compound-text)',
    shadow: 'var(--shadow-compound)',
  },
};

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

const cardVariants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: FADE_IN_S,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      staggerChildren: 0.045,
      delayChildren: 0.15,
    },
  },
  fading: {
    opacity: 0,
    transition: {
      duration: FADE_OUT_S,
      ease: [0.4, 0, 1, 1] as [number, number, number, number],
    },
  },
};

const wordVariants = {
  hidden: { opacity: 0, y: 10, filter: 'blur(6px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.55,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
  fading: { opacity: 0 },
};

const compoundVariants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: [0.85, 1.06, 1],
    transition: {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      staggerChildren: 0.05,
      delayChildren: 0.25,
    },
  },
  fading: { opacity: 0, transition: { duration: 1.6 } },
};

type Props = {
  consequence: Consequence | CompoundConsequence;
  stone: Stone;
  isCompound?: boolean;
  viewportW: number;
  viewportH: number;
  onChain?: (c: Consequence | CompoundConsequence, x: number, y: number) => void;
};

export function Card({ consequence, stone, isCompound, viewportW, viewportH, onChain }: Props) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const variant: Variant = isCompound ? 'compound' : (consequence.severity as Variant);
  const palette = VARIANTS[variant];

  // Pre-clamp position (used for accurate distance-from-stone in bob effect)
  let cxRaw: number;
  let cyRaw: number;
  if (isCompound && (consequence as CompoundConsequence).origin) {
    const o = (consequence as CompoundConsequence).origin;
    cxRaw = o.x;
    cyRaw = o.y;
  } else {
    const r = HORIZON_R[consequence.horizon] ?? 360;
    const rad = (consequence.angle * Math.PI) / 180;
    cxRaw = stone.x + Math.cos(rad) * r;
    cyRaw = stone.y + Math.sin(rad) * r;
  }
  const x = clamp(cxRaw, 80 + 160, viewportW - 80 - 160);
  const y = clamp(cyRaw, 80 + 32, viewportH - 80 - 32);

  // Unit vector from stone toward card (radial direction for the push effect)
  const distFromStone = Math.max(1, Math.hypot(cxRaw - stone.x, cyRaw - stone.y));
  const dxRadial = (cxRaw - stone.x) / distFromStone;
  const dyRadial = (cyRaw - stone.y) / distFromStone;

  // Phase orchestration
  const startDelayMs = useRef<number | null>(null);
  if (startDelayMs.current === null) {
    const tPassMs = isCompound
      ? 0
      : (HORIZON_R[consequence.horizon] ?? 360) / WAVE_SPEED_PX_PER_MS;
    const sinceMount = performance.now() - stone.t0;
    startDelayMs.current = Math.max(0, tPassMs - 100 - sinceMount);
  }

  const [phase, setPhase] = useState<'hidden' | 'visible' | 'fading'>('hidden');
  useEffect(() => {
    if (isCompound) {
      const t1 = window.setTimeout(() => setPhase('visible'), 0);
      return () => window.clearTimeout(t1);
    }
    const t1 = window.setTimeout(() => setPhase('visible'), startDelayMs.current ?? 0);
    const t2 = window.setTimeout(
      () => setPhase('fading'),
      (startDelayMs.current ?? 0) + (FADE_IN_S + HOLD_S) * 1000,
    );
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [isCompound]);

  // Bob effect — outer transform driven by RAF.
  // Three components: (1) tiny pre-arrival anticipation float,
  // (2) radial push when the wave hits, (3) damped 2D oscillation after.
  useEffect(() => {
    if (!outerRef.current || isCompound) return;
    let raf = 0;
    const tArrive = distFromStone / WAVE_SPEED_PX_PER_MS;
    const tick = () => {
      const now = performance.now();
      const sinceStone = now - stone.t0;
      const sinceWave = sinceStone - tArrive;

      let xOff = 0;
      let yOff = 0;

      if (sinceWave < 0) {
        // Pre-arrival: tiny anticipation breath (±1.5px)
        const breath = Math.sin(now * 0.0014) * 1.5;
        yOff = breath;
      } else {
        // Radial push on impact: peaks at 200ms, settles by 800ms
        const pushK = sinceWave < 800 ? Math.sin((sinceWave / 800) * Math.PI) : 0;
        const pushPx = pushK * 14;
        // Damped 2D bob continues for ~5s after wave passes
        const env = Math.exp(-sinceWave * 4.5e-4);
        const bobY = Math.sin(sinceWave * 0.0028) * env * 9;
        const bobX = Math.cos(sinceWave * 0.0019) * env * 4;
        xOff = dxRadial * pushPx + bobX;
        yOff = dyRadial * pushPx + bobY;
      }

      if (outerRef.current) {
        outerRef.current.style.transform = `translate(calc(-50% + ${xOff.toFixed(2)}px), calc(-50% + ${yOff.toFixed(2)}px))`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [distFromStone, dxRadial, dyRadial, stone.t0, isCompound]);

  // Variable-font weight pulse — heavier base
  useEffect(() => {
    if (!innerRef.current || isCompound) return;
    let raf = 0;
    let lastUpdate = 0;
    const tick = () => {
      const now = performance.now();
      if (now - lastUpdate > 66) {
        const age = now - stone.t0;
        const radius = WAVE_SPEED_PX_PER_MS * age;
        const amp = Math.exp(-DECAY_PER_MS * age) / Math.max(1, Math.sqrt(radius / REF_R));
        const target_r = HORIZON_R[consequence.horizon] ?? 360;
        const dist = Math.abs(radius - target_r);
        const local = amp * Math.exp((-dist * dist) / (60 * 60));
        const weight = Math.round(500 + clamp(local, 0, 1) * 200);
        if (innerRef.current) {
          innerRef.current.style.fontVariationSettings = `"wght" ${weight}, "SOFT" 60, "opsz" 32`;
        }
        lastUpdate = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [consequence.horizon, stone.t0, isCompound]);

  const words = useMemo(() => consequence.text.split(/(\s+)/), [consequence.text]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (phase !== 'visible') return;
    onChain?.(consequence, x, y);
  };

  return (
    <div
      ref={outerRef}
      onClick={handleClick}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
        willChange: 'transform',
        pointerEvents: phase === 'visible' ? 'auto' : 'none',
        cursor: phase === 'visible' ? 'pointer' : 'default',
      }}
    >
      <motion.div
        ref={innerRef}
        variants={isCompound ? compoundVariants : cardVariants}
        initial="hidden"
        animate={phase}
        whileHover={{ scale: 1.04, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } }}
        whileTap={{ scale: 0.97 }}
        style={{
          maxWidth: 'var(--max-card-w)',
          padding: '18px 24px',
          background: palette.bg,
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          border: `1px solid ${palette.border}`,
          borderRadius: 'var(--radius-card)',
          color: palette.text,
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-card)',
          fontStyle: 'italic',
          lineHeight: 1.3,
          letterSpacing: '-0.005em',
          boxShadow: palette.shadow,
          textAlign: 'center',
          whiteSpace: 'normal',
          userSelect: 'none',
          textShadow: '0 1px 1px oklch(0 0 0 / 0.6)',
        }}
      >
        {words.map((w, i) =>
          /^\s+$/.test(w) ? (
            <span key={i} style={{ whiteSpace: 'pre' }}>{w}</span>
          ) : (
            <motion.span
              key={i}
              variants={wordVariants}
              style={{ display: 'inline-block', willChange: 'transform, filter, opacity' }}
            >
              {w}
            </motion.span>
          ),
        )}
      </motion.div>
    </div>
  );
}
