'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await createClient().auth.signOut();
        router.replace('/admin/login');
        router.refresh();
      }}
      className="inline-flex items-center gap-2 text-[13px] text-muted hover:text-accent"
    >
      <LogOut className="w-4 h-4" strokeWidth={1.5} />
      Sign out
    </button>
  );
}
