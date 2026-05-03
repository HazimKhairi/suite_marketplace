'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/lib/cart';
import { formatMYR } from '@/lib/utils';
import { Input, Label } from '@/components/ui/input';
import type { Product, CartItem } from '@/lib/types';
import type { PlayerType } from '@/lib/teams';

export function ProductPurchase({ product }: { product: Product }) {
  const router = useRouter();
  const { add } = useCart();
  const isJacket = product.category === 'jacket';

  const [size, setSize] = useState<string>(product.sizes[1] ?? product.sizes[0]);
  const [qty, setQty] = useState(1);
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [playerType, setPlayerType] = useState<PlayerType>('player');
  const [adding, setAdding] = useState(false);

  const max = Math.max(1, product.stock);
  const outOfStock = product.stock === 0;

  const errors: string[] = [];
  if (!isJacket) {
    if (name.trim().length < 2) errors.push('Nama (min 2 huruf)');
    if (!/^[0-9]{1,3}$/.test(number.trim())) errors.push('Nombor (1–3 digit)');
  }

  function build(): Omit<CartItem, 'lineId'> {
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
      player_name: isJacket ? null : name.trim().toUpperCase(),
      player_number: isJacket ? null : number.trim(),
      player_type: isJacket ? null : playerType,
    };
  }

  function handleAdd(navigate: boolean) {
    if (outOfStock) return;
    if (errors.length > 0) {
      toast.error(`Tolong isi: ${errors.join(', ')}`);
      return;
    }
    setAdding(true);
    add(build());
    toast.success(
      isJacket
        ? `Added · ${product.name} · ${size} × ${qty}`
        : `Added · ${name.toUpperCase()} #${number} · ${size} × ${qty}`,
    );
    setTimeout(() => setAdding(false), 250);
    if (navigate) router.push('/checkout');
    else {
      // Reset name/number so user can add a different player quickly
      if (!isJacket) {
        setName('');
        setNumber('');
      }
    }
  }

  return (
    <div className="space-y-7">
      {!isJacket && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
            <div>
              <Label>Nama (untuk dibelakang baju)</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="AIMAN"
                maxLength={14}
                className="uppercase"
              />
            </div>
            <div>
              <Label>Nombor</Label>
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

          <div>
            <Label>Status</Label>
            <div className="grid grid-cols-2 gap-px bg-line border border-line">
              {([
                { v: 'player' as PlayerType, label: 'Player VB' },
                { v: 'non_player' as PlayerType, label: 'Non-player VB' },
              ]).map((opt) => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => setPlayerType(opt.v)}
                  className={`h-12 text-[13px] transition-colors ${
                    playerType === opt.v ? 'bg-ink text-canvas' : 'bg-canvas hover:bg-paper'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div>
        <Label>Size</Label>
        <div className="grid grid-cols-5 gap-px bg-line border border-line">
          {product.sizes.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSize(s)}
              className={`h-12 text-[13px] font-mono transition-colors ${
                size === s ? 'bg-ink text-canvas' : 'bg-canvas hover:bg-paper'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>Quantity</Label>
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
        {product.stock < 10 && product.stock > 0 && (
          <p className="mt-3 text-[12px] text-accent font-mono uppercase tracking-[0.14em]">
            Only {product.stock} left
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 pt-2">
        <button
          type="button"
          onClick={() => handleAdd(true)}
          disabled={outOfStock || adding}
          className="bg-ink text-canvas h-14 px-6 inline-flex items-center justify-between hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-[15px]">
            {outOfStock ? 'Sold out' : `Buy now · ${formatMYR(product.price * qty)}`}
          </span>
          <ShoppingBag className="w-4 h-4" strokeWidth={1.5} />
        </button>
        <button
          type="button"
          onClick={() => handleAdd(false)}
          disabled={outOfStock || adding}
          className="border border-line h-12 px-6 inline-flex items-center justify-center gap-2 hover:border-ink transition-colors disabled:opacity-50 text-[14px]"
        >
          {isJacket ? 'Add to cart' : 'Add another player'} <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
        </button>
        {!isJacket && (
          <p className="text-[12px] text-muted leading-relaxed">
            Tip — kalau sorang nak dua size (contoh M & L untuk nama yang sama),
            tekan <em>Add another player</em>, tukar size, klik add lagi sekali.
          </p>
        )}
      </div>
    </div>
  );
}
