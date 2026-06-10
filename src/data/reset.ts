import { BROKERS } from './brokers';
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

/**
 * Factory reset: returns every persisted store to its first-launch state.
 * Called from BackupScreen → Reset all data. The App.tsx gate re-renders
 * into AcceptScreen as soon as `useAcceptance` flips back to null, walking
 * the user through legal → profile → tour as if it were a fresh install.
 *
 * Cache stores (priceFeed, news) and history are also cleared so the user
 * is not left with stale derived data from the previous identity.
 */
export function resetAllUserData(): void {
  usePortfolio.setState({ holdings: [] });
  useWatchlist.setState({ symbols: [] });
  useOrders.setState({ orders: [] });
  useHistory.setState({ byTicker: {} });
  useDividends.setState({ receivedIds: [] });

  useSettings.setState({
    fullName: '',
    phone: '',
    email: '',
    defaultBrokerId: BROKERS[0]?.id ?? '',
    brokerEmails: {},
    brokerAccounts: {},
  });

  useProfile.setState({
    username: null,
    displayName: '',
    joinedAt: null,
  });

  useOnboarding.setState({ seen: false });
  useAcceptance.setState({ acceptedVersion: null, acceptedAt: null });

  usePriceFeed.setState({
    prices: {},
    lastUpdated: null,
    sessionLabel: null,
    sourceUrl: null,
    lastError: null,
    lastErrorAt: null,
  });

  useNews.setState({
    items: [],
    lastUpdated: null,
    lastError: null,
    failedSources: [],
  });
}
