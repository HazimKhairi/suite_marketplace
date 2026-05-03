import Link from 'next/link';
import { CartPill } from './cart-pill';

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-canvas/85 backdrop-blur border-b border-line">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <span className="font-display text-2xl leading-none">Suite</span>
          <span className="eyebrow hidden sm:inline-block translate-y-[1px]">
            VB · UiTM KT
          </span>
        </Link>
        <nav className="flex items-center gap-7 text-[13px]">
          <Link href="/jerseys" className="hover:text-accent transition-colors">
            Jerseys
          </Link>
          <Link href="/track" className="hover:text-accent transition-colors hidden sm:inline">
            Track
          </Link>
          <CartPill />
        </nav>
      </div>
    </header>
  );
}
