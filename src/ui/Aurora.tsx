export function Aurora() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: '-20%',
        zIndex: 5,
        pointerEvents: 'none',
        opacity: 0.06,
        mixBlendMode: 'screen',
        background:
          'conic-gradient(from 0deg at 50% 50%, oklch(0.65 0.18 220) 0deg, oklch(0.65 0.20 280) 120deg, oklch(0.78 0.16 195) 240deg, oklch(0.65 0.18 220) 360deg)',
        animation: 'aurora-spin 60s linear infinite',
        filter: 'blur(80px)',
      }}
    />
  );
}
