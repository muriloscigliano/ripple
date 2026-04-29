import Anthropic from '@anthropic-ai/sdk';

const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

export const hasKey = (): boolean => Boolean(apiKey && apiKey.length > 10);

export const client = hasKey()
  ? new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
  : null;

export const MODEL = 'claude-haiku-4-5-20251001';

if (!hasKey()) {
  console.warn('[ripple] VITE_ANTHROPIC_API_KEY missing — running in fallback-only mode.');
}
