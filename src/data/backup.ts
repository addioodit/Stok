import { Holding, Order, UserSettings } from '../types';
import { usePortfolio } from '../store/usePortfolio';
import { useWatchlist } from '../store/useWatchlist';
import { useSettings } from '../store/useSettings';
import { useOrders } from '../store/useOrders';
import { useHistory, PricePoint } from '../store/useHistory';
import { useDividends } from '../store/useDividends';
import { useProfile } from '../store/useProfile';

// Bump when the BackupData shape changes incompatibly. validateBackup
// rejects files with a higher version than the running app understands.
export const BACKUP_VERSION = 1;

export interface BackupProfile {
  username: string | null;
  displayName: string;
  joinedAt: number | null;
}

export interface BackupData {
  portfolio: Holding[];
  watchlist: string[];
  settings: UserSettings;
  orders: Order[];
  history: Record<string, PricePoint[]>;
  dividendsReceived: string[];
  profile: BackupProfile;
}

export interface BackupFile {
  app: 'stok';
  backupVersion: number;
  exportedAt: number;
  data: BackupData;
}

export interface RestoreSummary {
  portfolio: number;
  watchlist: number;
  orders: number;
  history: number;
  dividendsReceived: number;
  settings: boolean;
  profile: boolean;
}

export type ValidateResult =
  | { ok: true; backup: BackupFile }
  | { ok: false; error: string };

/** Snapshot every persisted store the user would hate to lose. */
export function buildBackup(now: number = Date.now()): BackupFile {
  const s = useSettings.getState();
  const p = useProfile.getState();
  return {
    app: 'stok',
    backupVersion: BACKUP_VERSION,
    exportedAt: now,
    data: {
      portfolio: usePortfolio.getState().holdings,
      watchlist: useWatchlist.getState().symbols,
      settings: {
        fullName: s.fullName,
        phone: s.phone,
        email: s.email,
        defaultBrokerId: s.defaultBrokerId,
        brokerEmails: s.brokerEmails,
        brokerAccounts: s.brokerAccounts,
      },
      orders: useOrders.getState().orders,
      history: useHistory.getState().byTicker,
      dividendsReceived: useDividends.getState().receivedIds,
      profile: {
        username: p.username,
        displayName: p.displayName,
        joinedAt: p.joinedAt,
      },
    },
  };
}

/** Check the envelope. Per-section shape is checked again in applyBackup. */
export function validateBackup(raw: unknown): ValidateResult {
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, error: 'That file is not valid JSON.' };
  }
  const o = raw as Record<string, unknown>;
  if (o.app !== 'stok') {
    return { ok: false, error: 'This file is not a Stok backup.' };
  }
  if (typeof o.backupVersion !== 'number') {
    return { ok: false, error: 'Backup is missing a version number.' };
  }
  if (o.backupVersion > BACKUP_VERSION) {
    return {
      ok: false,
      error:
        'This backup was made by a newer version of Stok. Update the app first.',
    };
  }
  if (typeof o.data !== 'object' || o.data === null) {
    return { ok: false, error: 'Backup contains no data.' };
  }
  return { ok: true, backup: o as unknown as BackupFile };
}

const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === 'string');

/**
 * Apply a validated backup, replacing current data. Each section is checked
 * and applied independently — a malformed section is skipped, not fatal.
 * Returns what was actually restored.
 */
export function applyBackup(backup: BackupFile): RestoreSummary {
  const d = (backup.data ?? {}) as Partial<BackupData>;
  const summary: RestoreSummary = {
    portfolio: 0,
    watchlist: 0,
    orders: 0,
    history: 0,
    dividendsReceived: 0,
    settings: false,
    profile: false,
  };

  if (Array.isArray(d.portfolio)) {
    usePortfolio.setState({ holdings: d.portfolio });
    summary.portfolio = d.portfolio.length;
  }
  if (isStringArray(d.watchlist)) {
    useWatchlist.setState({ symbols: d.watchlist });
    summary.watchlist = d.watchlist.length;
  }
  if (Array.isArray(d.orders)) {
    useOrders.setState({ orders: d.orders });
    summary.orders = d.orders.length;
  }
  if (d.history && typeof d.history === 'object') {
    useHistory.setState({ byTicker: d.history });
    summary.history = Object.keys(d.history).length;
  }
  if (isStringArray(d.dividendsReceived)) {
    useDividends.setState({ receivedIds: d.dividendsReceived });
    summary.dividendsReceived = d.dividendsReceived.length;
  }
  if (d.settings && typeof d.settings === 'object') {
    const s = d.settings;
    useSettings.setState({
      fullName: s.fullName ?? '',
      phone: s.phone ?? '',
      email: s.email ?? '',
      defaultBrokerId: s.defaultBrokerId ?? '',
      brokerEmails: s.brokerEmails ?? {},
      brokerAccounts: s.brokerAccounts ?? {},
    });
    summary.settings = true;
  }
  if (d.profile && typeof d.profile === 'object') {
    const pf = d.profile;
    // Only restore a non-empty username — applying a null would bounce the
    // user back to the onboarding gate.
    if (typeof pf.username === 'string' && pf.username.length > 0) {
      useProfile.setState({
        username: pf.username,
        displayName: pf.displayName ?? '',
        joinedAt: pf.joinedAt ?? null,
      });
      summary.profile = true;
    }
  }

  return summary;
}
