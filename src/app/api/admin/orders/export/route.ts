import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/server';
import type { OrderStatus } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALL_STATUSES: OrderStatus[] = [
  'pending_payment',
  'verifying',
  'paid',
  'shipped',
  'completed',
  'rejected',
  'cancelled',
];

function csvEscape(value: unknown): string {
  if (value == null) return '';
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

type ProductJoin = { color: string | null } | { color: string | null }[] | null;

type OrderItemRow = {
  product_name: string;
  sleeve_type: 'short' | 'long' | null;
  size: string;
  quantity: number;
  unit_price: number | string;
  subtotal: number | string;
  player_name: string | null;
  player_number: string | null;
  player_type: 'player' | 'non_player' | null;
  products: ProductJoin;
};

type OrderRow = {
  order_number: string;
  status: OrderStatus;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  total_amount: number | string;
  admin_note: string | null;
  order_items: OrderItemRow[];
};

function getColor(p: ProductJoin): string {
  if (!p) return '';
  if (Array.isArray(p)) return p[0]?.color ?? '';
  return p.color ?? '';
}

export async function GET(req: NextRequest) {
  await requireAdmin();

  const url = new URL(req.url);
  const statusParam = url.searchParams.get('status');
  const status = statusParam && ALL_STATUSES.includes(statusParam as OrderStatus)
    ? (statusParam as OrderStatus)
    : null;

  const supabase = createAdminClient();
  let query = supabase
    .from('orders')
    .select(
      `order_number, status, created_at, customer_name, customer_phone, customer_email,
       total_amount, admin_note,
       order_items(product_name, sleeve_type, size, quantity, unit_price, subtotal,
                   player_name, player_number, player_type,
                   products(color))`,
    )
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const orders = (data ?? []) as unknown as OrderRow[];

  const headers = [
    'order_number',
    'status',
    'created_at',
    'customer_name',
    'customer_phone',
    'customer_email',
    'product',
    'color',
    'sleeve',
    'size',
    'qty',
    'unit_price_myr',
    'line_subtotal_myr',
    'player_name',
    'player_number',
    'player_type',
    'order_total_myr',
    'admin_note',
  ];

  const rows: string[] = [headers.join(',')];

  for (const o of orders) {
    if (!o.order_items || o.order_items.length === 0) {
      // Defensive fallback so an order without items still surfaces in the export.
      rows.push(
        [
          o.order_number,
          o.status,
          o.created_at,
          o.customer_name,
          o.customer_phone,
          o.customer_email ?? '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          Number(o.total_amount).toFixed(2),
          o.admin_note ?? '',
        ]
          .map(csvEscape)
          .join(','),
      );
      continue;
    }
    for (const item of o.order_items) {
      rows.push(
        [
          o.order_number,
          o.status,
          o.created_at,
          o.customer_name,
          o.customer_phone,
          o.customer_email ?? '',
          item.product_name,
          getColor(item.products),
          item.sleeve_type ?? '',
          item.size,
          item.quantity,
          Number(item.unit_price).toFixed(2),
          Number(item.subtotal).toFixed(2),
          item.player_name ?? '',
          item.player_number ?? '',
          item.player_type ?? '',
          Number(o.total_amount).toFixed(2),
          o.admin_note ?? '',
        ]
          .map(csvEscape)
          .join(','),
      );
    }
  }

  // Excel needs a UTF-8 BOM to render non-ASCII characters (Malay names with accents) correctly.
  const csv = '﻿' + rows.join('\r\n');
  const stamp = new Date().toISOString().slice(0, 10);
  const suffix = status ? `-${status}` : '';
  const filename = `suite-orders${suffix}-${stamp}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
