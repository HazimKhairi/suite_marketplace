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
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 pt-12 lg:pt-20 pb-24 lg:pb-32">
          <div className="grid grid-cols-12 gap-6 lg:gap-12 items-end">
            <div className="col-span-12 lg:col-span-7">
              <p className="eyebrow rise">Suite Games 2026 / Volleyball / UiTM Kuala Terengganu</p>
              <h1 className="h-display rise rise-2 text-[64px] sm:text-[112px] lg:text-[180px] mt-6">
                Smash in
                <br />
                <span className="text-flame-red">your</span> name.
              </h1>
              <p className="rise rise-3 mt-8 max-w-xl body-lede text-[18px] text-ink-soft">
                The official volleyball kit of UiTM Kuala Terengganu, printed with your own name
                and number. Short sleeve at RM 28 or long sleeve at RM 33. Pick your size, drop
                your name on the back, hit the court.
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
                  href="#how-it-works"
                  className="border border-line h-14 px-8 inline-flex items-center hover:border-ink text-[15px] font-heading"
                >
                  How it works
                </Link>
              </div>
              <div className="rise rise-5 mt-14 grid grid-cols-2 sm:grid-cols-4 gap-y-8 max-w-2xl">
                <Stat n="01" k="Short sleeve" v="RM 28" tint="text-flame-red" />
                <Stat n="02" k="Long sleeve" v="RM 33" tint="text-flame-purple" />
                <Stat n="03" k="Custom" v="Name and number" tint="text-gold" />
                <Stat n="04" k="Print" v="Sublimation" tint="text-leaf" />
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
                  <span className="eyebrow bg-canvas/90 px-2 py-1">Drop / 01</span>
                  <span className="bg-flame-red text-white px-2 py-1 text-[11px] font-mono uppercase tracking-[0.14em]">
                    Custom name
                  </span>
                </div>
              </div>
              <div className="mt-5 border-t border-line pt-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                  {TEAM.fullName}
                </p>
                <p className="font-display font-extrabold text-2xl mt-2 leading-tight">
                  Wear the team. Make it yours.
                </p>
                <div className="mt-4 flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.16em] text-muted">
                  <span>VB / UITM KT</span>
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
                  { t: 'Volleyball UiTM KT', c: 'text-ink' },
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

      <section className="max-w-[1440px] mx-auto px-6 lg:px-10 pt-24 lg:pt-32">
        <div className="grid grid-cols-12 gap-6 mb-12">
          <div className="col-span-12 md:col-span-3">
            <p className="eyebrow">01 / The drop</p>
          </div>
          <div className="col-span-12 md:col-span-9">
            <h2 className="h-section text-[40px] md:text-[72px]">
              Two cuts. <span className="text-flame-red">One</span> team.
            </h2>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="border border-dashed border-line p-12 text-center text-muted">
            Connect Supabase (see <code className="font-mono">supabase/README.md</code>) to load the
            drop.
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
                      0{i + 1} / {p.sleeve_type === 'short' ? 'Short sleeve' : 'Long sleeve'}
                    </p>
                    <p className="text-[18px] mt-2 font-heading font-bold">{p.name}</p>
                  </div>
                  <p className="font-mono text-[16px]">{formatMYR(p.price)}</p>
                </div>
                <p className="mt-3 text-[13px] text-muted inline-flex items-center gap-2 group-hover:text-flame-red transition-colors">
                  Order and customize
                  <ArrowRight
                    className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                    strokeWidth={1.5}
                  />
                </p>
              </Link>
            ))}
          </div>
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
            { n: '04', k: 'Play', v: 'Track your order online. Pickup at UiTM KT or courier.', tint: 'text-leaf' },
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
              href={`tel:${ORG_CONTACT.phone}`}
              className="mt-12 inline-flex items-center gap-3 bg-ink text-canvas h-14 px-8 hover:bg-flame-red transition-colors"
            >
              <Phone className="w-4 h-4" strokeWidth={1.5} />
              <span className="text-[15px] font-heading font-semibold">
                Call {ORG_CONTACT.phoneDisplay}
              </span>
            </a>
            <p className="mt-4 text-[13px] text-muted">
              WhatsApp or call. Sukan UiTM KT admin will set you up.
            </p>
          </div>
        </div>
      </section>
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
