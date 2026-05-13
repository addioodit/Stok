import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AcceptScreen } from './src/screens/AcceptScreen';
import { isAccepted, useAcceptance } from './src/store/useAcceptance';
import { theme } from './src/theme';

export default function App() {
  const hasHydrated = useAcceptance((s) => s.hasHydrated);
  const accepted = useAcceptance(isAccepted);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {!hasHydrated ? (
        // Brief blank during AsyncStorage rehydration — avoids a flash of
        // the AcceptScreen for already-accepted users.
        <View style={{ flex: 1, backgroundColor: theme.colors.bg }} />
      ) : accepted ? (
        <RootNavigator />
      ) : (
        <AcceptScreen />
      )}
    </SafeAreaProvider>
  );
}
