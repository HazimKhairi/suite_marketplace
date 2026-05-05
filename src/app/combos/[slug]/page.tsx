import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/server';
import { TEAM } from '@/lib/teams';
import { findCombo } from '@/lib/combos';
import { getTakenPlayerNumbers } from '@/lib/players';
import type { Product } from '@/lib/types';
import { ComboExperience } from '@/components/product/combo-experience';

export const dynamic = 'force-dynamic';

async function getJerseyShortVariants(): Promise<Product[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('category', 'jersey')
      .eq('sleeve_type', 'short')
      .eq('active', true)
      .order('color', { ascending: true });
    return (data ?? []) as Product[];
  } catch {
    return [];
  }
}

async function getJacket(): Promise<Product | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('category', 'jacket')
      .eq('active', true)
      .order('price', { ascending: true })
      .limit(1)
      .maybeSingle();
    return (data ?? null) as Product | null;
  } catch {
    return null;
  }
}

export default async function ComboPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const combo = findCombo(slug);
  if (!combo) notFound();

  const [shortJerseys, jacket, takenPlayers] = await Promise.all([
    getJerseyShortVariants(),
    getJacket(),
    getTakenPlayerNumbers(),
  ]);

  const needsJacket = combo.slots.some((s) => s.kind === 'jacket');
  if (needsJacket && !jacket) notFound();
  if (combo.slots.some((s) => s.kind === 'jersey-short') && shortJerseys.length === 0) {
    notFound();
  }

  return (
    <div className="max-w-[1100px] mx-auto px-6 lg:px-10 pt-8 pb-24">
      <Link
        href="/jerseys"
        className="inline-flex items-center gap-2 text-[13px] text-muted hover:text-flame-red mb-8"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} /> Back to catalog
      </Link>

      <div className="mb-10">
        <p className="eyebrow">{TEAM.fullName} · Bundle</p>
        <h1 className="h-display text-[56px] md:text-[96px] mt-4 leading-[0.95]">{combo.name}</h1>
        <p className="mt-5 body-lede text-ink-soft text-[16px] max-w-2xl">{combo.tagline}</p>
        <p className="mt-3 body-lede text-muted text-[14px] max-w-2xl">{combo.body}</p>
      </div>

      <ComboExperience
        combo={combo}
        shortJerseys={shortJerseys}
        jacket={jacket}
        takenPlayers={takenPlayers}
      />
    </div>
  );
}
