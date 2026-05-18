import {
  applyBackup,
  buildBackup,
  BACKUP_VERSION,
  validateBackup,
} from './backup';
import { usePortfolio } from '../store/usePortfolio';
import { useWatchlist } from '../store/useWatchlist';
import { useSettings } from '../store/useSettings';
import { useOrders } from '../store/useOrders';
import { useHistory } from '../store/useHistory';
import { useDividends } from '../store/useDividends';
import { useProfile } from '../store/useProfile';

function seedStores() {
  usePortfolio.setState({
    holdings: [
      { symbol: 'DDL', quantity: 100, avgCost: 22, addedAt: 1 },
      { symbol: 'DIH', quantity: 5, avgCost: 215, addedAt: 2 },
    ],
  });
  useWatchlist.setState({ symbols: ['RBL', 'GBTI'] });
  useOrders.setState({
    orders: [
      {
        id: 'o1',
        symbol: 'DDL',
        side: 'buy',
        type: 'limit',
        quantity: 100,
        limitPrice: 22,
        brokerId: 'beharry',
        status: 'filled',
        createdAt: 10,
        updatedAt: 20,
      },
    ],
  });
  useHistory.setState({
    byTicker: { DDL: [{ ts: 100, close: 22 }] },
  });
  useDividends.setState({ receivedIds: ['DIH-2025-FIN'] });
  useSettings.setState({
    fullName: 'Jane Doe',
    phone: '+592 000 0000',
    email: 'jane@example.com',
    defaultBrokerId: 'beharry',
    brokerEmails: { beharry: 'orders@beharry.example' },
    brokerAccounts: { beharry: 'ACC-1' },
  });
  useProfile.setState({
    username: 'jane_gy',
    displayName: 'Jane',
    joinedAt: 555,
  });
}

function clearStores() {
  usePortfolio.setState({ holdings: [] });
  useWatchlist.setState({ symbols: [] });
  useOrders.setState({ orders: [] });
  useHistory.setState({ byTicker: {} });
  useDividends.setState({ receivedIds: [] });
  useSettings.setState({
    fullName: '',
    phone: '',
    email: '',
    defaultBrokerId: '',
    brokerEmails: {},
    brokerAccounts: {},
  });
  useProfile.setState({ username: null, displayName: '', joinedAt: null });
}

describe('buildBackup', () => {
  it('snapshots every store into a versioned envelope', () => {
    seedStores();
    const backup = buildBackup(1_700_000_000_000);
    expect(backup.app).toBe('stok');
    expect(backup.backupVersion).toBe(BACKUP_VERSION);
    expect(backup.exportedAt).toBe(1_700_000_000_000);
    expect(backup.data.portfolio).toHaveLength(2);
    expect(backup.data.watchlist).toEqual(['RBL', 'GBTI']);
    expect(backup.data.orders).toHaveLength(1);
    expect(backup.data.settings.brokerEmails.beharry).toBe(
      'orders@beharry.example',
    );
    expect(backup.data.profile.username).toBe('jane_gy');
  });
});

describe('validateBackup', () => {
  it('accepts a well-formed backup', () => {
    seedStores();
    const result = validateBackup(buildBackup());
    expect(result.ok).toBe(true);
  });

  it('rejects non-objects', () => {
    expect(validateBackup(null).ok).toBe(false);
    expect(validateBackup('a string').ok).toBe(false);
  });

  it('rejects files that are not Stok backups', () => {
    const r = validateBackup({ app: 'something-else', data: {} });
    expect(r).toEqual({ ok: false, error: 'This file is not a Stok backup.' });
  });

  it('rejects a backup from a newer app version', () => {
    const r = validateBackup({
      app: 'stok',
      backupVersion: BACKUP_VERSION + 1,
      data: {},
    });
    expect(r.ok).toBe(false);
  });

  it('rejects a backup with no data', () => {
    const r = validateBackup({ app: 'stok', backupVersion: BACKUP_VERSION });
    expect(r.ok).toBe(false);
  });
});

describe('buildBackup → applyBackup round-trip', () => {
  it('restores every store exactly after a wipe', () => {
    seedStores();
    const backup = buildBackup();
    clearStores();

    expect(usePortfolio.getState().holdings).toHaveLength(0);
    const summary = applyBackup(backup);

    expect(summary.portfolio).toBe(2);
    expect(summary.orders).toBe(1);
    expect(summary.watchlist).toBe(2);
    expect(summary.profile).toBe(true);

    expect(usePortfolio.getState().holdings).toHaveLength(2);
    expect(useWatchlist.getState().symbols).toEqual(['RBL', 'GBTI']);
    expect(useOrders.getState().orders[0].id).toBe('o1');
    expect(useHistory.getState().byTicker.DDL).toHaveLength(1);
    expect(useDividends.getState().receivedIds).toEqual(['DIH-2025-FIN']);
    expect(useSettings.getState().fullName).toBe('Jane Doe');
    expect(useProfile.getState().username).toBe('jane_gy');
  });
});

describe('applyBackup — defensive', () => {
  it('skips malformed sections without throwing', () => {
    clearStores();
    usePortfolio.setState({
      holdings: [{ symbol: 'DDL', quantity: 1, avgCost: 22, addedAt: 1 }],
    });
    const summary = applyBackup({
      app: 'stok',
      backupVersion: BACKUP_VERSION,
      exportedAt: 0,
      // portfolio is the wrong type; others missing
      data: { portfolio: 'not an array' } as never,
    });
    expect(summary.portfolio).toBe(0);
    // Existing data is untouched when the section is malformed.
    expect(usePortfolio.getState().holdings).toHaveLength(1);
  });

  it('does not restore an empty username (would bounce to onboarding)', () => {
    clearStores();
    useProfile.setState({
      username: 'keepme',
      displayName: 'Keep',
      joinedAt: 1,
    });
    applyBackup({
      app: 'stok',
      backupVersion: BACKUP_VERSION,
      exportedAt: 0,
      data: {
        profile: { username: null, displayName: '', joinedAt: null },
      } as never,
    });
    expect(useProfile.getState().username).toBe('keepme');
  });
});
