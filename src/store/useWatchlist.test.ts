import { useWatchlist } from './useWatchlist';

describe('useWatchlist', () => {
  beforeEach(() => {
    useWatchlist.setState({ symbols: [] });
  });

  it('starts empty', () => {
    expect(useWatchlist.getState().symbols).toEqual([]);
    expect(useWatchlist.getState().isWatched('DDL')).toBe(false);
  });

  it('toggle adds an unknown symbol', () => {
    useWatchlist.getState().toggle('DDL');
    expect(useWatchlist.getState().symbols).toEqual(['DDL']);
    expect(useWatchlist.getState().isWatched('DDL')).toBe(true);
  });

  it('toggle removes a known symbol', () => {
    useWatchlist.setState({ symbols: ['DDL', 'RBL'] });
    useWatchlist.getState().toggle('DDL');
    expect(useWatchlist.getState().symbols).toEqual(['RBL']);
    expect(useWatchlist.getState().isWatched('DDL')).toBe(false);
  });

  it('preserves order when adding a new symbol', () => {
    useWatchlist.getState().toggle('DDL');
    useWatchlist.getState().toggle('RBL');
    useWatchlist.getState().toggle('DIH');
    expect(useWatchlist.getState().symbols).toEqual(['DDL', 'RBL', 'DIH']);
  });
});
