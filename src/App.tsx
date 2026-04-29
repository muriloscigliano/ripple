import { useCallback, useEffect, useRef, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { Pond } from './pond/Pond';
import { Vignette } from './ui/Vignette';
import { Aurora } from './ui/Aurora';
import { Title } from './ui/Title';
import { Cursor } from './ui/Cursor';
import { Input } from './ui/Input';
import { GlyphDrop } from './ui/GlyphDrop';
import { GhostText } from './ui/GhostText';
import { Cards } from './ui/Cards';
import { Readout } from './ui/Readout';
import { Particles } from './ui/Particles';
import type { PondHandle } from './pond/sketch';
import { streamConsequences, streamCompound } from './engine/stream';
import { unlockAudio, playDrop, playCompound } from './audio/tone';
import { useStore } from './store';
import type { Consequence, Intersection } from './types';

type GlyphInFlight = { key: string; text: string; x: number; y: number };
type GhostInFlight = { key: string; text: string; x: number; y: number };
type ParticleSet = { key: string; x: number; y: number };

const SEV_WEIGHT: Record<string, number> = { heavy: 3, tense: 2, calm: 1 };
const SEV_LEVEL: Record<string, number> = { calm: 0, tense: 1, heavy: 2 };

function pickWeighted(items: Consequence[]): Consequence {
  const total = items.reduce((s, c) => s + (SEV_WEIGHT[c.severity] ?? 1), 0);
  let r = Math.random() * total;
  for (const c of items) {
    r -= SEV_WEIGHT[c.severity] ?? 1;
    if (r <= 0) return c;
  }
  return items[items.length - 1];
}

export default function App() {
  const pondRef = useRef<PondHandle>(null);
  const [cursor, setCursor] = useState<{ x: number | null; y: number | null }>({
    x: null,
    y: null,
  });
  const [viewport, setViewport] = useState({
    w: typeof window !== 'undefined' ? window.innerWidth : 1440,
    h: typeof window !== 'undefined' ? window.innerHeight : 900,
  });
  const [glyphs, setGlyphs] = useState<GlyphInFlight[]>([]);
  const [ghosts, setGhosts] = useState<GhostInFlight[]>([]);
  const [particleSets, setParticleSets] = useState<ParticleSet[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const pendingIntersections = useRef<Intersection[]>([]);

  const addStone = useStore((s) => s.addStone);
  const addConsequence = useStore((s) => s.addConsequence);
  const addCompound = useStore((s) => s.addCompound);
  const updateCompoundText = useStore((s) => s.updateCompoundText);
  const consequencesLen = useStore((s) => s.consequences.length);

  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Audio unlock on first user gesture (Tone.js requires this).
  useEffect(() => {
    const unlock = () => {
      unlockAudio();
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  // Cold-open: visual perturbation only (does NOT register an analytic stone,
  // so it can never participate in compound intersections later).
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!pondRef.current) return;
      const x = window.innerWidth / 2;
      const y = window.innerHeight / 2;
      pondRef.current.dropPerturbation(x, y, 0.6);
      const key = uuid();
      setGhosts((g) => [...g, { key, text: 'every decision is a stone', x, y }]);
      window.setTimeout(() => {
        setGhosts((g) => g.filter((gh) => gh.key !== key));
      }, 4200);
    }, 3500);
    return () => window.clearTimeout(timer);
  }, []);

  // Severity-driven hue shift on the void (Move #12)
  useEffect(() => {
    const recent = useStore.getState().consequences.slice(-6);
    if (recent.length === 0) return;
    const avg =
      recent.reduce((s, c) => s + (SEV_LEVEL[c.severity] ?? 0), 0) / recent.length;
    const lightness = 0.10 - avg * 0.005;
    const chroma = 0.025 + avg * 0.012;
    document.documentElement.style.setProperty(
      '--color-surface-void',
      `oklch(${lightness.toFixed(3)} ${chroma.toFixed(3)} 250)`,
    );
  }, [consequencesLen]);

  // Compound flow
  const fireCompound = useCallback(
    (ix: Intersection, a: Consequence, b: Consequence) => {
      const compoundId = uuid();
      pondRef.current?.setSlowMo(performance.now() + 400);

      const partKey = uuid();
      setParticleSets((p) => [...p, { key: partKey, x: ix.x, y: ix.y }]);
      window.setTimeout(() => {
        setParticleSets((p) => p.filter((s) => s.key !== partKey));
      }, 1100);

      playCompound();
      addCompound({
        id: compoundId,
        stoneId: a.stoneId,
        text: '…',
        horizon: 'short',
        severity: 'tense',
        angle: 0,
        parents: [a.id, b.id],
        origin: { x: ix.x, y: ix.y },
      });

      streamCompound(a, b, { x: ix.x, y: ix.y }, (c) => {
        updateCompoundText(compoundId, c.text);
      }).catch((err) => console.warn('[ripple] compound stream error', err));
    },
    [addCompound, updateCompoundText],
  );

  // Intersection polling at 10Hz; pending queue retries until both stones have ≥1 consequence
  useEffect(() => {
    let raf = 0;
    let last = 0;
    const tryFire = (ix: Intersection): boolean => {
      const state = useStore.getState();
      const aConseqs = state.consequences.filter((c) => c.stoneId === ix.a);
      const bConseqs = state.consequences.filter((c) => c.stoneId === ix.b);
      if (aConseqs.length === 0 || bConseqs.length === 0) return false;
      const a = pickWeighted(aConseqs);
      const b = pickWeighted(bConseqs);
      fireCompound(ix, a, b);
      return true;
    };
    const loop = () => {
      const now = performance.now();
      if (now - last > 100) {
        const fresh = pondRef.current?.getIntersections() ?? [];
        for (const ix of fresh) pendingIntersections.current.push(ix);
        // Try to drain pending
        const remaining: Intersection[] = [];
        for (const ix of pendingIntersections.current) {
          if (!tryFire(ix)) remaining.push(ix);
        }
        pendingIntersections.current = remaining;
        last = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [fireCompound]);

  const pickDropPoint = useCallback(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const padX = w * 0.2;
    const padY = h * 0.25;
    return {
      x: padX + Math.random() * (w - 2 * padX),
      y: padY + Math.random() * (h - 2 * padY - 140),
    };
  }, []);

  const handleSubmit = useCallback(
    (text: string) => {
      if (submitting) return;
      setSubmitting(true);
      const { x, y } = pickDropPoint();
      const glyphKey = uuid();
      setGlyphs((g) => [...g, { key: glyphKey, text, x, y }]);

      window.setTimeout(() => {
        const stoneId = pondRef.current?.dropStone(x, y, 1.2) ?? uuid();
        playDrop();
        addStone({
          id: stoneId,
          x,
          y,
          decision: text,
          t0: performance.now(),
          intensity: 1.2,
        });
        streamConsequences(text, (c) => addConsequence({ ...c, stoneId }), {
          stoneId,
        }).catch((err) => console.warn('[ripple] stream error', err));
      }, 500);

      window.setTimeout(() => {
        setGlyphs((g) => g.filter((gl) => gl.key !== glyphKey));
        setSubmitting(false);
      }, 950);
    },
    [submitting, pickDropPoint, addStone, addConsequence],
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--color-surface-void)',
        overflow: 'hidden',
      }}
    >
      <Pond
        ref={pondRef}
        onCursorMove={(x, y) => setCursor({ x, y })}
      />
      <Aurora />
      {ghosts.map((g) => (
        <GhostText key={g.key} text={g.text} x={g.x} y={g.y} />
      ))}
      <Cards viewportW={viewport.w} viewportH={viewport.h} />
      {particleSets.map((p) => (
        <Particles key={p.key} originX={p.x} originY={p.y} />
      ))}
      {glyphs.map((g) => (
        <GlyphDrop key={g.key} text={g.text} x={g.x} y={g.y} />
      ))}
      <Vignette />
      <Cursor x={cursor.x} y={cursor.y} />
      <Title />
      <Readout />
      <Input onSubmit={handleSubmit} disabled={submitting} />
    </div>
  );
}
