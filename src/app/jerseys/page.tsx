import Link from 'next/link';
import Image from 'next/image';
import { createAdminClient } from '@/lib/supabase/server';
import { TEAMS, type TeamId } from '@/lib/teams';
import { formatMYR } from '@/lib/utils';
import type { Product } from '@/lib/types';

export const revalidate = 60;

async function getProducts(team?: string): Promise<Product[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  try {
    const supabase = createAdminClient();
    let q = supabase.from('products').select('*').eq('active', true).order('created_at');
    if (team) q = q.eq('team_id', team);
    const { data } = await q;
    return (data ?? []) as Product[];
  } catch {
    return [];
  }
}

export default async function JerseysPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string }>;
}) {
  const { team } = await searchParams;
  const products = await getProducts(team);
  const activeTeam = team && team in TEAMS ? (team as TeamId) : null;

  return (
    <div className="max-w-[1440px] mx-auto px-6 lg:px-10 pt-12 lg:pt-16 pb-24">
      <div className="grid grid-cols-12 gap-6 mb-12 items-end">
        <div className="col-span-12 md:col-span-7">
          <p className="eyebrow">Catalog · {String(products.length).padStart(2, '0')} items</p>
          <h1 className="h-display text-[56px] md:text-[96px] mt-4">
            {activeTeam ? TEAMS[activeTeam].name : 'The drop'}
          </h1>
        </div>
        <div className="col-span-12 md:col-span-5 flex flex-wrap gap-2 md:justify-end">
          <Link
            href="/jerseys"
            className={`px-4 h-10 inline-flex items-center text-[13px] border ${
              !activeTeam ? 'bg-ink text-canvas border-ink' : 'border-line hover:border-ink'
            }`}
          >
            All
          </Link>
          {(['dungun', 'kuala_terengganu', 'bukit_besi', 'official'] as const).map((id) => (
            <Link
              key={id}
              href={`/jerseys?team=${id}`}
              className={`px-4 h-10 inline-flex items-center text-[13px] border ${
                activeTeam === id
                  ? 'bg-ink text-canvas border-ink'
                  : 'border-line hover:border-ink'
              }`}
            >
              {TEAMS[id].name}
            </Link>
          ))}
        </div>
      </div>

      {products.length === 0 ? (
        <div className="border border-dashed border-line p-16 text-center">
          <p className="font-display text-3xl mb-2">No jerseys here yet.</p>
          <p className="text-muted">
            Setup Supabase via <code className="font-mono">supabase/README.md</code> and run the
            seed.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-line border border-line">
          {products.map((p, i) => (
            <Link
              key={p.id}
              href={`/jerseys/${p.slug}`}
              className="group bg-canvas p-5 lg:p-7 flex flex-col"
            >
              <div className="aspect-[4/5] relative overflow-hidden bg-paper">
                <Image
                  src={p.image_url}
                  alt={p.name}
                  fill
                  className="object-cover group-hover:scale-[1.03] transition-transform duration-700"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                {p.stock < 10 && (
                  <span className="absolute top-3 left-3 bg-accent text-white px-2 py-1 text-[10px] font-mono uppercase tracking-[0.16em]">
                    Low stock
                  </span>
                )}
              </div>
              <div className="mt-4 flex items-start justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                    {String(i + 1).padStart(2, '0')} / {TEAMS[p.team_id].short}
                  </p>
                  <p className="text-[15px] mt-1">{p.name}</p>
                </div>
                <p className="font-mono text-[14px]">{formatMYR(p.price)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
