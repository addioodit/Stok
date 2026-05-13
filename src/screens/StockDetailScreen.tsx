import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useEffectiveCompany } from '../hooks/useCompanies';
import { useWatchlist } from '../store/useWatchlist';
import { usePortfolio } from '../store/usePortfolio';
import { useHistory, selectHistoryFor } from '../store/useHistory';
import { PrimaryButton } from '../components/PrimaryButton';
import { LineChart } from '../components/LineChart';
import { Segmented } from '../components/Segmented';
import { theme } from '../theme';
import { formatGYD, formatPct, formatQty, priceChange } from '../utils/format';
import { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'StockDetail'>;

type Range = '4w' | '12w' | '1y' | 'all';

const RANGE_DAYS: Record<Range, number | null> = {
  '4w': 30,
  '12w': 90,
  '1y': 365,
  all: null,
};

export function StockDetailScreen({ route, navigation }: Props) {
  const { symbol } = route.params;
  const company = useEffectiveCompany(symbol);
  const { isWatched, toggle } = useWatchlist();
  const holding = usePortfolio((s) =>
    s.holdings.find((h) => h.symbol === symbol),
  );
  const [range, setRange] = useState<Range>('12w');
  const points = useHistory((s) => selectHistoryFor(s, symbol, RANGE_DAYS[range]));
  const totalPointsForSymbol = useHistory(
    (s) => (s.byTicker[symbol] ?? []).length,
  );
  const backfillStatus = useHistory((s) => s.backfillStatus);
  const backfillError = useHistory((s) => s.backfillError);
  const backfillDone = useHistory((s) => s.backfillDone);
  const backfillTotal = useHistory((s) => s.backfillTotal);
  const backfill = useHistory((s) => s.backfill);

  const { width } = useWindowDimensions();
  const chartWidth = width - theme.spacing(4);

  if (!company) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Unknown symbol: {symbol}</Text>
      </View>
    );
  }

  const { diff, pct } = priceChange(company.lastPrice, company.prevClose);
  const positive = pct >= 0;
  const watching = isWatched(symbol);

  const showChart = points.length >= 2;
  const isBackfilling = backfillStatus === 'loading';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: theme.spacing(2) }}
    >
      <Text style={styles.symbol}>{company.symbol}</Text>
      <Text style={styles.name}>{company.name}</Text>
      <Text style={styles.sector}>{company.sector}</Text>

      <View style={styles.priceBlock}>
        <Text style={styles.price}>{formatGYD(company.lastPrice)}</Text>
        <Text
          style={[
            styles.change,
            { color: positive ? theme.colors.positive : theme.colors.negative },
          ]}
        >
          {positive ? '+' : ''}
          {formatGYD(diff)} ({formatPct(pct)})
        </Text>
        <Text style={styles.prev}>
          Prev close {formatGYD(company.prevClose)}
        </Text>
      </View>

      <View style={styles.chartSection}>
        {showChart ? (
          <>
            <LineChart data={points} width={chartWidth} />
            <View style={styles.rangeRow}>
              <Segmented
                value={range}
                onChange={setRange}
                options={[
                  { label: '4W', value: '4w' },
                  { label: '12W', value: '12w' },
                  { label: '1Y', value: '1y' },
                  { label: 'All', value: 'all' },
                ]}
              />
            </View>
            <Text style={styles.chartFooter}>
              {points.length} weekly close{points.length === 1 ? '' : 's'}
              {totalPointsForSymbol > points.length
                ? ` of ${totalPointsForSymbol} recorded`
                : ''}
            </Text>
          </>
        ) : (
          <View style={styles.emptyChart}>
            <Text style={styles.emptyChartTitle}>No price history yet</Text>
            <Text style={styles.emptyChartBody}>
              {totalPointsForSymbol === 0
                ? 'Pull-to-refresh on Market records one weekly close. Or load older GASCI sessions to backfill a chart now.'
                : `${totalPointsForSymbol} point${totalPointsForSymbol === 1 ? '' : 's'} recorded — need at least 2 to draw a line. Try a wider range, or backfill older sessions.`}
            </Text>
            <View style={{ height: theme.spacing(1.5) }} />
            <PrimaryButton
              label={
                isBackfilling
                  ? `Loading ${backfillDone}/${backfillTotal}…`
                  : 'Load last 12 sessions'
              }
              onPress={() => backfill(12)}
              loading={isBackfilling}
              disabled={isBackfilling}
            />
            {backfillStatus === 'error' && backfillError ? (
              <Text style={styles.backfillError}>{backfillError}</Text>
            ) : null}
          </View>
        )}
      </View>

      {holding ? (
        <View style={styles.holdingCard}>
          <Text style={styles.cardTitle}>Your position</Text>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Quantity</Text>
            <Text style={styles.cardValue}>{formatQty(holding.quantity)}</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Avg cost</Text>
            <Text style={styles.cardValue}>{formatGYD(holding.avgCost)}</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Market value</Text>
            <Text style={styles.cardValue}>
              {formatGYD(holding.quantity * company.lastPrice)}
            </Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Unrealised P/L</Text>
            <Text
              style={[
                styles.cardValue,
                {
                  color:
                    company.lastPrice >= holding.avgCost
                      ? theme.colors.positive
                      : theme.colors.negative,
                },
              ]}
            >
              {formatGYD(
                (company.lastPrice - holding.avgCost) * holding.quantity,
              )}
            </Text>
          </View>
        </View>
      ) : null}

      <View style={styles.actions}>
        <PrimaryButton
          label="Buy"
          variant="positive"
          onPress={() =>
            navigation.navigate('OrderTicket', { symbol, side: 'buy' })
          }
          style={{ flex: 1 }}
        />
        <View style={{ width: theme.spacing(1.5) }} />
        <PrimaryButton
          label="Sell"
          variant="negative"
          onPress={() =>
            navigation.navigate('OrderTicket', { symbol, side: 'sell' })
          }
          style={{ flex: 1 }}
        />
      </View>
      <View style={{ height: theme.spacing(1.5) }} />
      <PrimaryButton
        label={watching ? 'Remove from watchlist' : 'Add to watchlist'}
        variant="secondary"
        onPress={() => toggle(symbol)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bg,
  },
  notFound: { color: theme.colors.textSecondary },
  symbol: {
    fontSize: theme.font.h1,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: 1,
  },
  name: { fontSize: theme.font.body, color: theme.colors.text, marginTop: 4 },
  sector: {
    fontSize: theme.font.small,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  priceBlock: { marginTop: theme.spacing(3) },
  price: {
    fontSize: 36,
    fontWeight: '700',
    color: theme.colors.text,
  },
  change: { fontSize: theme.font.body, fontWeight: '600', marginTop: 4 },
  prev: {
    fontSize: theme.font.small,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  chartSection: { marginTop: theme.spacing(3) },
  rangeRow: { marginTop: theme.spacing(1) },
  chartFooter: {
    marginTop: theme.spacing(1),
    fontSize: theme.font.tiny,
    color: theme.colors.textSecondary,
  },
  emptyChart: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emptyChartTitle: {
    fontSize: theme.font.body,
    fontWeight: '700',
    color: theme.colors.text,
  },
  emptyChartBody: {
    fontSize: theme.font.small,
    color: theme.colors.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  backfillError: {
    marginTop: theme.spacing(1),
    fontSize: theme.font.tiny,
    color: theme.colors.negative,
  },
  holdingCard: {
    marginTop: theme.spacing(3),
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardTitle: {
    fontSize: theme.font.small,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing(1),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  cardLabel: {
    fontSize: theme.font.small,
    color: theme.colors.textSecondary,
  },
  cardValue: {
    fontSize: theme.font.body,
    fontWeight: '600',
    color: theme.colors.text,
  },
  actions: {
    flexDirection: 'row',
    marginTop: theme.spacing(3),
  },
});
