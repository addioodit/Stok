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
import { classifyFetchError } from '../utils/errorMessage';

type Props = TabScreenProps<'Market'>;

export function MarketScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const companies = useEffectiveCompanies();
  const {
    status,
    lastError,
    lastErrorAt,
    lastUpdated,
    sessionLabel,
    refresh,
    dismissError,
  } = usePriceFeed();
  const classified = lastError ? classifyFetchError(lastError) : null;
  const showError = !!classified && status !== 'loading';

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
        {showError && classified ? (
          <View style={styles.errorBanner}>
            <View style={styles.errorRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.errorTitle}>{classified.title}</Text>
                <Text style={styles.errorBody} numberOfLines={3}>
                  {classified.body}
                </Text>
                <Text style={styles.errorMeta}>
                  Failed {lastErrorAt ? timeAgo(lastErrorAt) : 'just now'}
                  {lastUpdated
                    ? ` · last good update ${timeAgo(lastUpdated)}`
                    : ''}
                </Text>
              </View>
              <Pressable
                onPress={dismissError}
                hitSlop={8}
                style={styles.dismissBtn}
              >
                <Text style={styles.dismissText}>×</Text>
              </Pressable>
            </View>
            {classified.canRetry ? (
              <Pressable onPress={refresh} style={styles.retryBtn}>
                <Text style={styles.retryText}>Tap to retry</Text>
              </Pressable>
            ) : null}
          </View>
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
  errorRow: { flexDirection: 'row', alignItems: 'flex-start' },
  errorTitle: {
    fontSize: theme.font.small,
    fontWeight: '700',
    color: theme.colors.negative,
  },
  errorBody: {
    fontSize: theme.font.tiny,
    color: theme.colors.negative,
    marginTop: 2,
    lineHeight: 16,
  },
  errorMeta: {
    fontSize: theme.font.tiny,
    color: theme.colors.negative,
    opacity: 0.7,
    marginTop: 4,
  },
  dismissBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    marginTop: -4,
  },
  dismissText: {
    fontSize: 20,
    color: theme.colors.negative,
    lineHeight: 22,
    fontWeight: '600',
  },
  retryBtn: {
    marginTop: theme.spacing(0.75),
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: theme.spacing(1.25),
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.negative,
  },
  retryText: {
    fontSize: theme.font.tiny,
    fontWeight: '700',
    color: theme.colors.textInverse,
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
