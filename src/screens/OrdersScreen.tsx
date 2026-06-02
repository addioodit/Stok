import React, { useMemo } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { findCompany } from '../data/companies';
import { findBroker } from '../data/brokers';
import { useEffectiveCompany } from '../hooks/useCompanies';
import { isPending, useOrders } from '../store/useOrders';
import { usePortfolio } from '../store/usePortfolio';
import { theme } from '../theme';
import { formatGYD } from '../utils/format';
import { timeAgo } from '../utils/timeAgo';
import { Order, OrderStatus } from '../types';
import { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'Orders'>;

export function OrdersScreen({ navigation }: Props) {
  const orders = useOrders((s) => s.orders);
  const setStatus = useOrders((s) => s.setStatus);
  const remove = useOrders((s) => s.remove);
  const addLot = usePortfolio((s) => s.addLot);

  const { pending, filled, cancelled } = useMemo(() => {
    const pending: Order[] = [];
    const filled: Order[] = [];
    const cancelled: Order[] = [];
    for (const o of orders) {
      if (isPending(o.status)) pending.push(o);
      else if (o.status === 'filled') filled.push(o);
      else if (o.status === 'cancelled') cancelled.push(o);
    }
    return { pending, filled, cancelled };
  }, [orders]);

  const onMarkFilled = (o: Order) => {
    const fillPrice =
      o.limitPrice ?? findCompany(o.symbol)?.lastPrice ?? 0;
    if (fillPrice <= 0) {
      Alert.alert('No price', 'Cannot infer a fill price for this order.');
      return;
    }
    Alert.alert(
      'Confirm fill',
      `${o.side === 'buy' ? 'Bought' : 'Sold'} ${o.quantity} ${o.symbol} at ${formatGYD(fillPrice)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            addLot(o.symbol, o.side === 'buy' ? o.quantity : -o.quantity, fillPrice);
            setStatus(o.id, 'filled');
          },
        },
      ],
    );
  };

  const onCancel = (o: Order) => {
    Alert.alert('Cancel order?', 'Mark this order as cancelled?', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel order',
        style: 'destructive',
        onPress: () => setStatus(o.id, 'cancelled'),
      },
    ]);
  };

  const onDelete = (o: Order) => {
    Alert.alert('Delete record?', 'Remove this order from history?', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove(o.id) },
    ]);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={{ paddingBottom: theme.spacing(3) }}
    >
      {orders.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No activity yet</Text>
          <Text style={styles.emptyBody}>
            Submitting an order from the order ticket — by email, phone, or
            "Record fill" — will log it here.
          </Text>
        </View>
      ) : (
        <>
          <Section
            label={`Pending · ${pending.length}`}
            visible={pending.length > 0}
          >
            {pending.map((o) => (
              <OrderRow
                key={o.id}
                order={o}
                onOpen={() =>
                  navigation.navigate('StockDetail', { symbol: o.symbol })
                }
                actions={
                  <>
                    <SmallButton
                      label="Mark filled"
                      variant="positive"
                      onPress={() => onMarkFilled(o)}
                    />
                    <SmallButton
                      label="Cancel"
                      variant="ghost"
                      onPress={() => onCancel(o)}
                    />
                  </>
                }
              />
            ))}
          </Section>

          <Section
            label={`Filled · ${filled.length}`}
            visible={filled.length > 0}
          >
            {filled.map((o) => (
              <OrderRow
                key={o.id}
                order={o}
                onOpen={() =>
                  navigation.navigate('StockDetail', { symbol: o.symbol })
                }
                actions={
                  <SmallButton
                    label="Delete"
                    variant="ghost"
                    onPress={() => onDelete(o)}
                  />
                }
              />
            ))}
          </Section>

          <Section
            label={`Cancelled · ${cancelled.length}`}
            visible={cancelled.length > 0}
          >
            {cancelled.map((o) => (
              <OrderRow
                key={o.id}
                order={o}
                onOpen={() =>
                  navigation.navigate('StockDetail', { symbol: o.symbol })
                }
                actions={
                  <SmallButton
                    label="Delete"
                    variant="ghost"
                    onPress={() => onDelete(o)}
                  />
                }
              />
            ))}
          </Section>
        </>
      )}
    </ScrollView>
  );
}

function Section({
  label,
  visible,
  children,
}: {
  label: string;
  visible: boolean;
  children: React.ReactNode;
}) {
  if (!visible) return null;
  return (
    <View>
      <Text style={styles.section}>{label}</Text>
      {children}
    </View>
  );
}

interface OrderRowProps {
  order: Order;
  onOpen: () => void;
  actions: React.ReactNode;
}

function OrderRow({ order: o, onOpen, actions }: OrderRowProps) {
  const company = useEffectiveCompany(o.symbol);
  const broker = findBroker(o.brokerId);
  const sideColor = o.side === 'buy' ? theme.colors.positive : theme.colors.negative;
  const priceLabel =
    o.type === 'limit' && o.limitPrice
      ? `@ ${formatGYD(o.limitPrice)}`
      : 'Market';
  const total =
    o.type === 'limit' && o.limitPrice
      ? o.quantity * o.limitPrice
      : o.quantity * (company?.lastPrice ?? 0);

  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`${o.symbol}, ${o.side} ${o.quantity} shares ${priceLabel}, ${o.status}`}
      accessibilityHint="Opens stock details"
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.rowTop}>
        <View style={[styles.sidePill, { backgroundColor: sideColor }]}>
          <Text style={styles.sidePillText}>{o.side.toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1, paddingLeft: theme.spacing(1.25) }}>
          <Text style={styles.symbol}>{o.symbol}</Text>
          <Text style={styles.line} numberOfLines={1}>
            {o.quantity.toLocaleString('en-US')} sh · {priceLabel}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.total}>{formatGYD(total)}</Text>
          <StatusBadge status={o.status} />
        </View>
      </View>
      <Text style={styles.meta} numberOfLines={1}>
        {broker?.name ?? o.brokerId} · {timeAgo(o.updatedAt)}
        {o.notes ? ` · ${o.notes}` : ''}
      </Text>
      <View style={styles.actions}>{actions}</View>
    </Pressable>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const { label, color, bg } = (() => {
    switch (status) {
      case 'emailed':
        return { label: 'Emailed', color: theme.colors.primary, bg: '#E7EFFD' };
      case 'called':
        return { label: 'Called', color: theme.colors.warn, bg: '#FFF4E5' };
      case 'filled':
        return {
          label: 'Filled',
          color: theme.colors.positive,
          bg: '#E7F8EE',
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          color: theme.colors.textSecondary,
          bg: theme.colors.surfaceAlt,
        };
    }
  })();
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

function SmallButton({
  label,
  variant,
  onPress,
}: {
  label: string;
  variant: 'positive' | 'ghost';
  onPress: () => void;
}) {
  const bg = variant === 'positive' ? theme.colors.positive : 'transparent';
  const fg =
    variant === 'positive' ? theme.colors.textInverse : theme.colors.text;
  const border =
    variant === 'positive' ? theme.colors.positive : theme.colors.border;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => [
        styles.smallBtn,
        { backgroundColor: bg, borderColor: border, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <Text style={[styles.smallBtnText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(4),
    marginTop: theme.spacing(4),
  },
  emptyTitle: {
    fontSize: theme.font.body,
    fontWeight: '700',
    color: theme.colors.text,
  },
  emptyBody: {
    marginTop: theme.spacing(1),
    fontSize: theme.font.small,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    fontSize: theme.font.tiny,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: theme.spacing(2),
    marginHorizontal: theme.spacing(2),
    marginBottom: theme.spacing(0.5),
  },
  row: {
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(1.5),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.bg,
  },
  pressed: { backgroundColor: theme.colors.surface },
  rowTop: { flexDirection: 'row', alignItems: 'flex-start' },
  sidePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
    minWidth: 48,
    alignItems: 'center',
  },
  sidePillText: {
    color: theme.colors.textInverse,
    fontWeight: '700',
    fontSize: theme.font.tiny,
    letterSpacing: 0.5,
  },
  symbol: {
    fontSize: theme.font.body,
    fontWeight: '700',
    color: theme.colors.text,
  },
  line: {
    fontSize: theme.font.small,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  total: {
    fontSize: theme.font.body,
    fontWeight: '600',
    color: theme.colors.text,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radius.sm,
    marginTop: 4,
  },
  badgeText: { fontSize: theme.font.tiny, fontWeight: '700' },
  meta: {
    marginTop: 6,
    fontSize: theme.font.tiny,
    color: theme.colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    marginTop: theme.spacing(1),
    gap: theme.spacing(1),
  },
  smallBtn: {
    paddingHorizontal: theme.spacing(1.25),
    paddingVertical: 6,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
  },
  smallBtnText: {
    fontSize: theme.font.tiny,
    fontWeight: '700',
  },
});
