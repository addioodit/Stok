import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import * as Sentry from '@sentry/react-native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AcceptScreen } from './src/screens/AcceptScreen';
import { isAccepted, useAcceptance } from './src/store/useAcceptance';
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
  const hasHydrated = useAcceptance((s) => s.hasHydrated);
  const accepted = useAcceptance(isAccepted);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {!hasHydrated ? (
        <View style={{ flex: 1, backgroundColor: theme.colors.bg }} />
      ) : accepted ? (
        <RootNavigator />
      ) : (
        <AcceptScreen />
      )}
    </SafeAreaProvider>
  );
}

export default sentryEnabled ? Sentry.wrap(App) : App;
