'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cart';

export function CartPill() {
  const { count, ready } = useCart();
  return (
    <Link
      href="/checkout"
      className="bg-ink text-canvas px-4 h-9 inline-flex items-center gap-2 hover:bg-accent transition-colors"
    >
      <span className="text-[13px]">Cart</span>
      <span className="font-mono text-[11px] tracking-wider">
        {ready ? String(count).padStart(2, '0') : '00'}
      </span>
    </Link>
  );
}
