import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PICKUP_DATE, PICKUP_LOCATION } from '@/lib/sales';

type Props = {
  variant?: 'block' | 'compact';
};

export function SalesClosedNotice({ variant = 'block' }: Props) {
  if (variant === 'compact') {
    return (
      <div className="border border-flame-red bg-flame-red/5 px-5 py-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-flame-red">
          Pembelian ditutup
        </p>
        <p className="mt-2 text-[13px] body-lede text-ink-soft">
          Self pickup opens {PICKUP_DATE} at {PICKUP_LOCATION}. Bring your payment receipt and order
          reference number. Track your order below. Terima kasih sudi membeli.
        </p>
        <Link
          href="/track"
          className="mt-4 inline-flex items-center gap-2 bg-ink text-canvas h-11 px-5 hover:bg-flame-red transition-colors text-[13px] font-heading font-semibold"
        >
          Track your order
          <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
        </Link>
      </div>
    );
  }

  return (
    <section className="border border-line bg-paper">
      <div className="p-8 lg:p-12">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-flame-red">
          Drop closed
        </p>
        <p className="mt-5 font-display font-extrabold text-[44px] sm:text-[64px] leading-[0.95]">
          Pembelian telah ditutup.
        </p>
        <p className="mt-6 body-lede text-[16px] text-ink-soft max-w-2xl">
          Self pickup opens {PICKUP_DATE} at {PICKUP_LOCATION}. Bring your payment receipt and order
          reference number to collect your kit.
        </p>
        <p className="mt-3 body-lede text-[15px] text-muted max-w-2xl">
          Already paid? Check your order status anytime below. Terima kasih sudi membeli.
        </p>
        <Link
          href="/track"
          className="mt-8 inline-flex items-center gap-3 bg-ink text-canvas h-14 px-8 hover:bg-flame-red transition-colors text-[15px] font-heading font-semibold"
        >
          Track your order
          <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
        </Link>
      </div>
    </section>
  );
}
