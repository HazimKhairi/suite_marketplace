import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { extractReceipt, matchReceipt } from '@/lib/gemini';
import { sendOrderEmail } from '@/lib/email';

export const runtime = 'nodejs';
export const maxDuration = 60;

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const MAX_BYTES = 8 * 1024 * 1024;

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
    .select('id, total_amount, status, order_number, customer_name, customer_email, delivery_method, delivery_address, order_items(*)')
    .eq('id', id)
    .maybeSingle();

  if (oErr || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  if (!['pending_payment', 'rejected'].includes(order.status)) {
    return NextResponse.json({ error: 'Order already processed' }, { status: 409 });
  }

  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${id}/${Date.now()}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await supabase.storage
    .from('receipts')
    .upload(path, buf, { contentType: file.type, upsert: false });

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const expectedHolder = process.env.NEXT_PUBLIC_BANK_HOLDER ?? 'MUHAMMAD HAZIM';
  let ocr;
  try {
    ocr = await extractReceipt(buf.toString('base64'), file.type);
  } catch (e) {
    ocr = {
      detected_amount: null,
      detected_recipient: null,
      detected_reference: null,
      detected_date: null,
      detected_bank: null,
      raw_text: '',
      is_likely_real: false,
      confidence: 'low' as const,
      notes: e instanceof Error ? e.message : 'OCR failed',
    };
  }

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

  return NextResponse.json({ ocr, match, status: newStatus });
}
