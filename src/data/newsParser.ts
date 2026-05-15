export interface NewsItem {
  id: string;
  sourceId: string;
  title: string;
  link: string;
  publishedAt: number | null;
  summary?: string;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, '&');
}

function stripCdata(s: string): string {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function clean(s: string): string {
  return decodeEntities(stripCdata(s)).trim();
}

function firstTag(block: string, name: string): string | null {
  const m = block.match(
    new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'),
  );
  return m ? clean(m[1]) : null;
}

// Atom <link> is a self-closing element with the URL in an href attribute.
// Prefer rel="alternate" (the human-readable page) over rel="self" etc.
function atomLink(block: string): string | null {
  const links = block.match(/<link\b[^>]*\/?>/gi) ?? [];
  let fallback: string | null = null;
  for (const tag of links) {
    const href = tag.match(/href="([^"]+)"/i)?.[1];
    if (!href) continue;
    const rel = tag.match(/rel="([^"]+)"/i)?.[1];
    if (!rel || rel === 'alternate') return clean(href);
    if (!fallback) fallback = clean(href);
  }
  return fallback;
}

function matchBlocks(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>[\\s\\S]*?</${tag}>`, 'gi');
  return xml.match(re) ?? [];
}

/**
 * Parse an RSS 2.0 or Atom feed into NewsItems. Pure — no network. Items
 * missing a title or link are dropped. Unknown/garbage input yields [].
 */
export function parseFeed(xml: string, sourceId: string): NewsItem[] {
  const isAtom = /<feed[\s>]/i.test(xml) && !/<rss[\s>]/i.test(xml);
  const blocks = matchBlocks(xml, isAtom ? 'entry' : 'item');
  const items: NewsItem[] = [];

  for (const block of blocks) {
    const title = firstTag(block, 'title');
    const link = isAtom ? atomLink(block) : firstTag(block, 'link');
    if (!title || !link) continue;

    const dateStr = isAtom
      ? firstTag(block, 'published') ?? firstTag(block, 'updated')
      : firstTag(block, 'pubDate') ?? firstTag(block, 'dc:date');
    const parsed = dateStr ? Date.parse(dateStr) : NaN;
    const publishedAt = Number.isFinite(parsed) ? parsed : null;

    const guid =
      (isAtom ? firstTag(block, 'id') : firstTag(block, 'guid')) || link;

    const rawSummary = isAtom
      ? firstTag(block, 'summary') ?? firstTag(block, 'content')
      : firstTag(block, 'description');
    const summary = rawSummary ? stripTags(rawSummary).slice(0, 240) : undefined;

    items.push({
      id: `${sourceId}:${guid}`,
      sourceId,
      title: stripTags(title),
      link,
      publishedAt,
      summary: summary || undefined,
    });
  }
  return items;
}

export function dedupeAndSort(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  const out: NewsItem[] = [];
  for (const it of items) {
    if (seen.has(it.id)) continue;
    seen.add(it.id);
    out.push(it);
  }
  out.sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
  return out;
}
