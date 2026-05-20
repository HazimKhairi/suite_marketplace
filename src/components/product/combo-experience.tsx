'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/lib/cart';
import { effectiveUnitPrice, sizeSurcharge, SIZES } from '@/lib/pricing';
import { Input, Label } from '@/components/ui/input';
import { SUITE_SPORTS, sportLabel } from '@/lib/sports';
import { formatMYR } from '@/lib/utils';
import { SALES_CLOSED } from '@/lib/sales';
import { SalesClosedNotice } from '@/components/site/sales-closed-notice';
import type { Combo, ComboSlot } from '@/lib/combos';
import type { Product, CartItem } from '@/lib/types';
import type { PlayerType } from '@/lib/teams';
import type { TakenPlayer } from '@/lib/players';

type Props = {
  combo: Combo;
  shortJerseys: Product[];
  jacket: Product | null;
  takenPlayers: TakenPlayer[];
};

type JerseySlotState = {
  productId: string;
  size: string;
  name: string;
  number: string;
  playerType: PlayerType;
};

type JacketSlotState = {
  size: string;
  sport: string;
};

type SlotState =
  | { kind: 'jersey-short'; data: JerseySlotState }
  | { kind: 'jacket'; data: JacketSlotState };

function defaultJerseyState(variants: Product[]): JerseySlotState {
  const first = variants[0];
  const sizes = first?.sizes?.length ? first.sizes : (SIZES as readonly string[]);
  return {
    productId: first?.id ?? '',
    size: sizes[1] ?? sizes[0] ?? 'M',
    name: '',
    number: '',
    playerType: 'non_player',
  };
}

function defaultJacketState(jacket: Product | null): JacketSlotState {
  const sizes = jacket?.sizes?.length ? jacket.sizes : (SIZES as readonly string[]);
  return {
    size: sizes[1] ?? sizes[0] ?? 'M',
    sport: '',
  };
}

export function ComboExperience(props: Props) {
  if (SALES_CLOSED) {
    return <SalesClosedNotice />;
  }
  return <ComboExperienceForm {...props} />;
}

function ComboExperienceForm({ combo, shortJerseys, jacket, takenPlayers }: Props) {
  const { add } = useCart();

  const [slots, setSlots] = useState<SlotState[]>(() =>
    combo.slots.map((s): SlotState =>
      s.kind === 'jacket'
        ? { kind: 'jacket', data: defaultJacketState(jacket) }
        : { kind: 'jersey-short', data: defaultJerseyState(shortJerseys) },
    ),
  );
  const [submitting, setSubmitting] = useState(false);

  const variantById = useMemo(() => {
    const map = new Map<string, Product>();
    for (const v of shortJerseys) map.set(v.id, v);
    return map;
  }, [shortJerseys]);

  // Squad-number reservations are scoped per product variant, so the takenMap
  // we hand to each jersey slot must filter by that slot's selected productId.
  function takenForProduct(productId: string): Map<string, string> {
    return new Map(
      takenPlayers.filter((p) => p.product_id === productId).map((p) => [p.number, p.name]),
    );
  }

  function updateJerseySlot(index: number, patch: Partial<JerseySlotState>) {
    setSlots((prev) =>
      prev.map((s, i) =>
        i === index && s.kind === 'jersey-short' ? { ...s, data: { ...s.data, ...patch } } : s,
      ),
    );
  }

  function updateJacketSlot(index: number, patch: Partial<JacketSlotState>) {
    setSlots((prev) =>
      prev.map((s, i) =>
        i === index && s.kind === 'jacket' ? { ...s, data: { ...s.data, ...patch } } : s,
      ),
    );
  }

  // Per-slot validation messages — collected here so the bottom bar can show a
  // single "fix N issues" hint, while each slot still highlights its own row.
  const slotIssues: string[][] = slots.map((slot, i) => {
    const issues: string[] = [];
    if (slot.kind === 'jersey-short') {
      const product = variantById.get(slot.data.productId);
      if (!product) {
        issues.push('Pick a jersey colour');
        return issues;
      }
      const trimmedNumber = slot.data.number.trim();
      const trimmedName = slot.data.name.trim().toUpperCase();
      if (trimmedNumber !== '' && !/^[0-9]{1,3}$/.test(trimmedNumber)) {
        issues.push('Number must be 1 to 3 digits');
      }
      if (slot.data.playerType === 'player' && trimmedNumber) {
        const taken = takenForProduct(slot.data.productId);
        const claimant = taken.get(trimmedNumber);
        if (claimant && claimant !== trimmedName) {
          issues.push(`#${trimmedNumber} taken by ${claimant} on this colour`);
        }
      }
      // Cross-slot collision: same product + same number + player_type=player but
      // different names is invalid even before the API sees it.
      for (let j = 0; j < slots.length; j += 1) {
        if (j === i) continue;
        const other = slots[j];
        if (other.kind !== 'jersey-short') continue;
        if (other.data.productId !== slot.data.productId) continue;
        if (slot.data.playerType !== 'player' || other.data.playerType !== 'player') continue;
        if (!trimmedNumber || !other.data.number.trim()) continue;
        if (trimmedNumber !== other.data.number.trim()) continue;
        const otherName = other.data.name.trim().toUpperCase();
        if (trimmedName && otherName && trimmedName !== otherName) {
          issues.push(`#${trimmedNumber} clashes with another slot on this colour`);
          break;
        }
      }
    } else {
      if (!slot.data.sport) issues.push('Pick your sport');
    }
    return issues;
  });

  const totalIssues = slotIssues.reduce((sum, arr) => sum + arr.length, 0);

  const total = slots.reduce((sum, slot) => {
    if (slot.kind === 'jersey-short') {
      const product = variantById.get(slot.data.productId);
      if (!product) return sum;
      return sum + effectiveUnitPrice(Number(product.price), slot.data.size, 'jersey');
    }
    if (slot.kind === 'jacket' && jacket) {
      return sum + effectiveUnitPrice(Number(jacket.price), slot.data.size, 'jacket');
    }
    return sum;
  }, 0);

  function handleAdd() {
    if (totalIssues > 0) {
      toast.error(`Fix ${totalIssues} issue${totalIssues === 1 ? '' : 's'} before adding`);
      return;
    }
    setSubmitting(true);

    const lines: Omit<CartItem, 'lineId'>[] = [];
    for (const slot of slots) {
      if (slot.kind === 'jersey-short') {
        const product = variantById.get(slot.data.productId);
        if (!product) continue;
        const cleanedName = slot.data.name.trim().toUpperCase();
        const cleanedNumber = slot.data.number.trim();
        lines.push({
          productId: product.id,
          slug: product.slug,
          name: product.name,
          category: 'jersey',
          sleeve_type: product.sleeve_type,
          image_url: product.image_url,
          size: slot.data.size,
          quantity: 1,
          unit_price: Number(product.price),
          player_name: cleanedName || null,
          player_number: cleanedNumber || null,
          player_type: slot.data.playerType,
        });
      } else if (slot.kind === 'jacket' && jacket) {
        lines.push({
          productId: jacket.id,
          slug: jacket.slug,
          name: jacket.name,
          category: 'jacket',
          sleeve_type: jacket.sleeve_type,
          image_url: jacket.image_url,
          size: slot.data.size,
          quantity: 1,
          unit_price: Number(jacket.price),
          player_name: sportLabel(slot.data.sport) ?? null,
          player_number: null,
          player_type: 'player',
        });
      }
    }

    for (const line of lines) add(line);
    toast.success(`${combo.name} added — ${lines.length} item${lines.length === 1 ? '' : 's'} in cart`);
    setTimeout(() => setSubmitting(false), 250);
  }

  return (
    <div className="grid grid-cols-12 gap-6 lg:gap-10">
      <div className="col-span-12 lg:col-span-8 space-y-6">
        {slots.map((slot, i) => {
          const meta = combo.slots[i];
          const issues = slotIssues[i];
          if (slot.kind === 'jersey-short') {
            return (
              <JerseySlotCard
                key={i}
                index={i}
                meta={meta}
                state={slot.data}
                variants={shortJerseys}
                takenMap={takenForProduct(slot.data.productId)}
                issues={issues}
                onChange={(patch) => updateJerseySlot(i, patch)}
              />
            );
          }
          if (slot.kind === 'jacket' && jacket) {
            return (
              <JacketSlotCard
                key={i}
                meta={meta}
                state={slot.data}
                jacket={jacket}
                issues={issues}
                onChange={(patch) => updateJacketSlot(i, patch)}
              />
            );
          }
          return null;
        })}
      </div>

      <aside className="col-span-12 lg:col-span-4">
        <div className="lg:sticky lg:top-28 border border-line bg-canvas p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">Bundle total</p>
          <p className="mt-2 font-display font-extrabold text-5xl">{formatMYR(total)}</p>
          <p className="mt-2 text-[12px] text-muted body-lede">
            {slots.length} item{slots.length === 1 ? '' : 's'}, fully customized, ready to ship from
            30 May. Match-day kit locked in before the queue catches up.
          </p>

          {totalIssues > 0 && (
            <p className="mt-4 text-[12px] font-mono uppercase tracking-[0.16em] text-flame-red">
              {totalIssues} issue{totalIssues === 1 ? '' : 's'} to fix
            </p>
          )}

          <button
            type="button"
            onClick={handleAdd}
            disabled={submitting || totalIssues > 0}
            className="mt-5 w-full bg-ink text-canvas h-14 px-6 inline-flex items-center justify-between hover:bg-flame-red transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-heading font-semibold"
          >
            <span className="text-[15px]">Add bundle to cart</span>
            <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>
      </aside>
    </div>
  );
}

type JerseySlotProps = {
  index: number;
  meta: ComboSlot;
  state: JerseySlotState;
  variants: Product[];
  takenMap: Map<string, string>;
  issues: string[];
  onChange: (patch: Partial<JerseySlotState>) => void;
};

function JerseySlotCard({ index, meta, state, variants, takenMap, issues, onChange }: JerseySlotProps) {
  const selected = variants.find((v) => v.id === state.productId) ?? variants[0];
  const sizes = selected?.sizes?.length ? selected.sizes : (SIZES as readonly string[]);
  const availableSizes = useMemo(
    () => SIZES.filter((s) => sizes.includes(s)),
    [sizes],
  );
  const trimmedNumber = state.number.trim();
  const trimmedName = state.name.trim().toUpperCase();
  const claimant =
    state.playerType === 'player' && trimmedNumber ? takenMap.get(trimmedNumber) : undefined;
  const numberConflict = !!claimant && claimant !== trimmedName;

  return (
    <section className="border border-line bg-canvas p-6">
      <header className="flex items-center justify-between mb-5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            Slot {String(index + 1).padStart(2, '0')}
          </p>
          <p className="mt-1 font-display font-extrabold text-2xl">{meta.label}</p>
        </div>
        <p className="font-mono text-[13px] text-ink-soft">
          {formatMYR(effectiveUnitPrice(Number(selected?.price ?? 0), state.size, 'jersey'))}
        </p>
      </header>

      <div className="space-y-5">
        <div>
          <Label>Color</Label>
          <div
            className="grid gap-px bg-line border border-line"
            style={{ gridTemplateColumns: `repeat(${variants.length}, minmax(0, 1fr))` }}
          >
            {variants.map((v) => {
              const active = state.productId === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => onChange({ productId: v.id })}
                  className={`p-3 flex items-center gap-3 text-left transition-colors ${
                    active ? 'bg-ink text-canvas' : 'bg-canvas hover:bg-paper'
                  }`}
                >
                  <div
                    className={`relative w-12 h-12 shrink-0 overflow-hidden border ${
                      active ? 'border-canvas/30' : 'border-line bg-paper'
                    }`}
                  >
                    <Image src={v.image_url} alt="" fill className="object-cover" sizes="48px" />
                  </div>
                  <span className="font-mono text-[11px] uppercase tracking-[0.16em]">{v.color}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
          <div>
            <Label>Player name (optional)</Label>
            <Input
              value={state.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="AIMAN or leave blank"
              maxLength={14}
              className="uppercase font-heading"
            />
          </div>
          <div>
            <Label>Number (optional)</Label>
            <Input
              value={state.number}
              onChange={(e) =>
                onChange({ number: e.target.value.replace(/\D/g, '').slice(0, 3) })
              }
              placeholder="07"
              inputMode="numeric"
              className="w-24 text-center font-mono"
            />
          </div>
        </div>

        <div>
          <Label>Status</Label>
          <div className="grid grid-cols-2 gap-px bg-line border border-line">
            {(['player', 'non_player'] as PlayerType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onChange({ playerType: t })}
                className={`h-11 text-[13px] font-heading transition-colors ${
                  state.playerType === t ? 'bg-ink text-canvas' : 'bg-canvas hover:bg-paper'
                }`}
              >
                {t === 'player' ? 'Player' : 'Non player'}
              </button>
            ))}
          </div>
        </div>

        {numberConflict && claimant && (
          <div className="border border-flame-red bg-flame-red/5 p-3">
            <p className="text-[13px] font-heading">
              #{trimmedNumber} claimed by{' '}
              <span className="bg-ink text-canvas px-2 py-0.5 font-mono text-[11px]">{claimant}</span>{' '}
              on {selected?.color ?? 'this colour'}.
            </p>
          </div>
        )}

        <div>
          <Label>Size</Label>
          <div className="grid grid-cols-6 gap-px bg-line border border-line">
            {availableSizes.map((s) => {
              const sc = sizeSurcharge(s, 'jersey');
              const active = state.size === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => onChange({ size: s })}
                  className={`h-11 text-[12px] font-mono transition-colors flex flex-col items-center justify-center ${
                    active ? 'bg-ink text-canvas' : 'bg-canvas hover:bg-paper'
                  }`}
                >
                  <span>{s}</span>
                  {sc > 0 && (
                    <span
                      className={`text-[9px] ${active ? 'text-canvas/70' : 'text-flame-red'}`}
                    >
                      +{sc}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {issues.length > 0 && (
          <ul className="text-[12px] text-flame-red font-mono uppercase tracking-[0.14em] space-y-1">
            {issues.map((msg) => (
              <li key={msg}>· {msg}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

type JacketSlotProps = {
  meta: ComboSlot;
  state: JacketSlotState;
  jacket: Product;
  issues: string[];
  onChange: (patch: Partial<JacketSlotState>) => void;
};

function JacketSlotCard({ meta, state, jacket, issues, onChange }: JacketSlotProps) {
  const sizes = jacket.sizes?.length ? jacket.sizes : (SIZES as readonly string[]);
  const availableSizes = useMemo(
    () => SIZES.filter((s) => sizes.includes(s)),
    [sizes],
  );

  return (
    <section className="border border-line bg-canvas p-6">
      <header className="flex items-center justify-between mb-5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">Slot 03</p>
          <p className="mt-1 font-display font-extrabold text-2xl">{meta.label}</p>
        </div>
        <p className="font-mono text-[13px] text-ink-soft">
          {formatMYR(effectiveUnitPrice(Number(jacket.price), state.size, 'jacket'))}
        </p>
      </header>

      <div className="border-2 border-flame-red bg-flame-red/5 p-4 mb-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-flame-red">
          Suite Games athletes only
        </p>
        <p className="mt-2 text-[13px] text-ink/80 body-lede">
          Honour system. Pick this only if you are competing for UiTM Kuala Terengganu at Suite
          Games 2026. Admin verifies against the squad list before fulfilment.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <Label>Your sport</Label>
          <select
            value={state.sport}
            onChange={(e) => onChange({ sport: e.target.value })}
            className="w-full h-12 px-3 border border-line bg-canvas text-[14px] font-heading focus:outline-none focus:border-ink"
          >
            <option value="">Select sport</option>
            <optgroup label="Berpasukan">
              {SUITE_SPORTS.filter((s) => s.kind === 'team' || s.kind === 'team_mixed').map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                  {s.kind === 'team_mixed' ? ' (Campuran)' : ''}
                </option>
              ))}
            </optgroup>
            <optgroup label="Individu">
              {SUITE_SPORTS.filter((s) => s.kind === 'individual').map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        <div className="border border-flame-red/40 bg-flame-red/5 px-3 py-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-flame-red">
            Sizing runs slim — go up one size
          </p>
          <p className="mt-1 text-[12px] text-ink/80">
            Usually wear S, pick M. Wear M, pick L. Same logic for the rest.
          </p>
        </div>

        <div>
          <Label>Size</Label>
          <div className="grid grid-cols-6 gap-px bg-line border border-line">
            {availableSizes.map((s) => {
              const sc = sizeSurcharge(s, 'jacket');
              const active = state.size === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => onChange({ size: s })}
                  className={`h-11 text-[12px] font-mono transition-colors flex flex-col items-center justify-center ${
                    active ? 'bg-ink text-canvas' : 'bg-canvas hover:bg-paper'
                  }`}
                >
                  <span>{s}</span>
                  {sc > 0 && (
                    <span
                      className={`text-[9px] ${active ? 'text-canvas/70' : 'text-flame-red'}`}
                    >
                      +{sc}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {issues.length > 0 && (
          <ul className="text-[12px] text-flame-red font-mono uppercase tracking-[0.14em] space-y-1">
            {issues.map((msg) => (
              <li key={msg}>· {msg}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
