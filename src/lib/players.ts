import { createAdminClient } from '@/lib/supabase/server';
import type { OrderStatus } from '@/lib/types';

export type TakenPlayer = { product_id: string; number: string; name: string };

// Statuses that "reserve" a player number. Cancelled / rejected orders free it up.
export const ACTIVE_PLAYER_STATUSES: OrderStatus[] = [
  'pending_payment',
  'verifying',
  'paid',
  'shipped',
  'completed',
];

type Row = {
  product_id: string | null;
  player_name: string | null;
  player_number: string | null;
  orders: { status: OrderStatus } | { status: OrderStatus }[] | null;
};

function rowStatus(row: Row): OrderStatus | null {
  const o = row.orders;
  if (!o) return null;
  if (Array.isArray(o)) return o[0]?.status ?? null;
  return o.status;
}

/**
 * Squad-number reservations are scoped per product variant — buying #7 on the
 * white jersey doesn't lock #7 on the black one, since each colour ships as its
 * own SKU.
 */
export async function getTakenPlayerNumbers(): Promise<TakenPlayer[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('order_items')
      .select('product_id, player_name, player_number, orders!inner(status)')
      .eq('player_type', 'player')
      .not('player_number', 'is', null);

    if (!data) return [];

    const seen = new Map<string, TakenPlayer>();
    for (const raw of data as unknown as Row[]) {
      const status = rowStatus(raw);
      if (!status || !ACTIVE_PLAYER_STATUSES.includes(status)) continue;
      if (!raw.product_id || !raw.player_number || !raw.player_name) continue;
      const num = raw.player_number.trim();
      const key = `${raw.product_id}:${num}`;
      if (!seen.has(key)) {
        seen.set(key, {
          product_id: raw.product_id,
          number: num,
          name: raw.player_name.trim().toUpperCase(),
        });
      }
    }

    return Array.from(seen.values());
  } catch {
    return [];
  }
}
