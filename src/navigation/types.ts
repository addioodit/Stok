import {
  CompositeScreenProps,
  NavigatorScreenParams,
} from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OrderSide } from '../types';

export type TabsParamList = {
  Market: undefined;
  Watchlist: undefined;
  Portfolio: undefined;
  Dividends: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabsParamList>;
  StockDetail: { symbol: string };
  OrderTicket: { symbol: string; side: OrderSide };
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type TabScreenProps<T extends keyof TabsParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<TabsParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;
