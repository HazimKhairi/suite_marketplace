'use client';

import { useState } from 'react';
import { Ruler, ChevronDown } from 'lucide-react';

type Row = {
  size: string;
  chest: string;
  length: string;
  shoulder: string;
  sleeve: string;
  longSleeve: string;
};

const ROWS: Row[] = [
  { size: 'XS', chest: '18', length: '25', shoulder: '16', sleeve: '7', longSleeve: '21' },
  { size: 'S', chest: '19', length: '26', shoulder: '17', sleeve: '7.5', longSleeve: '21.5' },
  { size: 'M', chest: '20', length: '27', shoulder: '18', sleeve: '8', longSleeve: '22' },
  { size: 'L', chest: '21', length: '28', shoulder: '19', sleeve: '8.5', longSleeve: '22.5' },
  { size: 'XL', chest: '22', length: '29', shoulder: '20', sleeve: '9', longSleeve: '23' },
  { size: 'XXL', chest: '23', length: '30', shoulder: '21', sleeve: '9.5', longSleeve: '23.5' },
  { size: '3XL', chest: '24', length: '31', shoulder: '22', sleeve: '10', longSleeve: '24' },
  { size: '4XL', chest: '25', length: '32', shoulder: '23', sleeve: '10.5', longSleeve: '24.5' },
  { size: '5XL', chest: '26', length: '33', shoulder: '24', sleeve: '11', longSleeve: '25' },
];

const COLS: { key: keyof Row; label: string; tint: string }[] = [
  { key: 'chest', label: 'Chest', tint: 'text-flame-red' },
  { key: 'length', label: 'Length', tint: 'text-flame-purple' },
  { key: 'shoulder', label: 'Shoulder', tint: 'text-gold' },
  { key: 'sleeve', label: 'Sleeve', tint: 'text-leaf' },
  { key: 'longSleeve', label: 'Long sleeve', tint: 'text-ink' },
];

type Props = {
  selectedSize?: string;
  defaultOpen?: boolean;
};

export function SizeChart({ selectedSize, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-line">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 px-4 py-3 hover:bg-paper transition-colors"
        aria-expanded={open}
      >
        <span className="flex items-center gap-3">
          <Ruler className="w-4 h-4 text-flame-red" strokeWidth={1.5} />
          <span className="font-mono text-[11px] uppercase tracking-[0.16em]">
            Size chart — measurements in inches
          </span>
        </span>
        <ChevronDown
          className={`w-4 h-4 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
          strokeWidth={1.5}
        />
      </button>

      {open && (
        <div className="border-t border-line">
          <div className="grid grid-cols-12 gap-px bg-line">
            <div className="col-span-12 md:col-span-4 bg-canvas p-6 lg:p-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                How to measure
              </p>
              <p className="mt-3 font-display font-extrabold text-2xl leading-tight">
                Lay flat. <span className="text-flame-red">Measure across.</span> Compare.
              </p>
              <FitDiagram />
              <ul className="mt-6 space-y-2 text-[12px] text-muted body-lede list-none">
                <li>
                  <span className="font-mono text-flame-red">Chest</span> — armpit to armpit, lay
                  flat.
                </li>
                <li>
                  <span className="font-mono text-flame-purple">Length</span> — top of shoulder to
                  hem.
                </li>
                <li>
                  <span className="font-mono text-gold">Shoulder</span> — seam to seam across the
                  back.
                </li>
                <li>
                  <span className="font-mono text-leaf">Sleeve</span> — short cuff length from
                  shoulder seam.
                </li>
                <li>
                  <span className="font-mono text-ink">Long sleeve</span> — long cuff length from
                  shoulder seam.
                </li>
              </ul>
            </div>

            <div className="col-span-12 md:col-span-8 bg-canvas overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-line">
                    <th className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                      Size
                    </th>
                    {COLS.map((c) => (
                      <th
                        key={c.key}
                        className={`text-right px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] ${c.tint}`}
                      >
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((r) => {
                    const active = selectedSize === r.size;
                    return (
                      <tr
                        key={r.size}
                        className={`border-b border-line last:border-b-0 transition-colors ${
                          active ? 'bg-ink text-canvas' : 'hover:bg-paper'
                        }`}
                      >
                        <td
                          className={`px-4 py-3 font-mono text-[13px] tracking-wider ${
                            active ? 'text-canvas' : ''
                          }`}
                        >
                          {r.size}
                        </td>
                        {COLS.map((c) => (
                          <td
                            key={c.key}
                            className="text-right px-4 py-3 font-mono text-[13px] tabular-nums"
                          >
                            {r[c.key]}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="border-t border-line px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono uppercase tracking-[0.14em] text-muted">
                <span>1 inch ≈ 2.54 cm</span>
                <span>
                  Need 6XL–8XL? <span className="text-flame-red">WhatsApp admin to confirm fit.</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FitDiagram() {
  return (
    <svg
      viewBox="0 0 220 240"
      className="mt-6 w-full max-w-[200px] mx-auto"
      role="img"
      aria-label="Jersey measurement diagram"
    >
      {/* Jersey silhouette */}
      <path
        d="M55 40 L80 25 Q110 15 140 25 L165 40 L195 60 L185 95 L160 85 L160 220 L60 220 L60 85 L35 95 L25 60 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-ink"
      />
      <path
        d="M85 25 Q110 40 135 25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-ink"
      />

      {/* Chest line — flame-red */}
      <line
        x1="60"
        y1="115"
        x2="160"
        y2="115"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="3 3"
        className="text-flame-red"
      />
      <text
        x="110"
        y="110"
        textAnchor="middle"
        className="fill-flame-red font-mono"
        fontSize="9"
      >
        CHEST
      </text>

      {/* Length line — flame-purple */}
      <line
        x1="205"
        y1="40"
        x2="205"
        y2="220"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="3 3"
        className="text-flame-purple"
      />
      <text
        x="210"
        y="135"
        className="fill-flame-purple font-mono"
        fontSize="9"
        transform="rotate(90 210 135)"
      >
        LENGTH
      </text>

      {/* Shoulder line — gold */}
      <line
        x1="80"
        y1="30"
        x2="140"
        y2="30"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="3 3"
        className="text-gold"
      />
      <text
        x="110"
        y="22"
        textAnchor="middle"
        className="fill-gold font-mono"
        fontSize="9"
      >
        SHOULDER
      </text>

      {/* Sleeve indicator — leaf */}
      <line
        x1="35"
        y1="95"
        x2="60"
        y2="95"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="3 3"
        className="text-leaf"
      />
      <text
        x="15"
        y="100"
        className="fill-leaf font-mono"
        fontSize="9"
      >
        SLEEVE
      </text>
    </svg>
  );
}
