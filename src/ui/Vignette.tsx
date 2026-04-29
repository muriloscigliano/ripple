export function Vignette() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 10,
        background:
          'radial-gradient(ellipse at center, transparent 50%, oklch(0 0 0 / 0.55) 100%)',
      }}
    />
  );
}
