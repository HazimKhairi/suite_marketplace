import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, MessageCircle, Code2, ExternalLink } from 'lucide-react';
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

type SocialProof = { whiteJersey: number; blackJersey: number; jacket: number; total: number };

async function getSocialProof(): Promise<SocialProof> {
  const empty: SocialProof = { whiteJersey: 0, blackJersey: 0, jacket: 0, total: 0 };
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return empty;
  try {
    const supabase = createAdminClient();
    // Count units in confirmed orders (paid → completed). Verifying / pending / rejected don't count.
    const { data: rows } = await supabase
      .from('order_items')
      .select('quantity, category, products!inner(color), orders!inner(status)')
      .in('orders.status', ['paid', 'shipped', 'completed']);
    const c: SocialProof = { ...empty };
    type Row = {
      quantity: number;
      category: string;
      products: { color: string } | { color: string }[] | null;
    };
    for (const r of (rows ?? []) as unknown as Row[]) {
      const qty = Number(r.quantity) || 0;
      const color = Array.isArray(r.products) ? r.products[0]?.color : r.products?.color;
      if (r.category === 'jacket') c.jacket += qty;
      else if (color === 'white') c.whiteJersey += qty;
      else if (color === 'black') c.blackJersey += qty;
    }
    c.total = c.whiteJersey + c.blackJersey + c.jacket;
    return c;
  } catch {
    return empty;
  }
}

export default async function Home() {
  const [products, proof] = await Promise.all([getProducts(), getSocialProof()]);

  return (
    <div>
      <section className="relative">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 pt-12 lg:pt-20 pb-24 lg:pb-32">
          <div className="grid grid-cols-12 gap-6 lg:gap-12 items-end">
            <div className="col-span-12 lg:col-span-7">
              <p className="eyebrow rise">Suite Games 2026 / UiTM Kuala Terengganu</p>
              <h1 className="h-display rise rise-2 text-[64px] sm:text-[112px] lg:text-[180px] mt-6">
                Suit up in
                <br />
                <span className="text-flame-red">your</span> name.
              </h1>
              <p className="rise rise-3 mt-8 max-w-xl body-lede text-[18px] text-ink-soft">
                The official kit drop for UiTM Kuala Terengganu athletes. Custom jerseys printed
                with your own name and number, plus a track jacket built for every sport. Pick
                your kit, drop your name on the back, hit the court.
              </p>
              <div className="rise rise-4 mt-10 flex flex-wrap items-center gap-4">
                <Link
                  href="/jerseys"
                  className="bg-ink text-canvas h-14 px-8 inline-flex items-center gap-3 hover:bg-flame-red transition-colors text-[15px] font-heading font-semibold"
                >
                  Order your jersey
                  <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </Link>
                <Link
                  href="#catalog"
                  className="border border-line h-14 px-8 inline-flex items-center hover:border-ink text-[15px] font-heading"
                >
                  Browse the drop
                </Link>
              </div>
              <div className="rise rise-5 mt-14 grid grid-cols-2 sm:grid-cols-4 gap-x-8 lg:gap-x-12 gap-y-8 max-w-2xl">
                <Stat n="01" k="Short sleeve" v="RM 28" tint="text-flame-red" />
                <Stat n="02" k="Long sleeve" v="RM 33" tint="text-flame-purple" />
                <Stat n="03" k="Custom" v="Name and number" tint="text-gold" />
                <Stat n="04" k="Print" v="Sublimation" tint="text-leaf" />
              </div>
            </div>

            <div className="col-span-12 lg:col-span-5">
              <div className="relative aspect-[4/5] bg-paper border border-line overflow-hidden rise rise-3">
                <Image
                  src="/jerseys/jacket_white.png"
                  alt="VB UiTM KT track jacket"
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 600px"
                />
                <div className="absolute top-5 left-5 right-5 flex items-start justify-between">
                  <span className="eyebrow bg-canvas/90 px-2 py-1">Drop / 01</span>
                  <span className="bg-flame-red text-white px-2 py-1 text-[11px] font-mono uppercase tracking-[0.14em] animate-pulse">
                    Hot drop
                  </span>
                </div>
              </div>
              <div className="mt-5 border-t border-line pt-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                  {TEAM.fullName}
                </p>
                <p className="font-display font-extrabold text-2xl mt-2 leading-tight">
                  Suitable for all athletes.
                </p>
                <div className="mt-5 flex items-center justify-between gap-4 border-t border-line pt-4">
                  <span className="bg-ink text-canvas px-3 py-2 text-[10px] font-mono uppercase tracking-[0.16em]">
                    Limited launch
                  </span>
                  <div className="text-right">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted line-through">
                      RM 150
                    </p>
                    <p className="font-display font-extrabold text-3xl text-flame-red leading-none mt-1">
                      RM 80
                    </p>
                  </div>
                </div>
                <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-flame-purple">
                  Launch promo — save RM 70 while stock lasts.
                </p>
                <div className="mt-4 flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.16em] text-muted">
                  <span>SUITE / UITM KT</span>
                  <span>SS / 26</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-y border-line bg-paper overflow-hidden">
          <div className="flex animate-scroll-x whitespace-nowrap py-4">
            {Array.from({ length: 4 }).map((_, k) => (
              <div key={k} className="flex shrink-0 items-center gap-12 px-12">
                {[
                  { t: 'Suite UiTM KT', c: 'text-ink' },
                  { t: 'Custom name and number', c: 'text-flame-red' },
                  { t: 'Sublimation print', c: 'text-ink' },
                  { t: 'RM 28 short', c: 'text-flame-purple' },
                  { t: 'RM 33 long', c: 'text-gold' },
                  { t: 'Made for the court', c: 'text-leaf' },
                ].map(({ t, c }) => (
                  <span key={t} className={`font-display font-extrabold text-3xl ${c}`}>
                    {t}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="catalog" className="max-w-[1440px] mx-auto px-6 lg:px-10 pt-24 lg:pt-32">
        <div className="grid grid-cols-12 gap-6 mb-10 items-end">
          <div className="col-span-12 md:col-span-7">
            <div className="flex items-center gap-3 flex-wrap">
              <p className="eyebrow">01 / The drop</p>
              {proof.total > 0 && (
                <span className="inline-flex items-center gap-2 px-2.5 py-1 border border-flame-red text-flame-red font-mono text-[10px] uppercase tracking-[0.16em]">
                  <span className="relative inline-flex w-1.5 h-1.5">
                    <span className="absolute inline-flex w-full h-full rounded-full bg-flame-red opacity-75 animate-ping" />
                    <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-flame-red" />
                  </span>
                  Live · {proof.total} locked in
                </span>
              )}
            </div>
            <h2 className="h-section text-[40px] md:text-[80px] mt-4">
              Full kit. <span className="text-flame-red">One</span> squad.
            </h2>
          </div>
          <div className="col-span-12 md:col-span-5 body-lede text-muted text-[15px]">
            Jerseys in black or white, short or long, with your name and number on the back. Plus a
            track jacket suitable for all athletes. Hit the court at Suite Games 11.12.13 June.
          </div>
        </div>

        {proof.total > 0 && (
          <div className="mb-px border border-line border-b-0 bg-paper">
            <div className="grid grid-cols-3 divide-x divide-line">
              <ProofCard
                count={proof.whiteJersey}
                label="White jerseys"
                swatch="bg-canvas border border-ink"
              />
              <ProofCard count={proof.blackJersey} label="Black jerseys" swatch="bg-ink" />
              <ProofCard count={proof.jacket} label="Track jackets" swatch="bg-flame-purple" />
            </div>
            <div className="border-t border-line px-4 py-2.5 flex items-center justify-between gap-4 flex-wrap">
              <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted">
                Already paid · on the print queue
              </p>
              <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-flame-red">
                Don&rsquo;t be the last one in regular clothes.
              </p>
            </div>
          </div>
        )}

        {products.length === 0 ? (
          <div className="border border-dashed border-line p-12 text-center text-muted">
            Connect Supabase (see <code className="font-mono">supabase/README.md</code>) to load the
            drop.
          </div>
        ) : (
          (() => {
            const jerseys = products.filter((p) => p.category === 'jersey');
            const jackets = products.filter((p) => p.category === 'jacket');
            return (
              <>
                {jerseys.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-line border border-line">
                    {jerseys.map((p) => (
                      <Link
                        key={p.id}
                        href={`/jerseys/${p.slug}`}
                        className="group bg-canvas p-3 sm:p-4 flex flex-col"
                      >
                        <div className="aspect-square relative overflow-hidden bg-paper">
                          <Image
                            src={p.image_url}
                            alt={p.name}
                            fill
                            className="object-cover group-hover:scale-[1.03] transition-transform duration-700"
                            sizes="(max-width: 640px) 50vw, 25vw"
                          />
                          {p.stock < 10 && p.stock > 0 && (
                            <span className="absolute top-2 left-2 bg-flame-red text-white px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-[0.14em]">
                              Low
                            </span>
                          )}
                          {p.stock === 0 && (
                            <span className="absolute top-2 left-2 bg-ink text-canvas px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-[0.14em]">
                              Sold out
                            </span>
                          )}
                        </div>
                        <div className="mt-3 flex items-baseline justify-between gap-2">
                          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted truncate">
                            {p.color} / {p.sleeve_type === 'short' ? 'Short' : 'Long'}
                          </p>
                          <p className="font-mono text-[12px] whitespace-nowrap group-hover:text-flame-red transition-colors">
                            {formatMYR(p.price)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {jackets.map((p) => (
                  <Link
                    key={p.id}
                    href={`/jerseys/${p.slug}`}
                    className="group mt-px grid grid-cols-12 gap-px bg-line border border-line border-t-0 hover:border-ink transition-colors"
                  >
                    <div className="col-span-12 sm:col-span-4 lg:col-span-3 bg-canvas p-3 sm:p-4">
                      <div className="aspect-square relative overflow-hidden bg-paper">
                        <Image
                          src={p.image_url}
                          alt={p.name}
                          fill
                          className="object-cover group-hover:scale-[1.03] transition-transform duration-700"
                          sizes="(max-width: 640px) 100vw, 25vw"
                        />
                        {p.stock < 10 && p.stock > 0 && (
                          <span className="absolute top-2 left-2 bg-flame-red text-white px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-[0.14em]">
                            Low
                          </span>
                        )}
                        {p.stock === 0 && (
                          <span className="absolute top-2 left-2 bg-ink text-canvas px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-[0.14em]">
                            Sold out
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="col-span-12 sm:col-span-8 lg:col-span-9 bg-canvas p-6 sm:p-8 lg:p-12 flex flex-col justify-between gap-6">
                      <div>
                        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-flame-purple">
                          Drop / 02 — Track jacket
                        </p>
                        <p className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl mt-3 leading-tight">
                          {p.name}
                        </p>
                        <p className="mt-4 max-w-xl body-lede text-[14px] text-muted">
                          Suitable for all athletes. Full zip, warm-up ready, no custom name and
                          number.
                        </p>
                      </div>
                      <div className="flex items-end justify-between gap-4 border-t border-line pt-4">
                        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                          {p.color} / Jacket
                        </span>
                        <span className="font-display font-extrabold text-3xl sm:text-4xl text-flame-red group-hover:text-ink transition-colors">
                          {formatMYR(p.price)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </>
            );
          })()
        )}
      </section>

      <section id="how-it-works" className="max-w-[1440px] mx-auto px-6 lg:px-10 pt-24 lg:pt-32">
        <div className="grid grid-cols-12 gap-6 mb-12">
          <div className="col-span-12 md:col-span-3">
            <p className="eyebrow">02 / How it works</p>
          </div>
          <div className="col-span-12 md:col-span-9">
            <h2 className="h-section text-[40px] md:text-[64px]">
              Pick. <span className="text-flame-purple">Personalize.</span> Pay. Play.
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 border-t border-line">
          {[
            { n: '01', k: 'Pick a cut', v: 'Short sleeve at RM 28 or long sleeve at RM 33.', tint: 'text-flame-red' },
            { n: '02', k: 'Personalize', v: 'Name on the back, number 1 to 999, your size.', tint: 'text-flame-purple' },
            { n: '03', k: 'Pay', v: 'DuitNow QR or bank transfer. Receipt verified by AI.', tint: 'text-gold' },
            { n: '04', k: 'Play', v: 'Track your order online. Self pickup at UiTM KT.', tint: 'text-leaf' },
          ].map((s) => (
            <div
              key={s.n}
              className="border-line border-b md:border-b-0 md:border-r last:border-r-0 px-6 lg:px-8 py-12"
            >
              <p className={`font-mono text-[12px] uppercase tracking-[0.16em] ${s.tint}`}>
                {s.n}
              </p>
              <p className="font-display font-extrabold text-3xl mt-10">{s.k}</p>
              <p className="mt-4 body-lede text-[14px] text-muted">{s.v}</p>
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
            <p className="font-display font-extrabold text-[32px] md:text-[56px] leading-tight">
              Other UiTM KT teams welcome. List a product on Suite for{' '}
              <span className="text-flame-red">RM 15</span>. Same flow, same QR payment, same
              admin tracking.
            </p>
            <a
              href={ORG_CONTACT.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-12 inline-flex items-center gap-3 bg-ink text-canvas h-14 px-8 hover:bg-flame-red transition-colors"
            >
              <MessageCircle className="w-4 h-4" strokeWidth={1.5} />
              <span className="text-[15px] font-heading font-semibold">
                WhatsApp {ORG_CONTACT.phoneDisplay}
              </span>
            </a>
            <p className="mt-4 text-[13px] text-muted">
              Drop the Sukan UiTM KT admin a WhatsApp and they will set you up.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-ink text-canvas">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-24 lg:py-32 grid grid-cols-12 gap-6 lg:gap-10">
          <div className="col-span-12 md:col-span-3 flex flex-col items-start gap-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-flame-red">
              04 / Built by hazimdev
            </p>

            <a
              href="https://hazimdev.com?utm_source=suite-marketplace&utm_medium=avatar"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visit hazimdev.com"
              className="group/avatar relative block"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -inset-3 rounded-full bg-flame-red opacity-30 blur-2xl group-hover/avatar:opacity-70 transition-opacity duration-500"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -inset-1.5 rounded-full border border-flame-red/40 group-hover/avatar:border-flame-red transition-colors animate-spin-slow"
              />
              <span className="relative block w-44 h-44 sm:w-52 sm:h-52 rounded-full overflow-hidden border-2 border-canvas/20 group-hover/avatar:border-flame-red transition-all duration-500 group-hover/avatar:rotate-[-2deg]">
                <Image
                  src="/branding/hazim.png"
                  alt="Hazim — hazimdev"
                  fill
                  sizes="(max-width: 640px) 176px, 208px"
                  className="object-cover transition-transform duration-700 group-hover/avatar:scale-105"
                />
              </span>

              <span
                aria-hidden="true"
                className="absolute -top-2 -right-2 inline-flex items-center justify-center w-9 h-9 rounded-full bg-flame-red text-canvas font-mono text-[10px] uppercase tracking-[0.14em] shadow-lg group-hover/avatar:scale-110 transition-transform"
              >
                <span className="relative inline-flex w-2 h-2">
                  <span className="absolute inline-flex w-full h-full rounded-full bg-canvas opacity-75 animate-ping" />
                  <span className="relative inline-flex w-2 h-2 rounded-full bg-canvas" />
                </span>
              </span>

              <span
                aria-hidden="true"
                className="absolute left-1/2 -translate-x-1/2 -bottom-3 inline-block bg-canvas text-ink font-mono text-[9px] uppercase tracking-[0.18em] px-2.5 py-1 shadow-lg group-hover/avatar:bg-flame-red group-hover/avatar:text-canvas transition-colors whitespace-nowrap"
              >
                ✦ Touch me
              </span>

              <span
                aria-hidden="true"
                className="absolute left-full top-3 ml-5 hidden lg:flex items-center gap-2 opacity-0 -translate-x-2 group-hover/avatar:opacity-100 group-hover/avatar:translate-x-0 transition-all duration-300 pointer-events-none"
              >
                <span className="w-0 h-0 border-y-8 border-y-transparent border-r-[12px] border-r-canvas" />
                <span className="bg-canvas text-ink px-3 py-2 font-mono text-[11px] uppercase tracking-[0.16em] shadow-xl">
                  Hi, saya Hazim 👋
                </span>
              </span>
            </a>

            <div className="lg:hidden">
              <p className="font-display font-extrabold text-xl leading-tight">
                Hi, saya <span className="text-flame-red">Hazim</span> 👋
              </p>
              <p className="mt-1 text-[12px] font-mono uppercase tracking-[0.16em] text-canvas/60">
                Tap avatar untuk visit portfolio
              </p>
            </div>
          </div>
          <div className="col-span-12 md:col-span-9">
            <p className="font-display font-extrabold text-[32px] md:text-[56px] leading-tight">
              I built this whole marketplace in a weekend for UiTM KT.{' '}
              <span className="text-flame-red">Want one for your team, club, or event?</span>
            </p>
            <p className="mt-6 body-lede max-w-2xl text-[15px] text-canvas/70">
              Custom kit storefront, QR payment with AI receipt verification, order tracking, admin
              dashboard. Next.js, Supabase, deployed on Vercel. Same stack, same speed, your
              branding. From RM 800 — turnaround in days, not months.
            </p>

            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-px bg-canvas/15 border border-canvas/15">
              <Pillar n="01" k="Storefront" v="Custom catalog, cart, checkout — all yours." />
              <Pillar n="02" k="Automation" v="QR pay, AI receipt OCR, email + status flow." />
              <Pillar n="03" k="Admin" v="Orders, products, exports, all in one place." />
            </div>

            <div className="mt-10 grid grid-cols-1 lg:grid-cols-5 gap-px bg-canvas/15 border border-canvas/15">
              <a
                href={`${ORG_CONTACT.whatsappUrl}?text=${encodeURIComponent(
                  'Hi hazimdev, I saw Suite Marketplace and want one for my team. Boleh borak?',
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group lg:col-span-3 bg-flame-red hover:bg-canvas hover:text-ink transition-colors p-6 lg:p-8 flex items-center justify-between gap-6"
              >
                <div className="flex items-start gap-4">
                  <span className="relative inline-flex w-2.5 h-2.5 mt-2 shrink-0">
                    <span className="absolute inline-flex w-full h-full rounded-full bg-canvas group-hover:bg-flame-red opacity-75 animate-ping" />
                    <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-canvas group-hover:bg-flame-red" />
                  </span>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-canvas/80 group-hover:text-muted">
                      Available now · usually replies under 1h
                    </p>
                    <p className="font-display font-extrabold text-3xl lg:text-4xl mt-2 leading-tight">
                      Let&rsquo;s build yours.
                    </p>
                    <p className="mt-2 text-[13px] font-mono uppercase tracking-[0.14em] text-canvas/80 group-hover:text-muted">
                      WhatsApp · {ORG_CONTACT.phoneDisplay}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 inline-flex items-center justify-center w-14 h-14 border border-canvas/40 group-hover:border-ink group-hover:bg-ink group-hover:text-canvas transition-all">
                  <ArrowRight
                    className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
                    strokeWidth={1.5}
                  />
                </span>
              </a>

              <a
                href="https://hazimdev.com?utm_source=suite-marketplace&utm_medium=hero-cta"
                target="_blank"
                rel="noopener noreferrer"
                className="group lg:col-span-2 bg-ink hover:bg-canvas hover:text-ink transition-colors p-6 lg:p-8 flex flex-col justify-between gap-6"
              >
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-flame-red">
                    Portfolio
                  </p>
                  <p className="font-display font-extrabold text-2xl lg:text-3xl mt-2 leading-tight">
                    See more work at hazimdev.com
                  </p>
                </div>
                <div className="flex items-center justify-between text-[13px] font-mono uppercase tracking-[0.14em] text-canvas/60 group-hover:text-muted">
                  <span className="inline-flex items-center gap-2">
                    <Code2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                    Visit site
                  </span>
                  <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.5} />
                </div>
              </a>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
              <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-canvas/50">
                <span className="text-flame-red">●</span> 2 build slots open this month
              </p>
              <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-canvas/50">
                Free 15-min discovery call
              </p>
              <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-canvas/50">
                From RM 800
              </p>
            </div>

            <p className="mt-6 text-[11px] font-mono uppercase tracking-[0.16em] text-canvas/40">
              Next.js · Supabase · Tailwind · Vercel · Sonner · Lucide
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function Pillar({ n, k, v }: { n: string; k: string; v: string }) {
  return (
    <div className="bg-ink p-6 lg:p-8">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-flame-red">{n}</p>
      <p className="font-display font-extrabold text-2xl mt-4">{k}</p>
      <p className="mt-3 text-[13px] text-canvas/60 body-lede">{v}</p>
    </div>
  );
}

function ProofCard({
  count,
  label,
  swatch,
}: {
  count: number;
  label: string;
  swatch: string;
}) {
  return (
    <div className="px-3 py-4 sm:px-5 sm:py-5 flex items-center gap-3 sm:gap-4 hover:bg-canvas transition-colors">
      <span className={`shrink-0 w-2.5 h-2.5 rounded-full ${swatch}`} />
      <div className="min-w-0 flex items-baseline gap-2 sm:gap-3 flex-wrap">
        <p className="font-display font-extrabold text-2xl sm:text-3xl leading-none tabular-nums">
          {count}
        </p>
        <p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-muted truncate">
          {label} sold
        </p>
      </div>
    </div>
  );
}

function Stat({ n, k, v, tint }: { n: string; k: string; v: string; tint: string }) {
  return (
    <div>
      <p className={`font-mono text-[10px] uppercase tracking-[0.18em] ${tint}`}>
        {n} / {k}
      </p>
      <p className="mt-2 text-[18px] font-heading font-semibold">{v}</p>
    </div>
  );
}
