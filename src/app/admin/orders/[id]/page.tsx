import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatMYR } from '@/lib/utils';
import type { OcrResult, Order, OrderItem, OrderStatus } from '@/lib/types';
import { OrderActions } from './order-actions';

type ItemWithProduct = OrderItem & {
  products: { color: string; image_url: string } | null;
};

export const dynamic = 'force-dynamic';

const STATUS: Record<OrderStatus, { text: string; tone: 'default' | 'success' | 'warning' | 'error' }> = {
  pending_payment: { text: 'Awaiting payment', tone: 'warning' },
  verifying: { text: 'Verifying receipt', tone: 'warning' },
  paid: { text: 'Paid', tone: 'success' },
  shipped: { text: 'Shipped', tone: 'success' },
  completed: { text: 'Completed', tone: 'success' },
  rejected: { text: 'Rejected', tone: 'error' },
  cancelled: { text: 'Cancelled', tone: 'error' },
};

export default async function AdminOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = createAdminClient();
  const { data: order } = await supabase
    .from('orders')
    .select('*, order_items(*, products(color, image_url))')
    .eq('id', id)
    .maybeSingle();
  if (!order) notFound();

  const o = order as Order & { order_items: ItemWithProduct[] };
  const ocr = o.ocr_result as OcrResult | null;

  return (
    <div className="max-w-[1440px] mx-auto px-6 lg:px-10 pt-8 pb-24">
      <Link href="/admin" className="inline-flex items-center gap-2 text-[13px] text-muted hover:text-ink mb-6">
        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} /> Back to orders
      </Link>

      <div className="grid grid-cols-12 gap-10">
        <div className="col-span-12 lg:col-span-7 space-y-10">
          <div>
            <p className="eyebrow">Order</p>
            <p className="font-mono text-2xl sm:text-3xl mt-2 tracking-wider break-all">
              {o.order_number}
            </p>
            <div className="mt-3 flex items-center gap-3">
              <Badge variant={STATUS[o.status].tone}>{STATUS[o.status].text}</Badge>
              <span className="text-[12px] text-muted font-mono">{formatDate(o.created_at)}</span>
            </div>
          </div>

          <div className="border border-line">
            <Section title="Customer">
              <Field k="Name" v={o.customer_name} />
              <Field k="Phone" v={<span className="font-mono">{o.customer_phone}</span>} />
              <Field k="Email" v={o.customer_email ?? 'Not provided'} />
              <Field k="Pickup" v="Self pickup · UiTM KT" />
            </Section>

            <Section title="Items">
              <div className="divide-y divide-line">
                {o.order_items.map((it) => {
                  const color = it.products?.color;
                  const image = it.products?.image_url;
                  const swatch = color === 'black' ? 'bg-ink' : color === 'white' ? 'bg-canvas border border-line' : 'bg-paper';
                  return (
                    <div key={it.id} className="py-4 flex justify-between items-start gap-4">
                      <div className="flex gap-4 flex-1 min-w-0">
                        {image && (
                          <div className="relative w-20 h-24 bg-paper border border-line shrink-0 overflow-hidden">
                            <Image
                              src={image}
                              alt={it.product_name}
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-heading font-semibold">{it.product_name}</p>
                          {color && (
                            <div className="mt-1.5 inline-flex items-center gap-2">
                              <span className={`w-3 h-3 rounded-full ${swatch}`} />
                              <span className="font-mono text-[11px] uppercase tracking-[0.14em]">
                                {color}
                              </span>
                            </div>
                          )}
                          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                            <span>Size {it.size} · × {it.quantity}</span>
                            {it.sleeve_type && (
                              <>
                                <span>·</span>
                                <span>{it.sleeve_type === 'short' ? 'Lengan pendek' : 'Lengan panjang'}</span>
                              </>
                            )}
                            {it.player_type && (
                              <>
                                <span>·</span>
                                <span>{it.player_type === 'player' ? 'Player' : 'Non-player'}</span>
                              </>
                            )}
                          </div>
                          {it.player_name && (
                            <p className="mt-2 inline-block bg-ink text-canvas px-3 py-1 font-mono text-[12px]">
                              {it.player_name} <span className="opacity-60">·</span> #{it.player_number}
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="font-mono text-[13px] whitespace-nowrap">{formatMYR(Number(it.subtotal))}</p>
                    </div>
                  );
                })}
              </div>
            </Section>

            <Section title="Totals">
              <Field k="Subtotal" v={formatMYR(Number(o.subtotal))} />
              <Field
                k="Total"
                v={<span className="font-mono text-[15px]">{formatMYR(Number(o.total_amount))}</span>}
              />
            </Section>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5 space-y-8">
          <OrderActions
            id={o.id}
            currentStatus={o.status}
            currentNote={o.admin_note ?? ''}
            receiptPath={o.receipt_url}
          />

          {ocr && (
            <div className="border border-line p-6">
              <p className="eyebrow mb-4">Gemini OCR</p>
              <div className="space-y-3 text-[13px]">
                <Field
                  k="Verdict"
                  v={
                    <Badge variant={o.ocr_match ? 'success' : 'warning'}>
                      {o.ocr_match ? 'Auto-matched' : 'Needs review'}
                    </Badge>
                  }
                />
                <Field
                  k="Detected amount"
                  v={ocr.detected_amount != null ? formatMYR(ocr.detected_amount) : 'Not provided'}
                />
                <Field k="Recipient" v={ocr.detected_recipient ?? 'Not provided'} />
                <Field k="Reference" v={ocr.detected_reference ?? 'Not provided'} />
                <Field k="Bank" v={ocr.detected_bank ?? 'Not provided'} />
                <Field k="Date" v={ocr.detected_date ?? 'Not provided'} />
                <Field
                  k="Confidence"
                  v={<span className="capitalize">{ocr.confidence}</span>}
                />
                <Field
                  k="Real?"
                  v={
                    <Badge variant={ocr.is_likely_real ? 'success' : 'error'}>
                      {ocr.is_likely_real ? 'Looks real' : 'Suspect'}
                    </Badge>
                  }
                />
                {ocr.notes && (
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted mt-3">
                      Notes
                    </p>
                    <p className="mt-1 text-[13px] text-ink-soft leading-relaxed">{ocr.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-6 py-5 border-b border-line last:border-b-0">
      <p className="eyebrow mb-3">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Field({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-[13px]">
      <span className="text-muted shrink-0 min-w-20">{k}</span>
      <span className="text-right break-all min-w-0">{v}</span>
    </div>
  );
}
