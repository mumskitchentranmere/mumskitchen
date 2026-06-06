'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category: string;
}

interface CartStore {
  items:          CartItem[];
  orderType:      'takeaway';
  addItem:        (item: CartItem) => void;
  removeItem:     (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart:      () => void;
  total:          () => number;
  itemCount:      () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items:     [],
      orderType: 'takeaway',

      addItem: (item) => {
        const ex = get().items.find(i => i.id === item.id);
        if (ex) set({ items: get().items.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i) });
        else    set({ items: [...get().items, { ...item, quantity: 1 }] });
      },

      removeItem:     (id) => set({ items: get().items.filter(i => i.id !== id) }),

      updateQuantity: (id, qty) => {
        if (qty <= 0) get().removeItem(id);
        else set({ items: get().items.map(i => i.id === id ? { ...i, quantity: qty } : i) });
      },

      clearCart:  () => set({ items: [] }),
      total:      () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),
      itemCount:  () => get().items.reduce((s, i) => s + i.quantity, 0),
    }),
    {
      name:    'mumskitchen-cart',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
        }
        return sessionStorage;
      }),
      skipHydration: true,
      partialize:    (state) => ({ items: state.items }),
    }
  )
);
