import * as fs from 'fs';
import * as path from 'path';
import {
  diagnoseSymbols,
  discoverLatestSession,
  parseFromTables,
  parseHtmlReport,
  parseLoose,
  parseSessionLabel,
  parseSessionTimestamp,
  parseTables,
  summarizeTables,
} from './marketReportParser';
import { COMPANIES } from './companies';

const fixture = fs.readFileSync(
  path.join(__dirname, '__fixtures__/session-sample.html'),
  'utf8',
);

describe('discoverLatestSession', () => {
  it('returns the highest session number referenced on the page', () => {
    // Fixture references Session836 and Session838 — page itself is 837.
    expect(discoverLatestSession(fixture)).toBe(838);
  });

  it('returns null when no session links are present', () => {
    expect(discoverLatestSession('<p>nothing here</p>')).toBeNull();
  });
});

describe('parseSessionLabel', () => {
  it('captures session number and date when both are present', () => {
    const label = parseSessionLabel(fixture);
    expect(label).toMatch(/837/);
    expect(label).toMatch(/May/);
  });

  it('falls back to just the number when the date is missing', () => {
    expect(parseSessionLabel('<p>Session 12</p>')).toMatch(/Session 12/);
  });

  it('returns null when no session label appears', () => {
    expect(parseSessionLabel('<p>nothing</p>')).toBeNull();
  });
});

describe('parseSessionTimestamp', () => {
  it('parses a Month Day, Year string into a timestamp', () => {
    const ts = parseSessionTimestamp(fixture);
    expect(ts).not.toBeNull();
    const d = new Date(ts as number);
    expect(d.getUTCFullYear()).toBe(2026);
    expect(d.getUTCMonth()).toBe(4); // May (zero-indexed)
  });

  it('returns null when no date string is recognisable', () => {
    expect(parseSessionTimestamp('<p>nothing</p>')).toBeNull();
  });
});

describe('parseTables', () => {
  it('extracts cell text from the rates table', () => {
    const tables = parseTables(fixture);
    expect(tables).toHaveLength(1);
    const rows = tables[0];
    expect(rows[0]).toEqual([
      'Security',
      'Bid',
      'Offer',
      'Last Sale',
      'Previous Close',
      'Volume',
    ]);
    expect(rows[1][0]).toContain('BANKS DIH');
    expect(rows[1][3]).toBe('215');
  });
});

describe('parseFromTables', () => {
  it('picks last-sale by header, with previous close for prev', () => {
    const prices = parseFromTables(fixture, COMPANIES);
    expect(prices.DIH).toEqual({ last: 215, prev: 213 });
    expect(prices.DDL).toEqual({ last: 22, prev: 21.5 });
    expect(prices.RBL).toEqual({ last: 540, prev: 545 });
  });

  it('matches the company by ticker in the security cell', () => {
    const prices = parseFromTables(fixture, COMPANIES);
    expect(prices.DBL.last).toBe(35);
    expect(prices.DTC.last).toBe(1900);
    expect(prices.GBTI.last).toBe(200);
  });

  it('skips rows whose last-sale cell is blank or zero', () => {
    const prices = parseFromTables(fixture, COMPANIES);
    expect(prices.HIH).toBeUndefined();
  });

  it('returns an empty map when no recognisable table is present', () => {
    expect(parseFromTables('<p>no tables here</p>', COMPANIES)).toEqual({});
  });

  it('returns an empty map when the table has no usable headers', () => {
    const noHeader = '<table><tr><td>a</td><td>b</td></tr></table>';
    expect(parseFromTables(noHeader, COMPANIES)).toEqual({});
  });
});

describe('parseLoose', () => {
  it('falls back to the nearest-to-bundled-price number when no table is parseable', () => {
    const html = `
      <p>BANKS DIH LIMITED (DIH) traded today at 217 per share.</p>
      <p>REPUBLIC BANK (RBL) was 538 close.</p>
    `;
    const prices = parseLoose(html, COMPANIES);
    expect(prices.DIH.last).toBe(217);
    expect(prices.RBL.last).toBe(538);
  });

  it('ignores numbers that look like years', () => {
    const html = '<p>BANKS DIH (DIH) report dated 2026 — last 217</p>';
    const prices = parseLoose(html, COMPANIES);
    expect(prices.DIH.last).toBe(217);
  });
});

describe('parseHtmlReport', () => {
  it('orchestrates the table parser plus session metadata', () => {
    const report = parseHtmlReport(fixture, COMPANIES);
    expect(Object.keys(report.prices).length).toBeGreaterThanOrEqual(6);
    expect(report.sessionLabel).toMatch(/837/);
    expect(report.sessionTimestamp).not.toBeNull();
    expect(report.sessionNumber).toBe(838); // highest referenced
    expect(report.strategy).toBe('tables');
  });

  it('falls through to parseLoose when no table works', () => {
    const html = '<p>BANKS DIH (DIH) traded at 217</p>';
    const report = parseHtmlReport(html, COMPANIES);
    expect(report.prices.DIH.last).toBe(217);
    expect(report.strategy).toBe('loose');
  });

  it('returns an empty prices map and strategy "none" when nothing matches', () => {
    const report = parseHtmlReport('<p>no symbols mentioned</p>', COMPANIES);
    expect(report.prices).toEqual({});
    expect(report.strategy).toBe('none');
  });
});

describe('summarizeTables', () => {
  it('exposes header text and the parser column matches for each table', () => {
    const [t] = summarizeTables(fixture);
    expect(t.headers).toContain('Last Sale');
    expect(t.headers).toContain('Previous Close');
    expect(t.rowCount).toBeGreaterThan(0);
    expect(t.securityCol).toBe(0);
    expect(t.lastCol).toBeGreaterThan(0);
    expect(t.prevCol).toBeGreaterThan(0);
  });

  it('returns -1 columns when headers do not match any alias', () => {
    const html =
      '<table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table>';
    const [t] = summarizeTables(html);
    expect(t.securityCol).toBe(-1);
    expect(t.lastCol).toBe(-1);
    expect(t.prevCol).toBe(-1);
  });
});

describe('diagnoseSymbols', () => {
  it('marks parsed symbols as parsed and includes prices', () => {
    const report = parseHtmlReport(fixture, COMPANIES);
    const diag = diagnoseSymbols(fixture, report, COMPANIES);
    const dih = diag.find((d) => d.symbol === 'DIH');
    expect(dih?.status).toBe('parsed');
    expect(dih?.last).toBe(215);
  });

  it('marks HIH as in-text-not-parsed (blank last-sale cell in fixture)', () => {
    const report = parseHtmlReport(fixture, COMPANIES);
    const diag = diagnoseSymbols(fixture, report, COMPANIES);
    expect(diag.find((d) => d.symbol === 'HIH')?.status).toBe(
      'in-text-not-parsed',
    );
  });

  it('marks symbols not referenced anywhere on the page as not-in-text', () => {
    const report = parseHtmlReport(fixture, COMPANIES);
    const diag = diagnoseSymbols(fixture, report, COMPANIES);
    // PHI is in COMPANIES but not in the fixture HTML
    expect(diag.find((d) => d.symbol === 'PHI')?.status).toBe('not-in-text');
  });
});
