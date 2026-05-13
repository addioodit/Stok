import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MarketScreen } from '../screens/MarketScreen';
import { WatchlistScreen } from '../screens/WatchlistScreen';
import { PortfolioScreen } from '../screens/PortfolioScreen';
import { DividendsScreen } from '../screens/DividendsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { StockDetailScreen } from '../screens/StockDetailScreen';
import { OrderTicketScreen } from '../screens/OrderTicketScreen';
import { OrdersScreen } from '../screens/OrdersScreen';
import { RootStackParamList, TabsParamList } from './types';
import { theme } from '../theme';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<TabsParamList>();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text
      style={{
        fontSize: 18,
        opacity: focused ? 1 : 0.5,
      }}
    >
      {label}
    </Text>
  );
}

function TabsNavigator() {
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          borderTopColor: theme.colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="Market"
        component={MarketScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="📈" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="Watchlist"
        component={WatchlistScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="⭐" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="Portfolio"
        component={PortfolioScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="💼" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="Dividends"
        component={DividendsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="💰" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="⚙️" focused={focused} />
          ),
        }}
      />
    </Tabs.Navigator>
  );
}

export function RootNavigator() {
  return (
    <NavigationContainer>
      <RootStack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.bg },
          headerTintColor: theme.colors.text,
          headerTitleStyle: { fontWeight: '700' },
        }}
      >
        <RootStack.Screen
          name="Tabs"
          component={TabsNavigator}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="StockDetail"
          component={StockDetailScreen}
          options={({ route }) => ({ title: route.params.symbol })}
        />
        <RootStack.Screen
          name="OrderTicket"
          component={OrderTicketScreen}
          options={({ route }) => ({
            title: `${route.params.side === 'buy' ? 'Buy' : 'Sell'} ${route.params.symbol}`,
            presentation: 'modal',
          })}
        />
        <RootStack.Screen
          name="Orders"
          component={OrdersScreen}
          options={{ title: 'Activity' }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
