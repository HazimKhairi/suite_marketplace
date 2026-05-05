import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const revalidate = 30;

export type RecentPurchase = {
  name: string;
  item: string;
  category: 'jersey' | 'jacket';
  at: string;
};

function anonymize(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Someone';
  const first = parts[0];
  const skip = new Set(['BIN', 'BINTI', 'BT', 'BTE', 'B.', 'A/L', 'A/P']);
  const rest = parts.slice(1).find((p) => !skip.has(p.toUpperCase()));
  const initial = rest ? `${rest[0]?.toUpperCase()}.` : '';
  return initial ? `${cap(first)} ${initial}` : cap(first);
}

function cap(s: string) {
  return s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s;
}

function labelFor(row: {
  category: string;
  sleeve_type: string | null;
  product_color: string | null;
}): string {
  if (row.category === 'jacket') return 'Track jacket';
  const color = row.product_color ? cap(row.product_color) : '';
  const sleeve = row.sleeve_type === 'long' ? 'long sleeve' : 'short sleeve';
  return [color, sleeve].filter(Boolean).join(' ');
}

export async function GET() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ purchases: [] });
  }

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('order_items')
      .select(
        'category, sleeve_type, products!inner(color), orders!inner(customer_name, status, created_at)',
      )
      .in('orders.status', ['paid', 'shipped', 'completed'])
      .order('created_at', { foreignTable: 'orders', ascending: false })
      .limit(40);

    type Row = {
      category: string;
      sleeve_type: string | null;
      products: { color: string } | { color: string }[] | null;
      orders:
        | { customer_name: string; status: string; created_at: string }
        | { customer_name: string; status: string; created_at: string }[]
        | null;
    };

    const seenOrders = new Set<string>();
    const purchases: RecentPurchase[] = [];

    for (const raw of (data ?? []) as unknown as Row[]) {
      const order = Array.isArray(raw.orders) ? raw.orders[0] : raw.orders;
      const product = Array.isArray(raw.products) ? raw.products[0] : raw.products;
      if (!order || !product) continue;
      const key = `${order.customer_name}-${order.created_at}`;
      if (seenOrders.has(key)) continue;
      seenOrders.add(key);
      purchases.push({
        name: anonymize(order.customer_name),
        item: labelFor({
          category: raw.category,
          sleeve_type: raw.sleeve_type,
          product_color: product.color ?? null,
        }),
        category: raw.category as 'jersey' | 'jacket',
        at: order.created_at,
      });
      if (purchases.length >= 12) break;
    }

    return NextResponse.json(
      { purchases },
      { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } },
    );
  } catch {
    return NextResponse.json({ purchases: [] });
  }
}
