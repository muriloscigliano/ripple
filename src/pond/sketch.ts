import p5 from 'p5';
import { v4 as uuid } from 'uuid';
import type { Wavefront, Intersection, UUID } from '../types';

export type PondHandle = {
  dropStone(x: number, y: number, intensity: number): UUID;
  dropPerturbation(x: number, y: number, intensity: number): void;
  getWavefronts(): Wavefront[];
  getIntersections(): Intersection[];
  setHover(x: number | null, y: number | null): void;
  setSlowMo(untilMs: number): void;
  destroy(): void;
};

const BW = 360;
const BH = 225;
const DAMPING = 0.995;
const WAVE_SPEED_PX_PER_MS = 0.18;
const DECAY_PER_MS = 3.0e-4;
const REF_R = 200;
const AMPLITUDE_CULL = 0.04;

type AnalyticStone = { id: UUID; cx: number; cy: number; t0: number };

export function createPond(container: HTMLElement): PondHandle {
  let instance: p5 | null = null;

  // Wave buffers
  let cur = new Float32Array(BW * BH);
  let prev = new Float32Array(BW * BH);

  // Offscreen render target
  const offscreen = document.createElement('canvas');
  offscreen.width = BW;
  offscreen.height = BH;
  const offCtx = offscreen.getContext('2d', { alpha: false })!;
  const imageData = offCtx.createImageData(BW, BH);
  const px = imageData.data;

  // Analytic state
  const stones: AnalyticStone[] = [];
  const emittedPairs = new Set<string>();
  const pendingEmissions: Intersection[] = [];
  const pairKey = (a: UUID, b: UUID) => (a < b ? `${a}|${b}` : `${b}|${a}`);

  // Hover state
  let hoverX: number | null = null;
  let hoverY: number | null = null;
  let lastHoverX: number | null = null;
  let lastHoverY: number | null = null;

  // Slow-mo (used by Phase 5 compound bloom)
  let slowMoUntil = 0;
  let slowMoCounter = 0;

  // Canvas size cache
  let canvasW = container.clientWidth;
  let canvasH = container.clientHeight;

  const perturb = (x: number, y: number, intensity: number) => {
    const bx = Math.floor((x / canvasW) * BW);
    const by = Math.floor((y / canvasH) * BH);
    const r = 3;
    const power = 1.2 * intensity;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r * r) continue;
        const px2 = bx + dx;
        const py2 = by + dy;
        if (px2 < 1 || px2 >= BW - 1 || py2 < 1 || py2 >= BH - 1) continue;
        prev[px2 + py2 * BW] += power;
      }
    }
  };

  const sketch = (p: p5) => {
    p.setup = () => {
      const c = p.createCanvas(canvasW, canvasH);
      c.parent(container);
      p.noSmooth();
      cur.fill(0);
      prev.fill(0);
    };

    p.windowResized = () => {
      canvasW = container.clientWidth;
      canvasH = container.clientHeight;
      p.resizeCanvas(canvasW, canvasH);
    };

    p.draw = () => {
      const now = performance.now();

      // Slow-mo: only run kernel every 3rd frame while active
      let runKernel = true;
      if (now < slowMoUntil) {
        slowMoCounter = (slowMoCounter + 1) % 3;
        runKernel = slowMoCounter === 0;
      }

      // Apply hover perturbation only on movement
      if (
        hoverX !== null &&
        hoverY !== null &&
        (hoverX !== lastHoverX || hoverY !== lastHoverY)
      ) {
        const bx = Math.floor((hoverX / canvasW) * BW);
        const by = Math.floor((hoverY / canvasH) * BH);
        if (bx >= 1 && bx < BW - 1 && by >= 1 && by < BH - 1) {
          prev[bx + by * BW] += 0.06;
        }
        lastHoverX = hoverX;
        lastHoverY = hoverY;
      }

      if (runKernel) {
        // Wave kernel — Hugo Elias 2D water
        for (let y = 1; y < BH - 1; y++) {
          const row = y * BW;
          for (let x = 1; x < BW - 1; x++) {
            const i = x + row;
            let n =
              (cur[i - 1] + cur[i + 1] + cur[i - BW] + cur[i + BW]) * 0.5 -
              prev[i];
            n *= DAMPING;
            prev[i] = n;
          }
        }
        // Swap: the buffer we just wrote into ("prev") becomes the new "current"
        const tmp = cur;
        cur = prev;
        prev = tmp;
      }

      // NaN guard every 60 frames
      if (p.frameCount % 60 === 0) {
        if (!isFinite(cur[Math.floor(BW * BH * 0.5)])) {
          cur.fill(0);
          prev.fill(0);
        }
      }

      // Render: signed ramp into ImageData with aggressive contrast.
      // Amplitude x3.0 + gamma 0.4 + bright cyan-white highlight makes
      // the entire wave field readable, not just the leading edge.
      for (let i = 0; i < BW * BH; i++) {
        const raw = cur[i] * 3.0;
        const t = raw < -1 ? -1 : raw > 1 ? 1 : raw;
        let r: number, g: number, b: number;
        if (t < 0) {
          const k = Math.pow(-t, 0.4);
          // void rgb(11,17,29) → deep teal rgb(20,80,108)
          r = 11 + k * 9;
          g = 17 + k * 63;
          b = 29 + k * 79;
        } else {
          const k = Math.pow(t, 0.4);
          // void → bright cyan-white rgb(220,245,255)
          r = 11 + k * 209;
          g = 17 + k * 228;
          b = 29 + k * 226;
        }
        const idx = i * 4;
        px[idx] = r;
        px[idx + 1] = g;
        px[idx + 2] = b;
        px[idx + 3] = 255;
      }
      offCtx.putImageData(imageData, 0, 0);

      // Upscale to main canvas with smoothing
      const mainCtx = (p.drawingContext as CanvasRenderingContext2D);
      mainCtx.imageSmoothingEnabled = true;
      mainCtx.imageSmoothingQuality = 'high';
      mainCtx.drawImage(offscreen, 0, 0, canvasW, canvasH);

      // Additive overlay: bright stroked ring at each analytic wavefront +
      // brief splash flash at the drop point. Three stacked strokes per
      // ring fake a bloom without expensive shadowBlur.
      mainCtx.save();
      mainCtx.globalCompositeOperation = 'lighter';
      const diag = Math.hypot(canvasW, canvasH);
      for (const s of stones) {
        const age = now - s.t0;
        const radius = WAVE_SPEED_PX_PER_MS * age;
        const amp =
          Math.exp(-DECAY_PER_MS * age) / Math.max(1, Math.sqrt(radius / REF_R));

        // Splash flash (first 320ms only)
        if (age < 320) {
          const k = 1 - age / 320;
          const dotR = 6 + (1 - k) * 14;
          mainCtx.fillStyle = `rgba(220, 245, 255, ${k * 0.85})`;
          mainCtx.beginPath();
          mainCtx.arc(s.cx, s.cy, dotR, 0, Math.PI * 2);
          mainCtx.fill();
        }

        // Ring at the leading wavefront
        if (radius > 8 && radius < diag && amp > 0.05) {
          const a0 = Math.min(1, amp * 1.4);
          // Outermost soft halo
          mainCtx.strokeStyle = `rgba(170, 230, 255, ${a0 * 0.20})`;
          mainCtx.lineWidth = 14;
          mainCtx.beginPath();
          mainCtx.arc(s.cx, s.cy, radius, 0, Math.PI * 2);
          mainCtx.stroke();
          // Mid bloom
          mainCtx.strokeStyle = `rgba(190, 240, 255, ${a0 * 0.45})`;
          mainCtx.lineWidth = 6;
          mainCtx.beginPath();
          mainCtx.arc(s.cx, s.cy, radius, 0, Math.PI * 2);
          mainCtx.stroke();
          // Sharp inner edge
          mainCtx.strokeStyle = `rgba(230, 250, 255, ${a0})`;
          mainCtx.lineWidth = 1.5;
          mainCtx.beginPath();
          mainCtx.arc(s.cx, s.cy, radius, 0, Math.PI * 2);
          mainCtx.stroke();
        }
      }
      mainCtx.restore();

      // Cull dead stones
      for (let i = stones.length - 1; i >= 0; i--) {
        const s = stones[i];
        const age = now - s.t0;
        const radius = WAVE_SPEED_PX_PER_MS * age;
        const amp = Math.exp(-DECAY_PER_MS * age) / Math.max(1, Math.sqrt(radius / REF_R));
        if (amp < AMPLITUDE_CULL || radius > Math.hypot(canvasW, canvasH) + 200) {
          stones.splice(i, 1);
        }
      }
    };
  };

  instance = new p5(sketch, container);

  return {
    dropStone(x, y, intensity) {
      perturb(x, y, intensity);
      const id = uuid();
      stones.push({ id, cx: x, cy: y, t0: performance.now() });
      return id;
    },

    dropPerturbation(x, y, intensity) {
      // Visual ripple only — no analytic stone, no intersection tracking.
      perturb(x, y, intensity);
    },

    getWavefronts(): Wavefront[] {
      const now = performance.now();
      return stones.map((s) => {
        const age = now - s.t0;
        const radius = WAVE_SPEED_PX_PER_MS * age;
        const amplitude =
          Math.exp(-DECAY_PER_MS * age) / Math.max(1, Math.sqrt(radius / REF_R));
        return { stoneId: s.id, cx: s.cx, cy: s.cy, radius, age, amplitude };
      });
    },

    getIntersections(): Intersection[] {
      const wfs = this.getWavefronts();
      const now = performance.now();
      for (let i = 0; i < wfs.length; i++) {
        for (let j = i + 1; j < wfs.length; j++) {
          const a = wfs[i];
          const b = wfs[j];
          const k = pairKey(a.stoneId, b.stoneId);
          if (emittedPairs.has(k)) continue;
          const dx = b.cx - a.cx;
          const dy = b.cy - a.cy;
          const d = Math.hypot(dx, dy);
          if (d === 0) continue;
          if (d >= a.radius + b.radius) continue;
          if (d <= Math.abs(a.radius - b.radius)) continue;
          const aLen = (d * d + a.radius * a.radius - b.radius * b.radius) / (2 * d);
          const h2 = a.radius * a.radius - aLen * aLen;
          if (h2 < 0) continue;
          const h = Math.sqrt(h2);
          const ux = dx / d;
          const uy = dy / d;
          const px2x = a.cx + ux * aLen;
          const px2y = a.cy + uy * aLen;
          const ccx = canvasW * 0.5;
          const ccy = canvasH * 0.5;
          const i1x = px2x + h * uy;
          const i1y = px2y - h * ux;
          const i2x = px2x - h * uy;
          const i2y = px2y + h * ux;
          const d1 = Math.hypot(i1x - ccx, i1y - ccy);
          const d2 = Math.hypot(i2x - ccx, i2y - ccy);
          const pick = d1 <= d2 ? { x: i1x, y: i1y } : { x: i2x, y: i2y };
          emittedPairs.add(k);
          pendingEmissions.push({
            a: a.stoneId,
            b: b.stoneId,
            x: pick.x,
            y: pick.y,
            firstSeenAt: now,
          });
        }
      }
      const out = pendingEmissions.slice();
      pendingEmissions.length = 0;
      return out;
    },

    setHover(x, y) {
      hoverX = x;
      hoverY = y;
    },

    setSlowMo(untilMs) {
      slowMoUntil = untilMs;
    },

    destroy() {
      instance?.remove();
      instance = null;
    },
  };
}
