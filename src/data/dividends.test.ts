import {
  expectedIncome,
  recentDividends,
  upcomingDividends,
} from './dividends';
import { DividendDeclaration } from '../types';

const NOW = Date.UTC(2026, 4, 13); // May 13, 2026
const DAY = 24 * 60 * 60 * 1000;

const d = (
  id: string,
  symbol: string,
  perShare: number,
  paymentDate: number,
): DividendDeclaration => ({
  id,
  symbol,
  perShare,
  currency: 'GYD',
  type: 'interim',
  declaredAt: paymentDate - 30 * DAY,
  exDate: paymentDate - 14 * DAY,
  paymentDate,
});

const fixture: DividendDeclaration[] = [
  d('DIH-1', 'DIH', 3.0, NOW + 30 * DAY),
  d('DDL-1', 'DDL', 0.3, NOW + 7 * DAY),
  d('RBL-1', 'RBL', 12.0, NOW + 60 * DAY),
  d('DIH-0', 'DIH', 5.0, NOW - 60 * DAY),
  d('DDL-0', 'DDL', 0.4, NOW - 90 * DAY),
  d('GBTI-0', 'GBTI', 6.0, NOW - 200 * DAY), // outside default window
];

describe('upcomingDividends', () => {
  it('returns events with paymentDate in the future, sorted ascending', () => {
    const u = upcomingDividends(fixture, NOW);
    expect(u.map((x) => x.id)).toEqual(['DDL-1', 'DIH-1', 'RBL-1']);
  });

  it('treats the current moment as upcoming (>=)', () => {
    const u = upcomingDividends([d('NOW', 'DIH', 1, NOW)], NOW);
    expect(u.map((x) => x.id)).toEqual(['NOW']);
  });
});

describe('recentDividends', () => {
  it('returns past payments within the window, sorted descending', () => {
    const r = recentDividends(fixture, NOW);
    expect(r.map((x) => x.id)).toEqual(['DIH-0', 'DDL-0']);
  });

  it('respects a custom windowDays', () => {
    const r = recentDividends(fixture, NOW, 365);
    expect(r.map((x) => x.id)).toEqual(['DIH-0', 'DDL-0', 'GBTI-0']);
  });

  it('excludes future payments even if newer', () => {
    const r = recentDividends([...fixture, d('FUT', 'RBL', 1, NOW + DAY)], NOW);
    expect(r.map((x) => x.id)).not.toContain('FUT');
  });
});

describe('expectedIncome', () => {
  const holdings = [
    { symbol: 'DIH', quantity: 100 },
    { symbol: 'DDL', quantity: 500 },
  ];

  it('sums per-share × quantity for upcoming dividends in the window', () => {
    // Within 30 days: DDL-1 pays 0.30 × 500 = 150. DIH-1 (30 days from now) = 3 × 100 = 300.
    expect(expectedIncome(fixture, holdings, 30, NOW)).toBe(450);
  });

  it('excludes dividends outside the window', () => {
    // Only DDL-1 (7 days) is inside a 14-day window.
    expect(expectedIncome(fixture, holdings, 14, NOW)).toBeCloseTo(150);
  });

  it('skips dividends for symbols you do not hold', () => {
    expect(expectedIncome(fixture, [{ symbol: 'RBL', quantity: 10 }], 365, NOW)).toBe(
      120,
    );
  });

  it('skips holdings with zero or negative quantity', () => {
    expect(
      expectedIncome(
        fixture,
        [{ symbol: 'DIH', quantity: 0 }, { symbol: 'DDL', quantity: -5 }],
        365,
        NOW,
      ),
    ).toBe(0);
  });

  it('excludes already-paid dividends', () => {
    // DIH-0 paid 60 days ago — not counted even with a wide window.
    expect(expectedIncome(fixture, [{ symbol: 'DIH', quantity: 100 }], 365, NOW)).toBe(
      300,
    );
  });
});
