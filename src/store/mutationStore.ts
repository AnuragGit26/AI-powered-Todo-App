import { create } from 'zustand';

interface MutationStoreState {
    activeCrudCount: number;
    beginCrud: () => void;
    endCrud: () => void;
}

export const useMutationStore = create<MutationStoreState>((set) => ({
    activeCrudCount: 0,
    beginCrud: () => set((state) => ({ activeCrudCount: state.activeCrudCount + 1 })),
    endCrud: () => set((state) => ({ activeCrudCount: Math.max(0, state.activeCrudCount - 1) })),
}));


