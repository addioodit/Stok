export interface ClassifiedError {
  title: string;
  body: string;
  canRetry: boolean;
}

export function classifyFetchError(raw: string): ClassifiedError {
  const lower = raw.toLowerCase();

  if (lower.includes('aborted') || lower.includes('timeout')) {
    return {
      title: 'Request timed out',
      body: 'GASCI didn’t answer in 15 seconds. Likely a slow connection.',
      canRetry: true,
    };
  }

  if (
    lower.includes('network request failed') ||
    lower.includes('failed to fetch') ||
    lower.includes('typeerror: load failed')
  ) {
    return {
      title: 'No connection',
      body: 'Can’t reach the network. Check your signal and try again.',
      canRetry: true,
    };
  }

  if (lower.includes('http 403') || lower.includes('http 401')) {
    return {
      title: 'Blocked by GASCI',
      body: 'The site refused the request. This sometimes resolves on retry from a different network.',
      canRetry: true,
    };
  }

  if (lower.includes('http 404')) {
    return {
      title: 'Session page not found',
      body: 'GASCI moved or removed the session page Stok looked up. The parser will need an update.',
      canRetry: false,
    };
  }

  if (/http 5\d{2}/.test(lower)) {
    return {
      title: 'GASCI is having issues',
      body: raw,
      canRetry: true,
    };
  }

  if (
    lower.includes('could not parse') ||
    lower.includes('no session results') ||
    lower.includes('page format may have changed')
  ) {
    return {
      title: 'Page format changed',
      body: 'GASCI is reachable, but the parser couldn’t find prices on the page. Stok needs a parser update.',
      canRetry: false,
    };
  }

  return {
    title: 'Couldn’t update prices',
    body: raw,
    canRetry: true,
  };
}
