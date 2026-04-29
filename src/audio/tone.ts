// Audio bed: ambient pad + water-drop impact + compound chime.
// Tone.js requires a user gesture before AudioContext can start; we register
// a one-shot listener on first pointerdown / keydown to unlock.

import * as Tone from 'tone';

let started = false;
let unlocking = false;

let pad: Tone.PolySynth | null = null;
let padLoop: Tone.Loop | null = null;
let drop: Tone.MembraneSynth | null = null;
let chime: Tone.Synth | null = null;
let sharedReverb: Tone.Reverb | null = null;

const PAD_CHORDS: string[][] = [
  ['C2', 'G2', 'Eb3'],
  ['Bb1', 'F2', 'D3'],
  ['Ab1', 'Eb2', 'C3'],
  ['G1', 'D2', 'Bb2'],
];

async function build() {
  // Master reverb (long, lush)
  sharedReverb = new Tone.Reverb({ decay: 8, wet: 0.55 }).toDestination();
  await sharedReverb.generate();

  // Pad: PolySynth of triangle voices, low-passed, sent through reverb
  const padFilter = new Tone.Filter({ frequency: 700, type: 'lowpass', Q: 1 });
  const padDelay = new Tone.FeedbackDelay({ delayTime: '8n', feedback: 0.35, wet: 0.25 });
  pad = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 2.4, decay: 0.5, sustain: 0.8, release: 4 },
    volume: -22,
  });
  pad.chain(padFilter, padDelay, sharedReverb);

  // Loop pad chord progression every 8s
  let chordIdx = 0;
  padLoop = new Tone.Loop((time) => {
    pad?.triggerAttackRelease(PAD_CHORDS[chordIdx], '6n', time);
    chordIdx = (chordIdx + 1) % PAD_CHORDS.length;
  }, '8n');
  padLoop.interval = 8;

  // Drop: MembraneSynth tuned low + bandpass for "plip"
  const dropFilter = new Tone.Filter({ frequency: 1100, type: 'bandpass', Q: 3 });
  drop = new Tone.MembraneSynth({
    pitchDecay: 0.012,
    octaves: 6,
    envelope: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.12 },
    volume: -10,
  });
  drop.chain(dropFilter, sharedReverb);

  // Compound chime: simple sine bell into the lush reverb
  chime = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.001, decay: 1.6, sustain: 0, release: 0.6 },
    volume: -16,
  });
  chime.connect(sharedReverb);
}

export async function unlockAudio(): Promise<void> {
  if (started || unlocking) return;
  unlocking = true;
  try {
    await Tone.start();
    if (Tone.getContext().state !== 'running') return;
    await build();
    Tone.getTransport().start();
    padLoop?.start(0);
    started = true;
  } catch (err) {
    console.warn('[ripple] audio unlock failed:', err);
  } finally {
    unlocking = false;
  }
}

export function playDrop(): void {
  if (!started || !drop) return;
  try {
    drop.triggerAttackRelease('C5', '32n');
  } catch {
    // ignore — synth busy
  }
}

export function playCompound(): void {
  if (!started || !chime) return;
  try {
    chime.triggerAttackRelease('A5', '8n');
    // Layer a fifth above for a subtle harmonic sparkle
    setTimeout(() => chime?.triggerAttackRelease('E6', '16n'), 80);
  } catch {
    // ignore
  }
}

export function isStarted(): boolean {
  return started;
}
