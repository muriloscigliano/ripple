import { useEffect, useState } from 'react';
import { useStore } from '../store';

const WAVE_SPEED_PX_PER_MS = 0.18;
const DECAY_PER_MS = 3.0e-4;
const REF_R = 200;

export function Readout() {
  const stones = useStore((s) => s.stones);
  const consequences = useStore((s) => s.consequences);
  const compounds = useStore((s) => s.compounds);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let raf = 0;
    let last = 0;
    const loop = () => {
      const now = performance.now();
      if (now - last > 66) {
        setTick(now);
        last = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const newest = stones[stones.length - 1];
  const now = tick || performance.now();
  let tPlus = 0;
  let psi = 0;
  if (newest) {
    const age = now - newest.t0;
    tPlus = age / 1000;
    const radius = WAVE_SPEED_PX_PER_MS * age;
    psi = Math.exp(-DECAY_PER_MS * age) / Math.max(1, Math.sqrt(radius / REF_R));
  }
  const n = consequences.length + compounds.length;

  return (
    <div
      style={{
        position: 'absolute',
        right: 24,
        bottom: 96,
        zIndex: 22,
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-whisper)',
        color: 'var(--color-ink-whisper)',
        letterSpacing: 'var(--tracking-mono)',
        opacity: 0.45,
        pointerEvents: 'none',
        userSelect: 'none',
        textAlign: 'right',
        lineHeight: 1.6,
      }}
    >
      <div>t+ {tPlus.toFixed(2).padStart(6, ' ')}s</div>
      <div>ψ {psi.toFixed(3)}</div>
      <div>n = {n}</div>
    </div>
  );
}
