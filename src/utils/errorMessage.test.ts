import { classifyFetchError } from './errorMessage';

describe('classifyFetchError', () => {
  it('classifies AbortError as timeout, retryable', () => {
    const c = classifyFetchError('AbortError: signal is aborted');
    expect(c.title).toBe('Request timed out');
    expect(c.canRetry).toBe(true);
  });

  it('classifies failed fetch as no-connection, retryable', () => {
    const c = classifyFetchError('TypeError: Network request failed');
    expect(c.title).toBe('No connection');
    expect(c.canRetry).toBe(true);
  });

  it('classifies 403 as blocked-by-host, retryable', () => {
    const c = classifyFetchError('HTTP 403 from https://gasci.com/trades/');
    expect(c.title).toBe('Blocked by GASCI');
    expect(c.canRetry).toBe(true);
  });

  it('classifies 401 the same as 403', () => {
    const c = classifyFetchError('HTTP 401 from https://gasci.com/');
    expect(c.title).toBe('Blocked by GASCI');
    expect(c.canRetry).toBe(true);
  });

  it('classifies 404 as session-page-not-found, NOT retryable', () => {
    const c = classifyFetchError('HTTP 404 from session 838');
    expect(c.title).toBe('Session page not found');
    expect(c.canRetry).toBe(false);
  });

  it('classifies 5xx as host issues, retryable', () => {
    const c = classifyFetchError('HTTP 503 service unavailable');
    expect(c.title).toBe('GASCI is having issues');
    expect(c.canRetry).toBe(true);
  });

  it('classifies parser drift as not-retryable', () => {
    const c = classifyFetchError(
      'Reached the GSE site but could not parse any prices. The page format may have changed.',
    );
    expect(c.title).toBe('Page format changed');
    expect(c.canRetry).toBe(false);
  });

  it('falls back to generic title with the raw body, retryable', () => {
    const c = classifyFetchError('Something weird happened');
    expect(c.title).toBe('Couldn’t update prices');
    expect(c.body).toBe('Something weird happened');
    expect(c.canRetry).toBe(true);
  });
});
