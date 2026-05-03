'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Minus, Plus, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/lib/cart';
import { formatMYR } from '@/lib/utils';
import { Input, Label, Textarea } from '@/components/ui/input';
import { SHIPPING_FEE } from '@/lib/checkout';

type Step = 'review' | 'details' | 'payment';

type CustomerForm = {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  delivery_method: 'pickup' | 'delivery';
  delivery_address: string;
};

const BANK = {
  name: process.env.NEXT_PUBLIC_BANK_NAME ?? 'BANK ISLAM',
  account: process.env.NEXT_PUBLIC_BANK_ACCOUNT ?? '13053024661322',
  holder: process.env.NEXT_PUBLIC_BANK_HOLDER ?? 'MUHAMMAD HAZIM',
};

export function CheckoutClient() {
  const router = useRouter();
  const { items, setQty, remove, subtotal, ready, clear } = useCart();
  const [step, setStep] = useState<Step>('review');

  const [form, setForm] = useState<CustomerForm>({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    delivery_method: 'pickup',
    delivery_address: '',
  });

  const [creating, setCreating] = useState(false);
  const [order, setOrder] = useState<{ id: string; order_number: string; total_amount: number } | null>(
    null,
  );
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<
    | { match: boolean; status: string; ocr: { notes?: string } }
    | null
  >(null);

  const shipping = form.delivery_method === 'delivery' ? SHIPPING_FEE : 0;
  const total = subtotal + shipping;

  const canProceedDetails = useMemo(() => {
    if (form.customer_name.trim().length < 2) return false;
    if (form.customer_phone.replace(/\s|-/g, '').length < 8) return false;
    if (form.delivery_method === 'delivery' && form.delivery_address.trim().length < 10) return false;
    return true;
  }, [form]);

  if (!ready) {
    return (
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 pt-16 pb-32 text-muted">Loading…</div>
    );
  }

  if (items.length === 0 && !order) {
    return (
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 pt-12 pb-32">
        <p className="eyebrow">Checkout · empty</p>
        <h1 className="h-display text-[56px] md:text-[80px] mt-4">No jerseys yet.</h1>
        <p className="mt-6 text-muted max-w-md">
          Pilih jersey dulu — tiga campus tunggu kau pakai colors diorang.
        </p>
        <Link
          href="/jerseys"
          className="mt-10 inline-flex bg-ink text-canvas h-12 px-6 items-center gap-2 hover:bg-accent transition-colors"
        >
          Browse the drop <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
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
          customer_email: form.customer_email || undefined,
          delivery_method: form.delivery_method,
          delivery_address: form.delivery_address,
          items: items.map((i) => ({
            productId: i.productId,
            size: i.size,
            quantity: i.quantity,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed');
      setOrder(json);
      setStep('payment');
      toast.success(`Order created · ${json.order_number}`);
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
      if (json.match) {
        toast.success('Payment verified ');
        clear();
      } else {
        toast.message('Receipt received — pending manual review');
      }
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
        className="inline-flex items-center gap-2 text-[13px] text-muted hover:text-ink mb-6"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} /> Continue shopping
      </Link>

      <div className="grid grid-cols-12 gap-6 mb-10 items-end">
        <div className="col-span-12 md:col-span-7">
          <p className="eyebrow">Step {step === 'review' ? '01' : step === 'details' ? '02' : '03'} of 03</p>
          <h1 className="h-display text-[48px] md:text-[80px] mt-3">
            {step === 'review' && 'Your bag.'}
            {step === 'details' && 'Where to?'}
            {step === 'payment' && 'Pay & confirm.'}
          </h1>
        </div>
        <div className="col-span-12 md:col-span-5 hidden md:flex items-center gap-2 md:justify-end text-[12px] font-mono uppercase tracking-[0.16em] text-muted">
          <Stepper active={step} step="review" label="01 Bag" />
          <span className="text-line"></span>
          <Stepper active={step} step="details" label="02 Details" />
          <span className="text-line"></span>
          <Stepper active={step} step="payment" label="03 Pay" />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-10 lg:gap-16">
        <div className="col-span-12 lg:col-span-7">
          {step === 'review' && (
            <div className="border border-line">
              {items.map((i) => (
                <div
                  key={`${i.productId}-${i.size}`}
                  className="flex gap-5 p-5 border-b border-line last:border-b-0"
                >
                  <div className="relative w-24 h-28 bg-paper border border-line shrink-0">
                    <Image src={i.image_url} alt={i.name} fill className="object-cover" sizes="96px" />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[15px]">{i.name}</p>
                        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted mt-1">
                          Size {i.size}
                        </p>
                      </div>
                      <p className="font-mono text-[14px]">{formatMYR(i.unit_price * i.quantity)}</p>
                    </div>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="inline-flex border border-line">
                        <button
                          type="button"
                          onClick={() => setQty(i.productId, i.size, i.quantity - 1)}
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
                          onClick={() => setQty(i.productId, i.size, i.quantity + 1)}
                          className="w-8 h-8 inline-flex items-center justify-center hover:bg-paper"
                          aria-label="Increase"
                        >
                          <Plus className="w-3 h-3" strokeWidth={1.5} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(i.productId, i.size)}
                        className="text-muted hover:text-accent text-[12px] inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <Label>Full name</Label>
                  <Input
                    placeholder="Muhammad Hazim"
                    value={form.customer_name}
                    onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Phone (Malaysia)</Label>
                  <Input
                    placeholder="012-345 6789"
                    value={form.customer_phone}
                    onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Email (optional)</Label>
                <Input
                  type="email"
                  placeholder="you@example.my"
                  value={form.customer_email}
                  onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
                />
              </div>

              <div>
                <Label>Delivery method</Label>
                <div className="grid grid-cols-2 gap-px bg-line border border-line">
                  {(['pickup', 'delivery'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setForm({ ...form, delivery_method: m })}
                      className={`p-5 text-left transition-colors ${
                        form.delivery_method === m ? 'bg-ink text-canvas' : 'bg-canvas hover:bg-paper'
                      }`}
                    >
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em]">
                        {m === 'pickup' ? '01 / Free' : `02 / +${formatMYR(SHIPPING_FEE)}`}
                      </p>
                      <p className="text-[15px] mt-2">
                        {m === 'pickup' ? 'Self pickup · Dungun' : 'Courier · Semenanjung MY'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {form.delivery_method === 'delivery' && (
                <div>
                  <Label>Delivery address</Label>
                  <Textarea
                    placeholder="No. 12, Jalan ... Bandar ... Poskod ... Negeri"
                    value={form.delivery_address}
                    onChange={(e) => setForm({ ...form, delivery_address: e.target.value })}
                  />
                </div>
              )}
            </div>
          )}

          {step === 'payment' && order && (
            <div className="space-y-8">
              <div className="border border-line p-6 lg:p-8">
                <p className="eyebrow">Order</p>
                <p className="font-mono text-2xl mt-2 tracking-wider">{order.order_number}</p>
                <div className="mt-6 grid grid-cols-2 gap-y-4 text-[13px]">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                      Bank
                    </p>
                    <p className="mt-1">{BANK.name}</p>
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
                    <p className="mt-1">{BANK.holder}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                      Amount
                    </p>
                    <p className="mt-1 font-mono">{formatMYR(Number(order.total_amount))}</p>
                  </div>
                </div>
              </div>

              <div className="border border-line p-6 lg:p-8 bg-paper flex flex-col items-center text-center">
                <p className="eyebrow">Or scan DuitNow QR</p>
                <div className="relative w-56 h-56 mt-4 bg-canvas border border-line">
                  <Image src="/branding/qr_code.png" alt="DuitNow QR" fill className="object-contain p-3" />
                </div>
                <p className="mt-4 text-[13px] text-muted max-w-xs">
                  Scan with any Malaysian banking app, transfer the exact amount, then upload the
                  receipt below.
                </p>
              </div>

              <div className="border border-line p-6 lg:p-8">
                <p className="eyebrow">Upload receipt</p>
                <p className="text-[13px] text-muted mt-2">
                  Screenshot or photo of the transfer confirmation. We auto-verify with AI.
                </p>

                <label className="mt-5 border border-dashed border-line hover:border-ink p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors">
                  <Upload className="w-6 h-6 text-muted" strokeWidth={1.5} />
                  <p className="mt-3 text-[14px]">
                    {uploading ? 'Verifying with Gemini…' : 'Click to choose an image'}
                  </p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                    JPG · PNG · WEBP · max 8MB
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadReceipt(f);
                    }}
                  />
                </label>

                {uploadResult && (
                  <div
                    className={`mt-5 border p-5 ${
                      uploadResult.match ? 'border-[#0f5132]' : 'border-accent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Check
                        className={`w-4 h-4 ${uploadResult.match ? 'text-[#0f5132]' : 'text-accent'}`}
                        strokeWidth={2}
                      />
                      <p className="font-mono text-[11px] uppercase tracking-[0.16em]">
                        {uploadResult.match
                          ? 'Verified — payment confirmed'
                          : 'Pending manual review'}
                      </p>
                    </div>
                    <p className="mt-3 text-[13px] text-muted">
                      {uploadResult.match
                        ? 'Your order is paid. We will update tracking once shipped.'
                        : uploadResult.ocr.notes ||
                          'Receipt did not auto-match — admin will verify manually within 24h.'}
                    </p>
                    <Link
                      href={`/track?order=${order.order_number}`}
                      className="mt-4 inline-flex items-center gap-2 text-[13px] hover:text-accent"
                    >
                      Track order <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                    </Link>
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
              <Row
                k={`Shipping (${form.delivery_method})`}
                v={shipping ? formatMYR(shipping) : 'FREE'}
              />
              <div className="border-t border-line pt-3 mt-3">
                <Row k={<span className="text-[15px]">Total</span>} v={
                  <span className="text-[15px] font-mono">{formatMYR(total)}</span>
                } />
              </div>
            </div>

            {step === 'review' && (
              <button
                type="button"
                onClick={() => setStep('details')}
                disabled={items.length === 0}
                className="mt-8 w-full bg-ink text-canvas h-13 py-4 inline-flex items-center justify-between px-5 hover:bg-accent transition-colors disabled:opacity-50"
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
                  className="w-full bg-ink text-canvas py-4 inline-flex items-center justify-between px-5 hover:bg-accent transition-colors disabled:opacity-50"
                >
                  {creating ? 'Creating…' : 'Continue to payment'}
                  <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  onClick={() => setStep('review')}
                  className="w-full border border-line py-3 hover:border-ink text-[14px]"
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
                  className="w-full border border-line py-3 hover:border-ink text-[14px]"
                >
                  Track this order
                </button>
              </div>
            )}

            <p className="mt-6 text-[12px] text-muted leading-relaxed">
              Bank-transfer payment, AI-verified via Gemini OCR. If the receipt fails auto-match,
              admin reviews manually within 24h.
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
