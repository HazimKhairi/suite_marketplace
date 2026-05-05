import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/server';
import { TEAM } from '@/lib/teams';
import { formatMYR } from '@/lib/utils';
import { COMBOS } from '@/lib/combos';
import type { Product } from '@/lib/types';

export const revalidate = 60;

async function getProducts(): Promise<Product[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('price', { ascending: true });
    return (data ?? []) as Product[];
  } catch {
    return [];
  }
}

export default async function JerseysPage() {
  const products = await getProducts();

  return (
    <div className="max-w-[1440px] mx-auto px-6 lg:px-10 pt-12 lg:pt-16 pb-24">
      <div className="grid grid-cols-12 gap-6 mb-12 items-end">
        <div className="col-span-12 md:col-span-7">
          <p className="eyebrow">Catalog / {String(products.length).padStart(2, '0')} items</p>
          <h1 className="h-display text-[64px] md:text-[112px] mt-4">{TEAM.short}.</h1>
          <p className="mt-4 body-lede text-muted max-w-md text-[15px]">
            {TEAM.fullName}. Custom jerseys with name and number, plus a track jacket only
            available for SUITE&rsquo;s athletes.
          </p>
        </div>
      </div>

      {COMBOS.length > 0 && products.length > 0 && (
        <section className="mb-12">
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="eyebrow">Bundles</p>
              <h2 className="font-display font-extrabold text-3xl md:text-4xl mt-2">
                The full kit, one tap away.
              </h2>
            </div>
            <p className="hidden md:block text-[13px] text-muted body-lede max-w-xs text-right">
              Curated sets for athletes who already know what they need. Customize every piece on a
              single page.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-line border border-line">
            {COMBOS.map((c) => (
              <Link
                key={c.slug}
                href={`/combos/${c.slug}`}
                className="group bg-canvas p-6 lg:p-8 flex flex-col justify-between hover:bg-paper transition-colors"
              >
                <div>
                  <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-flame-red">
                    <Sparkles className="w-3 h-3" strokeWidth={2} /> {c.slots.length} items
                  </div>
                  <p className="mt-3 h-display text-[40px] md:text-[56px] leading-[0.95]">{c.name}</p>
                  <p className="mt-3 text-[14px] text-ink-soft body-lede max-w-md">{c.tagline}</p>
                </div>
                <p className="mt-6 text-[13px] inline-flex items-center gap-1 font-mono uppercase tracking-[0.16em] group-hover:text-flame-red transition-colors">
                  Customize bundle
                  <ArrowRight
                    className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                    strokeWidth={1.5}
                  />
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {products.length === 0 ? (
        <div className="border border-dashed border-line p-16 text-center">
          <p className="font-display font-extrabold text-3xl mb-2">No jerseys yet.</p>
          <p className="text-muted">
            Set up Supabase via <code className="font-mono">supabase/README.md</code> and run the
            seed.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-line border border-line">
          {products.map((p, i) => (
            <Link
              key={p.id}
              href={`/jerseys/${p.slug}`}
              className="group bg-canvas p-6 lg:p-10 flex flex-col"
            >
              <div className="aspect-[4/5] relative overflow-hidden bg-paper">
                <Image
                  src={p.image_url}
                  alt={p.name}
                  fill
                  className="object-cover group-hover:scale-[1.03] transition-transform duration-700"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                {p.stock < 10 && p.stock > 0 && (
                  <span className="absolute top-3 left-3 bg-flame-red text-white px-2 py-1 text-[10px] font-mono uppercase tracking-[0.16em]">
                    Low stock
                  </span>
                )}
                {p.stock === 0 && (
                  <span className="absolute top-3 left-3 bg-ink text-canvas px-2 py-1 text-[10px] font-mono uppercase tracking-[0.16em]">
                    Sold out
                  </span>
                )}
              </div>
              <div className="mt-5 flex items-start justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                    {String(i + 1).padStart(2, '0')} /{' '}
                    {p.sleeve_type === 'short' ? 'Short sleeve' : 'Long sleeve'}
                  </p>
                  <p className="text-[16px] mt-2 font-heading font-bold">{p.name}</p>
                </div>
                <p className="font-mono text-[15px]">{formatMYR(p.price)}</p>
              </div>
              <p className="mt-3 text-[13px] text-muted inline-flex items-center gap-1 group-hover:text-flame-red transition-colors">
                Order
                <ArrowRight
                  className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                  strokeWidth={1.5}
                />
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
