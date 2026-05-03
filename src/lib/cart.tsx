'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { CartItem } from '@/lib/types';

type CartContextValue = {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (productId: string, size: string) => void;
  setQty: (productId: string, size: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  ready: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = 'suite_cart_v1';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, ready]);

  const add = (item: CartItem) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.productId === item.productId && i.size === item.size);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + item.quantity };
        return next;
      }
      return [...prev, item];
    });
  };

  const remove = (productId: string, size: string) =>
    setItems((prev) => prev.filter((i) => !(i.productId === productId && i.size === size)));

  const setQty = (productId: string, size: string, qty: number) =>
    setItems((prev) =>
      prev
        .map((i) =>
          i.productId === productId && i.size === size ? { ...i, quantity: Math.max(0, qty) } : i,
        )
        .filter((i) => i.quantity > 0),
    );

  const clear = () => setItems([]);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, add, remove, setQty, clear, count, subtotal, ready }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart outside CartProvider');
  return ctx;
}
