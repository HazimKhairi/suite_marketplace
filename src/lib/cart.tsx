'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { CartItem } from '@/lib/types';

type CartContextValue = {
  items: CartItem[];
  add: (item: Omit<CartItem, 'lineId'>) => void;
  remove: (lineId: string) => void;
  setQty: (lineId: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  ready: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = 'suite_cart_v2';

function makeLineId() {
  return `line_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function fingerprint(item: Omit<CartItem, 'lineId'>) {
  return [
    item.productId,
    item.size,
    item.player_name?.trim().toUpperCase() ?? '',
    item.player_number?.trim() ?? '',
    item.player_type ?? '',
  ].join('|');
}

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

  const add: CartContextValue['add'] = (item) => {
    setItems((prev) => {
      // Merge only when ALL personalization fields match exactly.
      const fp = fingerprint(item);
      const idx = prev.findIndex((i) => fingerprint(i) === fp);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + item.quantity };
        return next;
      }
      return [...prev, { ...item, lineId: makeLineId() }];
    });
  };

  const remove = (lineId: string) =>
    setItems((prev) => prev.filter((i) => i.lineId !== lineId));

  const setQty = (lineId: string, qty: number) =>
    setItems((prev) =>
      prev
        .map((i) => (i.lineId === lineId ? { ...i, quantity: Math.max(0, qty) } : i))
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
