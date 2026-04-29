import { v4 as uuid } from 'uuid';
import { client, hasKey, MODEL } from './claude';
import { fallbackConsequences, fallbackCompound } from './fallback';
import {
  CONSEQUENCES_SYSTEM,
  COMPOUND_SYSTEM,
  ASSISTANT_PREFILL,
  userMessage,
  compoundUserMessage,
} from '../prompts/consequences';
import type {
  Consequence,
  CompoundConsequence,
  UUID,
  Horizon,
  Severity,
} from '../types';

const HORIZONS: Horizon[] = ['immediate', 'short', 'long'];
const SEVERITIES: Severity[] = ['calm', 'tense', 'heavy'];
const PACE_MS = 150;
const MAX_CONSEQUENCES = 10;

function normalizeQuotes(s: string): string {
  return s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
}

function stripFences(s: string): string {
  return s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
}

function clipText(s: string): string {
  if (s.length <= 60) return s;
  return s.slice(0, 59) + '…';
}

function coerceConsequence(raw: any, stoneId: UUID): Consequence | null {
  if (!raw || typeof raw !== 'object') return null;
  const text = typeof raw.text === 'string' ? clipText(raw.text.trim()) : null;
  if (!text) return null;
  const horizon: Horizon = HORIZONS.includes(raw.horizon) ? raw.horizon : 'short';
  const severity: Severity = SEVERITIES.includes(raw.severity) ? raw.severity : 'tense';
  let angle = Number(raw.angle);
  if (!Number.isFinite(angle)) angle = Math.random() * 360;
  angle = ((angle % 360) + 360) % 360;
  return { id: uuid(), stoneId, text, horizon, severity, angle };
}

async function liveStreamConsequences(
  decision: string,
  stoneId: UUID,
  onConsequence: (c: Consequence) => void,
  signal?: AbortSignal,
): Promise<void> {
  if (!client) throw new Error('no client');

  const queue: Consequence[] = [];
  let streamDone = false;
  let drained = 0;

  const drainer = setInterval(() => {
    if (drained >= MAX_CONSEQUENCES) {
      clearInterval(drainer);
      return;
    }
    if (queue.length === 0) {
      if (streamDone) clearInterval(drainer);
      return;
    }
    const c = queue.shift()!;
    drained++;
    onConsequence(c);
  }, PACE_MS);

  try {
    const stream = client.messages.stream(
      {
        model: MODEL,
        system: CONSEQUENCES_SYSTEM,
        max_tokens: 1024,
        stop_sequences: ['\n\n'],
        messages: [
          { role: 'user', content: userMessage(decision) },
          { role: 'assistant', content: ASSISTANT_PREFILL },
        ],
      },
      { signal },
    );

    let buffer = ASSISTANT_PREFILL;

    for await (const event of stream) {
      if (signal?.aborted) break;
      const e = event as any;
      if (e.type === 'content_block_delta' && e.delta?.type === 'text_delta') {
        buffer += e.delta.text;
        let nl: number;
        while ((nl = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          line = stripFences(normalizeQuotes(line)).trim();
          if (!line) continue;
          try {
            const obj = JSON.parse(line);
            const c = coerceConsequence(obj, stoneId);
            if (c) queue.push(c);
          } catch {
            // skip malformed
          }
        }
      }
      if (e.type === 'message_stop') break;
    }

    const tail = stripFences(normalizeQuotes(buffer)).trim();
    if (tail) {
      try {
        const obj = JSON.parse(tail);
        const c = coerceConsequence(obj, stoneId);
        if (c) queue.push(c);
      } catch {
        // ignore
      }
    }
  } finally {
    streamDone = true;
  }

  await new Promise<void>((resolve) => {
    const check = setInterval(() => {
      if (
        signal?.aborted ||
        drained >= MAX_CONSEQUENCES ||
        (streamDone && queue.length === 0)
      ) {
        clearInterval(check);
        resolve();
      }
    }, 80);
  });
}

export async function streamConsequences(
  decision: string,
  onConsequence: (c: Consequence) => void,
  opts?: { stoneId?: UUID; signal?: AbortSignal },
): Promise<void> {
  const stoneId = opts?.stoneId ?? uuid();
  if (!hasKey()) {
    return fallbackConsequences(decision, stoneId, onConsequence, opts?.signal);
  }
  try {
    await liveStreamConsequences(decision, stoneId, onConsequence, opts?.signal);
  } catch (err) {
    console.warn('[ripple] live consequences failed, using fallback:', err);
    return fallbackConsequences(decision, stoneId, onConsequence, opts?.signal);
  }
}

async function liveCompound(
  a: Consequence,
  b: Consequence,
  origin: { x: number; y: number },
  onResult: (c: CompoundConsequence) => void,
  signal?: AbortSignal,
): Promise<void> {
  if (!client) throw new Error('no client');
  const resp = await client.messages.create(
    {
      model: MODEL,
      system: COMPOUND_SYSTEM,
      max_tokens: 200,
      messages: [
        { role: 'user', content: compoundUserMessage(a.text, b.text) },
        { role: 'assistant', content: ASSISTANT_PREFILL },
      ],
    },
    { signal },
  );
  const block = (resp.content as any[])[0];
  if (!block || block.type !== 'text') throw new Error('no text block');
  const raw = stripFences(normalizeQuotes(ASSISTANT_PREFILL + block.text)).trim();
  const obj = JSON.parse(raw);
  const c = coerceConsequence(obj, a.stoneId);
  if (!c) throw new Error('coerce failed');
  onResult({ ...c, parents: [a.id, b.id], origin });
}

export async function streamCompound(
  a: Consequence,
  b: Consequence,
  origin: { x: number; y: number },
  onResult: (c: CompoundConsequence) => void,
  opts?: { signal?: AbortSignal },
): Promise<void> {
  if (!hasKey()) {
    return fallbackCompound(a, b, origin, onResult);
  }
  try {
    await liveCompound(a, b, origin, onResult, opts?.signal);
  } catch (err) {
    console.warn('[ripple] live compound failed, using fallback:', err);
    return fallbackCompound(a, b, origin, onResult);
  }
}
