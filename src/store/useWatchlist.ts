import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface WatchlistState {
  symbols: string[];
  toggle: (symbol: string) => void;
  isWatched: (symbol: string) => boolean;
}

export const useWatchlist = create<WatchlistState>()(
  persist(
    (set, get) => ({
      symbols: [],
      toggle: (symbol) =>
        set((s) =>
          s.symbols.includes(symbol)
            ? { symbols: s.symbols.filter((x) => x !== symbol) }
            : { symbols: [...s.symbols, symbol] },
        ),
      isWatched: (symbol) => get().symbols.includes(symbol),
    }),
    {
      name: 'stok.watchlist.v1',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
