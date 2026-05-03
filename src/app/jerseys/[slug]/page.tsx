import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/server';
import { TEAM } from '@/lib/teams';
import { formatMYR } from '@/lib/utils';
import { getTakenPlayerNumbers } from '@/lib/players';
import type { Product } from '@/lib/types';
import { ProductPurchase } from '@/components/product/purchase';
import { JerseyExperience } from '@/components/product/jersey-experience';

// Player-number availability must reflect the latest order state.
export const dynamic = 'force-dynamic';

async function getProduct(slug: string): Promise<Product | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from('products').select('*').eq('slug', slug).maybeSingle();
    return (data ?? null) as Product | null;
  } catch {
    return null;
  }
}

async function getJerseyVariants(): Promise<Product[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('category', 'jersey')
      .eq('active', true)
      .order('color', { ascending: true })
      .order('price', { ascending: true });
    return (data ?? []) as Product[];
  } catch {
    return [];
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, takenPlayers, jerseyVariants] = await Promise.all([
    getProduct(slug),
    getTakenPlayerNumbers(),
    getJerseyVariants(),
  ]);
  if (!product) notFound();

  const isJersey = product.category === 'jersey';
  const sleeveLabel = product.sleeve_type === 'short' ? 'Short sleeve' : 'Long sleeve';

  return (
    <div className="max-w-[1440px] mx-auto px-6 lg:px-10 pt-8 pb-24">
      <Link
        href="/jerseys"
        className="inline-flex items-center gap-2 text-[13px] text-muted hover:text-flame-red mb-8"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} /> Back to catalog
      </Link>

      {isJersey && jerseyVariants.length > 1 ? (
        <JerseyExperience
          initialProductId={product.id}
          variants={jerseyVariants}
          takenPlayers={takenPlayers}
        />
      ) : (
        <div className="grid grid-cols-12 gap-6 lg:gap-12">
          <div className="col-span-12 lg:col-span-7">
            <div className="aspect-[4/5] relative overflow-hidden bg-paper border border-line">
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 800px"
              />
            </div>
          </div>

          <div className="col-span-12 lg:col-span-5">
            <p className="eyebrow">{TEAM.fullName}</p>
            <h1 className="h-display text-[48px] md:text-[88px] mt-4">{product.name}</h1>
            <div className="mt-4 flex items-center gap-3 text-[13px] text-muted">
              <span className="font-mono uppercase tracking-[0.14em]">
                {isJersey ? sleeveLabel : 'Jacket'}
              </span>
              <span>/</span>
              <span className="font-mono">{formatMYR(product.price)}</span>
            </div>

            {product.description && (
              <p className="mt-8 body-lede text-[15px] text-ink-soft">{product.description}</p>
            )}

            <div className="mt-10 divider pt-8">
              <ProductPurchase product={product} takenPlayers={takenPlayers} />
            </div>

            <div className="mt-12 border-t border-line pt-6 text-[13px] text-muted body-lede">
              Made in Malaysia. Sublimation print on breathable mesh. Care: cold wash, hang dry,
              iron inside out on low.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
