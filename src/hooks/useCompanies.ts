import { useMemo } from 'react';
import { COMPANIES, findCompany } from '../data/companies';
import { usePriceFeed } from '../store/usePriceFeed';
import { Company } from '../types';

export function useEffectiveCompanies(): Company[] {
  const overlay = usePriceFeed((s) => s.prices);
  return useMemo(
    () =>
      COMPANIES.map((c) => {
        const o = overlay[c.symbol];
        return o ? { ...c, lastPrice: o.last, prevClose: o.prev } : c;
      }),
    [overlay],
  );
}

export function useEffectiveCompany(symbol: string): Company | undefined {
  const overlay = usePriceFeed((s) => s.prices[symbol]);
  return useMemo(() => {
    const base = findCompany(symbol);
    if (!base) return undefined;
    return overlay
      ? { ...base, lastPrice: overlay.last, prevClose: overlay.prev }
      : base;
  }, [symbol, overlay]);
}
