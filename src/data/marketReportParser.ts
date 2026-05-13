import { Company } from '../types';
import { COMPANIES } from './companies';

export interface ParsedReport {
  prices: Record<string, { last: number; prev: number }>;
  sessionLabel: string | null;
  sessionTimestamp: number | null;
  sessionNumber: number | null;
}

export function discoverLatestSession(html: string): number | null {
  const matches = html.match(/Session(\d+)\.htm/gi);
  if (!matches) return null;
  let max = 0;
  for (const m of matches) {
    const n = Number(m.replace(/[^0-9]/g, ''));
    if (n > max) max = n;
  }
  return max > 0 ? max : null;
}

export function parseSessionLabel(html: string): string | null {
  const numMatch = html.match(/Session\s+(\d+)/i);
  const dateMatch = html.match(/([A-Z][a-z]+\s+\d{1,2},?\s*\d{4})/);
  if (!numMatch && !dateMatch) return null;
  const parts: string[] = [];
  if (numMatch) parts.push(`Session ${numMatch[1]}`);
  if (dateMatch) parts.push(dateMatch[1]);
  return parts.join(' — ');
}

export function parseSessionTimestamp(html: string): number | null {
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

export function parseTables(html: string): string[][][] {
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

export function parseFromTables(
  html: string,
  companies: Company[] = COMPANIES,
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
    const prevCol = findCol(headers, [
      'previous',
      'prevclose',
      'opening',
      'open',
    ]);
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

export function parseLoose(
  html: string,
  companies: Company[] = COMPANIES,
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

export function parseHtmlReport(
  html: string,
  companies: Company[] = COMPANIES,
): ParsedReport {
  let prices = parseFromTables(html, companies);
  if (Object.keys(prices).length === 0) {
    prices = parseLoose(html, companies);
  }
  return {
    prices,
    sessionLabel: parseSessionLabel(html),
    sessionTimestamp: parseSessionTimestamp(html),
    sessionNumber: discoverLatestSession(html),
  };
}
