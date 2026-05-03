import { requireAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/server';
import type { Product } from '@/lib/types';
import { ProductsTable } from './products-table';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Products · Admin' };

export default async function AdminProductsPage() {
  await requireAdmin();
  const supabase = createAdminClient();
  const { data } = await supabase.from('products').select('*').order('created_at');
  return (
    <div className="max-w-[1440px] mx-auto px-6 lg:px-10 pt-10 pb-24">
      <div className="mb-10">
        <p className="eyebrow">Products</p>
        <h1 className="h-display text-[48px] md:text-[64px] mt-3">The drop.</h1>
      </div>
      <ProductsTable initial={(data ?? []) as Product[]} />
    </div>
  );
}
