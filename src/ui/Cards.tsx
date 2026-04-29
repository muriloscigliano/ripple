import { useStore } from '../store';
import { Card } from './Card';

type Props = {
  viewportW: number;
  viewportH: number;
};

export function Cards({ viewportW, viewportH }: Props) {
  const stones = useStore((s) => s.stones);
  const consequences = useStore((s) => s.consequences);
  const compounds = useStore((s) => s.compounds);

  const stoneById = new Map(stones.map((s) => [s.id, s] as const));

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
        return (
          <Card
            key={c.id}
            consequence={c}
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
