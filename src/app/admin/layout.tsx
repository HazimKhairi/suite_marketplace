import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { LogoutButton } from './logout-button';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <div>{children}</div>;

  return (
    <div className="border-t border-line">
      <div className="border-b border-line bg-paper">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 h-14 flex items-center justify-between">
          <div className="flex items-center gap-7">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              Admin Console
            </span>
            <nav className="flex items-center gap-5 text-[13px]">
              <Link href="/admin" className="hover:text-accent">
                Orders
              </Link>
              <Link href="/admin/products" className="hover:text-accent">
                Products
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[12px] text-muted hidden sm:inline">{user.email}</span>
            <LogoutButton />
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
