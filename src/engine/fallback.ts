import { v4 as uuid } from 'uuid';
import type { Consequence, CompoundConsequence, UUID } from '../types';

type Seed = Omit<Consequence, 'stoneId' | 'id'>;

const QUIT_JOB: Seed[] = [
  { text: 'You walk out at 4:12 pm', horizon: 'immediate', severity: 'calm', angle: 12 },
  { text: 'Your shoulders drop for the first time', horizon: 'immediate', severity: 'calm', angle: 58 },
  { text: 'You text your sister and she says yes', horizon: 'immediate', severity: 'calm', angle: 104 },
  { text: 'Rent due in 12 days', horizon: 'immediate', severity: 'heavy', angle: 151 },
  { text: 'COBRA covers the gap', horizon: 'short', severity: 'calm', angle: 196 },
  { text: 'You sleep eight hours straight', horizon: 'short', severity: 'calm', angle: 238 },
  { text: 'A friend of a friend wants to hire you', horizon: 'short', severity: 'calm', angle: 284 },
  { text: 'You finally write the book', horizon: 'long', severity: 'calm', angle: 322 },
  { text: 'Your savings buy you a real summer', horizon: 'long', severity: 'calm', angle: 15 },
  { text: 'You never go back, and you never miss it', horizon: 'long', severity: 'calm', angle: 255 },
];

const TELL_FEEL: Seed[] = [
  { text: 'You finally say it out loud', horizon: 'immediate', severity: 'calm', angle: 25 },
  { text: 'They smile before they answer', horizon: 'immediate', severity: 'calm', angle: 70 },
  { text: 'You both laugh at how long it took', horizon: 'immediate', severity: 'calm', angle: 118 },
  { text: 'Your hands stop shaking', horizon: 'immediate', severity: 'tense', angle: 165 },
  { text: 'They write back at 2am, and it is good', horizon: 'short', severity: 'calm', angle: 210 },
  { text: 'A walk along the river together', horizon: 'short', severity: 'calm', angle: 255 },
  { text: 'You laugh more this week', horizon: 'short', severity: 'calm', angle: 300 },
  { text: 'You stop rehearsing it in the shower', horizon: 'long', severity: 'calm', angle: 340 },
  { text: 'Your friendship has a warmer shape', horizon: 'long', severity: 'calm', angle: 40 },
  { text: 'You never wonder again', horizon: 'long', severity: 'calm', angle: 280 },
];

const MOVE_AWAY: Seed[] = [
  { text: 'Boxes by the door at midnight', horizon: 'immediate', severity: 'calm', angle: 18 },
  { text: 'The cat investigates by moonlight', horizon: 'immediate', severity: 'calm', angle: 65 },
  { text: 'You see the city from a U-Haul', horizon: 'immediate', severity: 'calm', angle: 112 },
  { text: 'A goodbye dinner that ends in laughs', horizon: 'immediate', severity: 'calm', angle: 158 },
  { text: 'A new bakery becomes your bakery', horizon: 'short', severity: 'calm', angle: 202 },
  { text: 'You miss someone every Tuesday', horizon: 'short', severity: 'heavy', angle: 248 },
  { text: 'Sunday morning light, new windows', horizon: 'short', severity: 'calm', angle: 290 },
  { text: 'Your accent slowly changes', horizon: 'long', severity: 'calm', angle: 332 },
  { text: 'A stranger becomes your closest friend', horizon: 'long', severity: 'calm', angle: 22 },
  { text: 'You build a life that fits you', horizon: 'long', severity: 'calm', angle: 268 },
];

const SAID_YES: Seed[] = [
  { text: 'Your hands stop shaking', horizon: 'immediate', severity: 'calm', angle: 12 },
  { text: 'A grin you cannot hide all day', horizon: 'immediate', severity: 'calm', angle: 70 },
  { text: 'You text your sister immediately', horizon: 'immediate', severity: 'calm', angle: 130 },
  { text: 'The sky looks slightly different', horizon: 'immediate', severity: 'calm', angle: 195 },
  { text: 'A weekend of celebration ahead', horizon: 'short', severity: 'calm', angle: 240 },
  { text: 'You sleep deeply that night', horizon: 'short', severity: 'calm', angle: 285 },
  { text: 'Your mother cries the good tears', horizon: 'short', severity: 'calm', angle: 325 },
  { text: 'A new chapter begins quietly', horizon: 'long', severity: 'calm', angle: 25 },
  { text: 'The future just got brighter', horizon: 'long', severity: 'calm', angle: 165 },
  { text: 'You knew the answer before you said it', horizon: 'long', severity: 'calm', angle: 270 },
];

const PROPOSAL: Seed[] = [
  { text: 'Their breath catches before yes', horizon: 'immediate', severity: 'calm', angle: 18 },
  { text: 'You both laugh through the tears', horizon: 'immediate', severity: 'calm', angle: 80 },
  { text: 'You call your mother first', horizon: 'immediate', severity: 'calm', angle: 140 },
  { text: 'Friends arrive with champagne by 9pm', horizon: 'immediate', severity: 'calm', angle: 200 },
  { text: 'Choosing the words for the rings', horizon: 'short', severity: 'calm', angle: 250 },
  { text: 'A small dinner this weekend', horizon: 'short', severity: 'calm', angle: 295 },
  { text: 'Picking out the venue together', horizon: 'short', severity: 'calm', angle: 335 },
  { text: 'Years of small Sundays together', horizon: 'long', severity: 'calm', angle: 30 },
  { text: 'Your kids will hear the story', horizon: 'long', severity: 'calm', angle: 175 },
  { text: 'Worth every uncertain second', horizon: 'long', severity: 'calm', angle: 280 },
];

const START_COMPANY: Seed[] = [
  { text: 'You sign the papers at noon', horizon: 'immediate', severity: 'calm', angle: 22 },
  { text: 'Your first customer says yes', horizon: 'immediate', severity: 'calm', angle: 88 },
  { text: 'Your old boss writes a kind email', horizon: 'immediate', severity: 'calm', angle: 148 },
  { text: 'Twelve hour days that feel right', horizon: 'immediate', severity: 'calm', angle: 210 },
  { text: 'Three months of runway', horizon: 'short', severity: 'heavy', angle: 256 },
  { text: 'Hiring the friend who believed first', horizon: 'short', severity: 'calm', angle: 302 },
  { text: 'Your name on the door', horizon: 'short', severity: 'calm', angle: 342 },
  { text: 'Building something that is yours', horizon: 'long', severity: 'calm', angle: 38 },
  { text: 'You finally choose your hours', horizon: 'long', severity: 'calm', angle: 178 },
  { text: 'A team of seven by spring', horizon: 'long', severity: 'calm', angle: 268 },
];

const DEFAULT: Seed[] = [
  { text: 'A small change in the room', horizon: 'immediate', severity: 'calm', angle: 30 },
  { text: 'You notice your breathing', horizon: 'immediate', severity: 'calm', angle: 75 },
  { text: 'A weight shifts off your chest', horizon: 'immediate', severity: 'calm', angle: 120 },
  { text: 'You walk a little taller this week', horizon: 'immediate', severity: 'calm', angle: 170 },
  { text: 'Sleep arrives easier this week', horizon: 'short', severity: 'calm', angle: 215 },
  { text: 'A friend says they saw it coming', horizon: 'short', severity: 'calm', angle: 260 },
  { text: 'You write a long letter and send it', horizon: 'short', severity: 'calm', angle: 305 },
  { text: 'A photograph means something kinder now', horizon: 'long', severity: 'calm', angle: 345 },
  { text: 'You become someone slightly braver', horizon: 'long', severity: 'calm', angle: 50 },
  { text: 'It becomes a story you tell well', horizon: 'long', severity: 'calm', angle: 295 },
];

const COMPOUNDS = [
  'Two ripples remember each other',
  'The room finds its new shape',
  'A single sentence rearranges the week',
  'Both decisions become one Tuesday',
  'You sleep better than you expected',
  'The future arrives a little earlier',
];

function pick(decision: string): Seed[] {
  const d = decision.toLowerCase();
  // Most-specific keywords first
  if (d.includes('marry') || d.includes('propose') || d.includes('engaged')) return PROPOSAL;
  if (d.includes('start') && (d.includes('company') || d.includes('business'))) return START_COMPANY;
  if (d.includes('company') || d.includes('startup') || d.includes('business')) return START_COMPANY;
  if (d.includes('said yes') || d.includes(' yes')) return SAID_YES;
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
