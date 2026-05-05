export type ComboSlotKind = 'jersey-short' | 'jacket';

export type ComboSlot = {
  kind: ComboSlotKind;
  label: string;
};

export type Combo = {
  slug: string;
  name: string;
  tagline: string;
  body: string;
  slots: ComboSlot[];
};

// Curated bundles. No discount — combos exist purely so shoppers don't have to
// add lines one by one. The price tag a buyer sees on each combo is computed at
// runtime from the variants they actually pick.
export const COMBOS: Combo[] = [
  {
    slug: 'set-aura',
    name: 'Set Aura',
    tagline: 'Dua jersey, dua mood — tukar warna ikut suka hati.',
    body: 'Dua baju lengan pendek dalam satu drop. Pilih warna lain-lain ke, sama ke, terpulang. Setiap jersey custom sendiri — nama, nombor, status player atau non player.',
    slots: [
      { kind: 'jersey-short', label: 'Jersey 1' },
      { kind: 'jersey-short', label: 'Jersey 2' },
    ],
  },
  {
    slug: 'set-athlete-professional',
    name: 'Set Athlete Professional',
    tagline: 'Full kit drop — dua jersey plus track jacket.',
    body: 'Untuk athletes Suite Games yang nak settle padang, court, dan warm-up dalam satu order. Dua jersey lengan pendek, satu track jacket. Setiap jersey custom name dan nombor sendiri. Jacket terhad untuk peserta Suite Games sahaja.',
    slots: [
      { kind: 'jersey-short', label: 'Jersey 1' },
      { kind: 'jersey-short', label: 'Jersey 2' },
      { kind: 'jacket', label: 'Track Jacket' },
    ],
  },
];

export function findCombo(slug: string): Combo | undefined {
  return COMBOS.find((c) => c.slug === slug);
}
