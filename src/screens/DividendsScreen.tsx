import React, { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  DIVIDENDS,
  expectedIncome,
  recentDividends,
  upcomingDividends,
} from '../data/dividends';
import { findCompany } from '../data/companies';
import { useDividends } from '../store/useDividends';
import { usePortfolio } from '../store/usePortfolio';
import { theme } from '../theme';
import {
  daysUntil,
  formatGYD,
  formatMediumDate,
  formatShortDate,
} from '../utils/format';
import { DividendDeclaration } from '../types';
import { TabScreenProps } from '../navigation/types';

type Props = TabScreenProps<'Dividends'>;

const DAY_MS = 24 * 60 * 60 * 1000;

export function DividendsScreen({ navigation }: Props) {
  const holdings = usePortfolio((s) => s.holdings);
  const receivedIds = useDividends((s) => s.receivedIds);
  const markReceived = useDividends((s) => s.markReceived);
  const unmarkReceived = useDividends((s) => s.unmarkReceived);

  const { upcoming, recent, expectedNext30 } = useMemo(() => {
    const now = Date.now();
    return {
      upcoming: upcomingDividends(DIVIDENDS, now),
      recent: recentDividends(DIVIDENDS, now),
      expectedNext30: expectedIncome(DIVIDENDS, holdings, 30, now),
    };
  }, [holdings]);

  const qtyOf = (symbol: string) =>
    holdings.find((h) => h.symbol === symbol)?.quantity ?? 0;

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: theme.spacing(3) }}>
        <View style={styles.header}>
          <Text style={styles.title}>Dividends</Text>
          <Text style={styles.summaryLabel}>Expected next 30 days</Text>
          <Text style={styles.summaryAmount}>{formatGYD(expectedNext30)}</Text>
          <Text style={styles.summarySub}>
            from {upcoming.filter((d) => d.paymentDate <= Date.now() + 30 * DAY_MS).length}{' '}
            upcoming dividend
            {upcoming.length === 1 ? '' : 's'} · based on current positions
          </Text>
        </View>

        <SectionHeader label="Upcoming" />
        {upcoming.length === 0 ? (
          <EmptyText>No upcoming dividends declared.</EmptyText>
        ) : (
          upcoming.map((d) => (
            <DividendRow
              key={d.id}
              dividend={d}
              quantity={qtyOf(d.symbol)}
              onOpen={() =>
                navigation.navigate('StockDetail', { symbol: d.symbol })
              }
              variant="upcoming"
            />
          ))
        )}

        <SectionHeader label="Recent" />
        {recent.length === 0 ? (
          <EmptyText>No dividends paid in the last 180 days.</EmptyText>
        ) : (
          recent.map((d) => {
            const isReceived = receivedIds.includes(d.id);
            return (
              <DividendRow
                key={d.id}
                dividend={d}
                quantity={qtyOf(d.symbol)}
                onOpen={() =>
                  navigation.navigate('StockDetail', { symbol: d.symbol })
                }
                variant="recent"
                received={isReceived}
                onToggleReceived={() =>
                  isReceived ? unmarkReceived(d.id) : markReceived(d.id)
                }
              />
            );
          })
        )}

        <Text style={styles.disclaimer}>
          Expected income assumes you hold these shares on the ex-date.
          Dividend declarations shown are illustrative — confirm with your
          broker or the GASCI notice.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ label }: { label: string }) {
  return <Text style={styles.section}>{label}</Text>;
}

function EmptyText({ children }: { children: React.ReactNode }) {
  return <Text style={styles.empty}>{children}</Text>;
}

interface RowProps {
  dividend: DividendDeclaration;
  quantity: number;
  onOpen: () => void;
  variant: 'upcoming' | 'recent';
  received?: boolean;
  onToggleReceived?: () => void;
}

function DividendRow({
  dividend: d,
  quantity,
  onOpen,
  variant,
  received,
  onToggleReceived,
}: RowProps) {
  const company = findCompany(d.symbol);
  const expected = quantity * d.perShare;
  const days = daysUntil(d.paymentDate);
  return (
    <View style={styles.row}>
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`${d.symbol}, ${formatGYD(d.perShare)} per share${
          quantity > 0 ? `, expected ${formatGYD(expected)}` : ''
        }`}
        accessibilityHint="Opens stock details"
        style={styles.rowMain}
      >
        <View style={styles.pill}>
          <Text style={styles.pillText}>{d.symbol}</Text>
        </View>
        <View style={styles.middle}>
          <Text style={styles.amount}>
            {formatGYD(d.perShare)}/share ·{' '}
            <Text style={styles.type}>{d.type}</Text>
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {company?.name ?? d.symbol}
          </Text>
          <Text style={styles.dates}>
            {variant === 'upcoming'
              ? `Ex ${formatShortDate(d.exDate)} · Pays ${formatShortDate(d.paymentDate)}${
                  days > 0 ? ` (in ${days}d)` : ''
                }`
              : `Paid ${formatMediumDate(d.paymentDate)}`}
          </Text>
        </View>
        <View style={styles.right}>
          {expected > 0 ? (
            <>
              <Text style={styles.payout}>{formatGYD(expected)}</Text>
              <Text style={styles.payoutSub}>
                {quantity.toLocaleString('en-US')} sh
              </Text>
            </>
          ) : (
            <Text style={styles.noPosition}>No position</Text>
          )}
        </View>
      </Pressable>
      {variant === 'recent' && onToggleReceived ? (
        <Pressable
          onPress={onToggleReceived}
          accessibilityRole="checkbox"
          accessibilityLabel={`Mark ${d.symbol} dividend received`}
          accessibilityState={{ checked: !!received }}
          hitSlop={6}
          style={[
            styles.checkBtn,
            received && styles.checkBtnOn,
            !received && expected === 0 && styles.checkBtnGhost,
          ]}
        >
          <Text
            style={[
              styles.checkText,
              received && styles.checkTextOn,
            ]}
          >
            {received ? '✓ Received' : 'Mark received'}
          </Text>
        </Pressable>
      ) : null}
    </View>
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
  summaryLabel: {
    fontSize: theme.font.small,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing(1.5),
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.positive,
    marginTop: 2,
  },
  summarySub: {
    fontSize: theme.font.tiny,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  section: {
    fontSize: theme.font.tiny,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: theme.spacing(2.5),
    marginHorizontal: theme.spacing(2),
    marginBottom: theme.spacing(0.5),
  },
  empty: {
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(1),
    color: theme.colors.textSecondary,
    fontSize: theme.font.small,
  },
  row: {
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(1.25),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.bg,
  },
  rowMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing(1.5),
  },
  pillText: {
    color: theme.colors.textInverse,
    fontWeight: '700',
    fontSize: theme.font.small,
    letterSpacing: 0.5,
  },
  middle: { flex: 1, paddingRight: theme.spacing(1) },
  amount: {
    fontSize: theme.font.body,
    fontWeight: '600',
    color: theme.colors.text,
  },
  type: { color: theme.colors.textSecondary, fontWeight: '500' },
  subtitle: {
    fontSize: theme.font.small,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  dates: {
    fontSize: theme.font.tiny,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  right: { alignItems: 'flex-end' },
  payout: {
    fontSize: theme.font.body,
    fontWeight: '700',
    color: theme.colors.positive,
  },
  payoutSub: {
    fontSize: theme.font.tiny,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  noPosition: {
    fontSize: theme.font.tiny,
    color: theme.colors.textSecondary,
  },
  checkBtn: {
    alignSelf: 'flex-start',
    marginTop: theme.spacing(1),
    marginLeft: 56,
    paddingHorizontal: theme.spacing(1.25),
    paddingVertical: 6,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.bg,
  },
  checkBtnOn: {
    backgroundColor: theme.colors.positive,
    borderColor: theme.colors.positive,
  },
  checkBtnGhost: { opacity: 0.7 },
  checkText: {
    fontSize: theme.font.tiny,
    fontWeight: '600',
    color: theme.colors.text,
  },
  checkTextOn: { color: theme.colors.textInverse },
  disclaimer: {
    fontSize: theme.font.tiny,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing(2),
    paddingHorizontal: theme.spacing(2),
    lineHeight: 16,
  },
});
