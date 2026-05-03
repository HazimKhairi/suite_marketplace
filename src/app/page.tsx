import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Phone } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/server';
import { TEAM, ORG_CONTACT } from '@/lib/teams';
import { formatMYR } from '@/lib/utils';
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

export default async function Home() {
  const products = await getProducts();

  return (
    <div>
      <section className="relative">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 pt-10 lg:pt-16 pb-24 lg:pb-32">
          <div className="grid grid-cols-12 gap-6 lg:gap-10 items-end">
            <div className="col-span-12 lg:col-span-7">
              <p className="eyebrow rise">Volleyball · UiTM Kuala Terengganu</p>
              <h1 className="h-display rise rise-2 text-[64px] sm:text-[96px] lg:text-[156px] mt-6">
                Smash in
                <br />
                <span className="italic">your</span> name
                <span className="text-accent">.</span>
              </h1>
              <p className="rise rise-3 mt-8 max-w-xl text-[17px] leading-relaxed text-ink-soft">
                Jersey rasmi pasukan volleyball UiTM Kuala Terengganu — custom nama dan nombor
                untuk setiap baju. Pilih lengan pendek atau panjang, isi nama, kita print, kau pakai.
              </p>
              <div className="rise rise-4 mt-10 flex flex-wrap items-center gap-4">
                <Link
                  href="/jerseys"
                  className="bg-ink text-canvas h-14 px-8 inline-flex items-center gap-3 hover:bg-accent transition-colors text-[15px]"
                >
                  Tempah jersey
                  <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </Link>
                <Link
                  href="#pricing"
                  className="border border-line h-14 px-8 inline-flex items-center hover:border-ink text-[15px]"
                >
                  Lihat harga
                </Link>
              </div>
              <div className="rise rise-4 mt-12 grid grid-cols-2 sm:grid-cols-4 gap-y-6 max-w-xl">
                {[
                  ['01', 'Lengan pendek', 'RM 28'],
                  ['02', 'Lengan panjang', 'RM 33'],
                  ['03', 'Custom', 'Nama + No.'],
                  ['04', 'Print', 'Sublimation'],
                ].map(([n, k, v]) => (
                  <div key={n}>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                      {n} / {k}
                    </p>
                    <p className="mt-1 text-[15px]">{v}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-12 lg:col-span-5">
              <div className="relative aspect-[4/5] bg-paper border border-line overflow-hidden rise rise-3">
                <Image
                  src="/jerseys/jersey_black.png"
                  alt="VB UiTM KT jersey"
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 600px"
                />
                <div className="absolute top-5 left-5 right-5 flex items-start justify-between">
                  <span className="eyebrow bg-canvas/85 px-2 py-1">Drop / 01</span>
                  <span className="bg-ink text-canvas px-2 py-1 text-[11px] font-mono uppercase tracking-[0.14em]">
                    Custom name
                  </span>
                </div>
                <div className="absolute bottom-5 left-5 right-5">
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-canvas/85">
                    {TEAM.fullName}
                  </p>
                  <p className="font-display text-canvas text-2xl mt-1">
                    Wear the team. Make it yours.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-[12px] font-mono uppercase tracking-[0.14em] text-muted">
                <span>VB · UITM KT</span>
                <span>2026</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-y border-line bg-paper overflow-hidden">
          <div className="flex animate-scroll-x whitespace-nowrap py-4">
            {Array.from({ length: 4 }).map((_, k) => (
              <div key={k} className="flex shrink-0 items-center gap-12 px-12">
                {[
                  'Volleyball UiTM KT',
                  'Custom name + number',
                  'Sublimation print',
                  'RM 28 — Lengan pendek',
                  'RM 33 — Lengan panjang',
                  'Made for the court',
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

      <section id="pricing" className="max-w-[1440px] mx-auto px-6 lg:px-10 pt-24 lg:pt-32">
        <div className="grid grid-cols-12 gap-6 mb-12">
          <div className="col-span-12 md:col-span-3">
            <p className="eyebrow">01 / The drop</p>
          </div>
          <div className="col-span-12 md:col-span-9">
            <h2 className="h-display text-[40px] md:text-[64px]">
              Two cuts. <em>One</em> team.
            </h2>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="border border-dashed border-line p-12 text-center text-muted">
            Connect Supabase (see <code className="font-mono">supabase/README.md</code>) untuk load
            jersey.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-line border border-line">
            {products.map((p, i) => (
              <Link
                key={p.id}
                href={`/jerseys/${p.slug}`}
                className="group bg-canvas p-8 lg:p-12 flex flex-col"
              >
                <div className="aspect-[4/5] relative overflow-hidden bg-paper">
                  <Image
                    src={p.image_url}
                    alt={p.name}
                    fill
                    className="object-cover group-hover:scale-[1.02] transition-transform duration-700"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <div className="mt-6 flex items-start justify-between">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
                      0{i + 1} / {p.sleeve_type === 'short' ? 'Lengan pendek' : 'Lengan panjang'}
                    </p>
                    <p className="text-[18px] mt-2 font-display">{p.name}</p>
                  </div>
                  <p className="font-mono text-[16px]">{formatMYR(p.price)}</p>
                </div>
                <p className="mt-3 text-[13px] text-muted inline-flex items-center gap-2">
                  Tempah & customize <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="max-w-[1440px] mx-auto px-6 lg:px-10 pt-24 lg:pt-32">
        <div className="grid grid-cols-12 gap-6 mb-12">
          <div className="col-span-12 md:col-span-3">
            <p className="eyebrow">02 / How it works</p>
          </div>
          <div className="col-span-12 md:col-span-9">
            <h2 className="h-display text-[40px] md:text-[56px]">
              Pilih, isi, bayar, pakai.
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 border-t border-line">
          {[
            ['01', 'Pilih jersey', 'Lengan pendek (RM 28) atau lengan panjang (RM 33).'],
            ['02', 'Isi customization', 'Nama, nombor, size, status (player VB / non-player VB).'],
            ['03', 'Bayar', 'DuitNow QR atau bank transfer. Upload receipt — AI auto-verify.'],
            ['04', 'Track & collect', 'Track order pakai nombor. Pickup di Dungun atau hantar.'],
          ].map(([n, k, v]) => (
            <div
              key={n}
              className="border-line border-b md:border-b-0 md:border-r last:border-r-0 px-6 lg:px-8 py-10"
            >
              <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-muted">
                {n}
              </p>
              <p className="font-display text-2xl mt-8">{k}</p>
              <p className="mt-3 text-[13px] text-muted leading-relaxed">{v}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-32 lg:mt-40 border-t border-line bg-paper">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-24 lg:py-32 grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-3">
            <p className="eyebrow">03 / List your sport</p>
          </div>
          <div className="col-span-12 md:col-span-9">
            <p className="font-display text-[32px] md:text-[48px] leading-tight">
              Sukan lain UiTM KT nak masuk listing? <em>RM 15 sahaja</em> untuk letak product korang
              di sini — same flow, same QR pay, same admin tracking.
            </p>
            <a
              href={`tel:${ORG_CONTACT.phone}`}
              className="mt-10 inline-flex items-center gap-3 bg-ink text-canvas h-14 px-7 hover:bg-accent transition-colors"
            >
              <Phone className="w-4 h-4" strokeWidth={1.5} />
              <span className="text-[15px]">Hubungi {ORG_CONTACT.phoneDisplay}</span>
            </a>
            <p className="mt-4 text-[13px] text-muted">WhatsApp / call — admin Sukan UiTM KT.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
