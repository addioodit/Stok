import { Company } from '../types';

export type SortKey = 'symbol' | 'gainers' | 'losers' | 'price';

export interface MarketViewOptions {
  query?: string;
  sector?: string | null;
  sort?: SortKey;
}

const pctChange = (c: Company): number =>
  c.prevClose === 0 ? 0 : (c.lastPrice - c.prevClose) / c.prevClose;

const bySymbol = (a: Company, b: Company) =>
  a.symbol.localeCompare(b.symbol);

/**
 * Pure ranking/filtering for the Market list. Search matches symbol/name/
 * sector substring. Sort is stable: ties fall back to symbol A→Z. Used by
 * MarketScreen so the search/sort/filter logic stays testable in isolation.
 */
export function sortAndFilter(
  companies: Company[],
  opts: MarketViewOptions = {},
): Company[] {
  const { query, sector, sort = 'symbol' } = opts;
  let out = companies;

  if (sector) {
    out = out.filter((c) => c.sector === sector);
  }

  if (query && query.trim()) {
    const q = query.trim().toLowerCase();
    out = out.filter(
      (c) =>
        c.symbol.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.sector.toLowerCase().includes(q),
    );
  }

  const sorted = [...out];
  switch (sort) {
    case 'symbol':
      sorted.sort(bySymbol);
      break;
    case 'gainers':
      sorted.sort((a, b) => pctChange(b) - pctChange(a) || bySymbol(a, b));
      break;
    case 'losers':
      sorted.sort((a, b) => pctChange(a) - pctChange(b) || bySymbol(a, b));
      break;
    case 'price':
      sorted.sort((a, b) => b.lastPrice - a.lastPrice || bySymbol(a, b));
      break;
  }
  return sorted;
}

export function listSectors(companies: Company[]): string[] {
  return Array.from(new Set(companies.map((c) => c.sector))).sort();
}
