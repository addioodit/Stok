export type NewsRegion = 'guyana' | 'caribbean';

export interface NewsSource {
  id: string;
  name: string;
  region: NewsRegion;
  feedUrl: string;
  homeUrl: string;
}

// Curated RSS/Atom feeds. Most of these outlets run WordPress, where the
// `/feed/` path serves RSS 2.0. The feed URLs have NOT been verified live
// from this repo's tooling (same sandbox 403 as the GASCI scraper) — when
// the app runs on a device, any feed that fails is skipped and surfaced in
// useNews.lastError rather than breaking the screen. Edit this list freely.
export const NEWS_SOURCES: NewsSource[] = [
  {
    id: 'stabroek',
    name: 'Stabroek News',
    region: 'guyana',
    feedUrl: 'https://www.stabroeknews.com/feed/',
    homeUrl: 'https://www.stabroeknews.com',
  },
  {
    id: 'kaieteur',
    name: 'Kaieteur News',
    region: 'guyana',
    feedUrl: 'https://www.kaieteurnewsonline.com/feed/',
    homeUrl: 'https://www.kaieteurnewsonline.com',
  },
  {
    id: 'demerara-waves',
    name: 'Demerara Waves',
    region: 'guyana',
    feedUrl: 'https://demerarawaves.com/feed/',
    homeUrl: 'https://demerarawaves.com',
  },
  {
    id: 'newsroom-gy',
    name: 'News Room Guyana',
    region: 'guyana',
    feedUrl: 'https://newsroom.gy/feed/',
    homeUrl: 'https://newsroom.gy',
  },
  {
    id: 'loop-caribbean',
    name: 'Loop Caribbean',
    region: 'caribbean',
    feedUrl: 'https://www.loopnews.com/feed',
    homeUrl: 'https://www.loopnews.com',
  },
  {
    id: 'jamaica-gleaner',
    name: 'Jamaica Gleaner',
    region: 'caribbean',
    feedUrl: 'https://jamaica-gleaner.com/feed',
    homeUrl: 'https://jamaica-gleaner.com',
  },
  {
    id: 'barbados-today',
    name: 'Barbados Today',
    region: 'caribbean',
    feedUrl: 'https://barbadostoday.bb/feed/',
    homeUrl: 'https://barbadostoday.bb',
  },
  {
    id: 'trinidad-guardian',
    name: 'Trinidad & Tobago Guardian',
    region: 'caribbean',
    feedUrl: 'https://www.guardian.co.tt/rss',
    homeUrl: 'https://www.guardian.co.tt',
  },
];

export const sourceById = (id: string): NewsSource | undefined =>
  NEWS_SOURCES.find((s) => s.id === id);
