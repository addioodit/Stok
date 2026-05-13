import { COMPANIES } from './companies';
import {
  discoverLatestSession,
  parseHtmlReport,
} from './marketReportParser';

export interface MarketReport {
  sessionLabel: string | null;
  sessionTimestamp: number | null;
  sessionNumber: number | null;
  sourceUrl: string;
  prices: Record<string, { last: number; prev: number }>;
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
