import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Segmented } from '../components/Segmented';
import { useNews } from '../store/useNews';
import { NewsItem } from '../data/newsParser';
import { NewsRegion, sourceById } from '../data/newsSources';
import { theme } from '../theme';
import { timeAgo } from '../utils/timeAgo';
import { TabScreenProps } from '../navigation/types';

type Props = TabScreenProps<'News'>;
type RegionFilter = 'all' | NewsRegion;

export function NewsScreen(_props: Props) {
  const { items, status, lastUpdated, lastError, failedSources, refresh } =
    useNews();
  const [region, setRegion] = useState<RegionFilter>('all');

  useEffect(() => {
    if (lastUpdated === null) {
      void refresh();
    }
  }, [lastUpdated, refresh]);

  const filtered = useMemo(() => {
    if (region === 'all') return items;
    return items.filter((it) => sourceById(it.sourceId)?.region === region);
  }, [items, region]);

  const open = async (item: NewsItem) => {
    try {
      await Linking.openURL(item.link);
    } catch {
      Alert.alert(
        "Can't open article",
        'Your device has no browser configured to handle this link.',
      );
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>News</Text>
        <Text style={styles.updated}>
          {status === 'loading'
            ? 'Loading feeds…'
            : lastUpdated
              ? `Updated ${timeAgo(lastUpdated)} · Guyana & the Caribbean`
              : 'Pull to load the latest headlines'}
        </Text>
        <View style={styles.filter}>
          <Segmented
            value={region}
            onChange={setRegion}
            options={[
              { label: 'All', value: 'all' },
              { label: 'Guyana', value: 'guyana' },
              { label: 'Caribbean', value: 'caribbean' },
            ]}
          />
        </View>
        {lastError && items.length === 0 ? (
          <Pressable
            onPress={refresh}
            accessibilityRole="button"
            accessibilityLabel="Retry loading news"
            style={styles.errorBanner}
          >
            <Text style={styles.errorText}>
              Couldn’t load news. {lastError}
            </Text>
            <Text style={styles.errorRetry}>Tap to retry</Text>
          </Pressable>
        ) : failedSources.length > 0 ? (
          <Text style={styles.softWarn}>
            {failedSources.length} source
            {failedSources.length === 1 ? '' : 's'} didn’t respond — showing
            the rest.
          </Text>
        ) : null}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(it) => it.id}
        renderItem={({ item }) => <NewsRow item={item} onPress={open} />}
        refreshControl={
          <RefreshControl
            refreshing={status === 'loading'}
            onRefresh={refresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          status === 'loading' ? null : (
            <Text style={styles.empty}>
              No headlines yet. Pull down to load.
            </Text>
          )
        }
      />
    </SafeAreaView>
  );
}

function NewsRow({
  item,
  onPress,
}: {
  item: NewsItem;
  onPress: (item: NewsItem) => void;
}) {
  const source = sourceById(item.sourceId);
  return (
    <Pressable
      onPress={() => onPress(item)}
      accessibilityRole="link"
      accessibilityLabel={`${item.title}. From ${source?.name ?? item.sourceId}${
        item.publishedAt ? `, ${timeAgo(item.publishedAt)}` : ''
      }`}
      accessibilityHint="Opens article in browser"
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.rowMeta}>
        <Text style={styles.source}>{source?.name ?? item.sourceId}</Text>
        {item.publishedAt ? (
          <Text style={styles.time}>· {timeAgo(item.publishedAt)}</Text>
        ) : null}
      </View>
      <Text style={styles.headline}>{item.title}</Text>
      {item.summary ? (
        <Text style={styles.summary} numberOfLines={2}>
          {item.summary}
        </Text>
      ) : null}
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
  updated: {
    fontSize: theme.font.tiny,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  filter: { marginTop: theme.spacing(1.5) },
  errorBanner: {
    marginTop: theme.spacing(1.5),
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
  softWarn: {
    marginTop: theme.spacing(1),
    fontSize: theme.font.tiny,
    color: theme.colors.warn,
  },
  row: {
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(1.5),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.bg,
  },
  pressed: { backgroundColor: theme.colors.surface },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  source: {
    fontSize: theme.font.tiny,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  time: {
    fontSize: theme.font.tiny,
    color: theme.colors.textSecondary,
    marginLeft: 4,
  },
  headline: {
    fontSize: theme.font.body,
    fontWeight: '600',
    color: theme.colors.text,
    lineHeight: 22,
  },
  summary: {
    marginTop: 4,
    fontSize: theme.font.small,
    color: theme.colors.textSecondary,
    lineHeight: 19,
  },
  empty: {
    textAlign: 'center',
    padding: theme.spacing(3),
    color: theme.colors.textSecondary,
  },
});
