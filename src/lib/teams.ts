export const TEAM = {
  id: 'vb_uitmkt',
  short: 'VB UITMKT',
  name: 'Volleyball · UiTM Kuala Terengganu',
  fullName: 'UiTM Kuala Terengganu — Volleyball',
  campus: 'UiTM Kuala Terengganu',
} as const;

export const ORG_CONTACT = {
  phone: '0139604899',
  phoneDisplay: '013-960 4899',
  // RM to list a product if other sports / clubs want in
  listingFee: 15,
};

export const SLEEVE = {
  short: { id: 'short', label: 'Lengan pendek', priceLabel: 'RM 28' },
  long: { id: 'long', label: 'Lengan panjang', priceLabel: 'RM 33' },
} as const;

export type SleeveId = keyof typeof SLEEVE;

export type PlayerType = 'player' | 'non_player';
