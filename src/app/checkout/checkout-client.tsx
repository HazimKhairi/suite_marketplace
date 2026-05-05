'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, MessageCircle, Minus, Plus, RotateCcw, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/lib/cart';
import { formatMYR } from '@/lib/utils';
import { effectiveUnitPrice, surchargeLabel } from '@/lib/pricing';
import { Input, Label } from '@/components/ui/input';
import { ORG_CONTACT } from '@/lib/teams';
import { BuiltByBadge } from '@/components/site/built-by';

type Step = 'review' | 'details' | 'payment';

type CustomerForm = {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
};

const BANK = {
  name: process.env.NEXT_PUBLIC_BANK_NAME ?? 'BANK ISLAM',
  account: process.env.NEXT_PUBLIC_BANK_ACCOUNT ?? '13053024661322',
  holder: process.env.NEXT_PUBLIC_BANK_HOLDER ?? 'MUHAMMAD HAZIM',
};

// Pending-order persistence — survives a tab kill while the user is in the QR
// banking app. Window is generous so a slow payment doesn't drop the upload.
const PENDING_ORDER_KEY = 'suite_pending_order_v1';
const PENDING_ORDER_TTL_MS = 60 * 60 * 1000;

type PendingOrder = { id: string; order_number: string; total_amount: number; ts: number };

function readPendingOrder(): PendingOrder | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PENDING_ORDER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingOrder;
    if (!parsed?.id || Date.now() - (parsed.ts ?? 0) > PENDING_ORDER_TTL_MS) {
      localStorage.removeItem(PENDING_ORDER_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writePendingOrder(o: { id: string; order_number: string; total_amount: number }) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      PENDING_ORDER_KEY,
      JSON.stringify({ ...o, ts: Date.now() } satisfies PendingOrder),
    );
  } catch {
    // ignore quota / privacy mode
  }
}

function clearPendingOrder() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(PENDING_ORDER_KEY);
  } catch {
    // ignore
  }
}

function formatRelative(ts: number) {
  const diffMin = Math.max(0, Math.floor((Date.now() - ts) / 60000));
  if (diffMin < 1) return 'just now';
  if (diffMin === 1) return '1 minute ago';
  if (diffMin < 60) return `${diffMin} minutes ago`;
  return 'over an hour ago';
}

export function CheckoutClient() {
  const router = useRouter();
  const { items, setQty, remove, subtotal, ready, clear } = useCart();
  const [step, setStep] = useState<Step>('review');

  const [form, setForm] = useState<CustomerForm>({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
  });

  const [creating, setCreating] = useState(false);
  const [order, setOrder] = useState<{ id: string; order_number: string; total_amount: number } | null>(
    null,
  );
  const [resumedAt, setResumedAt] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<
    | {
        status: string;
        attempts_used: number;
        attempts_remaining: number;
      }
    | null
  >(null);

  const MAX_RECEIPT_ATTEMPTS = 5;

  // On mount: if user was halfway through a payment (e.g. switched to banking app and the
  // mobile browser killed the tab), pick the order back up at the upload step.
  useEffect(() => {
    if (!ready || order) return;
    const pending = readPendingOrder();
    if (!pending) return;
    setOrder({
      id: pending.id,
      order_number: pending.order_number,
      total_amount: pending.total_amount,
    });
    setResumedAt(pending.ts);
    setStep('payment');
  }, [ready, order]);

  const total = subtotal;

  const detailIssues = useMemo(() => {
    const issues: string[] = [];
    if (form.customer_name.trim().length < 2) issues.push('full name');
    if (form.customer_phone.replace(/\s|-/g, '').length < 8) issues.push('phone');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customer_email.trim())) issues.push('email');
    return issues;
  }, [form]);

  const canProceedDetails = detailIssues.length === 0;

  if (!ready) {
    return (
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 pt-16 pb-32 text-muted">Loading.</div>
    );
  }

  if (items.length === 0 && !order) {
    return (
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 pt-12 pb-32">
        <p className="eyebrow">Checkout / empty</p>
        <h1 className="h-display text-[56px] md:text-[96px] mt-4">Your cart is empty.</h1>
        <p className="mt-6 body-lede text-muted max-w-md">
          Pick a jersey first. Short sleeve or long sleeve, drop your name on the back, smash on.
        </p>
        <Link
          href="/jerseys"
          className="mt-10 inline-flex bg-ink text-canvas h-12 px-6 items-center gap-2 hover:bg-flame-red transition-colors font-heading"
        >
          Browse jerseys <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
        </Link>
      </div>
    );
  }

  async function createOrder() {
    setCreating(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          customer_name: form.customer_name,
          customer_phone: form.customer_phone,
          customer_email: form.customer_email,
          items: items.map((i) => ({
            productId: i.productId,
            size: i.size,
            quantity: i.quantity,
            player_name: i.player_name,
            player_number: i.player_number,
            player_type: i.player_type,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed');
      setOrder(json);
      writePendingOrder(json);
      setStep('payment');
      toast.success(`Order created. ${json.order_number}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create order');
    } finally {
      setCreating(false);
    }
  }

  async function uploadReceipt(file: File) {
    if (!order) return;
    setUploading(true);
    setUploadResult(null);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch(`/api/orders/${order.id}/receipt`, { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Upload failed');
      setUploadResult(json);
      toast.success('Receipt received. Pending admin review.');
      clear();
      clearPendingOrder();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-[1440px] mx-auto px-6 lg:px-10 pt-10 pb-32">
      <Link
        href="/jerseys"
        className="inline-flex items-center gap-2 text-[13px] text-muted hover:text-flame-red mb-6"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} /> Continue shopping
      </Link>

      <div className="grid grid-cols-12 gap-6 mb-10 items-end">
        <div className="col-span-12 md:col-span-7">
          <p className="eyebrow">
            Step {step === 'review' ? '01' : step === 'details' ? '02' : '03'} of 03
          </p>
          <h1 className="h-display text-[48px] md:text-[96px] mt-3">
            {step === 'review' && 'Your bag.'}
            {step === 'details' && 'Your details.'}
            {step === 'payment' && 'Pay and confirm.'}
          </h1>
        </div>
        <div className="col-span-12 md:col-span-5 hidden md:flex items-center gap-2 md:justify-end text-[12px] font-mono uppercase tracking-[0.16em] text-muted">
          <Stepper active={step} step="review" label="01 Bag" />
          <span>/</span>
          <Stepper active={step} step="details" label="02 Details" />
          <span>/</span>
          <Stepper active={step} step="payment" label="03 Pay" />
        </div>
      </div>

      {resumedAt && order && !uploadResult && (
        <div className="mb-8 border border-flame-purple bg-flame-purple/5 px-5 py-4 flex items-start sm:items-center gap-4 flex-wrap">
          <RotateCcw className="w-4 h-4 text-flame-purple shrink-0 mt-0.5 sm:mt-0" strokeWidth={1.5} />
          <div className="flex-1 min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-flame-purple">
              Resuming order {order.order_number}
            </p>
            <p className="mt-1 text-[13px] body-lede text-ink-soft">
              Started {formatRelative(resumedAt)}. Finish payment and upload your receipt below — your
              order is held in our system.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              clearPendingOrder();
              setOrder(null);
              setResumedAt(null);
              setStep('review');
              setSelectedFile(null);
              setUploadResult(null);
            }}
            className="text-[12px] font-mono uppercase tracking-[0.14em] text-muted hover:text-flame-red transition-colors"
          >
            Start fresh →
          </button>
        </div>
      )}

      <div className="grid grid-cols-12 gap-10 lg:gap-16">
        <div className="col-span-12 lg:col-span-7">
          {step === 'review' && (
            <div className="border border-line">
              {items.map((i) => {
                const eff = effectiveUnitPrice(i.unit_price, i.size, i.category);
                return (
                  <div
                    key={i.lineId}
                    className="flex gap-5 p-5 border-b border-line last:border-b-0"
                  >
                    <div className="relative w-24 h-28 bg-paper border border-line shrink-0">
                      <Image
                        src={i.image_url}
                        alt={i.name}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    </div>
                    <div className="flex-1 flex flex-col">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-[15px] font-heading font-semibold">{i.name}</p>
                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                            <span>Size {i.size}</span>
                            {i.sleeve_type && (
                              <span>
                                /{' '}
                                {i.sleeve_type === 'short'
                                  ? 'Short sleeve'
                                  : 'Long sleeve'}
                              </span>
                            )}
                            {i.player_type && (
                              <span>
                                / {i.player_type === 'player' ? 'Player' : 'Non player'}
                              </span>
                            )}
                          </div>
                          {i.player_name && (
                            <p className="mt-2 inline-block bg-ink text-canvas px-3 py-1 font-mono text-[12px]">
                              {i.player_name}
                              <span className="opacity-60 mx-1">/</span>#{i.player_number}
                            </p>
                          )}
                          {surchargeLabel(i.size, i.category) && (
                            <p className="mt-2 text-[11px] font-mono text-flame-red">
                              {i.size} surcharge {surchargeLabel(i.size, i.category)}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-[14px]">{formatMYR(eff * i.quantity)}</p>
                          <p className="font-mono text-[10px] text-muted">
                            {formatMYR(eff)} each
                          </p>
                        </div>
                      </div>
                      <div className="mt-auto flex items-center justify-between">
                        <div className="inline-flex border border-line">
                          <button
                            type="button"
                            onClick={() => setQty(i.lineId, i.quantity - 1)}
                            className="w-8 h-8 inline-flex items-center justify-center hover:bg-paper"
                            aria-label="Decrease"
                          >
                            <Minus className="w-3 h-3" strokeWidth={1.5} />
                          </button>
                          <span className="w-10 h-8 inline-flex items-center justify-center font-mono text-[12px] border-x border-line">
                            {i.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => setQty(i.lineId, i.quantity + 1)}
                            className="w-8 h-8 inline-flex items-center justify-center hover:bg-paper"
                            aria-label="Increase"
                          >
                            <Plus className="w-3 h-3" strokeWidth={1.5} />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(i.lineId)}
                          className="text-muted hover:text-flame-red text-[12px] inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <Label>Full name (orderer)</Label>
                  <Input
                    placeholder="e.g. Aiman bin Abdullah"
                    value={form.customer_name}
                    onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Phone (Malaysia)</Label>
                  <Input
                    placeholder="012 345 6789"
                    value={form.customer_phone}
                    onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Email (required for order updates)</Label>
                <Input
                  type="email"
                  placeholder="you@example.my"
                  value={form.customer_email}
                  onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
                />
                <p className="mt-2 text-[12px] text-muted body-lede">
                  We will email your confirmation, payment status, and order updates here.
                </p>
              </div>

              <div>
                <Label>Pickup</Label>
                <div className="border border-line p-5 bg-paper">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                    01 / Free
                  </p>
                  <p className="text-[15px] mt-2 font-heading font-semibold">
                    Self pickup at UiTM KT
                  </p>
                  <p className="mt-2 body-lede text-[13px] text-muted">
                    Collect on campus once your order is ready. We will email the pickup window.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 'payment' && order && (
            <div className="space-y-8">
              <div className="border border-line p-6 lg:p-8">
                <p className="eyebrow">Order</p>
                <p className="font-mono text-xl sm:text-2xl mt-2 tracking-wider break-all">
                  {order.order_number}
                </p>
                <div className="mt-6 grid grid-cols-2 gap-y-4 text-[13px]">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                      Bank
                    </p>
                    <p className="mt-1 font-heading">{BANK.name}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                      Account
                    </p>
                    <p className="mt-1 font-mono">{BANK.account}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                      Holder
                    </p>
                    <p className="mt-1 font-heading">{BANK.holder}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                      Amount
                    </p>
                    <p className="mt-1 font-mono">{formatMYR(Number(order.total_amount))}</p>
                  </div>
                </div>
              </div>

              <div className="border border-line p-6 lg:p-10 bg-paper flex flex-col items-center text-center">
                <p className="eyebrow">Or scan DuitNow QR</p>
                <div className="relative mt-8 w-full max-w-[480px]">
                  <div className="relative aspect-square w-full bg-canvas border border-line p-3 sm:p-5">
                    <Image
                      src="/branding/qr_code.png"
                      alt="DuitNow QR"
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 90vw, 480px"
                    />
                  </div>
                  <span
                    className="absolute -top-4 -right-3 sm:-top-5 sm:-right-5 bg-flame-red text-canvas px-4 py-2 font-mono text-[11px] sm:text-[12px] uppercase tracking-[0.22em] -rotate-[8deg] shadow-[0_8px_24px_rgba(12,12,13,0.22)] select-none"
                  >
                    Scan me to pay
                  </span>
                </div>
                <p className="mt-8 body-lede text-[13px] text-muted max-w-sm">
                  Scan with any banking app, transfer the exact amount, then upload the receipt
                  below.
                </p>
              </div>

              <div className="border border-line p-6 lg:p-8">
                <p className="eyebrow">Upload receipt</p>
                <p className="mt-2 body-lede text-[13px] text-muted">
                  Screenshot or photo of the transfer confirmation. Pick the file, then hit{' '}
                  <em>Pay now</em> to verify.
                </p>

                {!uploadResult && (
                  <>
                    <label
                      className={`mt-5 border border-dashed p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                        selectedFile
                          ? 'border-ink bg-paper'
                          : 'border-line hover:border-ink'
                      }`}
                    >
                      <Upload className="w-6 h-6 text-muted" strokeWidth={1.5} />
                      <p className="mt-3 text-[14px] font-heading break-all px-4">
                        {selectedFile
                          ? selectedFile.name
                          : 'Click to choose your receipt image'}
                      </p>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                        {selectedFile
                          ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB · tap to swap`
                          : 'JPG, PNG, WEBP. Max 8 MB.'}
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploading}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) setSelectedFile(f);
                        }}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => selectedFile && uploadReceipt(selectedFile)}
                      disabled={!selectedFile || uploading}
                      className="mt-5 w-full bg-ink text-canvas h-14 inline-flex items-center justify-between px-5 hover:bg-flame-red transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-heading font-semibold"
                    >
                      <span className="text-[15px]">
                        {uploading
                          ? 'Sending receipt'
                          : selectedFile
                            ? `Pay now / ${formatMYR(Number(order.total_amount))}`
                            : 'Pay now'}
                      </span>
                      <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                    {!selectedFile && !uploading && (
                      <p className="mt-2 text-[12px] font-mono uppercase tracking-[0.14em] text-muted">
                        Pick a receipt image to enable Pay now
                      </p>
                    )}
                  </>
                )}

                {uploadResult && (
                  <div className="mt-5 border border-leaf bg-leaf/5 p-6">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-leaf" strokeWidth={2} />
                      <p className="font-mono text-[11px] uppercase tracking-[0.16em]">
                        Receipt received. Pending admin review.
                      </p>
                    </div>
                    <p className="mt-3 body-lede text-[14px] text-ink-soft">
                      The admin verifies every receipt against the uploaded image and will email
                      you the confirmation, usually within 24 hours. Use the order number to track
                      the status anytime.
                    </p>
                    <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                      Attempt {uploadResult.attempts_used} of {MAX_RECEIPT_ATTEMPTS}
                      {uploadResult.attempts_remaining > 0
                        ? ` · ${uploadResult.attempts_remaining} retry${
                            uploadResult.attempts_remaining === 1 ? '' : 's'
                          } left if you uploaded the wrong file`
                        : ' · No retries left'}
                    </p>

                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                      <Link
                        href={`/track?order=${order.order_number}`}
                        className="inline-flex items-center justify-center gap-2 bg-ink text-canvas h-12 px-6 hover:bg-flame-red transition-colors text-[14px] font-heading font-semibold"
                      >
                        Track order
                        <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                      </Link>
                      {uploadResult.attempts_remaining > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setUploadResult(null);
                            setSelectedFile(null);
                          }}
                          className="inline-flex items-center justify-center gap-2 border border-line h-12 px-6 hover:border-ink transition-colors text-[14px] font-heading"
                        >
                          <Upload className="w-4 h-4" strokeWidth={1.5} />
                          Upload a different file
                        </button>
                      )}
                    </div>

                    <div className="mt-5 pt-5 border-t border-leaf/30">
                      <p className="text-[12px] text-muted body-lede">
                        Wrong file or transfer issue?{' '}
                        <a
                          href={`${ORG_CONTACT.whatsappUrl}?text=${encodeURIComponent(
                            `Hi admin, I just uploaded a receipt for order ${order.order_number}. Need help with payment verification.`,
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-flame-red hover:text-ink inline-flex items-center gap-1"
                        >
                          WhatsApp the admin
                          <MessageCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </a>
                      </p>
                    </div>

                    <div className="mt-6 pt-5 border-t border-leaf/30 flex items-center justify-between flex-wrap gap-3">
                      <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted">
                        Need a marketplace like this?
                      </p>
                      <BuiltByBadge />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="col-span-12 lg:col-span-5">
          <div className="border border-line p-6 lg:p-8 sticky top-24">
            <p className="eyebrow">Summary</p>
            <div className="mt-6 space-y-3 text-[14px]">
              <Row k="Subtotal" v={formatMYR(subtotal)} />
              <Row k="Pickup at UiTM KT" v="FREE" />
              <div className="border-t border-line pt-3 mt-3">
                <Row
                  k={<span className="text-[15px] font-heading">Total</span>}
                  v={<span className="text-[15px] font-mono">{formatMYR(total)}</span>}
                />
              </div>
            </div>

            {step === 'review' && (
              <button
                type="button"
                onClick={() => setStep('details')}
                disabled={items.length === 0}
                className="mt-8 w-full bg-ink text-canvas py-4 inline-flex items-center justify-between px-5 hover:bg-flame-red transition-colors disabled:opacity-50 font-heading font-semibold"
              >
                Continue <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </button>
            )}

            {step === 'details' && (
              <div className="mt-8 space-y-2">
                <button
                  type="button"
                  onClick={createOrder}
                  disabled={!canProceedDetails || creating}
                  className="w-full bg-ink text-canvas py-4 inline-flex items-center justify-between px-5 hover:bg-flame-red transition-colors disabled:opacity-50 font-heading font-semibold"
                >
                  {creating ? 'Creating' : 'Continue to payment'}
                  <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </button>
                {!canProceedDetails && !creating && (
                  <p className="text-[12px] font-mono uppercase tracking-[0.14em] text-flame-red">
                    Missing {detailIssues.join(', ')}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setStep('review')}
                  className="w-full border border-line py-3 hover:border-ink text-[14px] font-heading"
                >
                  Back to bag
                </button>
              </div>
            )}

            {step === 'payment' && order && (
              <div className="mt-8 space-y-2">
                <button
                  type="button"
                  onClick={() => router.push(`/track?order=${order.order_number}`)}
                  className="w-full border border-line py-3 hover:border-ink text-[14px] font-heading"
                >
                  Track this order
                </button>
              </div>
            )}

            <p className="mt-6 body-lede text-[12px] text-muted">
              Bank transfer with AI receipt verification. If auto match fails, the admin verifies
              within 24 hours and emails the result.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: React.ReactNode; v: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-muted">{k}</span>
      <span>{v}</span>
    </div>
  );
}

function Stepper({ active, step, label }: { active: Step; step: Step; label: string }) {
  const order: Step[] = ['review', 'details', 'payment'];
  const isPast = order.indexOf(active) > order.indexOf(step);
  const isActive = active === step;
  return (
    <span
      className={`px-2 py-1 ${
        isActive ? 'text-ink' : isPast ? 'text-muted line-through' : 'text-muted'
      }`}
    >
      {label}
    </span>
  );
}
