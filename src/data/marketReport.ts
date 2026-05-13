import { COMPANIES } from './companies';
import {
  discoverLatestSession,
  parseHtmlReport,
  ParsedReport,
} from './marketReportParser';

export interface MarketReport {
  sessionLabel: string | null;
  sessionTimestamp: number | null;
  sessionNumber: number | null;
  sourceUrl: string;
  prices: Record<string, { last: number; prev: number }>;
}

export interface RawAndParsed {
  html: string;
  sourceUrl: string;
  parsed: ParsedReport;
  /**
   * The session number used in the URL (e.g. 838 for Session838.htm).
   * May differ from parsed.sessionNumber, which is the highest number
   * referenced anywhere on the page.
   */
  sessionNumberRequested: number | null;
}

const ROOT_URLS = [
  'https://gasci.com/trades/',
  'https://www.gasci.com/trades/',
  'https://www.gasci.com/',
];

const sessionUrl = (n: number) =>
  `https://www.gasci.com/results/Session${n}.htm`;

async function fetchText(url: string, timeoutMs = 15000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'text/html,application/xhtml+xml' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

function buildReport(
  html: string,
  source: string,
  sessionNumber: number | null,
): MarketReport {
  const parsed = parseHtmlReport(html, COMPANIES);
  if (Object.keys(parsed.prices).length === 0) {
    throw new Error(
      'Reached the GSE site but could not parse any prices. The page format may have changed.',
    );
  }
  return {
    sessionLabel: parsed.sessionLabel,
    sessionTimestamp: parsed.sessionTimestamp,
    sessionNumber: sessionNumber ?? parsed.sessionNumber,
    sourceUrl: source,
    prices: parsed.prices,
  };
}

export async function fetchLatestReport(): Promise<MarketReport> {
  let indexHtml = '';
  let usedRoot = ROOT_URLS[0];
  let lastErr: unknown = null;
  for (const url of ROOT_URLS) {
    try {
      indexHtml = await fetchText(url);
      usedRoot = url;
      break;
    } catch (e) {
      lastErr = e;
    }
  }
  if (!indexHtml) {
    throw new Error(
      `Could not reach GSE: ${lastErr instanceof Error ? lastErr.message : 'network error'}`,
    );
  }

  const session = discoverLatestSession(indexHtml);
  let html = indexHtml;
  let source = usedRoot;
  if (session) {
    try {
      html = await fetchText(sessionUrl(session));
      source = sessionUrl(session);
    } catch {
      // fall back to index page parse
    }
  }
  return buildReport(html, source, session);
}

export async function fetchReportBySession(n: number): Promise<MarketReport> {
  const url = sessionUrl(n);
  const html = await fetchText(url);
  return buildReport(html, url, n);
}

/**
 * Debug-only: fetch the latest session page (or a specific one) and return
 * BOTH the raw HTML and the parsed result. Never throws on parse failure —
 * always returns the raw HTML so the user can capture and inspect it. The
 * fetch itself can still throw on network/HTTP errors.
 */
export async function fetchRawAndParse(
  opts: { sessionNumber?: number } = {},
): Promise<RawAndParsed> {
  let html = '';
  let source = '';
  let sessionNumberRequested: number | null = null;

  if (opts.sessionNumber != null) {
    source = sessionUrl(opts.sessionNumber);
    html = await fetchText(source);
    sessionNumberRequested = opts.sessionNumber;
  } else {
    // Discover the latest session via the trades index.
    let indexHtml = '';
    let usedRoot = ROOT_URLS[0];
    let lastErr: unknown = null;
    for (const url of ROOT_URLS) {
      try {
        indexHtml = await fetchText(url);
        usedRoot = url;
        break;
      } catch (e) {
        lastErr = e;
      }
    }
    if (!indexHtml) {
      throw new Error(
        `Could not reach GSE: ${
          lastErr instanceof Error ? lastErr.message : 'network error'
        }`,
      );
    }
    const n = discoverLatestSession(indexHtml);
    if (n) {
      try {
        html = await fetchText(sessionUrl(n));
        source = sessionUrl(n);
        sessionNumberRequested = n;
      } catch {
        html = indexHtml;
        source = usedRoot;
      }
    } else {
      html = indexHtml;
      source = usedRoot;
    }
  }

  return {
    html,
    sourceUrl: source,
    sessionNumberRequested,
    parsed: parseHtmlReport(html, COMPANIES),
  };
}
