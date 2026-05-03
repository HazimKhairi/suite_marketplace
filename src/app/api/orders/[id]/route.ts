import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const phone = req.nextUrl.searchParams.get('phone')?.replace(/\s|-/g, '') ?? '';

  const supabase = createAdminClient();

  // Allow lookup by UUID or order_number
  const isUuid = /^[0-9a-f-]{36}$/i.test(id);
  const query = supabase
    .from('orders')
    .select(
      'id, order_number, customer_name, customer_phone, delivery_method, total_amount, status, created_at, order_items(product_name, size, quantity, unit_price, subtotal)',
    );

  const { data, error } = await (isUuid ? query.eq('id', id) : query.eq('order_number', id))
    .maybeSingle();

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (phone && data.customer_phone.replace(/\s|-/g, '') !== phone) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(data);
}
