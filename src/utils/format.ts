export function formatGYD(amount: number): string {
  const fixed = Math.abs(amount) >= 100 ? amount.toFixed(0) : amount.toFixed(2);
  const [whole, decimals] = fixed.split('.');
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decimals ? `G$${withCommas}.${decimals}` : `G$${withCommas}`;
}

export function formatQty(qty: number): string {
  return `${qty.toLocaleString('en-US')} sh`;
}

export function formatPct(pct: number): string {
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${(pct * 100).toFixed(2)}%`;
}

export function priceChange(last: number, prev: number) {
  const diff = last - prev;
  const pct = prev === 0 ? 0 : diff / prev;
  return { diff, pct };
}
