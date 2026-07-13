import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import * as Sentry from '@sentry/react-native';
import * as SplashScreen from 'expo-splash-screen';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AcceptScreen } from './src/screens/AcceptScreen';
import { ProfileSetupScreen } from './src/screens/ProfileSetupScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { isAccepted, useAcceptance } from './src/store/useAcceptance';
import { useProfile } from './src/store/useProfile';
import { useOnboarding } from './src/store/useOnboarding';
import { theme } from './src/theme';

// Hold the native splash until the hydration gate has decided which screen
// to render — otherwise the user sees splash → blank → app.
SplashScreen.preventAutoHideAsync().catch(() => {
  // Safe to swallow — if the splash is already gone we just render.
});

const sentryDsn = Constants.expoConfig?.extra?.sentryDsn as
  | string
  | null
  | undefined;
const sentryEnabled =
  typeof sentryDsn === 'string' && sentryDsn.startsWith('https://');

const appVersion =
  (Constants.expoConfig?.version as string | undefined) ?? '0.0.0';

if (sentryEnabled) {
  Sentry.init({
    dsn: sentryDsn,
    // Keep dev errors out of Sentry; flip to true to debug the wiring.
    enabled: !__DEV__,
    // Tag every event with the app version + build kind so crashes are
    // grouped correctly across releases and dev/preview/prod don't share
    // an issue bucket.
    release: `stok@${appVersion}`,
    environment: __DEV__ ? 'development' : 'production',
    tracesSampleRate: 0,
    enableNativeFramesTracking: false,
  });
}

function App() {
  const acceptanceHydrated = useAcceptance((s) => s.hasHydrated);
  const profileHydrated = useProfile((s) => s.hasHydrated);
  const onboardingHydrated = useOnboarding((s) => s.hasHydrated);
  const accepted = useAcceptance(isAccepted);
  const username = useProfile((s) => s.username);
  const seenOnboarding = useOnboarding((s) => s.seen);

  const ready = acceptanceHydrated && profileHydrated && onboardingHydrated;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready]);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <ErrorBoundary>
        {!ready ? (
          <View style={{ flex: 1, backgroundColor: theme.colors.bg }} />
        ) : !accepted ? (
          <AcceptScreen />
        ) : !username ? (
          <ProfileSetupScreen />
        ) : !seenOnboarding ? (
          <OnboardingScreen />
        ) : (
          <RootNavigator />
        )}
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

export default sentryEnabled ? Sentry.wrap(App) : App;
