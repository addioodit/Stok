import {
  CompositeScreenProps,
  NavigatorScreenParams,
} from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OrderSide } from '../types';
import { LegalDocId } from '../data/legal';

export type TabsParamList = {
  Market: undefined;
  Watchlist: undefined;
  Portfolio: undefined;
  Dividends: undefined;
  News: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabsParamList>;
  StockDetail: { symbol: string };
  OrderTicket: { symbol: string; side: OrderSide };
  Orders: undefined;
  Legal: { doc: LegalDocId };
  DebugParser: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type TabScreenProps<T extends keyof TabsParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<TabsParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;
