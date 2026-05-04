import Link from 'next/link';
import { Logo } from './logo';
import { CartPill } from './cart-pill';
import { SizeChartButton } from '@/components/product/size-chart';

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-canvas/85 backdrop-blur border-b border-line">
      <div className="bg-ink text-canvas">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 h-9 flex items-center justify-center text-center gap-3 sm:gap-5 overflow-hidden">
          <p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.18em] truncate">
            Order by <span className="text-flame-red font-semibold">20 May</span>
            <span className="opacity-40 mx-1.5">/</span>
            Pickup from <span className="text-gold font-semibold">30 May</span>
            <span className="opacity-40 mx-1.5">/</span>
            Suite Games <span className="text-flame-purple font-semibold">11.12.13 June</span>
          </p>
        </div>
      </div>
      <div className="h-1 flame-gradient" />
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <span className="eyebrow hidden sm:inline-block">Suit up.</span>
        </div>
        <nav className="flex items-center gap-5 sm:gap-7 text-[13px] font-heading">
          <Link href="/jerseys" className="hover:text-flame-red transition-colors">
            Jerseys
          </Link>
          <SizeChartButton />
          <Link
            href="/track"
            className="hover:text-flame-red transition-colors hidden sm:inline"
          >
            Track
          </Link>
          <CartPill />
        </nav>
      </div>
    </header>
  );
}
