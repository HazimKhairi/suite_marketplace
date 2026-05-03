import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatMYR } from '@/lib/utils';
import type { OcrResult, Order, OrderItem, OrderStatus } from '@/lib/types';
import { OrderActions } from './order-actions';

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
    .select('*, order_items(*)')
    .eq('id', id)
    .maybeSingle();
  if (!order) notFound();

  const o = order as Order & { order_items: OrderItem[] };
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
            <p className="font-mono text-3xl mt-2 tracking-wider">{o.order_number}</p>
            <div className="mt-3 flex items-center gap-3">
              <Badge variant={STATUS[o.status].tone}>{STATUS[o.status].text}</Badge>
              <span className="text-[12px] text-muted font-mono">{formatDate(o.created_at)}</span>
            </div>
          </div>

          <div className="border border-line">
            <Section title="Customer">
              <Field k="Name" v={o.customer_name} />
              <Field k="Phone" v={<span className="font-mono">{o.customer_phone}</span>} />
              <Field k="Email" v={o.customer_email ?? '—'} />
              <Field
                k="Delivery"
                v={
                  o.delivery_method === 'pickup'
                    ? 'Self pickup · Dungun'
                    : `Courier · ${o.delivery_address}`
                }
              />
            </Section>

            <Section title="Items">
              <div className="divide-y divide-line">
                {o.order_items.map((it) => (
                  <div key={it.id} className="py-3 flex justify-between items-baseline gap-4">
                    <div>
                      <p className="text-[14px]">{it.product_name}</p>
                      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted mt-0.5">
                        Size {it.size} · × {it.quantity}
                      </p>
                    </div>
                    <p className="font-mono text-[13px]">{formatMYR(Number(it.subtotal))}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Totals">
              <Field k="Subtotal" v={formatMYR(Number(o.subtotal))} />
              <Field
                k="Shipping"
                v={Number(o.shipping_fee) === 0 ? 'FREE' : formatMYR(Number(o.shipping_fee))}
              />
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
                  v={ocr.detected_amount != null ? formatMYR(ocr.detected_amount) : '—'}
                />
                <Field k="Recipient" v={ocr.detected_recipient ?? '—'} />
                <Field k="Reference" v={ocr.detected_reference ?? '—'} />
                <Field k="Bank" v={ocr.detected_bank ?? '—'} />
                <Field k="Date" v={ocr.detected_date ?? '—'} />
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
      <span className="text-muted shrink-0 min-w-24">{k}</span>
      <span className="text-right">{v}</span>
    </div>
  );
}
