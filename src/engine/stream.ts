import { v4 as uuid } from 'uuid';
import { hasKey } from './claude';
import { fallbackConsequences, fallbackCompound } from './fallback';
import type { Consequence, CompoundConsequence, UUID } from '../types';

export async function streamConsequences(
  decision: string,
  onConsequence: (c: Consequence) => void,
  opts?: { stoneId?: UUID; signal?: AbortSignal },
): Promise<void> {
  const stoneId = opts?.stoneId ?? uuid();
  if (!hasKey()) {
    return fallbackConsequences(decision, stoneId, onConsequence, opts?.signal);
  }
  // Phase 3 will replace this with the live messages.stream NDJSON path.
  return fallbackConsequences(decision, stoneId, onConsequence, opts?.signal);
}

export async function streamCompound(
  a: Consequence,
  b: Consequence,
  origin: { x: number; y: number },
  onResult: (c: CompoundConsequence) => void,
  _opts?: { signal?: AbortSignal },
): Promise<void> {
  if (!hasKey()) {
    return fallbackCompound(a, b, origin, onResult);
  }
  return fallbackCompound(a, b, origin, onResult);
}
