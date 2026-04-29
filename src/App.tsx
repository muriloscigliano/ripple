import { useRef } from 'react';
import { Pond } from './pond/Pond';
import { Vignette } from './ui/Vignette';
import { Title } from './ui/Title';
import type { PondHandle } from './pond/sketch';
import { streamConsequences } from './engine/stream';

export default function App() {
  const pondRef = useRef<PondHandle>(null);

  const onTest = async () => {
    console.log('[ripple] test stream...');
    await streamConsequences('I quit my job today', (c) => {
      console.log('[ripple]', c.horizon, c.severity, c.text);
    });
    console.log('[ripple] done.');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--color-surface-void)',
      }}
    >
      <Pond ref={pondRef} />
      <Vignette />
      <Title />
      <button
        onClick={onTest}
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
