import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePortfolio } from '../store/usePortfolio';
import { useEffectiveCompanies } from '../hooks/useCompanies';
import { theme } from '../theme';
import { formatGYD, formatPct, formatQty } from '../utils/format';
import { TabScreenProps } from '../navigation/types';

type Props = TabScreenProps<'Portfolio'>;

export function PortfolioScreen({ navigation }: Props) {
  const holdings = usePortfolio((s) => s.holdings);
  const companies = useEffectiveCompanies();
  const lastPriceFor = (symbol: string) =>
    companies.find((c) => c.symbol === symbol)?.lastPrice;

  const totals = holdings.reduce(
    (acc, h) => {
      const last = lastPriceFor(h.symbol) ?? h.avgCost;
      acc.cost += h.avgCost * h.quantity;
      acc.value += last * h.quantity;
      return acc;
    },
    { cost: 0, value: 0 },
  );
  const pl = totals.value - totals.cost;
  const plPct = totals.cost === 0 ? 0 : pl / totals.cost;

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Portfolio</Text>
        <Text style={styles.totalLabel}>Total market value</Text>
        <Text style={styles.total}>{formatGYD(totals.value)}</Text>
        <Text
          style={[
            styles.pl,
            { color: pl >= 0 ? theme.colors.positive : theme.colors.negative },
          ]}
        >
          {pl >= 0 ? '+' : ''}
          {formatGYD(pl)} ({formatPct(plPct)})
        </Text>
      </View>
      {holdings.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No positions yet</Text>
          <Text style={styles.emptyBody}>
            After a broker confirms a fill, open the stock and tap "Record fill"
            to track it here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={holdings}
          keyExtractor={(h) => h.symbol}
          renderItem={({ item }) => {
            const last = lastPriceFor(item.symbol) ?? item.avgCost;
            const value = last * item.quantity;
            const cost = item.avgCost * item.quantity;
            const itemPl = value - cost;
            return (
              <Pressable
                onPress={() =>
                  navigation.navigate('StockDetail', { symbol: item.symbol })
                }
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              >
                <View style={styles.left}>
                  <Text style={styles.symbol}>{item.symbol}</Text>
                  <Text style={styles.qty}>
                    {formatQty(item.quantity)} @ {formatGYD(item.avgCost)}
                  </Text>
                </View>
                <View style={styles.right}>
                  <Text style={styles.value}>{formatGYD(value)}</Text>
                  <Text
                    style={[
                      styles.itemPl,
                      {
                        color:
                          itemPl >= 0
                            ? theme.colors.positive
                            : theme.colors.negative,
                      },
                    ]}
                  >
                    {itemPl >= 0 ? '+' : ''}
                    {formatGYD(itemPl)}
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: {
    padding: theme.spacing(2),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: theme.font.h1,
    fontWeight: '700',
    color: theme.colors.text,
  },
  totalLabel: {
    marginTop: theme.spacing(1.5),
    fontSize: theme.font.small,
    color: theme.colors.textSecondary,
  },
  total: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 2,
  },
  pl: {
    fontSize: theme.font.body,
    fontWeight: '600',
    marginTop: 4,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(3),
  },
  emptyTitle: {
    fontSize: theme.font.body,
    fontWeight: '600',
    color: theme.colors.text,
  },
  emptyBody: {
    fontSize: theme.font.small,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing(1),
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing(1.5),
    paddingHorizontal: theme.spacing(2),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.bg,
  },
  pressed: { backgroundColor: theme.colors.surface },
  left: { flex: 1 },
  right: { alignItems: 'flex-end' },
  symbol: {
    fontSize: theme.font.body,
    fontWeight: '700',
    color: theme.colors.text,
  },
  qty: {
    fontSize: theme.font.small,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  value: {
    fontSize: theme.font.body,
    fontWeight: '600',
    color: theme.colors.text,
  },
  itemPl: { fontSize: theme.font.small, marginTop: 2, fontWeight: '600' },
});
