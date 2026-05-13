import { isPending, useOrders } from './useOrders';

const baseTicket = {
  symbol: 'DDL',
  side: 'buy' as const,
  type: 'limit' as const,
  quantity: 100,
  limitPrice: 22,
  brokerId: 'beharry',
};

describe('useOrders', () => {
  beforeEach(() => {
    useOrders.setState({ orders: [] });
  });

  it('add() assigns an id and timestamps, returns the order', () => {
    const o = useOrders.getState().add({ ...baseTicket, status: 'emailed' });
    expect(o.id).toBeTruthy();
    expect(o.createdAt).toBeGreaterThan(0);
    expect(o.createdAt).toBe(o.updatedAt);
    expect(useOrders.getState().orders).toHaveLength(1);
    expect(useOrders.getState().orders[0].id).toBe(o.id);
  });

  it('newest order is first in the list', () => {
    const first = useOrders.getState().add({ ...baseTicket, status: 'emailed' });
    const second = useOrders.getState().add({ ...baseTicket, status: 'called' });
    const ids = useOrders.getState().orders.map((o) => o.id);
    expect(ids).toEqual([second.id, first.id]);
  });

  it('setStatus updates status and bumps updatedAt', () => {
    const o = useOrders.getState().add({ ...baseTicket, status: 'emailed' });
    const before = useOrders.getState().orders[0].updatedAt;
    // Spin until clock advances by at least 1ms
    while (Date.now() === before) {
      /* no-op */
    }
    useOrders.getState().setStatus(o.id, 'filled');
    const after = useOrders.getState().orders[0];
    expect(after.status).toBe('filled');
    expect(after.updatedAt).toBeGreaterThan(before);
    expect(after.createdAt).toBe(o.createdAt); // createdAt is immutable
  });

  it('remove() deletes a single order by id', () => {
    const a = useOrders.getState().add({ ...baseTicket, status: 'emailed' });
    const b = useOrders.getState().add({ ...baseTicket, status: 'called' });
    useOrders.getState().remove(a.id);
    expect(useOrders.getState().orders.map((o) => o.id)).toEqual([b.id]);
  });

  it('clear() empties the log', () => {
    useOrders.getState().add({ ...baseTicket, status: 'emailed' });
    useOrders.getState().add({ ...baseTicket, status: 'called' });
    useOrders.getState().clear();
    expect(useOrders.getState().orders).toEqual([]);
  });
});

describe('isPending', () => {
  it('treats emailed and called as pending', () => {
    expect(isPending('emailed')).toBe(true);
    expect(isPending('called')).toBe(true);
  });

  it('treats filled and cancelled as not pending', () => {
    expect(isPending('filled')).toBe(false);
    expect(isPending('cancelled')).toBe(false);
  });
});
