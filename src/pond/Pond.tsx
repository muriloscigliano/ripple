import {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  type MouseEvent,
} from 'react';
import { createPond, type PondHandle } from './sketch';

type Props = {
  onDrop?: (stoneId: string, x: number, y: number) => void;
  onCursorMove?: (x: number | null, y: number | null) => void;
};

export const Pond = forwardRef<PondHandle, Props>(({ onDrop, onCursorMove }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<PondHandle | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    handleRef.current = createPond(containerRef.current);
    return () => {
      handleRef.current?.destroy();
      handleRef.current = null;
    };
  }, []);

  useImperativeHandle(ref, () => ({
    dropStone: (x, y, i) => handleRef.current?.dropStone(x, y, i) ?? '',
    dropPerturbation: (x, y, i) => handleRef.current?.dropPerturbation(x, y, i),
    getWavefronts: () => handleRef.current?.getWavefronts() ?? [],
    getIntersections: () => handleRef.current?.getIntersections() ?? [],
    setHover: (x, y) => handleRef.current?.setHover(x, y),
    setSlowMo: (until) => handleRef.current?.setSlowMo(until),
    setStoneTone: (id, tone) => handleRef.current?.setStoneTone(id, tone),
    destroy: () => handleRef.current?.destroy(),
  }));

  const localXY = (e: MouseEvent<HTMLDivElement>): { x: number; y: number } => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!handleRef.current) return;
    const { x, y } = localXY(e);
    // Click on the pond surface drops a quiet decorative ripple only —
    // no consequences, no intersections. Real decisions go through Input.
    handleRef.current.dropPerturbation(x, y, 0.6);
    onDrop?.('', x, y);
  };

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    const { x, y } = localXY(e);
    handleRef.current?.setHover(x, y);
    onCursorMove?.(x, y);
  };

  const handleLeave = () => {
    handleRef.current?.setHover(null, null);
    onCursorMove?.(null, null);
  };

  return (
    <div
      ref={containerRef}
      className="pond-surface"
      onClick={handleClick}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1,
        filter: 'blur(0.5px)',
      }}
    />
  );
});

Pond.displayName = 'Pond';
