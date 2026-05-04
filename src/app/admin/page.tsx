import Link from 'next/link';
import { ArrowUpRight, Download } from 'lucide-react';
import { requireAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatMYR } from '@/lib/utils';
import type { OrderStatus } from '@/lib/types';

export const metadata = { title: 'Orders · Admin' };
export const dynamic = 'force-dynamic';

const STATUS: Record<OrderStatus, { text: string; tone: 'default' | 'success' | 'warning' | 'error' }> = {
  pending_payment: { text: 'Awaiting', tone: 'warning' },
  verifying: { text: 'Verifying', tone: 'warning' },
  paid: { text: 'Paid', tone: 'success' },
  shipped: { text: 'Shipped', tone: 'success' },
  completed: { text: 'Completed', tone: 'success' },
  rejected: { text: 'Rejected', tone: 'error' },
  cancelled: { text: 'Cancelled', tone: 'error' },
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const { status } = await searchParams;

  const supabase = createAdminClient();
  let q = supabase
    .from('orders')
    .select('id, order_number, customer_name, customer_phone, total_amount, status, created_at, ocr_match')
    .order('created_at', { ascending: false })
    .limit(100);

  if (status && status !== 'all') q = q.eq('status', status);
  const { data: orders } = await q;

  const counts: Record<string, number> = {};
  const { data: countRows } = await supabase.from('orders').select('status');
  for (const r of countRows ?? []) counts[r.status] = (counts[r.status] ?? 0) + 1;

  const filters: { id: OrderStatus | 'all'; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'pending_payment', label: 'Awaiting' },
    { id: 'verifying', label: 'Verifying' },
    { id: 'paid', label: 'Paid' },
    { id: 'shipped', label: 'Shipped' },
    { id: 'completed', label: 'Completed' },
    { id: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-6 lg:px-10 pt-10 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
        <div>
          <p className="eyebrow">Orders</p>
          <h1 className="h-display text-[48px] md:text-[64px] mt-3">Inbox.</h1>
        </div>
        <a
          href={`/api/admin/orders/export${status && status !== 'all' ? `?status=${status}` : ''}`}
          className="inline-flex items-center gap-2 h-11 px-5 bg-ink text-canvas hover:bg-flame-red transition-colors text-[13px] font-heading font-semibold"
        >
          <Download className="w-4 h-4" strokeWidth={1.5} />
          Export CSV{status && status !== 'all' ? ` · ${status}` : ''}
        </a>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {filters.map((f) => {
          const isActive = (status ?? 'all') === f.id;
          const c = f.id === 'all' ? (countRows?.length ?? 0) : counts[f.id] ?? 0;
          return (
            <Link
              key={f.id}
              href={f.id === 'all' ? '/admin' : `/admin?status=${f.id}`}
              className={`h-9 px-4 inline-flex items-center gap-2 border text-[13px] ${
                isActive ? 'bg-ink text-canvas border-ink' : 'border-line hover:border-ink'
              }`}
            >
              {f.label}
              <span className="font-mono text-[11px] opacity-70">{String(c).padStart(2, '0')}</span>
            </Link>
          );
        })}
      </div>

      <div className="border border-line overflow-x-auto">
        <div className="min-w-[680px]">
          <div className="grid grid-cols-12 gap-3 px-5 py-3 bg-paper border-b border-line font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            <div className="col-span-3">Order</div>
            <div className="col-span-3">Customer</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Total</div>
            <div className="col-span-2 text-right">When</div>
          </div>
          {(!orders || orders.length === 0) && (
            <div className="p-10 text-center text-muted text-[14px]">No orders here yet.</div>
          )}
          {orders?.map((o) => (
            <Link
              key={o.id}
              href={`/admin/orders/${o.id}`}
              className="grid grid-cols-12 gap-3 px-5 py-4 border-b border-line last:border-b-0 hover:bg-paper transition-colors items-center"
            >
              <div className="col-span-3 font-mono text-[12px] min-w-0">
                <p className="tracking-wider truncate">{o.order_number}</p>
              </div>
              <div className="col-span-3 min-w-0">
                <p className="text-[14px] truncate">{o.customer_name}</p>
                <p className="text-[12px] text-muted font-mono truncate">{o.customer_phone}</p>
              </div>
              <div className="col-span-2">
                <Badge variant={STATUS[o.status as OrderStatus].tone}>
                  {STATUS[o.status as OrderStatus].text}
                </Badge>
              </div>
              <div className="col-span-2 font-mono text-[13px] whitespace-nowrap">
                {formatMYR(Number(o.total_amount))}
              </div>
              <div className="col-span-2 text-right text-[12px] text-muted flex items-center justify-end gap-1 min-w-0">
                <span className="truncate">{formatDate(o.created_at)}</span>
                <ArrowUpRight className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
