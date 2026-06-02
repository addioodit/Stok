import { isPriceFeedStale, STALE_AFTER_MS } from './StaleDataHint';

describe('isPriceFeedStale', () => {
  const NOW = 1_700_000_000_000;

  it('is stale when never updated', () => {
    expect(isPriceFeedStale(null, NOW)).toBe(true);
  });

  it('is fresh just below the threshold', () => {
    expect(isPriceFeedStale(NOW - STALE_AFTER_MS + 1, NOW)).toBe(false);
  });

  it('is stale once past the threshold', () => {
    expect(isPriceFeedStale(NOW - STALE_AFTER_MS - 1, NOW)).toBe(true);
  });

  it('is fresh when updated moments ago', () => {
    expect(isPriceFeedStale(NOW - 60 * 1000, NOW)).toBe(false);
  });
});
