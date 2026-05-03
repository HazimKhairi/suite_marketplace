import { NextResponse, type NextRequest } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import type { OrderStatus } from '@/lib/types';

export const runtime = 'nodejs';

const ALLOWED_STATUS: OrderStatus[] = [
  'pending_payment',
  'verifying',
  'paid',
  'shipped',
  'completed',
  'rejected',
  'cancelled',
];

async function ensureAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await ensureAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as
    | { status?: string; admin_note?: string }
    | null;
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (body.status) {
    if (!ALLOWED_STATUS.includes(body.status as OrderStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    update.status = body.status;
  }
  if (typeof body.admin_note === 'string') update.admin_note = body.admin_note;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.from('orders').update(update).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
