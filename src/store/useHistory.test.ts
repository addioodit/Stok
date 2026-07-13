import { useHistory, selectHistoryFor } from './useHistory';

describe('useHistory', () => {
  beforeEach(() => {
    useHistory.setState({ byTicker: {} });
  });

  it('recordReport appends a per-symbol point tagged with sessionLabel', () => {
    useHistory.getState().recordReport(
      { DDL: { last: 22, prev: 21 } },
      'Session 42',
      1_700_000_000_000,
    );
    const points = useHistory.getState().byTicker.DDL;
    expect(points).toHaveLength(1);
    expect(points[0]).toEqual({
      ts: 1_700_000_000_000,
      close: 22,
      sessionLabel: 'Session 42',
    });
  });

  it('dedupes multiple recordReport calls that land on the same UTC day', () => {
    const morning = Date.UTC(2026, 4, 13, 9, 0, 0);
    const evening = Date.UTC(2026, 4, 13, 18, 0, 0);
    useHistory.getState().recordReport({ DDL: { last: 22, prev: 21 } }, 'S1', morning);
    useHistory.getState().recordReport({ DDL: { last: 23, prev: 22 } }, 'S1-late', evening);
    const points = useHistory.getState().byTicker.DDL;
    expect(points).toHaveLength(1);
    // The later point wins.
    expect(points[0].close).toBe(23);
  });

  it('keeps distinct days as separate points and returns them sorted', () => {
    const d1 = Date.UTC(2026, 4, 13);
    const d2 = Date.UTC(2026, 4, 14);
    // Insert out of order.
    useHistory.getState().recordReport({ DDL: { last: 24, prev: 23 } }, 'later', d2);
    useHistory.getState().recordReport({ DDL: { last: 22, prev: 21 } }, 'earlier', d1);
    const points = useHistory.getState().byTicker.DDL;
    expect(points.map((p) => p.close)).toEqual([22, 24]);
  });

  it('clear wipes every symbol', () => {
    useHistory.setState({
      byTicker: { DDL: [{ ts: 1, close: 22 }], RBL: [{ ts: 1, close: 540 }] },
    });
    useHistory.getState().clear();
    expect(useHistory.getState().byTicker).toEqual({});
  });

  it('selectHistoryFor filters by daysBack window from Date.now()', () => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    useHistory.setState({
      byTicker: {
        DDL: [
          { ts: now - 40 * day, close: 20 },
          { ts: now - 10 * day, close: 22 },
          { ts: now - 1 * day, close: 23 },
        ],
      },
    });
    const state = useHistory.getState();
    expect(selectHistoryFor(state, 'DDL', 30).map((p) => p.close)).toEqual([22, 23]);
    expect(selectHistoryFor(state, 'DDL', null).map((p) => p.close)).toEqual([
      20, 22, 23,
    ]);
    expect(selectHistoryFor(state, 'MISSING', 30)).toEqual([]);
  });
});
