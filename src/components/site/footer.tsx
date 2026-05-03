import Link from 'next/link';
import { ORG_CONTACT } from '@/lib/teams';

export function Footer() {
  return (
    <footer className="border-t border-line mt-32">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
        <div className="col-span-2">
          <p className="font-display text-3xl leading-tight max-w-md">
            Jersey rasmi pasukan volleyball UiTM Kuala Terengganu — custom name + number
            untuk setiap baju.
          </p>
        </div>
        <div>
          <p className="eyebrow mb-4">Shop</p>
          <ul className="space-y-2 text-[14px]">
            <li>
              <Link href="/jerseys" className="hover:text-accent">
                Semua jersey
              </Link>
            </li>
            <li>
              <Link href="/track" className="hover:text-accent">
                Track order
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="eyebrow mb-4">List a sport</p>
          <ul className="space-y-2 text-[14px]">
            <li className="text-muted">RM {ORG_CONTACT.listingFee} / product</li>
            <li>
              <a href={`tel:${ORG_CONTACT.phone}`} className="hover:text-accent">
                {ORG_CONTACT.phoneDisplay}
              </a>
            </li>
            <li>
              <Link href="/admin/login" className="hover:text-accent">
                Admin
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[12px] text-muted font-mono uppercase tracking-[0.16em]">
          <span>© 2026 Suite Marketplace · Sukan UiTM KT</span>
          <span>
            Made by{' '}
            <a
              href="https://hazimdev.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink hover:text-accent underline-offset-4 hover:underline"
            >
              hazimdev
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
