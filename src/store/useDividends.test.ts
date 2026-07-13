import { useDividends } from './useDividends';

describe('useDividends store', () => {
  beforeEach(() => {
    useDividends.setState({ receivedIds: [] });
  });

  it('marks a dividend received exactly once', () => {
    useDividends.getState().markReceived('DIH-2025-FIN');
    useDividends.getState().markReceived('DIH-2025-FIN');
    expect(useDividends.getState().receivedIds).toEqual(['DIH-2025-FIN']);
    expect(useDividends.getState().isReceived('DIH-2025-FIN')).toBe(true);
  });

  it('unmarks a received dividend', () => {
    useDividends.setState({ receivedIds: ['DIH-2025-FIN', 'RBL-2025-INT'] });
    useDividends.getState().unmarkReceived('DIH-2025-FIN');
    expect(useDividends.getState().receivedIds).toEqual(['RBL-2025-INT']);
    expect(useDividends.getState().isReceived('DIH-2025-FIN')).toBe(false);
  });

  it('unmarking a non-received id is a no-op', () => {
    useDividends.setState({ receivedIds: ['DIH-2025-FIN'] });
    useDividends.getState().unmarkReceived('OTHER');
    expect(useDividends.getState().receivedIds).toEqual(['DIH-2025-FIN']);
  });
});
