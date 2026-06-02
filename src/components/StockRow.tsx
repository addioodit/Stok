import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Company } from '../types';
import { theme } from '../theme';
import { formatGYD, formatPct, priceChange } from '../utils/format';

interface Props {
  company: Company;
  onPress: () => void;
  rightLabel?: string;
}

export function StockRow({ company, onPress, rightLabel }: Props) {
  const { pct } = priceChange(company.lastPrice, company.prevClose);
  const positive = pct >= 0;
  const direction = pct === 0 ? 'unchanged' : pct > 0 ? 'up' : 'down';
  const pctText = pct === 0 ? '' : `, ${direction} ${Math.abs(pct * 100).toFixed(1)} percent`;
  const a11yLabel = `${company.symbol}, ${company.name}, ${formatGYD(company.lastPrice)}${pctText}`;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityHint="Opens stock details"
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.left}>
        <Text style={styles.symbol}>{company.symbol}</Text>
        <Text style={styles.name} numberOfLines={1}>
          {company.name}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.price}>{formatGYD(company.lastPrice)}</Text>
        <Text
          style={[
            styles.change,
            { color: positive ? theme.colors.positive : theme.colors.negative },
          ]}
        >
          {rightLabel ?? formatPct(pct)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
  left: { flex: 1, paddingRight: theme.spacing(1.5) },
  right: { alignItems: 'flex-end' },
  symbol: {
    fontSize: theme.font.body,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: 0.5,
  },
  name: {
    fontSize: theme.font.small,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  price: {
    fontSize: theme.font.body,
    fontWeight: '600',
    color: theme.colors.text,
  },
  change: { fontSize: theme.font.small, marginTop: 2, fontWeight: '600' },
});
