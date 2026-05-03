import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-line mt-32">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
        <div className="col-span-2">
          <p className="font-display text-3xl leading-tight max-w-md">
            The official kit of the 5<sup className="text-base">th</sup> Suite Games — worn by
            athletes from three UiTM Terengganu campuses.
          </p>
        </div>
        <div>
          <p className="eyebrow mb-4">Shop</p>
          <ul className="space-y-2 text-[14px]">
            <li><Link href="/jerseys" className="hover:text-accent">All jerseys</Link></li>
            <li><Link href="/jerseys?team=dungun" className="hover:text-accent">UiTM Dungun</Link></li>
            <li><Link href="/jerseys?team=kuala_terengganu" className="hover:text-accent">UiTM Kuala Terengganu</Link></li>
            <li><Link href="/jerseys?team=bukit_besi" className="hover:text-accent">UiTM Bukit Besi</Link></li>
          </ul>
        </div>
        <div>
          <p className="eyebrow mb-4">Support</p>
          <ul className="space-y-2 text-[14px]">
            <li><Link href="/track" className="hover:text-accent">Track order</Link></li>
            <li><Link href="/admin/login" className="hover:text-accent">Admin</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[12px] text-muted font-mono uppercase tracking-[0.16em]">
          <span>© 2026 Suite Games · Sukan UiTM Terengganu</span>
          <span>Built for athletes. Limited drop.</span>
        </div>
      </div>
    </footer>
  );
}
