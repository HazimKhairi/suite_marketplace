import { createAdminClient } from '@/lib/supabase/server';
import type { OrderStatus } from '@/lib/types';

export type TakenPlayer = { number: string; name: string };

// Statuses that "reserve" a player number. Cancelled / rejected orders free it up.
export const ACTIVE_PLAYER_STATUSES: OrderStatus[] = [
  'pending_payment',
  'verifying',
  'paid',
  'shipped',
  'completed',
];

type Row = {
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
 * Returns the canonical { number → first claimant name } map for player_type='player'
 * jersey items across all non-cancelled orders. Used to warn shoppers when their pick
 * collides with an existing teammate's number.
 */
export async function getTakenPlayerNumbers(): Promise<TakenPlayer[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('order_items')
      .select('player_name, player_number, orders!inner(status)')
      .eq('player_type', 'player')
      .not('player_number', 'is', null);

    if (!data) return [];

    const seen = new Map<string, string>();
    for (const raw of data as unknown as Row[]) {
      const status = rowStatus(raw);
      if (!status || !ACTIVE_PLAYER_STATUSES.includes(status)) continue;
      if (!raw.player_number || !raw.player_name) continue;
      const num = raw.player_number.trim();
      if (!seen.has(num)) seen.set(num, raw.player_name.trim().toUpperCase());
    }

    return Array.from(seen.entries()).map(([number, name]) => ({ number, name }));
  } catch {
    return [];
  }
}
