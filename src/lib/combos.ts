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

// Curated bundles. The price a buyer sees on each combo is computed at runtime
// from the variants they actually pick — bundles are about giving shoppers a
// faster path to the full kit, not a percentage off.
export const COMBOS: Combo[] = [
  {
    slug: 'set-aura',
    name: 'Set Aura',
    tagline: 'Two jerseys. Two moods. One squad.',
    body: 'Roll between match, training, and the campus walk in your own colours. Two short sleeve jerseys, each printed with your own name, number, and player status. Pick the same colour twice or split black and white — your call.',
    slots: [
      { kind: 'jersey-short', label: 'Jersey 1' },
      { kind: 'jersey-short', label: 'Jersey 2' },
    ],
  },
  {
    slug: 'set-athlete-professional',
    name: 'Set Athlete Professional',
    tagline: 'The full match-day kit. One bundle, one tap.',
    body: 'Built for SUITE athletes who refuse to roll up half-dressed. Two short sleeve jerseys plus the official Suite Games track jacket — court, field, warm-up locked in before kickoff. Each jersey carries your own name and number; the jacket carries your sport. Reserved for Suite Games 2026 squads only.',
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
