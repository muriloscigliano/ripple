export type UUID = string;

export type Stone = {
  id: UUID;
  x: number;
  y: number;
  decision: string;
  t0: number;
  intensity: number;
};

export type Horizon = 'immediate' | 'short' | 'long';
export type Severity = 'calm' | 'tense' | 'heavy';

export type Consequence = {
  id: UUID;
  stoneId: UUID;
  text: string;
  horizon: Horizon;
  severity: Severity;
  angle: number;
};

export type CompoundConsequence = Consequence & {
  parents: [UUID, UUID];
  origin: { x: number; y: number };
};

export type Wavefront = {
  stoneId: UUID;
  cx: number;
  cy: number;
  radius: number;
  age: number;
  amplitude: number;
};

export type Intersection = {
  a: UUID;
  b: UUID;
  x: number;
  y: number;
  firstSeenAt: number;
};
