import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchAllNews } from '../data/news';
import { NewsItem } from '../data/newsParser';

type Status = 'idle' | 'loading';

interface NewsState {
  items: NewsItem[];
  lastUpdated: number | null;
  status: Status;
  lastError: string | null;
  /** Names of feeds that failed on the most recent refresh, if any. */
  failedSources: string[];
  refresh: () => Promise<void>;
}

export const useNews = create<NewsState>()(
  persist(
    (set, get) => ({
      items: [],
      lastUpdated: null,
      status: 'idle',
      lastError: null,
      failedSources: [],
      refresh: async () => {
        if (get().status === 'loading') return;
        set({ status: 'loading' });
        try {
          const { items, errors } = await fetchAllNews();
          if (items.length === 0) {
            set({
              status: 'idle',
              lastError:
                errors[0] ?? 'No news could be loaded from any source.',
              failedSources: errors,
            });
            return;
          }
          set({
            items,
            lastUpdated: Date.now(),
            status: 'idle',
            lastError: null,
            failedSources: errors,
          });
        } catch (e) {
          set({
            status: 'idle',
            lastError: e instanceof Error ? e.message : 'Failed to load news',
          });
        }
      },
    }),
    {
      name: 'stok.news.v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        items: s.items,
        lastUpdated: s.lastUpdated,
      }),
    },
  ),
);
