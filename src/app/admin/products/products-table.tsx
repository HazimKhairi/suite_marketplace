'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { TEAM } from '@/lib/teams';
import { formatMYR } from '@/lib/utils';
import type { Product } from '@/lib/types';

type Editable = { stock: number; price: number; active: boolean };

export function ProductsTable({ initial }: { initial: Product[] }) {
  const [rows, setRows] = useState(initial);
  const [edits, setEdits] = useState<Record<string, Partial<Editable>>>({});
  const [pending, startTransition] = useTransition();

  function setEdit(id: string, patch: Partial<Editable>) {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  function save(id: string) {
    const patch = edits[id];
    if (!patch) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/products/${id}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(patch),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? 'Failed');
        setRows((prev) => prev.map((p) => (p.id === id ? { ...p, ...json } : p)));
        setEdits((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        toast.success('Saved');
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed');
      }
    });
  }

  return (
    <div className="border border-line overflow-x-auto">
      <div className="min-w-[820px]">
        <div className="grid grid-cols-12 gap-3 px-5 py-3 bg-paper border-b border-line font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          <div className="col-span-4">Product</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Price (MYR)</div>
          <div className="col-span-2">Stock</div>
          <div className="col-span-1">Active</div>
          <div className="col-span-1 text-right">Save</div>
        </div>
        {rows.map((p) => {
          const edit = edits[p.id] ?? {};
          const stock = edit.stock ?? p.stock;
          const price = edit.price ?? Number(p.price);
          const active = edit.active ?? p.active;
          const dirty = Object.keys(edit).length > 0;
          return (
            <div
              key={p.id}
              className="grid grid-cols-12 gap-3 px-5 py-4 border-b border-line last:border-b-0 items-center"
            >
              <div className="col-span-4 flex items-center gap-3 min-w-0">
                <div className="relative w-12 h-14 bg-paper border border-line shrink-0">
                  <Image src={p.image_url} alt="" fill className="object-cover" sizes="48px" />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] truncate">{p.name}</p>
                  <p className="font-mono text-[11px] text-muted truncate">{p.slug}</p>
                </div>
              </div>
              <div className="col-span-2 text-[13px] min-w-0">
                <p className="truncate">{TEAM.short}</p>
                <p className="font-mono text-[10px] text-muted uppercase tracking-[0.14em] mt-0.5 truncate">
                  {p.category === 'jacket'
                    ? 'Jacket'
                    : p.sleeve_type === 'short'
                      ? 'Lengan pendek'
                      : 'Lengan panjang'}
                </p>
              </div>
              <div className="col-span-2 min-w-0">
                <input
                  type="number"
                  min={1}
                  step={0.01}
                  value={price}
                  onChange={(e) => setEdit(p.id, { price: Number(e.target.value) })}
                  className="w-full h-9 border border-line bg-paper px-2 font-mono text-[13px]"
                />
                <p className="font-mono text-[10px] text-muted mt-1 truncate">{formatMYR(price)}</p>
              </div>
              <div className="col-span-2 min-w-0">
                <input
                  type="number"
                  min={0}
                  value={stock}
                  onChange={(e) => setEdit(p.id, { stock: Math.max(0, Number(e.target.value)) })}
                  className="w-full h-9 border border-line bg-paper px-2 font-mono text-[13px]"
                />
              </div>
              <div className="col-span-1">
                <button
                  type="button"
                  onClick={() => setEdit(p.id, { active: !active })}
                  className={`h-7 px-3 text-[11px] font-mono uppercase tracking-[0.14em] ${
                    active ? 'bg-ink text-canvas' : 'border border-line text-muted'
                  }`}
                >
                  {active ? 'On' : 'Off'}
                </button>
              </div>
              <div className="col-span-1 text-right">
                <button
                  type="button"
                  onClick={() => save(p.id)}
                  disabled={!dirty || pending}
                  className="h-9 w-9 inline-flex items-center justify-center bg-ink text-canvas hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Save"
                >
                  <Save className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
