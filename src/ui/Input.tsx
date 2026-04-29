import { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { inputFadeIn } from '../motion/presets';

const PRESETS = [
  'I quit my job today.',
  "I'm telling them how I feel.",
  "I'm moving across the country.",
];

type Props = {
  onSubmit: (text: string) => void;
  disabled?: boolean;
};

export function Input({ onSubmit, disabled }: Props) {
  const [value, setValue] = useState('');

  const submit = (text: string) => {
    const t = text.trim();
    if (!t) return;
    onSubmit(t);
    setValue('');
  };

  const onSubmitForm = (e: FormEvent) => {
    e.preventDefault();
    submit(value);
  };

  return (
    <motion.div
      variants={inputFadeIn}
      initial="hidden"
      animate="visible"
      style={{
        position: 'absolute',
        bottom: 56,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 25,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <div style={{ display: 'flex', gap: 8 }}>
        {PRESETS.map((p) => (
          <button
            key={p}
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              submit(p);
            }}
            style={{
              padding: '6px 14px',
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-caption)',
              color: 'var(--color-ink-secondary)',
              background: 'oklch(1 0 0 / 0.04)',
              border: '1px solid var(--color-hairline)',
              borderRadius: 'var(--radius-pill)',
              letterSpacing: 'var(--tracking-tight)',
              transition: 'border-color 240ms var(--ease-water), background 240ms var(--ease-water)',
              opacity: disabled ? 0.4 : 1,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-hairline-active)';
              e.currentTarget.style.background = 'oklch(1 0 0 / 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-hairline)';
              e.currentTarget.style.background = 'oklch(1 0 0 / 0.04)';
            }}
          >
            {p}
          </button>
        ))}
      </div>
      <form onSubmit={onSubmitForm} onClick={(e) => e.stopPropagation()}>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="What did you decide?"
          disabled={disabled}
          autoFocus
          style={{
            width: 480,
            height: 56,
            padding: '0 var(--pad-input-x)',
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-card)',
            fontStyle: 'italic',
            color: 'var(--color-ink-primary)',
            background: 'oklch(0.10 0.025 250 / 0.55)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--color-hairline)',
            borderRadius: 'var(--radius-input)',
            letterSpacing: 'var(--tracking-display)',
            textAlign: 'center',
            transition: 'border-color 240ms var(--ease-water)',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-hairline-active)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-hairline)';
          }}
        />
      </form>
    </motion.div>
  );
}
