import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import * as Sentry from '@sentry/react-native';
import { theme } from '../theme';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

const sentryEnabled = (() => {
  const dsn = Constants.expoConfig?.extra?.sentryDsn as string | undefined;
  return typeof dsn === 'string' && dsn.startsWith('https://');
})();

/**
 * App-level error boundary. Renders a recovery UI when any descendant
 * throws during render so the user is never stranded on a white screen.
 * Forwards to Sentry only when a real DSN is configured — otherwise the
 * error stays local and the user can retry.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    if (sentryEnabled) {
      Sentry.captureException(error, {
        contexts: { react: { componentStack: info.componentStack ?? '' } },
      });
    } else if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('Unhandled render error:', error, info.componentStack);
    }
  }

  private reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <ScrollView
        contentContainerStyle={styles.wrap}
        style={{ backgroundColor: theme.colors.bg }}
      >
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.body}>
          Stok hit an unexpected error and stopped drawing this screen. Your
          data is safe — it&apos;s stored on this device and was not affected.
        </Text>
        <Text style={styles.detailsLabel}>Details</Text>
        <View style={styles.detailsCard}>
          <Text style={styles.detailsText} selectable>
            {error.message || String(error)}
          </Text>
        </View>
        <Pressable
          onPress={this.reset}
          accessibilityRole="button"
          accessibilityLabel="Try again"
          style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
        >
          <Text style={styles.btnText}>Try again</Text>
        </Pressable>
        <Text style={styles.hint}>
          If this keeps happening, export a backup from Settings → Data and
          send it along with the message above.
        </Text>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  wrap: { padding: theme.spacing(3), paddingTop: theme.spacing(8) },
  title: {
    fontSize: theme.font.h1,
    fontWeight: '700',
    color: theme.colors.text,
  },
  body: {
    marginTop: theme.spacing(1),
    fontSize: theme.font.body,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  detailsLabel: {
    marginTop: theme.spacing(3),
    fontSize: theme.font.tiny,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: theme.spacing(0.5),
  },
  detailsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing(1.5),
  },
  detailsText: {
    fontSize: theme.font.small,
    color: theme.colors.text,
    fontFamily: 'Courier',
  },
  btn: {
    marginTop: theme.spacing(3),
    backgroundColor: theme.colors.primary,
    height: 48,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPressed: { opacity: 0.85 },
  btnText: {
    color: theme.colors.textInverse,
    fontSize: theme.font.body,
    fontWeight: '600',
  },
  hint: {
    marginTop: theme.spacing(2),
    fontSize: theme.font.tiny,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
});
