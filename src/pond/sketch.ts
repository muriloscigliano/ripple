import p5 from 'p5';
import { v4 as uuid } from 'uuid';
import type { Wavefront, Intersection, UUID } from '../types';

export type PondHandle = {
  dropStone(x: number, y: number, intensity: number): UUID;
  getWavefronts(): Wavefront[];
  getIntersections(): Intersection[];
  setHover(x: number | null, y: number | null): void;
  destroy(): void;
};

export function createPond(container: HTMLElement): PondHandle {
  let instance: p5 | null = null;

  const sketch = (p: p5) => {
    p.setup = () => {
      const c = p.createCanvas(container.clientWidth, container.clientHeight);
      c.parent(container);
      p.background(5, 10, 24);
    };
    p.draw = () => {
      // Phase 1: solid background only. Wave kernel arrives in Phase 2.
      p.background(5, 10, 24);
    };
    p.windowResized = () => {
      p.resizeCanvas(container.clientWidth, container.clientHeight);
    };
  };

  instance = new p5(sketch, container);

  return {
    dropStone(_x, _y, _intensity) {
      // Phase 2: writes perturbation into buffer + registers analytic stone.
      return uuid();
    },
    getWavefronts() {
      return [];
    },
    getIntersections() {
      return [];
    },
    setHover(_x, _y) {
      // Phase 2: cursor presence perturbation.
    },
    destroy() {
      instance?.remove();
      instance = null;
    },
  };
}
