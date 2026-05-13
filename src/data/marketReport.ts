import { Company } from '../types';
import { COMPANIES } from './companies';

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

function discoverLatestSession(html: string): number | null {
  const matches = html.match(/Session(\d+)\.htm/gi);
  if (!matches) return null;
  let max = 0;
  for (const m of matches) {
    const n = Number(m.replace(/[^0-9]/g, ''));
    if (n > max) max = n;
  }
  return max > 0 ? max : null;
}

function parseSessionLabel(html: string): string | null {
  const m =
    html.match(/Session\s+(\d+)[^A-Z]*([A-Z][a-z]+\s+\d{1,2},?\s*\d{4})/) ||
    html.match(/(Session\s+\d+)/i);
  return m ? m.slice(1).filter(Boolean).join(' — ').trim() : null;
}

function parseSessionTimestamp(html: string): number | null {
  const m = html.match(/([A-Z][a-z]+\s+\d{1,2},?\s*\d{4})/);
  if (!m) return null;
  const ts = Date.parse(m[1]);
  return Number.isFinite(ts) ? ts : null;
}

function stripHtml(s: string): string {
  return s
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#\d+;/g, ' ')
    .replace(/\s+/g, ' ');
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseNumber(s: string): number {
  const cleaned = s.replace(/[^\d.-]/g, '');
  if (!cleaned || cleaned === '-' || cleaned === '.') return NaN;
  return parseFloat(cleaned);
}

function parseTables(html: string): string[][][] {
  const tables: string[][][] = [];
  const tableRe = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  let tm: RegExpExecArray | null;
  while ((tm = tableRe.exec(html)) !== null) {
    const rows: string[][] = [];
    const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let rm: RegExpExecArray | null;
    while ((rm = rowRe.exec(tm[1])) !== null) {
      const cells: string[] = [];
      const cellRe = /<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi;
      let cm: RegExpExecArray | null;
      while ((cm = cellRe.exec(rm[1])) !== null) {
        cells.push(stripHtml(cm[1]).trim());
      }
      if (cells.length) rows.push(cells);
    }
    if (rows.length) tables.push(rows);
  }
  return tables;
}

function findCol(headers: string[], names: string[]): number {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
  const h = headers.map(norm);
  for (const name of names) {
    const t = norm(name);
    const i = h.findIndex((x) => x.includes(t));
    if (i >= 0) return i;
  }
  return -1;
}

function matchCompany(text: string, companies: Company[]): Company | undefined {
  const upper = text.toUpperCase();
  for (const c of companies) {
    if (new RegExp(`\\b${escapeRegex(c.symbol)}\\b`).test(upper)) return c;
  }
  for (const c of companies) {
    const first = c.name.split(/\s+/)[0].toUpperCase();
    if (first.length >= 4 && upper.includes(first)) return c;
  }
  return undefined;
}

function parseFromTables(
  html: string,
  companies: Company[],
): Record<string, { last: number; prev: number }> {
  const out: Record<string, { last: number; prev: number }> = {};
  for (const rows of parseTables(html)) {
    if (rows.length < 2) continue;
    const headers = rows[0];
    const secCol = findCol(headers, ['security', 'symbol', 'name', 'stock']);
    const lastCol = findCol(headers, [
      'lastsale',
      'closing',
      'close',
      'last',
      'price',
    ]);
    const prevCol = findCol(headers, ['previous', 'prevclose', 'opening', 'open']);
    if (secCol < 0 || lastCol < 0) continue;
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length <= Math.max(secCol, lastCol)) continue;
      const company = matchCompany(row[secCol] ?? '', companies);
      if (!company) continue;
      const last = parseNumber(row[lastCol] ?? '');
      if (!Number.isFinite(last) || last <= 0) continue;
      const prevRaw = prevCol >= 0 ? parseNumber(row[prevCol] ?? '') : NaN;
      const prev = Number.isFinite(prevRaw) && prevRaw > 0 ? prevRaw : last;
      out[company.symbol] = { last, prev };
    }
  }
  return out;
}

function parseLoose(
  html: string,
  companies: Company[],
): Record<string, { last: number; prev: number }> {
  const text = stripHtml(html);
  const out: Record<string, { last: number; prev: number }> = {};
  for (const c of companies) {
    const first = c.name.split(/\s+/)[0];
    const anchor = new RegExp(
      `\\b(${escapeRegex(c.symbol)}|${escapeRegex(first)})\\b`,
      'i',
    );
    const m = anchor.exec(text);
    if (!m) continue;
    const slice = text.slice(m.index, m.index + 400);
    const nums = (slice.match(/-?\d{1,3}(?:,\d{3})*(?:\.\d+)?/g) || [])
      .map((n) => parseNumber(n))
      .filter(
        (n) =>
          Number.isFinite(n) &&
          n > 0 &&
          n < 100000 &&
          Math.abs(n - 2025) > 1 &&
          Math.abs(n - 2026) > 1 &&
          Math.abs(n - 2027) > 1,
      );
    if (nums.length === 0) continue;
    const pick = nums.reduce((best, n) =>
      Math.abs(Math.log(n) - Math.log(c.lastPrice)) <
      Math.abs(Math.log(best) - Math.log(c.lastPrice))
        ? n
        : best,
    );
    out[c.symbol] = { last: pick, prev: c.prevClose };
  }
  return out;
}

function buildReport(
  html: string,
  source: string,
  sessionNumber: number | null,
): MarketReport {
  let prices = parseFromTables(html, COMPANIES);
  if (Object.keys(prices).length === 0) {
    prices = parseLoose(html, COMPANIES);
  }
  if (Object.keys(prices).length === 0) {
    throw new Error(
      'Reached the GSE site but could not parse any prices. The page format may have changed.',
    );
  }
  return {
    sessionLabel: parseSessionLabel(html),
    sessionTimestamp: parseSessionTimestamp(html),
    sessionNumber,
    sourceUrl: source,
    prices,
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
