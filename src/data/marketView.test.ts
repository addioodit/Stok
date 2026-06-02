import { Company, Sector } from '../types';
import { listSectors, sortAndFilter } from './marketView';

const make = (
  symbol: string,
  sector: Sector,
  lastPrice: number,
  prevClose: number,
): Company => ({
  symbol,
  name: `${symbol} Co`,
  sector,
  lastPrice,
  prevClose,
  currency: 'GYD',
});

const sample: Company[] = [
  make('AAA', 'Banking', 100, 90), //  +11.1%
  make('BBB', 'Beverages', 50, 50), //   0%
  make('CCC', 'Banking', 200, 220), //  -9.1%
  make('DDD', 'Manufacturing', 5, 4), // +25%
];

describe('sortAndFilter', () => {
  it('defaults to symbol A→Z', () => {
    expect(sortAndFilter(sample).map((c) => c.symbol)).toEqual([
      'AAA',
      'BBB',
      'CCC',
      'DDD',
    ]);
  });

  it('ranks gainers first', () => {
    expect(sortAndFilter(sample, { sort: 'gainers' }).map((c) => c.symbol)).toEqual([
      'DDD',
      'AAA',
      'BBB',
      'CCC',
    ]);
  });

  it('ranks losers first', () => {
    expect(sortAndFilter(sample, { sort: 'losers' }).map((c) => c.symbol)).toEqual([
      'CCC',
      'BBB',
      'AAA',
      'DDD',
    ]);
  });

  it('ranks by price descending', () => {
    expect(sortAndFilter(sample, { sort: 'price' }).map((c) => c.symbol)).toEqual([
      'CCC',
      'AAA',
      'BBB',
      'DDD',
    ]);
  });

  it('filters by sector before sorting', () => {
    expect(
      sortAndFilter(sample, { sector: 'Banking', sort: 'gainers' }).map(
        (c) => c.symbol,
      ),
    ).toEqual(['AAA', 'CCC']);
  });

  it('search matches symbol, name, or sector substring', () => {
    expect(sortAndFilter(sample, { query: 'bever' }).map((c) => c.symbol)).toEqual([
      'BBB',
    ]);
    expect(sortAndFilter(sample, { query: 'aa' }).map((c) => c.symbol)).toEqual([
      'AAA',
    ]);
  });

  it('combines sector and search filters', () => {
    expect(
      sortAndFilter(sample, { sector: 'Banking', query: 'cc' }).map(
        (c) => c.symbol,
      ),
    ).toEqual(['CCC']);
  });

  it('uses symbol tie-break when % change is equal', () => {
    const tied = [
      make('ZED', 'Banking', 100, 100),
      make('ABC', 'Banking', 200, 200),
      make('MID', 'Banking', 50, 50),
    ];
    expect(sortAndFilter(tied, { sort: 'gainers' }).map((c) => c.symbol)).toEqual([
      'ABC',
      'MID',
      'ZED',
    ]);
  });

  it('treats a zero prev close as zero % change (no NaN)', () => {
    const odd = [make('NEW', 'Banking', 10, 0), make('OLD', 'Banking', 10, 5)];
    const out = sortAndFilter(odd, { sort: 'gainers' });
    expect(out[0].symbol).toBe('OLD');
  });
});

describe('listSectors', () => {
  it('returns deduped sectors sorted A→Z', () => {
    expect(listSectors(sample)).toEqual([
      'Banking',
      'Beverages',
      'Manufacturing',
    ]);
  });
});
