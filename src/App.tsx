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
import type { PondHandle } from './pond/sketch';
import { streamConsequences } from './engine/stream';
import { useStore } from './store';

type GlyphInFlight = { key: string; text: string; x: number; y: number };
type GhostInFlight = { key: string; text: string; x: number; y: number };

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
  const [submitting, setSubmitting] = useState(false);

  const addStone = useStore((s) => s.addStone);
  const addConsequence = useStore((s) => s.addConsequence);

  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Cold-open: drop a quiet stone at center + ghost text after 3.5s
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const x = window.innerWidth / 2;
      const y = window.innerHeight / 2;
      pondRef.current?.dropStone(x, y, 0.6);
      const key = uuid();
      setGhosts((g) => [...g, { key, text: 'every decision is a stone', x, y }]);
      window.setTimeout(() => {
        setGhosts((g) => g.filter((gh) => gh.key !== key));
      }, 4200);
    }, 3500);
    return () => window.clearTimeout(timer);
  }, []);

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

      // Stone + stream fire when glyph lands (~500ms in)
      window.setTimeout(() => {
        const stoneId = pondRef.current?.dropStone(x, y, 1.2) ?? uuid();
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

      // Cleanup glyph after animation
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
