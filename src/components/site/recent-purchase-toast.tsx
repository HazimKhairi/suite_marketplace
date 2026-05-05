'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

type Purchase = {
  name: string;
  item: string;
  category: 'jersey' | 'jacket';
  at: string;
};

const SHOW_MS = 5400;
const GAP_MS = 6500;
const FIRST_DELAY_MS = 4500;
const DISMISS_KEY = 'suite:recent-toast-dismissed';

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const s = Math.max(1, Math.floor((now - then) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function RecentPurchaseToast() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const timersRef = useRef<{ show?: ReturnType<typeof setTimeout>; hide?: ReturnType<typeof setTimeout> }>({});

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(DISMISS_KEY) === '1') return;
    setDismissed(false);

    let cancelled = false;
    fetch('/api/recent-purchases')
      .then((r) => (r.ok ? r.json() : { purchases: [] }))
      .then((d: { purchases: Purchase[] }) => {
        if (!cancelled) setPurchases(d.purchases ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (dismissed || purchases.length === 0) return;

    const showNext = () => {
      setVisible(true);
      timersRef.current.hide = setTimeout(() => {
        setVisible(false);
        timersRef.current.show = setTimeout(() => {
          setIndex((i) => (i + 1) % purchases.length);
        }, 600);
      }, SHOW_MS);
    };

    const startDelay = index === 0 ? FIRST_DELAY_MS : GAP_MS - 600;
    timersRef.current.show = setTimeout(showNext, startDelay);

    return () => {
      if (timersRef.current.show) clearTimeout(timersRef.current.show);
      if (timersRef.current.hide) clearTimeout(timersRef.current.hide);
    };
  }, [index, purchases, dismissed]);

  const dismiss = () => {
    setDismissed(true);
    setVisible(false);
    if (typeof window !== 'undefined') sessionStorage.setItem(DISMISS_KEY, '1');
  };

  if (dismissed || purchases.length === 0) return null;
  const p = purchases[index];
  if (!p) return null;

  const swatch =
    p.category === 'jacket'
      ? 'bg-flame-purple'
      : p.item.toLowerCase().startsWith('white')
        ? 'bg-canvas border border-ink'
        : 'bg-ink';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed left-4 right-4 sm:left-6 sm:right-auto bottom-4 sm:bottom-6 z-40 transition-all duration-500 ${
        visible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <Link
        href="/jerseys"
        className="group block bg-canvas border border-ink shadow-[6px_6px_0_0_rgba(0,0,0,0.08)] sm:max-w-[380px] hover:border-flame-red transition-colors"
      >
        <div className="px-4 py-3 sm:px-5 sm:py-4 flex items-center gap-3 sm:gap-4">
          <span className={`shrink-0 w-3 h-3 ${swatch}`} aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.18em] text-flame-red flex items-center gap-1.5">
              <span className="relative inline-flex w-1.5 h-1.5">
                <span className="absolute inline-flex w-full h-full rounded-full bg-flame-red opacity-75 animate-ping" />
                <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-flame-red" />
              </span>
              Just locked in
            </p>
            <p className="mt-1 font-display font-extrabold text-[15px] sm:text-base leading-tight truncate">
              {p.name} · <span className="group-hover:text-flame-red transition-colors">{p.item}</span>
            </p>
            <p className="mt-1 font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.16em] text-muted">
              {timeAgo(p.at)} · UiTM KT
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              dismiss();
            }}
            aria-label="Dismiss"
            className="shrink-0 -mr-1 p-1 text-muted hover:text-ink transition-colors"
          >
            <X className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        </div>
      </Link>
    </div>
  );
}
