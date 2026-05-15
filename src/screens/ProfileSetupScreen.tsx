import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../components/Avatar';
import { PrimaryButton } from '../components/PrimaryButton';
import { useProfile } from '../store/useProfile';
import { validateUsername } from '../utils/username';
import { theme } from '../theme';

export function ProfileSetupScreen() {
  const setProfile = useProfile((s) => s.setProfile);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [touched, setTouched] = useState(false);

  const check = useMemo(() => validateUsername(username), [username]);
  const showError = touched && !check.ok;

  const onContinue = () => {
    if (!check.ok) {
      setTouched(true);
      return;
    }
    setProfile(username, displayName || username);
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Avatar name={username || '?'} size={84} />
          <Text style={styles.title}>Choose a username</Text>
          <Text style={styles.subtitle}>
            This is your handle in Stok. It will be how other investors find
            you when community features arrive.
          </Text>

          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Username</Text>
            <View
              style={[
                styles.usernameRow,
                showError && { borderColor: theme.colors.negative },
              ]}
            >
              <Text style={styles.at}>@</Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                onBlur={() => setTouched(true)}
                placeholder="your_handle"
                placeholderTextColor={theme.colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={20}
                style={styles.usernameInput}
              />
            </View>
            <Text
              style={[
                styles.hint,
                showError && { color: theme.colors.negative },
              ]}
            >
              {showError
                ? check.error
                : '3–20 characters · letters, numbers, underscore'}
            </Text>
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Display name (optional)</Text>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="How your name shows up"
              placeholderTextColor={theme.colors.textSecondary}
              autoCapitalize="words"
              maxLength={40}
              style={styles.input}
            />
          </View>

          <View style={{ flex: 1 }} />
          <PrimaryButton
            label="Continue"
            onPress={onContinue}
            disabled={!check.ok}
          />
          <Text style={styles.footer}>
            Your profile is stored on this device. Stok has no accounts or
            servers yet — community features will be opt-in when they ship.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  content: {
    flexGrow: 1,
    padding: theme.spacing(2),
    paddingTop: theme.spacing(4),
    alignItems: 'stretch',
  },
  title: {
    marginTop: theme.spacing(2),
    fontSize: 26,
    fontWeight: '700',
    color: theme.colors.text,
  },
  subtitle: {
    marginTop: theme.spacing(1),
    fontSize: theme.font.body,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  fieldWrap: { marginTop: theme.spacing(3) },
  label: {
    fontSize: theme.font.small,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing(1.5),
  },
  at: {
    fontSize: theme.font.h2,
    color: theme.colors.textSecondary,
    fontWeight: '700',
    marginRight: 4,
  },
  usernameInput: {
    flex: 1,
    paddingVertical: theme.spacing(1.25),
    fontSize: theme.font.body,
    color: theme.colors.text,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing(1.5),
    paddingVertical: theme.spacing(1.25),
    fontSize: theme.font.body,
    color: theme.colors.text,
  },
  hint: {
    marginTop: 6,
    fontSize: theme.font.tiny,
    color: theme.colors.textSecondary,
  },
  footer: {
    marginTop: theme.spacing(2),
    fontSize: theme.font.tiny,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
});
