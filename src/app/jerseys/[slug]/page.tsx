import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/server';
import { TEAMS } from '@/lib/teams';
import { formatMYR } from '@/lib/utils';
import type { Product } from '@/lib/types';
import { ProductPurchase } from '@/components/product/purchase';

export const revalidate = 60;

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

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const team = TEAMS[product.team_id];

  return (
    <div className="max-w-[1440px] mx-auto px-6 lg:px-10 pt-8 pb-24">
      <Link
        href="/jerseys"
        className="inline-flex items-center gap-2 text-[13px] text-muted hover:text-ink mb-8"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} /> Back to catalog
      </Link>

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
          <div className="grid grid-cols-3 gap-px mt-px bg-line border border-line border-t-0">
            {[product.image_url, product.image_url, product.image_url].map((src, i) => (
              <div key={i} className="aspect-square relative bg-paper">
                <Image src={src} alt="" fill className="object-cover opacity-90" />
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5">
          <p className="eyebrow">{team.fullName}</p>
          <h1 className="h-display text-[48px] md:text-[72px] mt-4">{product.name}</h1>
          <p className="font-mono text-[15px] mt-4">{formatMYR(product.price)}</p>

          <p className="mt-8 text-[15px] leading-relaxed text-ink-soft">
            {product.description}
          </p>

          <div className="mt-10 divider pt-8">
            <ProductPurchase product={product} />
          </div>

          <div className="mt-12 grid grid-cols-2 gap-y-6 text-[13px]">
            {[
              ['Color', product.color],
              ['Stock', String(product.stock)],
              ['Sizes', product.sizes.join(' · ')],
              ['Team', team.short],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">{k}</p>
                <p className="mt-1">{v}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 border-t border-line pt-6 text-[13px] text-muted leading-relaxed">
            Made in Malaysia. Sublimation print on breathable mesh. Care: cold wash, hang dry,
            iron inside-out on low.
          </div>
        </div>
      </div>
    </div>
  );
}
