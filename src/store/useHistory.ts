import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  fetchLatestReport,
  fetchReportBySession,
} from '../data/marketReport';

export interface PricePoint {
  ts: number;
  close: number;
  sessionLabel?: string;
}

type BackfillStatus = 'idle' | 'loading' | 'error';

interface HistoryState {
  byTicker: Record<string, PricePoint[]>;
  backfillStatus: BackfillStatus;
  backfillError: string | null;
  backfillDone: number;
  backfillTotal: number;
  recordReport: (
    prices: Record<string, { last: number; prev: number }>,
    sessionLabel: string | null,
    ts: number,
  ) => void;
  backfill: (sessions: number) => Promise<void>;
  clear: () => void;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function dedupeByDay(points: PricePoint[]): PricePoint[] {
  const map = new Map<string, PricePoint>();
  for (const p of points) {
    const dayKey = new Date(p.ts).toISOString().slice(0, 10);
    map.set(dayKey, p);
  }
  return [...map.values()].sort((a, b) => a.ts - b.ts);
}

export const useHistory = create<HistoryState>()(
  persist(
    (set, get) => ({
      byTicker: {},
      backfillStatus: 'idle',
      backfillError: null,
      backfillDone: 0,
      backfillTotal: 0,
      recordReport: (prices, sessionLabel, ts) => {
        const byTicker = { ...get().byTicker };
        for (const [symbol, p] of Object.entries(prices)) {
          const existing = byTicker[symbol] ?? [];
          byTicker[symbol] = dedupeByDay([
            ...existing,
            { ts, close: p.last, sessionLabel: sessionLabel ?? undefined },
          ]);
        }
        set({ byTicker });
      },
      backfill: async (sessions) => {
        if (get().backfillStatus === 'loading') return;
        set({
          backfillStatus: 'loading',
          backfillError: null,
          backfillDone: 0,
          backfillTotal: sessions + 1,
        });
        try {
          const latest = await fetchLatestReport();
          const currentTs = latest.sessionTimestamp ?? Date.now();
          get().recordReport(latest.prices, latest.sessionLabel, currentTs);
          set({ backfillDone: 1 });
          const currentN = latest.sessionNumber;
          if (currentN == null) {
            set({ backfillStatus: 'idle', backfillTotal: 1 });
            return;
          }
          for (let i = 1; i <= sessions; i++) {
            const n = currentN - i;
            if (n < 1) break;
            try {
              const r = await fetchReportBySession(n);
              const ts = r.sessionTimestamp ?? currentTs - i * 7 * DAY_MS;
              get().recordReport(r.prices, r.sessionLabel, ts);
            } catch {
              // skip missing/unparseable sessions and continue
            }
            set({ backfillDone: i + 1 });
          }
          set({ backfillStatus: 'idle' });
        } catch (e) {
          set({
            backfillStatus: 'error',
            backfillError: e instanceof Error ? e.message : 'Backfill failed',
          });
        }
      },
      clear: () => set({ byTicker: {} }),
    }),
    {
      name: 'stok.history.v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ byTicker: s.byTicker }),
    },
  ),
);

export function selectHistoryFor(
  state: HistoryState,
  symbol: string,
  daysBack: number | null,
): PricePoint[] {
  const all = state.byTicker[symbol] ?? [];
  if (daysBack == null) return all;
  const cutoff = Date.now() - daysBack * DAY_MS;
  return all.filter((p) => p.ts >= cutoff);
}
