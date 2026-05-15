import * as fs from 'fs';
import * as path from 'path';
import { dedupeAndSort, parseFeed } from './newsParser';

const rss = fs.readFileSync(
  path.join(__dirname, '__fixtures__/rss-sample.xml'),
  'utf8',
);
const atom = fs.readFileSync(
  path.join(__dirname, '__fixtures__/atom-sample.xml'),
  'utf8',
);

describe('parseFeed — RSS 2.0', () => {
  const items = parseFeed(rss, 'stabroek');

  it('drops items missing a link', () => {
    // 3 items in the fixture, one has no <link>
    expect(items).toHaveLength(2);
  });

  it('extracts title, link, and a sourced id', () => {
    expect(items[0].title).toBe('GSE trading volume climbs in May session');
    expect(items[0].link).toBe(
      'https://www.stabroeknews.com/2026/05/12/gse-volume/',
    );
    expect(items[0].id).toBe('stabroek:https://www.stabroeknews.com/?p=10001');
    expect(items[0].sourceId).toBe('stabroek');
  });

  it('parses pubDate into an epoch timestamp', () => {
    const d = new Date(items[0].publishedAt as number);
    expect(d.getUTCFullYear()).toBe(2026);
    expect(d.getUTCMonth()).toBe(4); // May
    expect(d.getUTCDate()).toBe(12);
  });

  it('decodes entities in titles', () => {
    expect(items[1].title).toBe('Demerara Bank & partners announce dividend');
  });

  it('strips CDATA and HTML tags from the summary', () => {
    expect(items[0].summary).toBe(
      'Trading on the Guyana Stock Exchange rose this week as Banks DIH changed hands.',
    );
  });
});

describe('parseFeed — Atom', () => {
  const items = parseFeed(atom, 'loop-caribbean');

  it('reads both entries', () => {
    expect(items).toHaveLength(2);
  });

  it('prefers rel="alternate" over rel="self" for the link', () => {
    expect(items[0].link).toBe('https://www.loopnews.com/content/guyana-oil');
  });

  it('falls back to a link with no rel attribute', () => {
    expect(items[1].link).toBe('https://www.loopnews.com/content/tt-budget');
  });

  it('uses published, falling back to updated', () => {
    expect(items[0].publishedAt).toBe(Date.parse('2026-05-12T08:15:00Z'));
    expect(items[1].publishedAt).toBe(Date.parse('2026-05-11T19:00:00Z'));
  });

  it('uses the atom id for the item id', () => {
    expect(items[0].id).toBe(
      'loop-caribbean:tag:loopnews.com,2026:/content/guyana-oil',
    );
  });
});

describe('parseFeed — robustness', () => {
  it('returns [] for non-feed input', () => {
    expect(parseFeed('<html><body>not a feed</body></html>', 'x')).toEqual([]);
    expect(parseFeed('', 'x')).toEqual([]);
  });
});

describe('dedupeAndSort', () => {
  it('removes duplicate ids and sorts newest first', () => {
    const merged = dedupeAndSort([
      ...parseFeed(rss, 'stabroek'),
      ...parseFeed(rss, 'stabroek'), // same feed twice
      ...parseFeed(atom, 'loop-caribbean'),
    ]);
    // 2 unique RSS + 2 unique Atom
    expect(merged).toHaveLength(4);
    const times = merged.map((m) => m.publishedAt ?? 0);
    const sorted = [...times].sort((a, b) => b - a);
    expect(times).toEqual(sorted);
  });

  it('keeps items with a null publishedAt last', () => {
    const merged = dedupeAndSort([
      { id: 'a', sourceId: 's', title: 'A', link: 'l1', publishedAt: null },
      {
        id: 'b',
        sourceId: 's',
        title: 'B',
        link: 'l2',
        publishedAt: Date.now(),
      },
    ]);
    expect(merged[0].id).toBe('b');
  });
});
