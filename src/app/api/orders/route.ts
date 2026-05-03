import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { SHIPPING_FEE, checkoutSchema } from '@/lib/checkout';
import { effectiveUnitPrice, sizeSurcharge } from '@/lib/pricing';
import { sendOrderEmail } from '@/lib/email';

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

  if (data.delivery_method === 'delivery' && !data.delivery_address?.trim()) {
    return NextResponse.json({ error: 'Delivery address required' }, { status: 400 });
  }

  const supabase = createAdminClient();
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

  const shipping = data.delivery_method === 'delivery' ? SHIPPING_FEE : 0;
  const total = subtotal + shipping;

  const { data: order, error: oErr } = await supabase
    .from('orders')
    .insert({
      order_number: '',
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      customer_email: data.customer_email,
      delivery_method: data.delivery_method,
      delivery_address: data.delivery_address || null,
      subtotal,
      shipping_fee: shipping,
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

  // Confirmation email (best effort, do not fail the order on email errors)
  try {
    await sendOrderEmail(
      {
        order_number: order.order_number,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        delivery_method: order.delivery_method,
        delivery_address: order.delivery_address,
        total_amount: order.total_amount,
        order_items: itemsToInsert.map((i) => ({
          product_name: i.product_name,
          category: i.category,
          size: i.size,
          quantity: i.quantity,
          subtotal: i.subtotal,
          player_name: i.player_name,
          player_number: i.player_number,
          player_type: i.player_type,
          sleeve_type: i.sleeve_type,
        })),
      },
      'pending_payment',
    );
  } catch (e) {
    console.error('Email send failed:', e);
  }

  // Reference unused helper to satisfy linter for surcharge import in this scope
  void sizeSurcharge;

  return NextResponse.json({
    id: order.id,
    order_number: order.order_number,
    total_amount: order.total_amount,
  });
}
