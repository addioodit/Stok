import {
  daysUntil,
  formatGYD,
  formatMediumDate,
  formatPct,
  formatQty,
  formatShortDate,
  priceChange,
} from './format';

describe('formatGYD', () => {
  it('drops cents for amounts >= 100', () => {
    expect(formatGYD(215)).toBe('G$215');
    expect(formatGYD(1234)).toBe('G$1,234');
    expect(formatGYD(1900)).toBe('G$1,900');
  });

  it('keeps cents for amounts < 100', () => {
    expect(formatGYD(22)).toBe('G$22.00');
    expect(formatGYD(0.5)).toBe('G$0.50');
    expect(formatGYD(0)).toBe('G$0.00');
  });

  it('groups thousands with commas', () => {
    expect(formatGYD(1_000_000)).toBe('G$1,000,000');
    expect(formatGYD(12_345)).toBe('G$12,345');
  });

  it('rounds half-up at the boundary', () => {
    expect(formatGYD(99.99)).toBe('G$99.99');
    expect(formatGYD(100.49)).toBe('G$100');
  });
});

describe('formatPct', () => {
  it('signs positive values with +', () => {
    expect(formatPct(0)).toBe('+0.00%');
    expect(formatPct(0.0123)).toBe('+1.23%');
    expect(formatPct(1)).toBe('+100.00%');
  });

  it('keeps minus on negatives', () => {
    expect(formatPct(-0.05)).toBe('-5.00%');
    expect(formatPct(-0.0001)).toBe('-0.01%');
  });
});

describe('priceChange', () => {
  it('computes diff and percentage', () => {
    expect(priceChange(110, 100)).toEqual({ diff: 10, pct: 0.1 });
    expect(priceChange(90, 100)).toEqual({ diff: -10, pct: -0.1 });
  });

  it('returns 0% when previous is 0 (avoids div-by-zero)', () => {
    expect(priceChange(50, 0)).toEqual({ diff: 50, pct: 0 });
  });

  it('returns 0 for flat prices', () => {
    expect(priceChange(22, 22)).toEqual({ diff: 0, pct: 0 });
  });
});

describe('formatQty', () => {
  it('formats with thousands separators', () => {
    expect(formatQty(1500)).toBe('1,500 sh');
    expect(formatQty(0)).toBe('0 sh');
  });
});

describe('date formatters', () => {
  it('formatShortDate returns Month + day', () => {
    const ts = Date.UTC(2026, 4, 11);
    expect(formatShortDate(ts)).toMatch(/May\s+\d{1,2}/);
  });

  it('formatMediumDate includes the year', () => {
    const ts = Date.UTC(2026, 4, 11);
    expect(formatMediumDate(ts)).toMatch(/2026/);
  });
});

describe('daysUntil', () => {
  it('returns positive for the future', () => {
    const now = Date.UTC(2026, 4, 1);
    const future = Date.UTC(2026, 4, 11);
    expect(daysUntil(future, now)).toBe(10);
  });

  it('returns 0 or negative for past dates', () => {
    const now = Date.UTC(2026, 4, 11);
    const past = Date.UTC(2026, 4, 1);
    expect(daysUntil(past, now)).toBeLessThanOrEqual(0);
  });
});
