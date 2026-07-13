import { useSettings } from './useSettings';
import { BROKERS } from '../data/brokers';

describe('useSettings', () => {
  beforeEach(() => {
    useSettings.setState({
      fullName: '',
      phone: '',
      email: '',
      defaultBrokerId: BROKERS[0]?.id ?? '',
      brokerEmails: {},
      brokerAccounts: {},
    });
  });

  it('defaults to the first broker as default', () => {
    expect(useSettings.getState().defaultBrokerId).toBe(BROKERS[0].id);
  });

  it('update merges a partial patch', () => {
    useSettings.getState().update({ fullName: 'Jane Doe', email: 'j@x' });
    const s = useSettings.getState();
    expect(s.fullName).toBe('Jane Doe');
    expect(s.email).toBe('j@x');
    expect(s.phone).toBe('');
  });

  it('setBrokerEmail preserves other brokers\' emails', () => {
    useSettings.getState().setBrokerEmail('beharry', 'a@x');
    useSettings.getState().setBrokerEmail('hih', 'b@x');
    expect(useSettings.getState().brokerEmails).toEqual({
      beharry: 'a@x',
      hih: 'b@x',
    });
  });

  it('setBrokerAccount overwrites the same broker\'s value', () => {
    useSettings.getState().setBrokerAccount('beharry', 'ACC1');
    useSettings.getState().setBrokerAccount('beharry', 'ACC2');
    expect(useSettings.getState().brokerAccounts.beharry).toBe('ACC2');
  });
});
