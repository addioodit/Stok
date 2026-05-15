import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ProfileState {
  username: string | null;
  displayName: string;
  joinedAt: number | null;
  hasHydrated: boolean;
  setProfile: (username: string, displayName: string) => void;
  updateDisplayName: (displayName: string) => void;
  changeUsername: (username: string) => void;
  setHasHydrated: (v: boolean) => void;
}

export const useProfile = create<ProfileState>()(
  persist(
    (set) => ({
      username: null,
      displayName: '',
      joinedAt: null,
      hasHydrated: false,
      setProfile: (username, displayName) =>
        set({
          username: username.trim(),
          displayName: displayName.trim(),
          joinedAt: Date.now(),
        }),
      updateDisplayName: (displayName) =>
        set({ displayName: displayName.trim() }),
      changeUsername: (username) => set({ username: username.trim() }),
      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: 'stok.profile.v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        username: s.username,
        displayName: s.displayName,
        joinedAt: s.joinedAt,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
