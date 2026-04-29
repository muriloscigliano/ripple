import { create } from 'zustand';
import type { Stone, Consequence, CompoundConsequence, UUID } from './types';

type State = {
  stones: Stone[];
  consequences: Consequence[];
  compounds: CompoundConsequence[];
  emittedPairs: Set<string>;

  addStone: (s: Stone) => void;
  addConsequence: (c: Consequence) => void;
  addCompound: (c: CompoundConsequence) => void;
  markPairEmitted: (a: UUID, b: UUID) => boolean;
  reset: () => void;
};

const pairKey = (a: UUID, b: UUID) => (a < b ? `${a}|${b}` : `${b}|${a}`);

export const useStore = create<State>()((set, get) => ({
  stones: [],
  consequences: [],
  compounds: [],
  emittedPairs: new Set(),

  addStone: (s) => set((st) => ({ stones: [...st.stones, s] })),
  addConsequence: (c) => set((st) => ({ consequences: [...st.consequences, c] })),
  addCompound: (c) => set((st) => ({ compounds: [...st.compounds, c] })),
  markPairEmitted: (a, b) => {
    const k = pairKey(a, b);
    if (get().emittedPairs.has(k)) return false;
    set((st) => {
      const next = new Set(st.emittedPairs);
      next.add(k);
      return { emittedPairs: next };
    });
    return true;
  },
  reset: () =>
    set({ stones: [], consequences: [], compounds: [], emittedPairs: new Set() }),
}));
