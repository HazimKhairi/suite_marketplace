import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/server';
import { TEAMS } from '@/lib/teams';
import { formatMYR } from '@/lib/utils';
import type { Product } from '@/lib/types';

export const revalidate = 60;

async function getFeaturedProducts(): Promise<Product[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: true })
      .limit(5);
    return (data ?? []) as Product[];
  } catch {
    return [];
  }
}

export default async function Home() {
  const products = await getFeaturedProducts();

  return (
    <div>
      <section className="relative">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 pt-10 lg:pt-16 pb-24 lg:pb-32">
          <div className="grid grid-cols-12 gap-6 lg:gap-10 items-end">
            <div className="col-span-12 lg:col-span-7">
              <p className="eyebrow rise">5th Suite Games · Terengganu · 2026</p>
              <h1 className="h-display rise rise-2 text-[64px] sm:text-[96px] lg:text-[156px] mt-6">
                Wear the
                <br />
                <span className="italic">campus</span>
                <span className="text-accent">.</span>
              </h1>
              <p className="rise rise-3 mt-8 max-w-xl text-[17px] leading-relaxed text-ink-soft">
                Official jerseys for athletes from UiTM Dungun, Kuala Terengganu, and Bukit Besi —
                a limited drop made for the field, the chant, and the photo on your camera roll.
              </p>
              <div className="rise rise-4 mt-10 flex flex-wrap items-center gap-4">
                <Link
                  href="/jerseys"
                  className="bg-ink text-canvas h-14 px-8 inline-flex items-center gap-3 hover:bg-accent transition-colors text-[15px]"
                >
                  Shop the drop
                  <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </Link>
                <Link
                  href="#teams"
                  className="border border-line h-14 px-8 inline-flex items-center hover:border-ink text-[15px]"
                >
                  Meet the teams
                </Link>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-5">
              <div className="relative aspect-[4/5] bg-paper border border-line overflow-hidden rise rise-3">
                <Image
                  src="/jerseys/jersey_black.png"
                  alt="Official Suite Games kit"
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 600px"
                />
                <div className="absolute top-5 left-5 right-5 flex items-start justify-between">
                  <span className="eyebrow bg-canvas/85 px-2 py-1">Edition / 01</span>
                  <span className="bg-ink text-canvas px-2 py-1 text-[11px] font-mono uppercase tracking-[0.14em]">
                    Limited
                  </span>
                </div>
                <div className="absolute bottom-5 left-5 right-5">
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-canvas/85">
                    Suite Games 2026
                  </p>
                  <p className="font-display text-canvas text-2xl mt-1">
                    By the campus, for the campus.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-[12px] font-mono uppercase tracking-[0.14em] text-muted">
                <span>Photographed in studio · Dungun</span>
                <span>SS / 26</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-y border-line bg-paper overflow-hidden">
          <div className="flex animate-scroll-x whitespace-nowrap py-4">
            {Array.from({ length: 4 }).map((_, k) => (
              <div key={k} className="flex shrink-0 items-center gap-12 px-12">
                {[
                  'UiTM Dungun',
                  'Kuala Terengganu',
                  'Bukit Besi',
                  'Sukan Suite 2026',
                  '5th Edition',
                  'Made for athletes',
                ].map((t) => (
                  <span key={t} className="font-display text-3xl">
                    {t} <span className="text-accent">·</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="teams" className="max-w-[1440px] mx-auto px-6 lg:px-10 pt-24 lg:pt-32">
        <div className="grid grid-cols-12 gap-6 mb-12">
          <div className="col-span-12 md:col-span-3">
            <p className="eyebrow">01 / Teams</p>
          </div>
          <div className="col-span-12 md:col-span-9">
            <h2 className="h-display text-[40px] md:text-[64px]">
              Three campuses, one <em>uniform</em> spirit.
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 border-t border-line">
          {(['dungun', 'kuala_terengganu', 'bukit_besi'] as const).map((id, i) => {
            const t = TEAMS[id];
            return (
              <Link
                key={id}
                href={`/jerseys?team=${id}`}
                className="group border-line border-b md:border-b-0 md:border-r last:border-r-0 px-6 lg:px-8 py-10 hover:bg-paper transition-colors flex flex-col"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[12px] uppercase tracking-[0.16em] text-muted">
                    0{i + 1} · {t.short}
                  </span>
                  <ArrowUpRight
                    className="w-5 h-5 text-muted group-hover:text-accent transition-colors"
                    strokeWidth={1.5}
                  />
                </div>
                <p className="font-display text-3xl lg:text-4xl mt-12 leading-tight">{t.fullName}</p>
                <p className="mt-3 text-[14px] text-muted">Home & away kits available.</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="max-w-[1440px] mx-auto px-6 lg:px-10 pt-24 lg:pt-32">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="eyebrow">02 / The drop</p>
            <h2 className="h-display text-[40px] md:text-[64px] mt-4">Five pieces. Numbered.</h2>
          </div>
          <Link href="/jerseys" className="hidden md:inline-flex items-center gap-2 hover:text-accent">
            See all <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="border border-dashed border-line p-12 text-center text-muted">
            Connect Supabase (see <code className="font-mono">supabase/README.md</code>) to load
            the drop.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-px bg-line border border-line">
            {products.map((p, i) => (
              <Link
                key={p.id}
                href={`/jerseys/${p.slug}`}
                className="group bg-canvas p-4 lg:p-6 flex flex-col"
              >
                <div className="aspect-[4/5] relative overflow-hidden bg-paper">
                  <Image
                    src={p.image_url}
                    alt={p.name}
                    fill
                    className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                    sizes="(max-width: 768px) 50vw, 20vw"
                  />
                </div>
                <div className="mt-4 flex items-start justify-between">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                      0{i + 1} / {p.color}
                    </p>
                    <p className="text-[14px] mt-1">{p.name}</p>
                  </div>
                  <p className="font-mono text-[13px]">{formatMYR(p.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mt-32 lg:mt-40 border-t border-line bg-paper">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-24 lg:py-32 grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-3">
            <p className="eyebrow">03 / Manifesto</p>
          </div>
          <div className="col-span-12 md:col-span-9">
            <p className="font-display text-[32px] md:text-[56px] leading-tight">
              We don't sell merch. We sell the version of you that{' '}
              <em>refuses to lose</em> when the heat says otherwise — and the version of you that
              still shakes hands after.
            </p>
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-y-6 text-[13px]">
              {[
                ['01', 'Made in', 'Malaysia'],
                ['02', 'Sublimation', 'Print'],
                ['03', 'Sizes', 'S → XXL'],
                ['04', 'Drop', 'Limited 230 units'],
              ].map(([n, k, v]) => (
                <div key={n}>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                    {n} / {k}
                  </p>
                  <p className="mt-1">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
