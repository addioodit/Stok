import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWatchlist } from '../store/useWatchlist';
import { useEffectiveCompanies } from '../hooks/useCompanies';
import { StockRow } from '../components/StockRow';
import { StaleDataHint } from '../components/StaleDataHint';
import { theme } from '../theme';
import { TabScreenProps } from '../navigation/types';

type Props = TabScreenProps<'Watchlist'>;

export function WatchlistScreen({ navigation }: Props) {
  const symbols = useWatchlist((s) => s.symbols);
  const all = useEffectiveCompanies();
  const companies = symbols
    .map((s) => all.find((c) => c.symbol === s))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Watchlist</Text>
        {companies.length > 0 ? (
          <StaleDataHint style={styles.staleHint} />
        ) : null}
      </View>
      {companies.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No stocks watched</Text>
          <Text style={styles.emptyBody}>
            Open a stock from the Market tab and tap "Add to watchlist".
          </Text>
        </View>
      ) : (
        <FlatList
          data={companies}
          keyExtractor={(c) => c.symbol}
          renderItem={({ item }) => (
            <StockRow
              company={item}
              onPress={() =>
                navigation.navigate('StockDetail', { symbol: item.symbol })
              }
            />
          )}
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
  staleHint: {
    marginTop: theme.spacing(1.5),
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
});
