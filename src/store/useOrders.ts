import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Order, OrderStatus } from '../types';

interface OrdersState {
  orders: Order[];
  add: (
    o: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>,
  ) => Order;
  setStatus: (id: string, status: OrderStatus) => void;
  remove: (id: string) => void;
  clear: () => void;
}

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useOrders = create<OrdersState>()(
  persist(
    (set) => ({
      orders: [],
      add: (o) => {
        const now = Date.now();
        const order: Order = { ...o, id: newId(), createdAt: now, updatedAt: now };
        set((s) => ({ orders: [order, ...s.orders] }));
        return order;
      },
      setStatus: (id, status) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id ? { ...o, status, updatedAt: Date.now() } : o,
          ),
        })),
      remove: (id) =>
        set((s) => ({ orders: s.orders.filter((o) => o.id !== id) })),
      clear: () => set({ orders: [] }),
    }),
    {
      name: 'stok.orders.v1',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export const isPending = (s: OrderStatus) =>
  s === 'emailed' || s === 'called';
