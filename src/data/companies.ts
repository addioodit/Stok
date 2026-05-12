import { Company } from '../types';

// Prices are illustrative defaults. Wire a real source (GSE weekly report
// scraper or broker feed) by replacing the lastPrice/prevClose values at load.
export const COMPANIES: Company[] = [
  { symbol: 'DIH', name: 'Banks DIH Limited', sector: 'Conglomerate', lastPrice: 215, prevClose: 213, currency: 'GYD' },
  { symbol: 'DBL', name: 'Demerara Bank Limited', sector: 'Banking', lastPrice: 35, prevClose: 35, currency: 'GYD' },
  { symbol: 'DDL', name: 'Demerara Distillers Limited', sector: 'Beverages', lastPrice: 22, prevClose: 21.5, currency: 'GYD' },
  { symbol: 'DTC', name: 'Demerara Tobacco Company Limited', sector: 'Tobacco', lastPrice: 1900, prevClose: 1900, currency: 'GYD' },
  { symbol: 'GBTI', name: 'Guyana Bank for Trade and Industry', sector: 'Banking', lastPrice: 200, prevClose: 198, currency: 'GYD' },
  { symbol: 'GSI', name: 'Guyana Stockfeeds Inc.', sector: 'Agriculture', lastPrice: 11, prevClose: 11, currency: 'GYD' },
  { symbol: 'HIH', name: 'Hand-in-Hand Trust Corporation', sector: 'Financial Services', lastPrice: 22, prevClose: 22, currency: 'GYD' },
  { symbol: 'PHI', name: 'Property Holdings Inc.', sector: 'Real Estate', lastPrice: 6.5, prevClose: 6.5, currency: 'GYD' },
  { symbol: 'RBL', name: 'Republic Bank (Guyana) Limited', sector: 'Banking', lastPrice: 540, prevClose: 545, currency: 'GYD' },
  { symbol: 'SPL', name: 'Sterling Products Limited', sector: 'Manufacturing', lastPrice: 22, prevClose: 22, currency: 'GYD' },
  { symbol: 'CCI', name: 'Caribbean Container Inc.', sector: 'Manufacturing', lastPrice: 35, prevClose: 36, currency: 'GYD' },
  { symbol: 'TGL', name: 'Trust Company (Guyana) Limited', sector: 'Financial Services', lastPrice: 24, prevClose: 24, currency: 'GYD' },
];

export const findCompany = (symbol: string) =>
  COMPANIES.find((c) => c.symbol === symbol);
