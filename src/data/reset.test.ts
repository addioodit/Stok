import { resetAllUserData } from './reset';
import { usePortfolio } from '../store/usePortfolio';
import { useWatchlist } from '../store/useWatchlist';
import { useSettings } from '../store/useSettings';
import { useOrders } from '../store/useOrders';
import { useHistory } from '../store/useHistory';
import { useDividends } from '../store/useDividends';
import { useProfile } from '../store/useProfile';
import { useOnboarding } from '../store/useOnboarding';
import { useAcceptance } from '../store/useAcceptance';
import { usePriceFeed } from '../store/usePriceFeed';
import { useNews } from '../store/useNews';

describe('resetAllUserData', () => {
  it('returns every persisted store to a first-launch shape', () => {
    usePortfolio.setState({
      holdings: [{ symbol: 'DDL', quantity: 5, avgCost: 22, addedAt: 1 }],
    });
    useWatchlist.setState({ symbols: ['RBL'] });
    useOrders.setState({
      orders: [
        {
          id: 'o1',
          symbol: 'DDL',
          side: 'buy',
          type: 'limit',
          quantity: 5,
          limitPrice: 22,
          brokerId: 'beharry',
          status: 'filled',
          createdAt: 1,
          updatedAt: 2,
        },
      ],
    });
    useHistory.setState({ byTicker: { DDL: [{ ts: 1, close: 22 }] } });
    useDividends.setState({ receivedIds: ['x'] });
    useSettings.setState({
      fullName: 'Test',
      phone: '+1',
      email: 'a@b',
      defaultBrokerId: 'beharry',
      brokerEmails: { beharry: 'a@b' },
      brokerAccounts: { beharry: 'X' },
    });
    useProfile.setState({
      username: 'me',
      displayName: 'Me',
      joinedAt: 1,
    });
    useOnboarding.setState({ seen: true });
    useAcceptance.setState({ acceptedVersion: 1, acceptedAt: 1 });
    usePriceFeed.setState({
      prices: { DDL: { last: 22, prev: 21 } },
      lastUpdated: 1,
      sessionLabel: 'X',
      sourceUrl: 'http://x',
      lastError: 'oops',
      lastErrorAt: 1,
    });
    useNews.setState({
      items: [
        {
          id: 'a',
          title: 't',
          link: 'http://x',
          sourceId: 's',
          publishedAt: 1,
          summary: '',
        },
      ],
      lastUpdated: 1,
      lastError: null,
      failedSources: [],
    });

    resetAllUserData();

    expect(usePortfolio.getState().holdings).toEqual([]);
    expect(useWatchlist.getState().symbols).toEqual([]);
    expect(useOrders.getState().orders).toEqual([]);
    expect(useHistory.getState().byTicker).toEqual({});
    expect(useDividends.getState().receivedIds).toEqual([]);
    expect(useSettings.getState().fullName).toBe('');
    expect(useSettings.getState().brokerEmails).toEqual({});
    expect(useProfile.getState().username).toBeNull();
    expect(useOnboarding.getState().seen).toBe(false);
    expect(useAcceptance.getState().acceptedVersion).toBeNull();
    expect(usePriceFeed.getState().prices).toEqual({});
    expect(usePriceFeed.getState().lastError).toBeNull();
    expect(useNews.getState().items).toEqual([]);
  });
});
