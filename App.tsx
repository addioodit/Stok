import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import * as Sentry from '@sentry/react-native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AcceptScreen } from './src/screens/AcceptScreen';
import { ProfileSetupScreen } from './src/screens/ProfileSetupScreen';
import { isAccepted, useAcceptance } from './src/store/useAcceptance';
import { useProfile } from './src/store/useProfile';
import { theme } from './src/theme';

const sentryDsn = Constants.expoConfig?.extra?.sentryDsn as
  | string
  | null
  | undefined;
const sentryEnabled =
  typeof sentryDsn === 'string' && sentryDsn.startsWith('https://');

if (sentryEnabled) {
  Sentry.init({
    dsn: sentryDsn,
    // Keep dev errors out of Sentry; flip to true to debug the wiring.
    enabled: !__DEV__,
    tracesSampleRate: 0,
    enableNativeFramesTracking: false,
  });
}

function App() {
  const acceptanceHydrated = useAcceptance((s) => s.hasHydrated);
  const profileHydrated = useProfile((s) => s.hasHydrated);
  const accepted = useAcceptance(isAccepted);
  const username = useProfile((s) => s.username);

  const ready = acceptanceHydrated && profileHydrated;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {!ready ? (
        <View style={{ flex: 1, backgroundColor: theme.colors.bg }} />
      ) : !accepted ? (
        <AcceptScreen />
      ) : !username ? (
        <ProfileSetupScreen />
      ) : (
        <RootNavigator />
      )}
    </SafeAreaProvider>
  );
}

export default sentryEnabled ? Sentry.wrap(App) : App;
