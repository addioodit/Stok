import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DividendState {
  receivedIds: string[];
  markReceived: (id: string) => void;
  unmarkReceived: (id: string) => void;
  isReceived: (id: string) => boolean;
}

export const useDividends = create<DividendState>()(
  persist(
    (set, get) => ({
      receivedIds: [],
      markReceived: (id) =>
        set((s) =>
          s.receivedIds.includes(id)
            ? s
            : { receivedIds: [...s.receivedIds, id] },
        ),
      unmarkReceived: (id) =>
        set((s) => ({ receivedIds: s.receivedIds.filter((x) => x !== id) })),
      isReceived: (id) => get().receivedIds.includes(id),
    }),
    {
      name: 'stok.dividends.v1',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
