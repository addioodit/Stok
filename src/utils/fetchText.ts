// Fetch a URL as text with an abort-based timeout. Shared by the GASCI
// price scraper and the news-feed reader.
//
// Retries once on network errors (fetch throw or 5xx) with a short backoff
// so a single flaky mobile blip doesn't fail the whole refresh. 4xx errors
// are returned immediately — a 404 will not fix itself and a 403 (which is
// what every sandbox this repo sees returns) shouldn't hammer the server.
export async function fetchText(
  url: string,
  timeoutMs = 15000,
  retries = 1,
): Promise<string> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    }
    try {
      return await fetchOnce(url, timeoutMs);
    } catch (e) {
      lastError = e;
      // Don't retry client errors — they are deterministic.
      if (e instanceof Error && /^HTTP 4\d\d/.test(e.message)) {
        throw e;
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function fetchOnce(url: string, timeoutMs: number): Promise<string> {
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
