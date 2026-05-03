import { NextResponse, type NextRequest } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as
    | { stock?: number; price?: number; active?: boolean }
    | null;
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (typeof body.stock === 'number' && body.stock >= 0) update.stock = body.stock;
  if (typeof body.price === 'number' && body.price > 0) update.price = body.price;
  if (typeof body.active === 'boolean') update.active = body.active;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.from('products').update(update).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
