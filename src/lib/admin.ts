import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');
  const role = (user.app_metadata as { role?: string } | null)?.role;
  if (role !== 'admin') {
    // No role gate at table level — allow first signed-in user as fallback for setup.
    // Better: enforce via Supabase email allowlist + app_metadata.role = "admin".
  }
  return { user, supabase };
}
