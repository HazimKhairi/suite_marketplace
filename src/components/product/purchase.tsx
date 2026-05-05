'use client';

import { useEffect, useMemo, useState } from 'react';
import { Minus, Plus, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/lib/cart';
import { formatMYR } from '@/lib/utils';
import { effectiveUnitPrice, sizeSurcharge, surchargeLabel, SIZES } from '@/lib/pricing';
import { Input, Label } from '@/components/ui/input';
import { SizeChart } from '@/components/product/size-chart';
import { SUITE_SPORTS, sportLabel } from '@/lib/sports';
import type { Product, CartItem } from '@/lib/types';
import type { PlayerType } from '@/lib/teams';
import type { TakenPlayer } from '@/lib/players';

type Props = {
  product: Product;
  takenPlayers?: TakenPlayer[];
};

export function ProductPurchase({ product, takenPlayers = [] }: Props) {
  const { add } = useCart();
  const isJacket = product.category === 'jacket';

  const takenMap = useMemo(
    () =>
      new Map(
        takenPlayers
          .filter((p) => p.product_id === product.id)
          .map((p) => [p.number, p.name]),
      ),
    [takenPlayers, product.id],
  );

  // Filter sizes: prefer the product.sizes array if available
  const availableSizes = useMemo<string[]>(
    () =>
      product.sizes?.length
        ? SIZES.filter((s) => product.sizes.includes(s))
        : Array.from(SIZES),
    [product.sizes],
  );

  const [size, setSize] = useState<string>(availableSizes[1] ?? availableSizes[0]);
  const [qty, setQty] = useState(1);

  // When the parent swaps to a sibling variant, keep size selection if still valid;
  // otherwise fall back to the variant's default so the form never carries a ghost size.
  useEffect(() => {
    if (!availableSizes.includes(size)) {
      setSize(availableSizes[1] ?? availableSizes[0]);
    }
  }, [product.id, availableSizes, size]);
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [playerType, setPlayerType] = useState<PlayerType>('non_player');
  const [adding, setAdding] = useState(false);
  const [sport, setSport] = useState<string>('');

  const max = Math.max(1, product.stock);
  const outOfStock = product.stock === 0;
  const surcharge = sizeSurcharge(size, product.category);
  const unit = effectiveUnitPrice(Number(product.price), size, product.category);

  const trimmedNumber = number.trim();
  const trimmedName = name.trim().toUpperCase();
  const existingClaimant =
    !isJacket && playerType === 'player' && trimmedNumber ? takenMap.get(trimmedNumber) : undefined;
  const numberConflict = !!existingClaimant && existingClaimant !== trimmedName;

  const errors: string[] = [];
  if (!isJacket) {
    // Name and number are optional. The only blocker is a number that collides with
    // another player's existing claim. Length / digit format is checked only when the
    // shopper actually types something.
    if (number !== '' && !/^[0-9]{1,3}$/.test(trimmedNumber)) {
      errors.push('Player number (1 to 3 digits or leave blank)');
    }
    if (numberConflict) errors.push(`Number ${trimmedNumber} is taken by ${existingClaimant}`);
  } else {
    if (!sport) errors.push('Pick your sport');
  }

  function build(): Omit<CartItem, 'lineId'> {
    const cleanedName = name.trim().toUpperCase();
    const cleanedNumber = number.trim();
    // Jacket lines reuse player_name to carry the athlete's sport so admin sees it
    // on the order detail without a schema change.
    return {
      productId: product.id,
      slug: product.slug,
      name: product.name,
      category: product.category,
      sleeve_type: product.sleeve_type,
      image_url: product.image_url,
      size,
      quantity: qty,
      unit_price: Number(product.price),
      player_name: isJacket ? (sportLabel(sport) ?? null) : cleanedName || null,
      player_number: isJacket ? null : cleanedNumber || null,
      player_type: isJacket ? 'player' : playerType,
    };
  }

  function handleAdd() {
    if (outOfStock) return;
    if (errors.length > 0) {
      toast.error(`Please fix: ${errors.join(', ')}`);
      return;
    }
    setAdding(true);
    add(build());

    let label: string;
    if (isJacket) {
      label = `${product.name} · ${sportLabel(sport) ?? sport}`;
    } else {
      const tag = [trimmedName, trimmedNumber ? `#${trimmedNumber}` : '']
        .filter(Boolean)
        .join(' ');
      label = tag || 'Blank jersey';
    }
    toast.success(`Added ${label}, size ${size}, qty ${qty}`);
    setTimeout(() => setAdding(false), 250);
  }

  return (
    <div className="space-y-7">
      {isJacket && (
        <div
          className={`border-2 transition-colors p-5 ${
            sport ? 'border-leaf bg-leaf/5' : 'border-flame-red bg-flame-red/5'
          }`}
        >
          <p
            className={`font-mono text-[10px] uppercase tracking-[0.18em] ${
              sport ? 'text-leaf' : 'text-flame-red'
            }`}
          >
            Suite Games athletes only
          </p>
          <p className="mt-2 font-display font-extrabold text-xl leading-tight">
            Only available for SUITE&rsquo;s athletes.
          </p>
          <p className="mt-2 text-[13px] body-lede text-muted">
            We dropped the passcode gate. It was friction nobody asked for, and team managers were
            tired of relaying it. The honour stays with you — pick this only if you are actually
            competing for UiTM Kuala Terengganu at Suite Games 2026. Non-athletes, please grab a
            jersey instead. Admin checks the squad list before fulfilment, and any jacket bought
            outside the roster will be cancelled and refunded.
          </p>

          <div className="mt-5">
            <Label>Your sport</Label>
            <select
              value={sport}
              onChange={(e) => setSport(e.target.value)}
              className="w-full h-12 px-3 border border-line bg-canvas text-[14px] font-heading focus:outline-none focus:border-ink"
            >
              <option value="">Select sport</option>
              <optgroup label="Berpasukan">
                {SUITE_SPORTS.filter((s) => s.kind === 'team' || s.kind === 'team_mixed').map(
                  (s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                      {s.kind === 'team_mixed' ? ' (Campuran)' : ''}
                    </option>
                  ),
                )}
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
        </div>
      )}

      {!isJacket && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
            <div>
              <Label>Player name (optional, printed on the back)</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="AIMAN or leave blank"
                maxLength={14}
                className="uppercase font-heading"
              />
            </div>
            <div>
              <Label>Number (optional)</Label>
              <Input
                value={number}
                onChange={(e) =>
                  setNumber(e.target.value.replace(/\D/g, '').slice(0, 3))
                }
                placeholder="07"
                inputMode="numeric"
                className="w-24 text-center font-mono"
              />
            </div>
          </div>
          <p className="-mt-3 text-[12px] text-muted body-lede">
            Leave name and number blank if the wearer prefers a clean jersey. Otherwise we print
            both on the back.
          </p>

          <div>
            <Label>Status</Label>
            <div className="grid grid-cols-2 gap-px bg-line border border-line">
              {([
                { v: 'player' as PlayerType, label: 'Player' },
                { v: 'non_player' as PlayerType, label: 'Non player' },
              ]).map((opt) => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => setPlayerType(opt.v)}
                  className={`h-12 text-[13px] font-heading transition-colors ${
                    playerType === opt.v ? 'bg-ink text-canvas' : 'bg-canvas hover:bg-paper'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[12px] text-muted body-lede">
              Only players need a unique squad number. Non players can share any digit.
            </p>
          </div>

          {numberConflict && existingClaimant && (
            <div className="border border-flame-red bg-flame-red/5 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-flame-red">
                Number taken
              </p>
              <p className="mt-2 text-[14px] font-heading">
                #{trimmedNumber} has been claimed by{' '}
                <span className="bg-ink text-canvas px-2 py-0.5 font-mono text-[12px]">
                  {existingClaimant}
                </span>
                . Pick another number, or switch to <em>Non player</em> if you are not on the squad.
              </p>
            </div>
          )}
        </>
      )}

      <div>
        <div className="flex items-baseline justify-between mb-2">
          <Label className="mb-0">Size</Label>
          <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted">
            {isJacket ? (
              <>
                3XL and up <span className="text-flame-red">+RM 15</span>
              </>
            ) : (
              <>
                3XL to 6XL <span className="text-flame-red">+RM 5</span>
                <span className="mx-2 text-line">/</span>
                7XL to 8XL <span className="text-flame-red">+RM 10</span>
              </>
            )}
          </p>
        </div>
        {isJacket && (
          <div className="mb-2 border border-flame-red/40 bg-flame-red/5 px-3 py-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-flame-red">
              Sizing runs slim — go up one size
            </p>
            <p className="mt-1 text-[12px] text-ink/80">
              Usually wear S, pick M. Wear M, pick L. Same logic for the rest. Size chart below is the actual jacket measurement, not your usual fit.
            </p>
          </div>
        )}
        <div className="grid grid-cols-5 sm:grid-cols-6 gap-px bg-line border border-line">
          {availableSizes.map((s) => {
            const sc = sizeSurcharge(s, product.category);
            return (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                className={`h-12 text-[13px] font-mono transition-colors flex flex-col items-center justify-center gap-0 ${
                  size === s ? 'bg-ink text-canvas' : 'bg-canvas hover:bg-paper'
                }`}
              >
                <span>{s}</span>
                {sc > 0 && (
                  <span
                    className={`text-[9px] tracking-wider ${
                      size === s ? 'text-canvas/70' : 'text-flame-red'
                    }`}
                  >
                    +{sc}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="mt-3">
          <SizeChart selectedSize={size} />
        </div>
      </div>

      <div>
        <Label>Quantity</Label>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="inline-flex items-stretch border border-line">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              className="w-12 h-12 inline-flex items-center justify-center hover:bg-paper disabled:opacity-40"
              aria-label="Decrease"
            >
              <Minus className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <div className="w-14 h-12 inline-flex items-center justify-center font-mono text-[15px] border-x border-line">
              {qty}
            </div>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(max, q + 1))}
              disabled={qty >= max}
              className="w-12 h-12 inline-flex items-center justify-center hover:bg-paper disabled:opacity-40"
              aria-label="Increase"
            >
              <Plus className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
          {surcharge > 0 && (
            <p className="text-[12px] font-mono uppercase tracking-[0.14em] text-flame-red">
              {size} surcharge {surchargeLabel(size, product.category)}
            </p>
          )}
          {product.stock < 10 && product.stock > 0 && (
            <p className="text-[12px] text-flame-red font-mono uppercase tracking-[0.14em]">
              Only {product.stock} left
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-2">
        <button
          type="button"
          onClick={handleAdd}
          disabled={outOfStock || adding || numberConflict}
          className="bg-ink text-canvas h-14 px-6 inline-flex items-center justify-between hover:bg-flame-red transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-heading font-semibold"
        >
          <span className="text-[15px]">
            {outOfStock
              ? 'Sold out'
              : numberConflict
                ? `Number ${trimmedNumber} taken`
                : `Add to cart / ${formatMYR(unit * qty)}`}
          </span>
          <ShoppingBag className="w-4 h-4" strokeWidth={1.5} />
        </button>
        {!isJacket && (
          <p className="text-[12px] text-muted body-lede">
            Need extra lines for the same player. Switch sleeve or size, then click{' '}
            <em>Add to cart</em> again. Name and number stay locked in. Head to the cart from the
            nav when you are ready to check out.
          </p>
        )}
      </div>
    </div>
  );
}
