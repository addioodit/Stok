import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StockRow } from '../components/StockRow';
import { theme } from '../theme';
import { TabScreenProps } from '../navigation/types';
import { useEffectiveCompanies } from '../hooks/useCompanies';
import { usePriceFeed } from '../store/usePriceFeed';
import { timeAgo } from '../utils/timeAgo';

type Props = TabScreenProps<'Market'>;

export function MarketScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const companies = useEffectiveCompanies();
  const { status, error, lastUpdated, sessionLabel, refresh } = usePriceFeed();

  useEffect(() => {
    if (lastUpdated === null) {
      void refresh();
    }
  }, [lastUpdated, refresh]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter(
      (c) =>
        c.symbol.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.sector.toLowerCase().includes(q),
    );
  }, [query, companies]);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Guyana Stock Exchange</Text>
        <View style={styles.metaRow}>
          <Text style={styles.subtitle}>
            {companies.length} listed companies
          </Text>
          {lastUpdated ? (
            <Text style={styles.updated}>
              Updated {timeAgo(lastUpdated)}
              {sessionLabel ? ` · ${sessionLabel}` : ''}
            </Text>
          ) : (
            <Text style={styles.updated}>
              {status === 'loading' ? 'Fetching latest report…' : 'Pull to update'}
            </Text>
          )}
        </View>
        {status === 'error' && error ? (
          <Pressable onPress={refresh} style={styles.errorBanner}>
            <Text style={styles.errorText} numberOfLines={2}>
              {error}
            </Text>
            <Text style={styles.errorRetry}>Tap to retry</Text>
          </Pressable>
        ) : null}
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search symbol, name, or sector"
          placeholderTextColor={theme.colors.textSecondary}
          autoCapitalize="characters"
          autoCorrect={false}
          style={styles.search}
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(c) => c.symbol}
        renderItem={({ item }) => (
          <StockRow
            company={item}
            onPress={() =>
              navigation.navigate('StockDetail', { symbol: item.symbol })
            }
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={status === 'loading'}
            onRefresh={refresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
            title="Fetching latest GASCI report"
            titleColor={theme.colors.textSecondary}
          />
        }
        ListEmptyComponent={<Text style={styles.empty}>No matches.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: {
    paddingHorizontal: theme.spacing(2),
    paddingBottom: theme.spacing(1.5),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: theme.font.h1,
    fontWeight: '700',
    color: theme.colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  subtitle: {
    fontSize: theme.font.small,
    color: theme.colors.textSecondary,
  },
  updated: {
    fontSize: theme.font.tiny,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  errorBanner: {
    marginTop: theme.spacing(1),
    backgroundColor: '#FEF2F2',
    borderColor: theme.colors.negative,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: theme.spacing(1.25),
  },
  errorText: {
    fontSize: theme.font.tiny,
    color: theme.colors.negative,
  },
  errorRetry: {
    fontSize: theme.font.tiny,
    color: theme.colors.negative,
    fontWeight: '700',
    marginTop: 2,
  },
  search: {
    marginTop: theme.spacing(1.5),
    height: 40,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing(1.5),
    fontSize: theme.font.body,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  empty: {
    textAlign: 'center',
    padding: theme.spacing(3),
    color: theme.colors.textSecondary,
  },
});
