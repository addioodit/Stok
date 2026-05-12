import { Broker } from '../types';

// Licensed GSE brokers. Email addresses are not bundled — the user adds them
// per-broker in Settings, so we never accidentally route a real order to a
// guessed address.
export const BROKERS: Broker[] = [
  {
    id: 'beharry',
    name: 'Beharry Stockbrokers Limited',
    phone: '+592-227-1962',
    website: 'https://www.beharrygroup.com',
  },
  {
    id: 'hih',
    name: 'Hand-in-Hand Trust Corporation Inc.',
    phone: '+592-227-2270',
    website: 'https://www.handinhand.com.gy',
  },
  {
    id: 'gambi',
    name: 'Guyana Americas Merchant Bank Inc.',
    phone: '+592-226-8810',
  },
  {
    id: 'tcgl',
    name: 'Trust Company (Guyana) Limited',
    phone: '+592-226-6580',
  },
];

export const findBroker = (id: string) => BROKERS.find((b) => b.id === id);
