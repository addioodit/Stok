import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ACCEPTANCE_VERSION } from '../data/legal';

interface AcceptanceState {
  acceptedVersion: number | null;
  acceptedAt: number | null;
  hasHydrated: boolean;
  accept: () => void;
  reset: () => void;
  setHasHydrated: (v: boolean) => void;
}

export const useAcceptance = create<AcceptanceState>()(
  persist(
    (set) => ({
      acceptedVersion: null,
      acceptedAt: null,
      hasHydrated: false,
      accept: () =>
        set({
          acceptedVersion: ACCEPTANCE_VERSION,
          acceptedAt: Date.now(),
        }),
      reset: () => set({ acceptedVersion: null, acceptedAt: null }),
      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: 'stok.acceptance.v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        acceptedVersion: s.acceptedVersion,
        acceptedAt: s.acceptedAt,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export function isAccepted(state: AcceptanceState): boolean {
  return state.acceptedVersion === ACCEPTANCE_VERSION;
}
