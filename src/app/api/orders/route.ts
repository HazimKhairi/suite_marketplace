import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { checkoutSchema } from '@/lib/checkout';
import { effectiveUnitPrice, sizeSurcharge } from '@/lib/pricing';
import { ACTIVE_PLAYER_STATUSES } from '@/lib/players';
import type { OrderStatus } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const data = parsed.data;

  // Validate that no two cart lines claim the same player number with different names.
  const intraOrderPlayers = new Map<string, string>();
  for (const item of data.items) {
    if (item.player_type !== 'player') continue;
    if (!item.player_number || !item.player_name) continue;
    const num = item.player_number.trim();
    const nm = item.player_name.trim().toUpperCase();
    const existing = intraOrderPlayers.get(num);
    if (existing && existing !== nm) {
      return NextResponse.json(
        { error: `Number ${num} cannot be assigned to two different players in the same order` },
        { status: 400 },
      );
    }
    intraOrderPlayers.set(num, nm);
  }

  const supabase = createAdminClient();

  // Cross-order conflict: another customer already claimed this number as a player.
  if (intraOrderPlayers.size > 0) {
    const numbers = Array.from(intraOrderPlayers.keys());
    const { data: existingClaims } = await supabase
      .from('order_items')
      .select('player_name, player_number, orders!inner(status)')
      .eq('player_type', 'player')
      .in('player_number', numbers);

    type Row = {
      player_name: string | null;
      player_number: string | null;
      orders: { status: OrderStatus } | { status: OrderStatus }[] | null;
    };

    const seen = new Map<string, string>();
    for (const raw of (existingClaims ?? []) as unknown as Row[]) {
      const status = Array.isArray(raw.orders) ? raw.orders[0]?.status : raw.orders?.status;
      if (!status || !ACTIVE_PLAYER_STATUSES.includes(status)) continue;
      if (!raw.player_number || !raw.player_name) continue;
      const num = raw.player_number.trim();
      if (!seen.has(num)) seen.set(num, raw.player_name.trim().toUpperCase());
    }

    for (const [num, nm] of intraOrderPlayers) {
      const claimed = seen.get(num);
      if (claimed && claimed !== nm) {
        return NextResponse.json(
          { error: `Number ${num} is already taken by ${claimed}` },
          { status: 400 },
        );
      }
    }
  }
  const ids = Array.from(new Set(data.items.map((i) => i.productId)));
  const { data: products, error: pErr } = await supabase
    .from('products')
    .select('id, name, slug, category, sleeve_type, price, stock, active, sizes')
    .in('id', ids);

  if (pErr || !products?.length) {
    return NextResponse.json({ error: 'Products not found' }, { status: 400 });
  }

  const requested: Record<string, number> = {};
  for (const it of data.items) {
    requested[it.productId] = (requested[it.productId] ?? 0) + it.quantity;
  }
  for (const p of products) {
    if ((requested[p.id] ?? 0) > p.stock) {
      return NextResponse.json(
        { error: `Insufficient stock for ${p.name}` },
        { status: 400 },
      );
    }
  }

  let subtotal = 0;
  const itemsToInsert: {
    product_id: string;
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
  }[] = [];

  for (const item of data.items) {
    const p = products.find((x) => x.id === item.productId);
    if (!p || !p.active) {
      return NextResponse.json({ error: 'Invalid product' }, { status: 400 });
    }
    if (Array.isArray(p.sizes) && !p.sizes.includes(item.size)) {
      return NextResponse.json(
        { error: `Size ${item.size} not available for ${p.name}` },
        { status: 400 },
      );
    }
    const isJersey = p.category === 'jersey';
    if (isJersey) {
      if (!item.player_name || item.player_name.trim().length < 2) {
        return NextResponse.json(
          { error: `Player name required for jersey (${p.name})` },
          { status: 400 },
        );
      }
      if (!item.player_number || !/^[0-9]{1,3}$/.test(item.player_number.trim())) {
        return NextResponse.json(
          { error: `Player number 1 to 3 digits required (${p.name})` },
          { status: 400 },
        );
      }
      if (!item.player_type) {
        return NextResponse.json(
          { error: `Player status required (${p.name})` },
          { status: 400 },
        );
      }
    }

    const unitWithSurcharge = effectiveUnitPrice(Number(p.price), item.size);
    const lineTotal = unitWithSurcharge * item.quantity;
    subtotal += lineTotal;

    itemsToInsert.push({
      product_id: p.id,
      product_name: p.name,
      category: p.category as 'jersey' | 'jacket',
      size: item.size,
      quantity: item.quantity,
      unit_price: unitWithSurcharge,
      subtotal: lineTotal,
      player_name: isJersey ? item.player_name!.trim().toUpperCase() : null,
      player_number: isJersey ? item.player_number!.trim() : null,
      player_type: isJersey ? item.player_type : null,
      sleeve_type: (p.sleeve_type as 'short' | 'long' | null) ?? null,
    });
  }

  const total = subtotal;

  const { data: order, error: oErr } = await supabase
    .from('orders')
    .insert({
      order_number: '',
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      customer_email: data.customer_email,
      delivery_method: 'pickup',
      delivery_address: null,
      subtotal,
      shipping_fee: 0,
      total_amount: total,
      status: 'pending_payment',
    })
    .select()
    .single();

  if (oErr || !order) {
    return NextResponse.json({ error: oErr?.message ?? 'Order create failed' }, { status: 500 });
  }

  const { error: iErr } = await supabase
    .from('order_items')
    .insert(itemsToInsert.map((row) => ({ ...row, order_id: order.id })));

  if (iErr) {
    await supabase.from('orders').delete().eq('id', order.id);
    return NextResponse.json({ error: iErr.message }, { status: 500 });
  }

  // No emails fire here. Both the customer confirmation and the admin notification go out
  // from /api/orders/[id]/receipt once the customer has actually paid and uploaded a slip.

  // Reference unused helper to satisfy linter for surcharge import in this scope
  void sizeSurcharge;

  return NextResponse.json({
    id: order.id,
    order_number: order.order_number,
    total_amount: order.total_amount,
  });
}
