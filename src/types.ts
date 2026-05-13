export type Sector =
  | 'Banking'
  | 'Beverages'
  | 'Manufacturing'
  | 'Tobacco'
  | 'Financial Services'
  | 'Real Estate'
  | 'Agriculture'
  | 'Conglomerate';

export interface Company {
  symbol: string;
  name: string;
  sector: Sector;
  lastPrice: number;
  prevClose: number;
  currency: 'GYD';
}

export interface Broker {
  id: string;
  name: string;
  phone: string;
  website?: string;
}

export interface Holding {
  symbol: string;
  quantity: number;
  avgCost: number;
  notes?: string;
  addedAt: number;
}

export type OrderSide = 'buy' | 'sell';
export type OrderType = 'market' | 'limit';

export interface OrderDraft {
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  limitPrice?: number;
  brokerId: string;
  notes?: string;
}

export interface UserSettings {
  fullName: string;
  phone: string;
  email: string;
  defaultBrokerId: string;
  brokerEmails: Record<string, string>;
  brokerAccounts: Record<string, string>;
}

export type DividendType = 'interim' | 'final' | 'special';

export interface DividendDeclaration {
  id: string;
  symbol: string;
  perShare: number;
  currency: 'GYD';
  type: DividendType;
  declaredAt: number;
  exDate: number;
  paymentDate: number;
  notes?: string;
}
