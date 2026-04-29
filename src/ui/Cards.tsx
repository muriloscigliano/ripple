import { useMemo } from 'react';
import { useStore } from '../store';
import { Card } from './Card';
import type { Consequence } from '../types';

type Props = {
  viewportW: number;
  viewportH: number;
};

// Deterministic angle distribution per (stoneId, horizon) — overrides the
// source `angle` field so cards never cluster, regardless of what the model
// or the canned fallback emits.
function distributeAngles(consequences: Consequence[]): Map<string, number> {
  const groups = new Map<string, Consequence[]>();
  for (const c of consequences) {
    const k = `${c.stoneId}|${c.horizon}`;
    const arr = groups.get(k) ?? [];
    arr.push(c);
    groups.set(k, arr);
  }
  const out = new Map<string, number>();
  for (const [key, group] of groups) {
    // Pseudo-random per-group offset so different stones don't all start at 0°
    const seed = key.split('').reduce((s, ch) => (s * 31 + ch.charCodeAt(0)) >>> 0, 7);
    const startDeg = seed % 360;
    const step = 360 / group.length;
    group.forEach((c, i) => {
      out.set(c.id, (startDeg + i * step) % 360);
    });
  }
  return out;
}

export function Cards({ viewportW, viewportH }: Props) {
  const stones = useStore((s) => s.stones);
  const consequences = useStore((s) => s.consequences);
  const compounds = useStore((s) => s.compounds);

  const stoneById = useMemo(
    () => new Map(stones.map((s) => [s.id, s] as const)),
    [stones],
  );
  const overrideAngles = useMemo(
    () => distributeAngles(consequences),
    [consequences],
  );

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 18,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {consequences.map((c) => {
        const stone = stoneById.get(c.stoneId);
        if (!stone) return null;
        const a = overrideAngles.get(c.id) ?? c.angle;
        return (
          <Card
            key={c.id}
            consequence={{ ...c, angle: a }}
            stone={stone}
            viewportW={viewportW}
            viewportH={viewportH}
          />
        );
      })}
      {compounds.map((c) => {
        const stone = stoneById.get(c.stoneId);
        if (!stone) return null;
        return (
          <Card
            key={c.id}
            consequence={c}
            stone={stone}
            isCompound
            viewportW={viewportW}
            viewportH={viewportH}
          />
        );
      })}
    </div>
  );
}
