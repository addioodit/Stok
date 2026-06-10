import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../components/PrimaryButton';
import { applyBackup } from '../data/backup';
import { resetAllUserData } from '../data/reset';
import { exportBackup, pickBackup } from '../utils/backupIo';
import { usePortfolio } from '../store/usePortfolio';
import { useWatchlist } from '../store/useWatchlist';
import { useOrders } from '../store/useOrders';
import { useHistory } from '../store/useHistory';
import { useDividends } from '../store/useDividends';
import { theme } from '../theme';
import { formatMediumDate } from '../utils/format';
import { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'Backup'>;
type Busy = 'idle' | 'exporting' | 'importing';
type Message = { tone: 'ok' | 'error'; text: string } | null;

export function BackupScreen(_props: Props) {
  const [busy, setBusy] = useState<Busy>('idle');
  const [message, setMessage] = useState<Message>(null);

  const holdings = usePortfolio((s) => s.holdings.length);
  const watchlist = useWatchlist((s) => s.symbols.length);
  const orders = useOrders((s) => s.orders.length);
  const historyStocks = useHistory((s) => Object.keys(s.byTicker).length);
  const dividends = useDividends((s) => s.receivedIds.length);

  const onExport = async () => {
    setBusy('exporting');
    setMessage(null);
    try {
      await exportBackup();
    } catch (e) {
      setMessage({
        tone: 'error',
        text: e instanceof Error ? e.message : 'Export failed.',
      });
    } finally {
      setBusy('idle');
    }
  };

  const onReset = () => {
    Alert.alert(
      'Reset all data?',
      'Wipes every store on this device and returns Stok to first-launch. Export a backup first if you want to keep what you have.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset everything',
          style: 'destructive',
          onPress: () => {
            resetAllUserData();
          },
        },
      ],
    );
  };

  const onImport = async () => {
    setBusy('importing');
    setMessage(null);
    let result;
    try {
      result = await pickBackup();
    } catch {
      setMessage({ tone: 'error', text: 'Could not open the file picker.' });
      setBusy('idle');
      return;
    }

    if (result.status === 'cancelled') {
      setBusy('idle');
      return;
    }
    if (result.status === 'error') {
      setMessage({ tone: 'error', text: result.error });
      setBusy('idle');
      return;
    }

    const { backup } = result;
    Alert.alert(
      'Replace all data?',
      `This backup was made ${formatMediumDate(backup.exportedAt)}. Importing replaces everything currently in Stok — holdings, orders, history, watchlist, dividends, settings and profile. This cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setBusy('idle'),
        },
        {
          text: 'Replace',
          style: 'destructive',
          onPress: () => {
            const s = applyBackup(backup);
            setMessage({
              tone: 'ok',
              text: `Restored ${s.portfolio} holdings, ${s.orders} orders, ${s.watchlist} watchlist symbols, and price history for ${s.history} stocks.`,
            });
            setBusy('idle');
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: theme.spacing(2) }}
    >
      <Text style={styles.title}>Backup &amp; restore</Text>
      <Text style={styles.body}>
        Stok keeps everything on this device — there are no accounts or cloud
        sync. Export a backup file and keep it somewhere safe so a reinstall or
        a new phone doesn&apos;t lose your records.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>On this device</Text>
        <Stat label="Holdings" value={holdings} />
        <Stat label="Orders logged" value={orders} />
        <Stat label="Watchlist symbols" value={watchlist} />
        <Stat label="Stocks with price history" value={historyStocks} />
        <Stat label="Dividends marked received" value={dividends} />
      </View>

      <View style={{ height: theme.spacing(2) }} />
      <PrimaryButton
        label={busy === 'exporting' ? 'Preparing…' : 'Export backup'}
        onPress={onExport}
        loading={busy === 'exporting'}
        disabled={busy !== 'idle'}
      />
      <Text style={styles.hint}>
        Writes a JSON file and opens the share sheet — save it to Files, email
        it to yourself, or send it to another device.
      </Text>

      <View style={{ height: theme.spacing(2) }} />
      <PrimaryButton
        label={busy === 'importing' ? 'Opening…' : 'Import backup'}
        variant="secondary"
        onPress={onImport}
        loading={busy === 'importing'}
        disabled={busy !== 'idle'}
      />
      <Text style={styles.hint}>
        Pick a previously exported Stok backup. Importing replaces all current
        data — you&apos;ll be asked to confirm first.
      </Text>

      {message ? (
        <View
          style={[
            styles.message,
            message.tone === 'ok' ? styles.messageOk : styles.messageError,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              {
                color:
                  message.tone === 'ok'
                    ? theme.colors.positive
                    : theme.colors.negative,
              },
            ]}
          >
            {message.text}
          </Text>
        </View>
      ) : null}

      <Text style={styles.footer}>
        The backup does not include cached prices, the news cache, or your
        legal acceptance — those are re-fetched or re-confirmed automatically.
      </Text>

      <Text style={styles.dangerSection}>Danger zone</Text>
      <View style={styles.dangerCard}>
        <Text style={styles.dangerTitle}>Reset all data</Text>
        <Text style={styles.dangerBody}>
          Wipes every persisted store on this device and walks you back
          through legal acceptance, profile setup, and the tour. Export a
          backup first if you want to come back to this state.
        </Text>
        <View style={{ height: theme.spacing(1.25) }} />
        <PrimaryButton
          label="Reset all data"
          variant="negative"
          onPress={onReset}
          disabled={busy !== 'idle'}
        />
      </View>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  title: {
    fontSize: theme.font.h1,
    fontWeight: '700',
    color: theme.colors.text,
  },
  body: {
    marginTop: theme.spacing(1),
    fontSize: theme.font.body,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  card: {
    marginTop: theme.spacing(2),
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing(2),
  },
  cardTitle: {
    fontSize: theme.font.tiny,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: theme.spacing(1),
  },
  stat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  statLabel: {
    fontSize: theme.font.small,
    color: theme.colors.textSecondary,
  },
  statValue: {
    fontSize: theme.font.body,
    fontWeight: '700',
    color: theme.colors.text,
  },
  hint: {
    marginTop: theme.spacing(1),
    fontSize: theme.font.tiny,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  message: {
    marginTop: theme.spacing(2),
    borderRadius: theme.radius.md,
    borderWidth: 1,
    padding: theme.spacing(1.5),
  },
  messageOk: {
    backgroundColor: '#E7F8EE',
    borderColor: theme.colors.positive,
  },
  messageError: {
    backgroundColor: '#FEF2F2',
    borderColor: theme.colors.negative,
  },
  messageText: {
    fontSize: theme.font.small,
    lineHeight: 20,
  },
  footer: {
    marginTop: theme.spacing(3),
    fontSize: theme.font.tiny,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  dangerSection: {
    marginTop: theme.spacing(4),
    fontSize: theme.font.tiny,
    fontWeight: '700',
    color: theme.colors.negative,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: theme.spacing(0.5),
  },
  dangerCard: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.negative,
    backgroundColor: '#FEF2F2',
    padding: theme.spacing(2),
  },
  dangerTitle: {
    fontSize: theme.font.body,
    fontWeight: '700',
    color: theme.colors.negative,
  },
  dangerBody: {
    marginTop: 4,
    fontSize: theme.font.small,
    color: theme.colors.negative,
    lineHeight: 20,
  },
});
