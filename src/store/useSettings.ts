import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserSettings } from '../types';
import { BROKERS } from '../data/brokers';

interface SettingsState extends UserSettings {
  update: (patch: Partial<UserSettings>) => void;
  setBrokerEmail: (brokerId: string, email: string) => void;
  setBrokerAccount: (brokerId: string, account: string) => void;
}

const initial: UserSettings = {
  fullName: '',
  phone: '',
  email: '',
  defaultBrokerId: BROKERS[0]?.id ?? '',
  brokerEmails: {},
  brokerAccounts: {},
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...initial,
      update: (patch) => set((s) => ({ ...s, ...patch })),
      setBrokerEmail: (brokerId, email) =>
        set((s) => ({
          brokerEmails: { ...s.brokerEmails, [brokerId]: email },
        })),
      setBrokerAccount: (brokerId, account) =>
        set((s) => ({
          brokerAccounts: { ...s.brokerAccounts, [brokerId]: account },
        })),
    }),
    {
      name: 'stok.settings.v1',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
