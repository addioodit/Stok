import React, { useState } from 'react';
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
import { useAcceptance } from '../store/useAcceptance';
import { useProfile } from '../store/useProfile';
import { BROKERS } from '../data/brokers';
import { ALL_LEGAL, LegalDocId } from '../data/legal';
import { Field } from '../components/Field';
import { Avatar } from '../components/Avatar';
import { PrimaryButton } from '../components/PrimaryButton';
import { theme } from '../theme';
import { formatMediumDate } from '../utils/format';
import { validateUsername } from '../utils/username';
import Constants from 'expo-constants';
import { TabScreenProps } from '../navigation/types';

type Props = TabScreenProps<'Settings'>;

const LEGAL_DOCS: LegalDocId[] = ['privacy', 'terms', 'disclosure'];

export function SettingsScreen({ navigation }: Props) {
  const settings = useSettings();
  const acceptedAt = useAcceptance((s) => s.acceptedAt);
  const acceptedVersion = useAcceptance((s) => s.acceptedVersion);
  const profile = useProfile();
  const appVersion =
    (Constants.expoConfig?.version as string | undefined) ?? '—';

  const [usernameDraft, setUsernameDraft] = useState(profile.username ?? '');
  const usernameCheck = validateUsername(usernameDraft);
  const usernameChanged = usernameDraft.trim() !== (profile.username ?? '');
  const canSaveUsername = usernameCheck.ok && usernameChanged;

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

          <Text style={styles.section}>Profile</Text>
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <Avatar name={profile.username ?? '?'} size={56} />
              <View style={styles.profileMeta}>
                <Text style={styles.profileHandle}>
                  @{profile.username ?? 'unknown'}
                </Text>
                {profile.joinedAt ? (
                  <Text style={styles.profileJoined}>
                    Joined {formatMediumDate(profile.joinedAt)}
                  </Text>
                ) : null}
              </View>
            </View>
            <View style={{ height: theme.spacing(1.5) }} />
            <Field
              label="Display name"
              value={profile.displayName}
              onChangeText={(v) => profile.updateDisplayName(v)}
              placeholder="How your name shows up"
              autoCapitalize="words"
            />
            <Field
              label="Username"
              value={usernameDraft}
              onChangeText={setUsernameDraft}
              placeholder="your_handle"
              autoCapitalize="none"
              hint={
                usernameDraft.trim().length > 0 && !usernameCheck.ok
                  ? usernameCheck.error
                  : '3–20 characters · letters, numbers, underscore'
              }
            />
            <PrimaryButton
              label="Save username"
              variant="secondary"
              onPress={() => profile.changeUsername(usernameDraft)}
              disabled={!canSaveUsername}
            />
          </View>

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

          <Text style={styles.section}>Data</Text>
          <View style={styles.legalCard}>
            <Pressable
              onPress={() => navigation.navigate('Backup')}
              style={({ pressed }) => [
                styles.legalRow,
                styles.legalRowLast,
                pressed && { backgroundColor: theme.colors.surfaceAlt },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.legalRowText}>Backup &amp; restore</Text>
                <Text style={styles.devHint}>
                  Export your data as a file · restore on a new device
                </Text>
              </View>
              <Text style={styles.legalChevron}>›</Text>
            </Pressable>
          </View>

          <Text style={styles.section}>Legal</Text>
          <View style={styles.legalCard}>
            {LEGAL_DOCS.map((id, i) => {
              const doc = ALL_LEGAL[id];
              return (
                <Pressable
                  key={id}
                  onPress={() => navigation.navigate('Legal', { doc: id })}
                  style={({ pressed }) => [
                    styles.legalRow,
                    i === LEGAL_DOCS.length - 1 && styles.legalRowLast,
                    pressed && { backgroundColor: theme.colors.surfaceAlt },
                  ]}
                >
                  <Text style={styles.legalRowText}>{doc.title}</Text>
                  <Text style={styles.legalChevron}>›</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.section}>Developer</Text>
          <View style={styles.legalCard}>
            <Pressable
              onPress={() => navigation.navigate('DebugParser')}
              style={({ pressed }) => [
                styles.legalRow,
                styles.legalRowLast,
                pressed && { backgroundColor: theme.colors.surfaceAlt },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.legalRowText}>Parser debug</Text>
                <Text style={styles.devHint}>
                  Fetch GASCI live · inspect raw HTML · share captured page
                </Text>
              </View>
              <Text style={styles.legalChevron}>›</Text>
            </Pressable>
          </View>

          <Text style={styles.versionRow}>
            Version {appVersion} · acceptance v{acceptedVersion ?? '—'}
            {acceptedAt ? ` · accepted ${formatMediumDate(acceptedAt)}` : ''}
          </Text>

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
  profileCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing(1),
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileMeta: {
    marginLeft: theme.spacing(1.5),
    flex: 1,
  },
  profileHandle: {
    fontSize: theme.font.h2,
    fontWeight: '700',
    color: theme.colors.text,
  },
  profileJoined: {
    fontSize: theme.font.tiny,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
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
  legalCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.bg,
    overflow: 'hidden',
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(1.5),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  legalRowLast: { borderBottomWidth: 0 },
  legalRowText: {
    flex: 1,
    fontSize: theme.font.body,
    color: theme.colors.text,
    fontWeight: '500',
  },
  legalChevron: {
    fontSize: theme.font.h2,
    color: theme.colors.textSecondary,
  },
  devHint: {
    fontSize: theme.font.tiny,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  versionRow: {
    marginTop: theme.spacing(2),
    fontSize: theme.font.tiny,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  disclaimer: {
    fontSize: theme.font.tiny,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing(1),
    lineHeight: 16,
  },
});
