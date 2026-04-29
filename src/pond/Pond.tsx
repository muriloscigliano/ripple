import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { createPond, type PondHandle } from './sketch';

export const Pond = forwardRef<PondHandle, {}>((_, ref) => {
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
    getWavefronts: () => handleRef.current?.getWavefronts() ?? [],
    getIntersections: () => handleRef.current?.getIntersections() ?? [],
    setHover: (x, y) => handleRef.current?.setHover(x, y),
    destroy: () => handleRef.current?.destroy(),
  }));

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        filter: 'blur(0.5px)',
      }}
    />
  );
});

Pond.displayName = 'Pond';
