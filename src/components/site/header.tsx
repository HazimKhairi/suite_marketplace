import Link from 'next/link';
import { Logo } from './logo';
import { CartPill } from './cart-pill';

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-canvas/85 backdrop-blur border-b border-line">
      <div className="h-1 flame-gradient" />
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <span className="eyebrow hidden sm:inline-block">
            Get ready / Suite 11.12.13 Jun
          </span>
        </div>
        <nav className="flex items-center gap-7 text-[13px] font-heading">
          <Link href="/jerseys" className="hover:text-flame-red transition-colors">
            Jerseys
          </Link>
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
