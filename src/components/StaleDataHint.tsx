import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { theme } from '../theme';
import { timeAgo } from '../utils/timeAgo';
import { usePriceFeed } from '../store/usePriceFeed';

export const STALE_AFTER_MS = 3 * 24 * 60 * 60 * 1000;

export function isPriceFeedStale(
  lastUpdated: number | null,
  now: number,
): boolean {
  return lastUpdated === null || now - lastUpdated > STALE_AFTER_MS;
}

interface Props {
  style?: StyleProp<ViewStyle>;
  now?: number;
}

/**
 * Warn banner shown on Portfolio / Stock Detail / Watchlist when the live
 * price overlay is missing or > 3 days old, so derived market values aren't
 * silently misleading. Hidden during loading and when the Market error
 * banner is already up.
 */
export function StaleDataHint({ style, now = Date.now() }: Props) {
  const lastUpdated = usePriceFeed((s) => s.lastUpdated);
  const status = usePriceFeed((s) => s.status);
  const lastError = usePriceFeed((s) => s.lastError);
  const refresh = usePriceFeed((s) => s.refresh);

  if (status === 'loading' || lastError) return null;
  if (!isPriceFeedStale(lastUpdated, now)) return null;

  const headline =
    lastUpdated === null
      ? "Prices haven't loaded yet"
      : `Prices last updated ${timeAgo(lastUpdated, now)}`;

  return (
    <View style={[styles.banner, style]} accessibilityRole="alert">
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{headline}</Text>
        <Text style={styles.body}>Market values shown may be out of date.</Text>
      </View>
      <Pressable
        onPress={refresh}
        accessibilityRole="button"
        accessibilityLabel="Refresh prices"
        hitSlop={6}
        style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
      >
        <Text style={styles.btnText}>Refresh</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing(1.25),
    backgroundColor: '#FFFBEB',
    borderColor: theme.colors.warn,
    borderWidth: 1,
    borderRadius: theme.radius.md,
  },
  title: {
    fontSize: theme.font.small,
    fontWeight: '700',
    color: theme.colors.warn,
  },
  body: {
    fontSize: theme.font.tiny,
    color: theme.colors.warn,
    opacity: 0.85,
    marginTop: 2,
  },
  btn: {
    paddingHorizontal: theme.spacing(1.25),
    paddingVertical: 8,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.warn,
    marginLeft: theme.spacing(1),
  },
  btnPressed: { opacity: 0.85 },
  btnText: {
    fontSize: theme.font.tiny,
    fontWeight: '700',
    color: theme.colors.textInverse,
  },
});
