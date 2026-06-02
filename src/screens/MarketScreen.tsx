import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StockRow } from '../components/StockRow';
import { Segmented } from '../components/Segmented';
import { theme } from '../theme';
import { TabScreenProps } from '../navigation/types';
import { useEffectiveCompanies } from '../hooks/useCompanies';
import { usePriceFeed } from '../store/usePriceFeed';
import { timeAgo } from '../utils/timeAgo';
import { classifyFetchError } from '../utils/errorMessage';
import { listSectors, sortAndFilter, SortKey } from '../data/marketView';

type Props = TabScreenProps<'Market'>;

export function MarketScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('symbol');
  const [sector, setSector] = useState<string | null>(null);
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

  const sectors = useMemo(() => listSectors(companies), [companies]);
  const filtered = useMemo(
    () => sortAndFilter(companies, { query, sector, sort }),
    [query, companies, sector, sort],
  );

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
          accessibilityLabel="Search stocks"
        />
        <View style={styles.sortRow}>
          <Segmented<SortKey>
            value={sort}
            onChange={setSort}
            options={[
              { label: 'A–Z', value: 'symbol' },
              { label: 'Gainers', value: 'gainers' },
              { label: 'Losers', value: 'losers' },
              { label: 'Price', value: 'price' },
            ]}
          />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sectorRow}
        >
          <SectorPill
            label="All sectors"
            active={sector === null}
            onPress={() => setSector(null)}
          />
          {sectors.map((s) => (
            <SectorPill
              key={s}
              label={s}
              active={sector === s}
              onPress={() => setSector(sector === s ? null : s)}
            />
          ))}
        </ScrollView>
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

function SectorPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Filter by ${label}`}
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        styles.pill,
        active && styles.pillActive,
        pressed && !active && styles.pillPressed,
      ]}
    >
      <Text style={[styles.pillText, active && styles.pillTextActive]}>
        {label}
      </Text>
    </Pressable>
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
  sortRow: { marginTop: theme.spacing(1) },
  sectorRow: {
    paddingTop: theme.spacing(1),
    paddingRight: theme.spacing(2),
    gap: 6,
  },
  pill: {
    paddingHorizontal: theme.spacing(1.25),
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.bg,
  },
  pillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  pillPressed: { backgroundColor: theme.colors.surface },
  pillText: {
    fontSize: theme.font.tiny,
    fontWeight: '600',
    color: theme.colors.text,
  },
  pillTextActive: { color: theme.colors.textInverse },
  empty: {
    textAlign: 'center',
    padding: theme.spacing(3),
    color: theme.colors.textSecondary,
  },
});
