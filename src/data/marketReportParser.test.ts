import * as fs from 'fs';
import * as path from 'path';
import {
  discoverLatestSession,
  parseFromTables,
  parseHtmlReport,
  parseLoose,
  parseSessionLabel,
  parseSessionTimestamp,
  parseTables,
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
  });

  it('falls through to parseLoose when no table works', () => {
    const html = '<p>BANKS DIH (DIH) traded at 217</p>';
    const report = parseHtmlReport(html, COMPANIES);
    expect(report.prices.DIH.last).toBe(217);
  });

  it('returns an empty prices map when nothing matches (caller decides whether to throw)', () => {
    const report = parseHtmlReport('<p>no symbols mentioned</p>', COMPANIES);
    expect(report.prices).toEqual({});
  });
});
