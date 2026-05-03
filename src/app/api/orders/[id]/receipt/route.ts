import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { extractReceipt, matchReceipt } from '@/lib/ocr';
import { sendAdminReceiptEmail, sendOrderEmail } from '@/lib/email';

export const runtime = 'nodejs';
export const maxDuration = 60;

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const MAX_BYTES = 8 * 1024 * 1024;
const MAX_ATTEMPTS = 5;

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const form = await req.formData().catch(() => null);
  const file = form?.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file' }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: 'Image only' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Too large (max 8MB)' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: order, error: oErr } = await supabase
    .from('orders')
    .select('id, total_amount, status, order_number, customer_name, customer_phone, customer_email, delivery_method, delivery_address, order_items(*)')
    .eq('id', id)
    .maybeSingle();

  if (oErr || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  if (!['pending_payment', 'verifying', 'rejected'].includes(order.status)) {
    return NextResponse.json({ error: 'Order already processed' }, { status: 409 });
  }

  // Cap how many times a customer can resubmit a receipt before we hand them off to
  // the admin manually. Counted by listing the per-order folder in the receipts bucket.
  const { data: priorFiles } = await supabase.storage.from('receipts').list(id, { limit: 100 });
  const priorCount = priorFiles?.length ?? 0;
  if (priorCount >= MAX_ATTEMPTS) {
    return NextResponse.json(
      {
        error: `Maximum ${MAX_ATTEMPTS} upload attempts reached. Please WhatsApp the admin with this order number for manual verification.`,
        attempts_used: priorCount,
        attempts_remaining: 0,
      },
      { status: 429 },
    );
  }

  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${id}/${Date.now()}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await supabase.storage
    .from('receipts')
    .upload(path, buf, { contentType: file.type, upsert: false });

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const attemptsUsed = priorCount + 1;
  const attemptsRemaining = MAX_ATTEMPTS - attemptsUsed;

  const expectedHolder = process.env.NEXT_PUBLIC_BANK_HOLDER ?? 'MUHAMMAD HAZIM';
  const ocr = await extractReceipt(buf, expectedHolder);

  const match = matchReceipt(ocr, Number(order.total_amount), expectedHolder);
  const newStatus = match ? 'paid' : 'verifying';

  const { error: updErr } = await supabase
    .from('orders')
    .update({
      receipt_url: path,
      ocr_result: ocr,
      ocr_match: match,
      status: newStatus,
    })
    .eq('id', id);

  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  if (order.customer_email) {
    try {
      await sendOrderEmail(
        {
          order_number: order.order_number,
          customer_name: order.customer_name,
          customer_email: order.customer_email,
          delivery_method: order.delivery_method,
          delivery_address: order.delivery_address,
          total_amount: order.total_amount,
          order_items: order.order_items,
        },
        newStatus,
      );
    } catch (e) {
      console.error('Email send failed:', e);
    }
  }

  try {
    await sendAdminReceiptEmail({
      order_id: order.id,
      order_number: order.order_number,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      customer_email: order.customer_email,
      total_amount: order.total_amount,
      match,
      new_status: newStatus,
      ocr,
    });
  } catch (e) {
    console.error('Admin notification failed:', e);
  }

  return NextResponse.json({
    ocr,
    match,
    status: newStatus,
    attempts_used: attemptsUsed,
    attempts_remaining: attemptsRemaining,
  });
}
