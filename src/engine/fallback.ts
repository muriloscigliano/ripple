import { v4 as uuid } from 'uuid';
import type { Consequence, CompoundConsequence, UUID } from '../types';

type Seed = Omit<Consequence, 'stoneId' | 'id'>;

const QUIT_JOB: Seed[] = [
  { text: 'You walk out at 4:12 pm', horizon: 'immediate', severity: 'calm', angle: 12 },
  { text: 'Tell your sister tonight', horizon: 'immediate', severity: 'tense', angle: 58 },
  { text: 'The slack you forgot to leave', horizon: 'immediate', severity: 'calm', angle: 104 },
  { text: 'Rent due in 12 days', horizon: 'immediate', severity: 'heavy', angle: 151 },
  { text: 'COBRA paperwork on Tuesday', horizon: 'short', severity: 'tense', angle: 196 },
  { text: 'Three months of runway', horizon: 'short', severity: 'heavy', angle: 238 },
  { text: 'You sleep eight hours', horizon: 'short', severity: 'calm', angle: 284 },
  { text: 'You finally write the book', horizon: 'long', severity: 'calm', angle: 322 },
  { text: 'A friend of a friend hires you', horizon: 'long', severity: 'calm', angle: 15 },
  { text: 'You never go back', horizon: 'long', severity: 'heavy', angle: 255 },
];

const TELL_FEEL: Seed[] = [
  { text: 'Your hands shake at the door', horizon: 'immediate', severity: 'tense', angle: 25 },
  { text: 'They look at you for a long time', horizon: 'immediate', severity: 'tense', angle: 70 },
  { text: 'You finally say it out loud', horizon: 'immediate', severity: 'calm', angle: 118 },
  { text: 'A long silence on the couch', horizon: 'immediate', severity: 'heavy', angle: 165 },
  { text: 'Two days of not knowing', horizon: 'short', severity: 'heavy', angle: 210 },
  { text: 'A walk along the river together', horizon: 'short', severity: 'calm', angle: 255 },
  { text: 'They write back at 2am', horizon: 'short', severity: 'tense', angle: 300 },
  { text: 'You stop rehearsing it in the shower', horizon: 'long', severity: 'calm', angle: 340 },
  { text: 'Your friendship has a new shape', horizon: 'long', severity: 'tense', angle: 40 },
  { text: 'You never wonder again', horizon: 'long', severity: 'calm', angle: 280 },
];

const MOVE_AWAY: Seed[] = [
  { text: 'Boxes by the door at midnight', horizon: 'immediate', severity: 'calm', angle: 18 },
  { text: 'The cat hides under the sink', horizon: 'immediate', severity: 'tense', angle: 65 },
  { text: 'You see the city from a U-Haul', horizon: 'immediate', severity: 'calm', angle: 112 },
  { text: 'Goodbye dinner runs too long', horizon: 'immediate', severity: 'heavy', angle: 158 },
  { text: 'A new bakery on the corner', horizon: 'short', severity: 'calm', angle: 202 },
  { text: 'You miss someone every Tuesday', horizon: 'short', severity: 'heavy', angle: 248 },
  { text: 'Three boxes still unpacked', horizon: 'short', severity: 'tense', angle: 290 },
  { text: 'Your accent slowly changes', horizon: 'long', severity: 'calm', angle: 332 },
  { text: 'You stop calling it home', horizon: 'long', severity: 'heavy', angle: 22 },
  { text: 'A stranger becomes your closest friend', horizon: 'long', severity: 'calm', angle: 268 },
];

const DEFAULT: Seed[] = [
  { text: 'A small change in the room', horizon: 'immediate', severity: 'calm', angle: 30 },
  { text: 'You notice your breathing', horizon: 'immediate', severity: 'calm', angle: 75 },
  { text: 'Someone eventually finds out', horizon: 'immediate', severity: 'tense', angle: 120 },
  { text: 'A door you cannot un-open', horizon: 'immediate', severity: 'heavy', angle: 170 },
  { text: 'Sleep is different that week', horizon: 'short', severity: 'tense', angle: 215 },
  { text: 'A friend says they saw it coming', horizon: 'short', severity: 'calm', angle: 260 },
  { text: 'You write a long email and delete it', horizon: 'short', severity: 'heavy', angle: 305 },
  { text: 'A photograph means something else now', horizon: 'long', severity: 'tense', angle: 345 },
  { text: 'You become someone slightly different', horizon: 'long', severity: 'calm', angle: 50 },
  { text: 'It becomes a story you tell', horizon: 'long', severity: 'calm', angle: 295 },
];

const COMPOUNDS = [
  'Two ripples remember each other',
  'The first decision asks the second to wait',
  'You sleep on the couch tonight',
  'A single sentence rearranges the week',
  'Both rooms feel different now',
];

function pick(decision: string): Seed[] {
  const d = decision.toLowerCase();
  if (d.includes('quit') || d.includes('job')) return QUIT_JOB;
  if (d.includes('feel') || d.includes('tell') || d.includes('love')) return TELL_FEEL;
  if (d.includes('move') || d.includes('city') || d.includes('country')) return MOVE_AWAY;
  return DEFAULT;
}

export async function fallbackConsequences(
  decision: string,
  stoneId: UUID,
  onConsequence: (c: Consequence) => void,
  signal?: AbortSignal,
): Promise<void> {
  const items = pick(decision);
  for (const item of items) {
    if (signal?.aborted) return;
    await new Promise((r) => setTimeout(r, 150));
    onConsequence({ ...item, id: uuid(), stoneId });
  }
}

export async function fallbackCompound(
  a: Consequence,
  b: Consequence,
  origin: { x: number; y: number },
  onResult: (c: CompoundConsequence) => void,
): Promise<void> {
  await new Promise((r) => setTimeout(r, 600));
  const text = COMPOUNDS[Math.floor(Math.random() * COMPOUNDS.length)];
  onResult({
    id: uuid(),
    stoneId: a.stoneId,
    text,
    horizon: 'short',
    severity: 'tense',
    angle: 0,
    parents: [a.id, b.id],
    origin,
  });
}
