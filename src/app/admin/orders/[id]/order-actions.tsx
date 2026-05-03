'use client';

import { useEffect, useState, useTransition } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Check, Truck, X, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/input';
import type { OrderStatus } from '@/lib/types';

const ACTIONS: { label: string; status: OrderStatus; icon: React.ElementType; tone: string }[] = [
  { label: 'Approve · paid', status: 'paid', icon: Check, tone: 'bg-[#0f5132] text-white hover:opacity-90' },
  { label: 'Mark shipped', status: 'shipped', icon: Truck, tone: 'bg-ink text-canvas hover:bg-accent' },
  { label: 'Mark completed', status: 'completed', icon: Check, tone: 'border border-line hover:border-ink' },
  { label: 'Reject', status: 'rejected', icon: X, tone: 'bg-accent text-white hover:opacity-90' },
];

export function OrderActions({
  id,
  currentStatus,
  currentNote,
  receiptPath,
}: {
  id: string;
  currentStatus: OrderStatus;
  currentNote: string;
  receiptPath: string | null;
}) {
  const router = useRouter();
  const [note, setNote] = useState(currentNote);
  const [pending, startTransition] = useTransition();
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!receiptPath) return;
    fetch(`/api/admin/receipt-url?path=${encodeURIComponent(receiptPath)}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.url) setSignedUrl(j.url);
      })
      .catch(() => {});
  }, [receiptPath]);

  function update(payload: { status?: OrderStatus; admin_note?: string }) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/orders/${id}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? 'Failed');
        toast.success('Updated');
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed');
      }
    });
  }

  return (
    <div className="space-y-6">
      {receiptPath && (
        <div className="border border-line p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="eyebrow">Receipt</p>
            {signedUrl && (
              <a
                href={signedUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[12px] hover:text-accent inline-flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" strokeWidth={1.5} /> Open full
              </a>
            )}
          </div>
          {signedUrl ? (
            <div className="relative aspect-[3/4] bg-paper border border-line">
              <Image src={signedUrl} alt="Receipt" fill className="object-contain p-2" unoptimized />
            </div>
          ) : (
            <p className="text-[13px] text-muted">Loading receipt…</p>
          )}
        </div>
      )}

      <div className="border border-line p-5 space-y-3">
        <p className="eyebrow">Actions</p>
        <p className="text-[12px] text-muted">Current: <span className="text-ink">{currentStatus}</span></p>
        <div className="grid grid-cols-1 gap-2 mt-2">
          {ACTIONS.filter((a) => a.status !== currentStatus).map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.status}
                type="button"
                disabled={pending}
                onClick={() => update({ status: a.status })}
                className={`h-11 px-4 inline-flex items-center justify-between text-[13px] disabled:opacity-50 ${a.tone}`}
              >
                <span>{a.label}</span>
                <Icon className="w-4 h-4" strokeWidth={1.5} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="border border-line p-5">
        <p className="eyebrow mb-3">Internal note</p>
        <Textarea
          placeholder="Add a note for this order…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button
          type="button"
          disabled={pending || note === currentNote}
          onClick={() => update({ admin_note: note })}
          className="mt-3 h-10 px-4 border border-line hover:border-ink text-[13px] disabled:opacity-50"
        >
          Save note
        </button>
      </div>
    </div>
  );
}
