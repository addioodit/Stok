import { usePortfolio } from './usePortfolio';

describe('usePortfolio.addLot', () => {
  beforeEach(() => {
    usePortfolio.setState({ holdings: [] });
  });

  it('creates a new holding when none exists for the symbol', () => {
    usePortfolio.getState().addLot('DDL', 100, 22);
    const h = usePortfolio.getState().holdings;
    expect(h).toHaveLength(1);
    expect(h[0]).toMatchObject({
      symbol: 'DDL',
      quantity: 100,
      avgCost: 22,
    });
    expect(typeof h[0].addedAt).toBe('number');
  });

  it('weights the average cost when adding to an existing holding', () => {
    const p = usePortfolio.getState();
    p.addLot('DDL', 100, 20);
    p.addLot('DDL', 100, 24);
    const h = usePortfolio.getState().holdings[0];
    expect(h.quantity).toBe(200);
    // (100*20 + 100*24) / 200 = 22
    expect(h.avgCost).toBe(22);
  });

  it('handles a sell (negative quantity) without changing avg cost', () => {
    const p = usePortfolio.getState();
    p.addLot('DDL', 200, 22);
    p.addLot('DDL', -50, 30);
    const h = usePortfolio.getState().holdings[0];
    expect(h.quantity).toBe(150);
    // Sells should NOT shift cost basis
    expect(h.avgCost).toBe(22);
  });

  it('keeps the holding at qty 0 (not auto-removed) so the row stays visible', () => {
    const p = usePortfolio.getState();
    p.addLot('DDL', 100, 22);
    p.addLot('DDL', -100, 22);
    const h = usePortfolio.getState().holdings[0];
    expect(h.quantity).toBe(0);
    expect(h.avgCost).toBe(22);
  });

  it('keeps holdings sorted by symbol', () => {
    const p = usePortfolio.getState();
    p.addLot('RBL', 1, 500);
    p.addLot('DDL', 1, 22);
    p.addLot('DIH', 1, 215);
    const symbols = usePortfolio.getState().holdings.map((h) => h.symbol);
    expect(symbols).toEqual(['DDL', 'DIH', 'RBL']);
  });
});

describe('usePortfolio.upsert and remove', () => {
  beforeEach(() => {
    usePortfolio.setState({ holdings: [] });
  });

  it('upsert replaces a holding fully (no weighted average)', () => {
    const p = usePortfolio.getState();
    p.addLot('DDL', 100, 20);
    p.upsert({
      symbol: 'DDL',
      quantity: 50,
      avgCost: 30,
      addedAt: Date.now(),
    });
    const h = usePortfolio.getState().holdings[0];
    expect(h.quantity).toBe(50);
    expect(h.avgCost).toBe(30);
  });

  it('remove deletes only the named symbol', () => {
    const p = usePortfolio.getState();
    p.addLot('DDL', 1, 22);
    p.addLot('DIH', 1, 215);
    p.remove('DDL');
    const symbols = usePortfolio.getState().holdings.map((h) => h.symbol);
    expect(symbols).toEqual(['DIH']);
  });
});
