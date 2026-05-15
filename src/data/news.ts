import { fetchText } from '../utils/fetchText';
import { dedupeAndSort, NewsItem, parseFeed } from './newsParser';
import { NEWS_SOURCES, NewsSource } from './newsSources';

export interface NewsFetchResult {
  items: NewsItem[];
  errors: string[];
}

const MAX_ITEMS = 200;

/**
 * Fetch every source in parallel, parse each feed, and merge. A feed that
 * fails to fetch or parse is skipped — its name is added to `errors` so the
 * UI can show a soft warning — rather than failing the whole refresh.
 */
export async function fetchAllNews(
  sources: NewsSource[] = NEWS_SOURCES,
): Promise<NewsFetchResult> {
  const settled = await Promise.allSettled(
    sources.map(async (s) => {
      const xml = await fetchText(s.feedUrl, 12000);
      const items = parseFeed(xml, s.id);
      if (items.length === 0) {
        throw new Error('feed reached but no items parsed');
      }
      return items;
    }),
  );

  const items: NewsItem[] = [];
  const errors: string[] = [];
  settled.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      items.push(...r.value);
    } else {
      const reason =
        r.reason instanceof Error ? r.reason.message : String(r.reason);
      errors.push(`${sources[i].name}: ${reason}`);
    }
  });

  return { items: dedupeAndSort(items).slice(0, MAX_ITEMS), errors };
}
