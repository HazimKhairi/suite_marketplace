'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Minus, Plus, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/lib/cart';
import { formatMYR } from '@/lib/utils';
import type { Product } from '@/lib/types';

export function ProductPurchase({ product }: { product: Product }) {
  const router = useRouter();
  const { add } = useCart();
  const [size, setSize] = useState<string>(product.sizes[1] ?? product.sizes[0]);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);

  const max = Math.max(1, product.stock);
  const outOfStock = product.stock === 0;

  function handleAdd(navigate: boolean) {
    if (outOfStock) return;
    setAdding(true);
    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image_url: product.image_url,
      size,
      quantity: qty,
      unit_price: product.price,
    });
    toast.success(`Added · ${product.name} · ${size} × ${qty}`);
    setTimeout(() => setAdding(false), 250);
    if (navigate) router.push('/checkout');
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow mb-3">Size</p>
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
        <p className="eyebrow mb-3">Quantity</p>
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

      <div className="flex flex-col gap-3">
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
          className="border border-line h-12 px-6 inline-flex items-center justify-center hover:border-ink transition-colors disabled:opacity-50 text-[14px]"
        >
          Add to cart
        </button>
      </div>
    </div>
  );
}
