import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { SHIPPING_FEE, checkoutSchema } from '@/lib/checkout';

export const runtime = 'nodejs';

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
  const ids = data.items.map((i) => i.productId);
  const { data: products, error: pErr } = await supabase
    .from('products')
    .select('id, name, slug, price, stock, active')
    .in('id', ids);

  if (pErr || !products?.length) {
    return NextResponse.json({ error: 'Products not found' }, { status: 400 });
  }

  let subtotal = 0;
  const itemsToInsert: {
    product_id: string;
    product_name: string;
    size: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }[] = [];

  for (const item of data.items) {
    const p = products.find((x) => x.id === item.productId);
    if (!p || !p.active) {
      return NextResponse.json({ error: 'Invalid product' }, { status: 400 });
    }
    if (item.quantity > p.stock) {
      return NextResponse.json(
        { error: `Insufficient stock for ${p.name}` },
        { status: 400 },
      );
    }
    const lineSubtotal = Number(p.price) * item.quantity;
    subtotal += lineSubtotal;
    itemsToInsert.push({
      product_id: p.id,
      product_name: p.name,
      size: item.size,
      quantity: item.quantity,
      unit_price: Number(p.price),
      subtotal: lineSubtotal,
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
      customer_email: data.customer_email || null,
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

  return NextResponse.json({
    id: order.id,
    order_number: order.order_number,
    total_amount: order.total_amount,
  });
}
