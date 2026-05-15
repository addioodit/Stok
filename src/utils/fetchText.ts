// Fetch a URL as text with an abort-based timeout. Shared by the GASCI
// price scraper and the news-feed reader.
export async function fetchText(
  url: string,
  timeoutMs = 15000,
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept:
          'text/html,application/xhtml+xml,application/xml,application/rss+xml,application/atom+xml,text/xml',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}
