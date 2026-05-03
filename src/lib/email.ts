import nodemailer from 'nodemailer';
import { formatMYR } from '@/lib/utils';
import type { OcrResult, OrderStatus } from '@/lib/types';

type Item = {
  product_name: string;
  category: 'jersey' | 'jacket';
  size: string;
  quantity: number;
  subtotal: number;
  player_name: string | null;
  player_number: string | null;
  player_type: 'player' | 'non_player' | null;
  sleeve_type: 'short' | 'long' | null;
};

type OrderForEmail = {
  order_number: string;
  customer_name: string;
  customer_email: string | null;
  delivery_method: 'pickup' | 'delivery';
  delivery_address: string | null;
  total_amount: number;
  order_items: Item[];
};

let cachedTransport: nodemailer.Transporter | null = null;

function getTransport() {
  if (cachedTransport) return cachedTransport;
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) throw new Error('GMAIL_USER and GMAIL_APP_PASSWORD must be set');
  cachedTransport = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
  return cachedTransport;
}

const FROM_NAME = 'Suite Games 2026';
const BASE_STYLES = `
  body { margin: 0; background: #fafaf7; font-family: 'Inter', -apple-system, sans-serif; color: #0c0c0d; }
  .wrap { max-width: 560px; margin: 0 auto; padding: 32px 24px; }
  .card { background: #ffffff; border: 1px solid #e5e2da; padding: 32px; }
  h1 { font-family: 'Montserrat', sans-serif; font-weight: 800; letter-spacing: -0.02em; font-size: 28px; margin: 0; }
  .eyebrow { font-family: 'Roboto', sans-serif; text-transform: uppercase; letter-spacing: 0.18em; font-size: 11px; color: #6f6c66; }
  .pill { display: inline-block; padding: 4px 10px; font-family: 'Roboto', sans-serif; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; }
  .row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e2da; }
  .row:last-child { border-bottom: 0; }
  .muted { color: #6f6c66; }
  .mono { font-family: 'Roboto Mono', 'Courier New', monospace; }
  .total { font-size: 18px; font-weight: 600; padding-top: 16px; border-top: 1px solid #e5e2da; margin-top: 16px; }
  .button { display: inline-block; background: #0c0c0d; color: #ffffff; padding: 14px 24px; text-decoration: none; font-family: 'Inter', sans-serif; font-size: 14px; }
  .badge { background: #0c0c0d; color: #ffffff; padding: 4px 10px; font-family: 'Roboto Mono', monospace; font-size: 12px; }
  .name-tag { display: inline-block; background: #0c0c0d; color: #ffffff; padding: 4px 10px; font-family: 'Roboto Mono', monospace; font-size: 12px; margin-top: 6px; }
  .footer { color: #6f6c66; font-size: 12px; padding-top: 24px; text-align: center; }
`;

const STATUS_COPY: Record<OrderStatus, { title: string; body: string; tone: string }> = {
  pending_payment: {
    title: 'Awaiting your payment',
    body: 'We have received your order. Please complete the bank transfer and upload the receipt to confirm.',
    tone: '#b1361f',
  },
  verifying: {
    title: 'Receipt under review',
    body: 'We received your receipt. Our team will manually verify within 24 hours and email you the confirmation.',
    tone: '#b1361f',
  },
  paid: {
    title: 'Payment confirmed',
    body: 'Your payment has been verified. We will start preparing your order and notify you once it ships.',
    tone: '#0f5132',
  },
  shipped: {
    title: 'Your order has shipped',
    body: 'Your order is on its way. Tracking will be provided separately if applicable.',
    tone: '#0f5132',
  },
  completed: {
    title: 'Order completed',
    body: 'Your order is complete. Thank you for repping the team. See you on the court.',
    tone: '#0f5132',
  },
  rejected: {
    title: 'Order requires attention',
    body: 'Your receipt could not be verified. Please contact the admin or upload a clearer image.',
    tone: '#b1361f',
  },
  cancelled: {
    title: 'Order cancelled',
    body: 'This order has been cancelled. If this is unexpected, please contact the admin.',
    tone: '#b1361f',
  },
};

function renderItems(items: Item[]) {
  return items
    .map((it) => {
      const meta: string[] = [`Size ${it.size}`, `qty ${it.quantity}`];
      if (it.sleeve_type) meta.push(it.sleeve_type === 'short' ? 'Short sleeve' : 'Long sleeve');
      if (it.player_type) meta.push(it.player_type === 'player' ? 'Player' : 'Non-player');
      const tag = it.player_name
        ? `<div class="name-tag">${escapeHtml(it.player_name)} &middot; #${escapeHtml(it.player_number ?? '')}</div>`
        : '';
      return `
        <div class="row">
          <div>
            <div>${escapeHtml(it.product_name)}</div>
            <div class="eyebrow" style="margin-top:6px;">${meta.map(escapeHtml).join(' &middot; ')}</div>
            ${tag}
          </div>
          <div class="mono">${formatMYR(Number(it.subtotal))}</div>
        </div>
      `;
    })
    .join('');
}

function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function trackUrl(orderNumber: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://suite-marketplace.vercel.app';
  return `${base}/track?order=${encodeURIComponent(orderNumber)}`;
}

export async function sendOrderEmail(order: OrderForEmail, status: OrderStatus) {
  if (!order.customer_email) return;
  const copy = STATUS_COPY[status];
  const html = `
    <html>
      <head><style>${BASE_STYLES}</style></head>
      <body>
        <div class="wrap">
          <div class="eyebrow" style="margin-bottom:8px;">Suite Games 2026 / Volleyball UiTM KT</div>
          <h1>${copy.title}.</h1>
          <p class="muted" style="margin-top:12px; line-height:1.6;">${copy.body}</p>

          <div class="card" style="margin-top:24px;">
            <div class="eyebrow">Order</div>
            <div class="mono" style="font-size:18px; margin-top:6px; letter-spacing:0.08em;">${escapeHtml(order.order_number)}</div>
            <div class="pill" style="background:${copy.tone}; color:#ffffff; margin-top:10px;">${escapeHtml(status.replace('_', ' '))}</div>

            <div style="margin-top:24px;">${renderItems(order.order_items)}</div>

            <div class="total"><span class="muted">Total</span> <span class="mono" style="float:right;">${formatMYR(Number(order.total_amount))}</span></div>

            <p class="muted" style="margin-top:24px; line-height:1.6;">
              Delivery: ${order.delivery_method === 'pickup' ? 'Self pickup at UiTM KT' : escapeHtml(order.delivery_address ?? '')}
            </p>

            <a href="${trackUrl(order.order_number)}" class="button" style="margin-top:24px;">Track this order</a>
          </div>

          <p class="footer">
            Suite Games 2026 / VB UiTM Kuala Terengganu<br/>
            Made by <a href="https://hazimdev.com" style="color:#6f6c66;">hazimdev</a>
          </p>
        </div>
      </body>
    </html>
  `;

  await getTransport().sendMail({
    from: `"${FROM_NAME}" <${process.env.GMAIL_USER}>`,
    to: order.customer_email,
    subject: `[${order.order_number}] ${copy.title}`,
    html,
  });
}

type AdminReceiptPayload = {
  order_id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  total_amount: number;
  match: boolean;
  new_status: OrderStatus;
  ocr: OcrResult;
};

function adminUrl(orderId: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://suite-marketplace.vercel.app';
  return `${base}/admin/orders/${orderId}`;
}

export async function sendAdminReceiptEmail(payload: AdminReceiptPayload) {
  const to = process.env.ADMIN_EMAIL ?? 'hazim4128@gmail.com';
  const verdictLabel = payload.match ? 'Auto-matched' : 'Needs review';
  const verdictTone = payload.match ? '#0f5132' : '#b1361f';
  const detected = payload.ocr.detected_amount;
  const detectedAmount = detected != null ? formatMYR(detected) : 'Not detected';

  const fields: { k: string; v: string }[] = [
    { k: 'Order', v: payload.order_number },
    { k: 'Customer', v: payload.customer_name },
    { k: 'Phone', v: payload.customer_phone },
    { k: 'Email', v: payload.customer_email ?? 'Not provided' },
    { k: 'Total expected', v: formatMYR(Number(payload.total_amount)) },
    { k: 'OCR amount', v: detectedAmount },
    { k: 'OCR recipient', v: payload.ocr.detected_recipient ?? 'Not detected' },
    { k: 'OCR reference', v: payload.ocr.detected_reference ?? 'Not detected' },
    { k: 'OCR bank', v: payload.ocr.detected_bank ?? 'Not detected' },
    { k: 'OCR date', v: payload.ocr.detected_date ?? 'Not detected' },
    { k: 'Confidence', v: payload.ocr.confidence },
    { k: 'Looks real', v: payload.ocr.is_likely_real ? 'Yes' : 'Suspect' },
    { k: 'New status', v: payload.new_status.replace('_', ' ') },
  ];

  const rows = fields
    .map(
      (f) => `
        <div class="row">
          <div class="muted">${escapeHtml(f.k)}</div>
          <div class="mono">${escapeHtml(f.v)}</div>
        </div>
      `,
    )
    .join('');

  const notes = payload.ocr.notes
    ? `<p class="muted" style="margin-top:18px; line-height:1.6;"><strong>Notes:</strong> ${escapeHtml(payload.ocr.notes)}</p>`
    : '';

  const html = `
    <html>
      <head><style>${BASE_STYLES}</style></head>
      <body>
        <div class="wrap">
          <div class="eyebrow" style="margin-bottom:8px;">Suite Games 2026 / Admin</div>
          <h1>Receipt uploaded.</h1>
          <p class="muted" style="margin-top:12px; line-height:1.6;">
            ${escapeHtml(payload.customer_name)} just uploaded a payment receipt for order
            <span class="mono">${escapeHtml(payload.order_number)}</span>.
          </p>

          <div class="card" style="margin-top:24px;">
            <div class="pill" style="background:${verdictTone}; color:#ffffff;">${verdictLabel}</div>
            <div style="margin-top:18px;">${rows}</div>
            ${notes}
            <a href="${adminUrl(payload.order_id)}" class="button" style="margin-top:24px;">Open in admin</a>
          </div>

          <p class="footer">
            Suite Games 2026 / Admin notification<br/>
            Made by <a href="https://hazimdev.com" style="color:#6f6c66;">hazimdev</a>
          </p>
        </div>
      </body>
    </html>
  `;

  await getTransport().sendMail({
    from: `"${FROM_NAME}" <${process.env.GMAIL_USER}>`,
    to,
    subject: `[Receipt] ${payload.order_number} / ${verdictLabel}`,
    html,
  });
}
