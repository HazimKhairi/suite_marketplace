import Link from 'next/link';
import { Logo } from './logo';
import { ORG_CONTACT } from '@/lib/teams';

export function Footer() {
  return (
    <footer className="border-t border-line mt-32">
      <div className="h-1 flame-gradient" />
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
        <div className="col-span-2">
          <Logo size="md" />
          <p className="mt-6 font-display font-extrabold text-3xl leading-tight max-w-md">
            The official kit drop for UiTM Kuala Terengganu athletes.
          </p>
          <p className="mt-3 body-lede max-w-md text-muted">
            Custom jerseys with name and number, plus a squad-only track jacket.
          </p>
        </div>
        <div>
          <p className="eyebrow mb-4">Shop</p>
          <ul className="space-y-2 text-[14px] list-none">
            <li>
              <Link href="/jerseys" className="hover:text-flame-red">
                Browse the drop
              </Link>
            </li>
            <li>
              <Link href="/track" className="hover:text-flame-red">
                Track an order
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="eyebrow mb-4">List a sport</p>
          <ul className="space-y-2 text-[14px] list-none">
            <li className="text-muted">RM {ORG_CONTACT.listingFee} per product</li>
            <li>
              <a
                href={ORG_CONTACT.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-flame-red"
              >
                WhatsApp {ORG_CONTACT.phoneDisplay}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[12px] text-muted font-mono uppercase tracking-[0.16em]">
          <span>© 2026 Suite Games / Sukan UiTM Kuala Terengganu</span>
          <span>
            Made by{' '}
            <a
              href="https://hazimdev.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink hover:text-flame-red underline-offset-4 hover:underline"
            >
              hazimdev
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
