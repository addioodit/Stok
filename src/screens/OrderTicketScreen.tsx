import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useEffectiveCompany } from '../hooks/useCompanies';
import { BROKERS, findBroker } from '../data/brokers';
import { useSettings } from '../store/useSettings';
import { usePortfolio } from '../store/usePortfolio';
import { useOrders } from '../store/useOrders';
import { Segmented } from '../components/Segmented';
import { Field } from '../components/Field';
import { PrimaryButton } from '../components/PrimaryButton';
import { theme } from '../theme';
import { formatGYD } from '../utils/format';
import { OrderSide, OrderType } from '../types';
import { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'OrderTicket'>;

export function OrderTicketScreen({ route, navigation }: Props) {
  const { symbol, side: initialSide } = route.params;
  const company = useEffectiveCompany(symbol);
  const settings = useSettings();
  const addLot = usePortfolio((s) => s.addLot);
  const logOrder = useOrders((s) => s.add);

  const [side, setSide] = useState<OrderSide>(initialSide);
  const [orderType, setOrderType] = useState<OrderType>('limit');
  const [quantity, setQuantity] = useState('');
  const [limitPrice, setLimitPrice] = useState(
    company ? String(company.lastPrice) : '',
  );
  const [brokerId, setBrokerId] = useState(
    settings.defaultBrokerId || BROKERS[0].id,
  );
  const [notes, setNotes] = useState('');

  const qtyNum = Number(quantity) || 0;
  const priceNum = Number(limitPrice) || (company?.lastPrice ?? 0);
  const estimated = qtyNum * priceNum;
  const broker = findBroker(brokerId);
  const brokerEmail = settings.brokerEmails[brokerId] ?? '';
  const brokerAccount = settings.brokerAccounts[brokerId] ?? '';

  const canSubmit = qtyNum > 0 && (orderType === 'market' || priceNum > 0);

  if (!company || !broker) {
    return (
      <View style={styles.center}>
        <Text style={styles.warn}>Missing company or broker.</Text>
      </View>
    );
  }

  const buildOrderText = useMemo(
    () => () => {
      const lines = [
        `${side.toUpperCase()} order — ${company.symbol} (${company.name})`,
        '',
        `Quantity: ${qtyNum.toLocaleString('en-US')} shares`,
        `Order type: ${orderType.toUpperCase()}`,
        orderType === 'limit'
          ? `Limit price: ${formatGYD(priceNum)}`
          : 'Price: Market',
        `Estimated value: ${formatGYD(estimated)}`,
        '',
        `Client: ${settings.fullName || '(missing — set in Settings)'}`,
        `Account #: ${brokerAccount || '(missing — set in Settings)'}`,
        `Contact: ${settings.phone || ''}${settings.email ? ` · ${settings.email}` : ''}`,
        '',
        notes ? `Notes: ${notes}` : '',
        '',
        'Please confirm receipt and provide a fill confirmation.',
      ];
      return lines.filter(Boolean).join('\n');
    },
    [
      side,
      company,
      qtyNum,
      orderType,
      priceNum,
      estimated,
      settings.fullName,
      settings.phone,
      settings.email,
      brokerAccount,
      notes,
    ],
  );

  const orderSnapshot = () => ({
    symbol,
    side,
    type: orderType,
    quantity: qtyNum,
    limitPrice: orderType === 'limit' ? priceNum : undefined,
    brokerId,
    notes: notes || undefined,
  });

  const sendEmail = async () => {
    if (!brokerEmail) {
      Alert.alert(
        'Broker email missing',
        `Add an email for ${broker.name} in Settings before sending.`,
      );
      return;
    }
    const subject = `${side === 'buy' ? 'BUY' : 'SELL'} order: ${qtyNum} ${company.symbol} ${orderType === 'limit' ? `@ ${formatGYD(priceNum)}` : '(market)'}`;
    const url = `mailto:${encodeURIComponent(brokerEmail)}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(buildOrderText())}`;
    const can = await Linking.canOpenURL(url);
    if (!can) {
      Alert.alert('No mail app', 'Could not open the mail composer.');
      return;
    }
    await Linking.openURL(url);
    logOrder({ ...orderSnapshot(), status: 'emailed' });
    navigation.goBack();
  };

  const callBroker = async () => {
    const url = `tel:${broker.phone.replace(/\s/g, '')}`;
    const can = await Linking.canOpenURL(url);
    if (!can) {
      Alert.alert('Cannot place call', 'Telephony not available.');
      return;
    }
    await Linking.openURL(url);
    if (qtyNum > 0) {
      logOrder({ ...orderSnapshot(), status: 'called' });
      navigation.goBack();
    }
  };

  const recordFill = () => {
    if (qtyNum <= 0 || priceNum <= 0) return;
    Alert.alert(
      `Record ${side} fill?`,
      `${qtyNum} ${company.symbol} at ${formatGYD(priceNum)}. This updates your portfolio locally.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Record',
          onPress: () => {
            addLot(
              symbol,
              side === 'buy' ? qtyNum : -qtyNum,
              priceNum,
            );
            logOrder({ ...orderSnapshot(), status: 'filled' });
            navigation.goBack();
          },
        },
      ],
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ padding: theme.spacing(2) }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.symbol}>{company.symbol}</Text>
        <Text style={styles.name}>{company.name}</Text>
        <Text style={styles.last}>Last {formatGYD(company.lastPrice)}</Text>

        <View style={{ height: theme.spacing(2) }} />
        <Segmented
          value={side}
          onChange={setSide}
          options={[
            { label: 'Buy', value: 'buy' },
            { label: 'Sell', value: 'sell' },
          ]}
        />

        <View style={{ height: theme.spacing(2) }} />
        <Segmented
          value={orderType}
          onChange={setOrderType}
          options={[
            { label: 'Limit', value: 'limit' },
            { label: 'Market', value: 'market' },
          ]}
        />

        <View style={{ height: theme.spacing(2) }} />
        <Field
          label="Quantity (shares)"
          value={quantity}
          onChangeText={(v) => setQuantity(v.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          placeholder="0"
        />
        {orderType === 'limit' ? (
          <Field
            label="Limit price (GYD)"
            value={limitPrice}
            onChangeText={(v) => setLimitPrice(v.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad"
            placeholder={String(company.lastPrice)}
          />
        ) : null}

        <Text style={styles.brokerLabel}>Broker</Text>
        <View style={styles.brokerList}>
          {BROKERS.map((b) => {
            const selected = b.id === brokerId;
            return (
              <Pressable
                key={b.id}
                onPress={() => setBrokerId(b.id)}
                style={[styles.brokerRow, selected && styles.brokerRowSelected]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.brokerName}>{b.name}</Text>
                  <Text style={styles.brokerSub}>
                    {settings.brokerEmails[b.id]
                      ? settings.brokerEmails[b.id]
                      : 'No email set — tap Settings'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.radio,
                    selected && {
                      backgroundColor: theme.colors.primary,
                      borderColor: theme.colors.primary,
                    },
                  ]}
                />
              </Pressable>
            );
          })}
        </View>

        <Field
          label="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Good til cancelled, partial fills OK, etc."
          multiline
        />

        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>Estimated value</Text>
          <Text style={styles.summaryValue}>{formatGYD(estimated)}</Text>
        </View>

        <View style={{ height: theme.spacing(2) }} />
        <PrimaryButton
          label={`Email order to ${broker.name.split(' ')[0]}`}
          variant={side === 'buy' ? 'positive' : 'negative'}
          onPress={sendEmail}
          disabled={!canSubmit}
        />
        <View style={{ height: theme.spacing(1) }} />
        <PrimaryButton
          label={`Call ${broker.phone}`}
          variant="secondary"
          onPress={callBroker}
        />
        <View style={{ height: theme.spacing(1) }} />
        <PrimaryButton
          label="Record fill in portfolio"
          variant="secondary"
          onPress={recordFill}
          disabled={!canSubmit}
        />

        <Text style={styles.disclaimer}>
          Stok does not execute trades. Orders are emailed or phoned to your
          licensed GSE broker, who handles execution and settlement.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bg,
  },
  warn: { color: theme.colors.negative },
  symbol: {
    fontSize: theme.font.h1,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: 1,
  },
  name: {
    fontSize: theme.font.body,
    color: theme.colors.text,
    marginTop: 2,
  },
  last: {
    fontSize: theme.font.small,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  brokerLabel: {
    fontSize: theme.font.small,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginBottom: 6,
  },
  brokerList: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    marginBottom: theme.spacing(2),
  },
  brokerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing(1.5),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.bg,
  },
  brokerRowSelected: { backgroundColor: theme.colors.surface },
  brokerName: {
    fontSize: theme.font.body,
    color: theme.colors.text,
    fontWeight: '600',
  },
  brokerSub: {
    fontSize: theme.font.tiny,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.bg,
  },
  summary: {
    marginTop: theme.spacing(1),
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing(2),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: theme.font.small,
    color: theme.colors.textSecondary,
  },
  summaryValue: {
    fontSize: theme.font.h2,
    fontWeight: '700',
    color: theme.colors.text,
  },
  disclaimer: {
    fontSize: theme.font.tiny,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing(2),
    lineHeight: 16,
  },
});
