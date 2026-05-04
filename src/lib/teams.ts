export const TEAM = {
  id: 'suite_uitmkt',
  short: 'SUITE UITMKT',
  name: 'Suite · UiTM Kuala Terengganu',
  fullName: 'UiTM Kuala Terengganu · Suite Games 2026',
  campus: 'UiTM Kuala Terengganu',
} as const;

export const ORG_CONTACT = {
  phone: '0139604899',
  phoneDisplay: '013-960 4899',
  // International format (no leading 0, country code 60) for wa.me / tel links
  whatsapp: '60139604899',
  whatsappUrl: 'https://wa.me/60139604899',
  // RM to list a product if other sports / clubs want in
  listingFee: 15,
};

export const SLEEVE = {
  short: { id: 'short', label: 'Lengan pendek', priceLabel: 'RM 28' },
  long: { id: 'long', label: 'Lengan panjang', priceLabel: 'RM 33' },
} as const;

export type SleeveId = keyof typeof SLEEVE;

export type PlayerType = 'player' | 'non_player';
