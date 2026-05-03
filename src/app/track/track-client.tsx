'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input, Label } from '@/components/ui/input';
import { formatDate, formatMYR } from '@/lib/utils';
import type { OrderStatus } from '@/lib/types';

type LineItem = {
  product_name: string;
  category: 'jersey' | 'jacket';
  size: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  player_name: string | null;
  player_number: string | null;
  player_type: 'player' | 'non_player' | null;
  sleeve_type: 'short' | 'long' | null;
};

type OrderView = {
  id: string;
  order_number: string;
  customer_name: string;
  total_amount: number;
  delivery_method: 'pickup' | 'delivery';
  status: OrderStatus;
  created_at: string;
  order_items: LineItem[];
};

const STATUS_LABEL: Record<OrderStatus, { text: string; tone: 'default' | 'success' | 'warning' | 'error' }> = {
  pending_payment: { text: 'Awaiting payment', tone: 'warning' },
  verifying: { text: 'Verifying receipt', tone: 'warning' },
  paid: { text: 'Paid', tone: 'success' },
  shipped: { text: 'Shipped', tone: 'success' },
  completed: { text: 'Completed', tone: 'success' },
  rejected: { text: 'Rejected', tone: 'error' },
  cancelled: { text: 'Cancelled', tone: 'error' },
};

const TIMELINE: { key: OrderStatus; label: string }[] = [
  { key: 'pending_payment', label: 'Order placed' },
  { key: 'verifying', label: 'Receipt review' },
  { key: 'paid', label: 'Payment confirmed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'completed', label: 'Delivered' },
];

export function TrackClient({ initialOrder, initialPhone }: { initialOrder: string; initialPhone: string }) {
  const [orderNumber, setOrderNumber] = useState(initialOrder);
  const [phone, setPhone] = useState(initialPhone);
  const [order, setOrder] = useState<OrderView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function lookup(o = orderNumber, p = phone) {
    if (!o.trim()) return;
    setLoading(true);
    setError(null);
    setOrder(null);
    try {
      const res = await fetch(
        `/api/orders/${encodeURIComponent(o.trim())}${p ? `?phone=${encodeURIComponent(p.trim())}` : ''}`,
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Not found');
      setOrder(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lookup failed');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialOrder) lookup(initialOrder, initialPhone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const idx = order ? TIMELINE.findIndex((t) => t.key === order.status) : -1;
  const isFailed = order && (order.status === 'rejected' || order.status === 'cancelled');

  return (
    <div className="max-w-[1440px] mx-auto px-6 lg:px-10 pt-12 pb-32">
      <div className="grid grid-cols-12 gap-6 mb-12 items-end">
        <div className="col-span-12 md:col-span-7">
          <p className="eyebrow">Track</p>
          <h1 className="h-display text-[56px] md:text-[80px] mt-4">Where's my kit?</h1>
        </div>
        <div className="col-span-12 md:col-span-5 text-muted text-[14px]">
          Masuk order number kita hantar masa checkout, dan phone yang kau guna (optional).
        </div>
      </div>

      <div className="border border-line p-6 lg:p-8 max-w-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <Label>Order number</Label>
            <Input
              placeholder="VB-20260504-0001"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && lookup()}
            />
          </div>
          <div>
            <Label>Phone (optional)</Label>
            <Input
              placeholder="012-345 6789"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && lookup()}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => lookup()}
          disabled={loading || !orderNumber.trim()}
          className="mt-5 inline-flex bg-ink text-canvas h-12 px-6 items-center gap-2 hover:bg-accent transition-colors disabled:opacity-50"
        >
          {loading ? 'Looking up…' : 'Find order'} <Search className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>

      {error && (
        <div className="mt-10 border border-accent p-6 max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">Not found</p>
          <p className="mt-2 text-[14px] text-ink-soft">
            Tak jumpa order tu{phone ? ' + phone' : ''}. Check semula.
          </p>
        </div>
      )}

      {order && (
        <div className="mt-12 grid grid-cols-12 gap-10">
          <div className="col-span-12 lg:col-span-7 space-y-10">
            <div>
              <p className="eyebrow">Order</p>
              <p className="font-mono text-2xl mt-2 tracking-wider">{order.order_number}</p>
              <div className="mt-3 flex items-center gap-3 text-[13px] text-muted">
                <span>{formatDate(order.created_at)}</span>
                <span>·</span>
                <Badge variant={STATUS_LABEL[order.status].tone}>
                  {STATUS_LABEL[order.status].text}
                </Badge>
              </div>
            </div>

            <div className="border border-line">
              {order.order_items.map((it, i) => (
                <div key={i} className="p-5 border-b border-line last:border-b-0">
                  <div className="flex items-baseline justify-between gap-4">
                    <div>
                      <p className="text-[15px]">{it.product_name}</p>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                        <span>Size {it.size} · × {it.quantity}</span>
                        {it.sleeve_type && <span>·</span>}
                        {it.sleeve_type && (
                          <span>{it.sleeve_type === 'short' ? 'Lengan pendek' : 'Lengan panjang'}</span>
                        )}
                        {it.player_name && <span>·</span>}
                        {it.player_name && (
                          <span className="text-ink">
                            {it.player_name} #{it.player_number}
                          </span>
                        )}
                        {it.player_type && <span>·</span>}
                        {it.player_type && (
                          <span>{it.player_type === 'player' ? 'Player' : 'Non-player'}</span>
                        )}
                      </div>
                    </div>
                    <p className="font-mono text-[14px]">{formatMYR(Number(it.subtotal))}</p>
                  </div>
                </div>
              ))}
              <div className="p-5 border-t border-line flex items-baseline justify-between bg-paper">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em]">Total</p>
                <p className="font-mono text-[15px]">{formatMYR(Number(order.total_amount))}</p>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-5">
            <p className="eyebrow mb-6">Timeline</p>
            <div className="border border-line">
              {TIMELINE.map((s, i) => {
                const reached = !isFailed && i <= idx;
                return (
                  <div
                    key={s.key}
                    className={`flex items-center gap-4 px-5 py-4 border-b border-line last:border-b-0 ${
                      reached ? 'text-ink' : 'text-muted'
                    }`}
                  >
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${reached ? 'bg-ink' : 'bg-line'}`}
                    />
                    <p className="text-[14px]">{s.label}</p>
                  </div>
                );
              })}
              {isFailed && (
                <div className="flex items-center gap-4 px-5 py-4 border-t border-line text-accent">
                  <div className="w-2.5 h-2.5 rounded-full bg-accent" />
                  <p className="text-[14px]">{STATUS_LABEL[order.status].text}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
