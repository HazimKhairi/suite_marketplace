'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { TEAM } from '@/lib/teams';
import { formatMYR } from '@/lib/utils';
import { Label } from '@/components/ui/input';
import type { Product } from '@/lib/types';
import type { TakenPlayer } from '@/lib/players';
import { ProductPurchase } from './purchase';

type Props = {
  initialProductId: string;
  variants: Product[];
  takenPlayers: TakenPlayer[];
};

type Sleeve = 'short' | 'long';

function isSleeve(s: string | null): s is Sleeve {
  return s === 'short' || s === 'long';
}

export function JerseyExperience({ initialProductId, variants, takenPlayers }: Props) {
  const [selectedId, setSelectedId] = useState<string>(initialProductId);
  const selected = variants.find((v) => v.id === selectedId) ?? variants[0];

  const colors = useMemo(() => Array.from(new Set(variants.map((v) => v.color))), [variants]);
  const sleeves = useMemo(
    () => Array.from(new Set(variants.map((v) => v.sleeve_type).filter(isSleeve))),
    [variants],
  );

  function findVariant(color: string, sleeve: string | null): Product | undefined {
    return variants.find((v) => v.color === color && v.sleeve_type === sleeve);
  }

  function pickColor(color: string) {
    const match = findVariant(color, selected.sleeve_type) ?? variants.find((v) => v.color === color);
    if (match) setSelectedId(match.id);
  }

  function pickSleeve(sleeve: Sleeve) {
    const match = findVariant(selected.color, sleeve) ?? variants.find((v) => v.sleeve_type === sleeve);
    if (match) setSelectedId(match.id);
  }

  const sleeveLabel = selected.sleeve_type === 'short' ? 'Short sleeve' : 'Long sleeve';

  return (
    <div className="grid grid-cols-12 gap-6 lg:gap-12">
      <div className="col-span-12 lg:col-span-7">
        <div className="aspect-[4/5] relative overflow-hidden bg-paper border border-line">
          <Image
            key={selected.id}
            src={selected.image_url}
            alt={selected.name}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 800px"
          />
        </div>
      </div>

      <div className="col-span-12 lg:col-span-5">
        <p className="eyebrow">{TEAM.fullName}</p>
        <h1 className="h-display text-[48px] md:text-[88px] mt-4">{selected.name}</h1>
        <div className="mt-4 flex items-center gap-3 text-[13px] text-muted">
          <span className="font-mono uppercase tracking-[0.14em]">{sleeveLabel}</span>
          <span>/</span>
          <span className="font-mono uppercase tracking-[0.14em]">{selected.color}</span>
          <span>/</span>
          <span className="font-mono">{formatMYR(selected.price)}</span>
        </div>

        {selected.description && (
          <p className="mt-8 body-lede text-[15px] text-ink-soft">{selected.description}</p>
        )}

        <div className="mt-10 divider pt-8 space-y-7">
          {colors.length > 1 && (
            <div>
              <Label>Color</Label>
              <div
                className="grid gap-px bg-line border border-line"
                style={{ gridTemplateColumns: `repeat(${colors.length}, minmax(0, 1fr))` }}
              >
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => pickColor(c)}
                    className={`h-12 text-[13px] font-heading uppercase tracking-[0.12em] transition-colors ${
                      selected.color === c ? 'bg-ink text-canvas' : 'bg-canvas hover:bg-paper'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {sleeves.length > 1 && (
            <div>
              <Label>Sleeve</Label>
              <div className="grid grid-cols-2 gap-px bg-line border border-line">
                {sleeves.map((s) => {
                  const variant = findVariant(selected.color, s);
                  const active = selected.sleeve_type === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => pickSleeve(s)}
                      disabled={!variant}
                      className={`h-16 px-4 text-left transition-colors ${
                        active ? 'bg-ink text-canvas' : 'bg-canvas hover:bg-paper'
                      } ${!variant ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em]">
                        {s === 'short' ? '01' : '02'}{' '}
                        {variant ? `/ ${formatMYR(variant.price)}` : '/ unavailable'}
                      </p>
                      <p className="text-[13px] mt-1 font-heading font-semibold">
                        {s === 'short' ? 'Short sleeve' : 'Long sleeve'}
                      </p>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[12px] text-muted body-lede">
                Switch sleeves anytime. Same name and number stay locked in. Add as many lines as
                you need before going to checkout.
              </p>
            </div>
          )}

          <ProductPurchase product={selected} takenPlayers={takenPlayers} />
        </div>

        <div className="mt-12 border-t border-line pt-6 text-[13px] text-muted body-lede">
          Made in Malaysia. Sublimation print on breathable mesh. Care: cold wash, hang dry, iron
          inside out on low.
        </div>
      </div>
    </div>
  );
}
