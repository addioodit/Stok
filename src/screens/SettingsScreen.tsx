import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettings } from '../store/useSettings';
import { BROKERS } from '../data/brokers';
import { Field } from '../components/Field';
import { theme } from '../theme';

export function SettingsScreen() {
  const settings = useSettings();

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: theme.spacing(2) }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Settings</Text>

          <Text style={styles.section}>Your details</Text>
          <Field
            label="Full name"
            value={settings.fullName}
            onChangeText={(v) => settings.update({ fullName: v })}
            placeholder="As registered with your broker"
            autoCapitalize="words"
          />
          <Field
            label="Phone"
            value={settings.phone}
            onChangeText={(v) => settings.update({ phone: v })}
            placeholder="+592 ..."
            keyboardType="phone-pad"
          />
          <Field
            label="Email"
            value={settings.email}
            onChangeText={(v) => settings.update({ email: v })}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.section}>Brokers</Text>
          <Text style={styles.help}>
            Add the email and your account number with each broker you use. The
            email is used to send order tickets; the account number is included
            in the order body.
          </Text>

          {BROKERS.map((b) => {
            const isDefault = settings.defaultBrokerId === b.id;
            return (
              <View key={b.id} style={styles.brokerCard}>
                <View style={styles.brokerHeader}>
                  <Text style={styles.brokerName}>{b.name}</Text>
                  <Pressable
                    onPress={() => settings.update({ defaultBrokerId: b.id })}
                    style={[styles.defaultPill, isDefault && styles.defaultOn]}
                  >
                    <Text
                      style={[
                        styles.defaultText,
                        isDefault && styles.defaultTextOn,
                      ]}
                    >
                      {isDefault ? 'Default' : 'Set default'}
                    </Text>
                  </Pressable>
                </View>
                <Text style={styles.brokerPhone}>{b.phone}</Text>
                <View style={{ height: theme.spacing(1) }} />
                <Field
                  label="Broker email"
                  value={settings.brokerEmails[b.id] ?? ''}
                  onChangeText={(v) => settings.setBrokerEmail(b.id, v)}
                  placeholder="orders@broker.example"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Field
                  label="Your account #"
                  value={settings.brokerAccounts[b.id] ?? ''}
                  onChangeText={(v) => settings.setBrokerAccount(b.id, v)}
                  placeholder="Account number with this broker"
                />
              </View>
            );
          })}

          <Text style={styles.disclaimer}>
            Stok is an order-prep tool. It does not execute trades or move money.
            The Guyana Stock Exchange settles via licensed brokers — orders are
            confirmed by the broker, not by this app.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  title: {
    fontSize: theme.font.h1,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing(2),
  },
  section: {
    fontSize: theme.font.tiny,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  help: {
    fontSize: theme.font.small,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing(1.5),
    lineHeight: 18,
  },
  brokerCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing(2),
  },
  brokerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brokerName: {
    flex: 1,
    fontSize: theme.font.body,
    fontWeight: '700',
    color: theme.colors.text,
  },
  brokerPhone: {
    fontSize: theme.font.small,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  defaultPill: {
    paddingHorizontal: theme.spacing(1.25),
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.bg,
  },
  defaultOn: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  defaultText: {
    fontSize: theme.font.tiny,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  defaultTextOn: { color: theme.colors.textInverse },
  disclaimer: {
    fontSize: theme.font.tiny,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing(1),
    lineHeight: 16,
  },
});
