import { useRef, useState } from 'react';
import { Pond } from './pond/Pond';
import { Vignette } from './ui/Vignette';
import { Aurora } from './ui/Aurora';
import { Title } from './ui/Title';
import { Cursor } from './ui/Cursor';
import type { PondHandle } from './pond/sketch';
import { streamConsequences } from './engine/stream';

export default function App() {
  const pondRef = useRef<PondHandle>(null);
  const [cursor, setCursor] = useState<{ x: number | null; y: number | null }>({
    x: null,
    y: null,
  });

  const onTest = async () => {
    console.log('[ripple] test stream...');
    await streamConsequences('I quit my job today', (c) => {
      console.log('[ripple]', c.horizon, c.severity, c.text);
    });
    console.log('[ripple] done.');
  };

  const onDrop = (id: string, x: number, y: number) => {
    console.log('[ripple] drop', id.slice(0, 8), Math.round(x), Math.round(y));
  };

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
        onDrop={onDrop}
        onCursorMove={(x, y) => setCursor({ x, y })}
      />
      <Aurora />
      <Vignette />
      <Cursor x={cursor.x} y={cursor.y} />
      <Title />
      <button
        onClick={(e) => {
          e.stopPropagation();
          onTest();
        }}
        style={{
          position: 'absolute',
          right: 24,
          bottom: 24,
          zIndex: 30,
          padding: '8px 14px',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-whisper)',
          color: 'var(--color-ink-secondary)',
          background: 'oklch(1 0 0 / 0.04)',
          border: '1px solid var(--color-hairline)',
          borderRadius: 'var(--radius-pill)',
          letterSpacing: 'var(--tracking-mono)',
          textTransform: 'lowercase',
        }}
      >
        test claude
      </button>
    </div>
  );
}
