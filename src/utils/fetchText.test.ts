import { fetchText } from './fetchText';

type FetchFn = (input: unknown, init?: unknown) => Promise<Response>;

describe('fetchText retry policy', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.useRealTimers();
  });

  it('resolves with body text on a 200', async () => {
    global.fetch = jest.fn(async () =>
      new Response('hello', { status: 200 }),
    ) as unknown as FetchFn as typeof fetch;
    await expect(fetchText('https://x')).resolves.toBe('hello');
  });

  it('does not retry on a 4xx', async () => {
    const spy = jest.fn(async () => new Response('nope', { status: 404 }));
    global.fetch = spy as unknown as FetchFn as typeof fetch;
    await expect(fetchText('https://x', 15000, 3)).rejects.toThrow(/HTTP 404/);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('retries once on a 5xx and succeeds on the second attempt', async () => {
    let call = 0;
    global.fetch = jest.fn(async () => {
      call++;
      return call === 1
        ? new Response('bad', { status: 503 })
        : new Response('ok', { status: 200 });
    }) as unknown as FetchFn as typeof fetch;
    await expect(fetchText('https://x')).resolves.toBe('ok');
    expect(call).toBe(2);
  });

  it('surfaces the last error after retries are exhausted', async () => {
    const spy = jest.fn(async () => new Response('bad', { status: 500 }));
    global.fetch = spy as unknown as FetchFn as typeof fetch;
    await expect(fetchText('https://x', 15000, 1)).rejects.toThrow(/HTTP 500/);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('retries after a network throw', async () => {
    let call = 0;
    global.fetch = jest.fn(async () => {
      call++;
      if (call === 1) throw new Error('network down');
      return new Response('recovered', { status: 200 });
    }) as unknown as FetchFn as typeof fetch;
    await expect(fetchText('https://x')).resolves.toBe('recovered');
  });
});
