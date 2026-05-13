import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchLatestReport } from '../data/marketReport';
import { useHistory } from './useHistory';

interface PriceEntry {
  last: number;
  prev: number;
}

type Status = 'idle' | 'loading' | 'error';

interface PriceFeedState {
  prices: Record<string, PriceEntry>;
  lastUpdated: number | null;
  sessionLabel: string | null;
  sourceUrl: string | null;
  status: Status;
  error: string | null;
  refresh: () => Promise<void>;
}

export const usePriceFeed = create<PriceFeedState>()(
  persist(
    (set, get) => ({
      prices: {},
      lastUpdated: null,
      sessionLabel: null,
      sourceUrl: null,
      status: 'idle',
      error: null,
      refresh: async () => {
        if (get().status === 'loading') return;
        set({ status: 'loading', error: null });
        try {
          const report = await fetchLatestReport();
          const previous = get().prices;
          const merged: Record<string, PriceEntry> = { ...previous };
          for (const [symbol, p] of Object.entries(report.prices)) {
            const priorLast = previous[symbol]?.last;
            merged[symbol] = {
              last: p.last,
              prev: priorLast && priorLast !== p.last ? priorLast : p.prev,
            };
          }
          set({
            prices: merged,
            lastUpdated: Date.now(),
            sessionLabel: report.sessionLabel,
            sourceUrl: report.sourceUrl,
            status: 'idle',
            error: null,
          });
          useHistory
            .getState()
            .recordReport(
              report.prices,
              report.sessionLabel,
              report.sessionTimestamp ?? Date.now(),
            );
        } catch (e) {
          set({
            status: 'error',
            error: e instanceof Error ? e.message : 'Failed to fetch report',
          });
        }
      },
    }),
    {
      name: 'stok.priceFeed.v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        prices: s.prices,
        lastUpdated: s.lastUpdated,
        sessionLabel: s.sessionLabel,
        sourceUrl: s.sourceUrl,
      }),
    },
  ),
);
