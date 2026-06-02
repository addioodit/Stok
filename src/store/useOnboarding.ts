import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingState {
  seen: boolean;
  hasHydrated: boolean;
  markSeen: () => void;
  resetSeen: () => void;
  setHasHydrated: (v: boolean) => void;
}

export const useOnboarding = create<OnboardingState>()(
  persist(
    (set) => ({
      seen: false,
      hasHydrated: false,
      markSeen: () => set({ seen: true }),
      resetSeen: () => set({ seen: false }),
      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: 'stok.onboarding.v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ seen: s.seen }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
