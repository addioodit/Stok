import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Holding } from '../types';

interface PortfolioState {
  holdings: Holding[];
  upsert: (h: Holding) => void;
  addLot: (symbol: string, quantity: number, price: number) => void;
  remove: (symbol: string) => void;
  clear: () => void;
}

export const usePortfolio = create<PortfolioState>()(
  persist(
    (set) => ({
      holdings: [],
      upsert: (h) =>
        set((s) => ({
          holdings: [
            ...s.holdings.filter((x) => x.symbol !== h.symbol),
            h,
          ].sort((a, b) => a.symbol.localeCompare(b.symbol)),
        })),
      addLot: (symbol, quantity, price) =>
        set((s) => {
          const existing = s.holdings.find((h) => h.symbol === symbol);
          if (!existing) {
            return {
              holdings: [
                ...s.holdings,
                {
                  symbol,
                  quantity,
                  avgCost: price,
                  addedAt: Date.now(),
                },
              ].sort((a, b) => a.symbol.localeCompare(b.symbol)),
            };
          }
          const newQty = existing.quantity + quantity;
          const newAvg =
            newQty === 0
              ? existing.avgCost
              : (existing.avgCost * existing.quantity + price * quantity) / newQty;
          return {
            holdings: s.holdings.map((h) =>
              h.symbol === symbol
                ? { ...h, quantity: newQty, avgCost: newAvg }
                : h,
            ),
          };
        }),
      remove: (symbol) =>
        set((s) => ({
          holdings: s.holdings.filter((h) => h.symbol !== symbol),
        })),
      clear: () => set({ holdings: [] }),
    }),
    {
      name: 'stok.portfolio.v1',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
