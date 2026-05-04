export const SIZES = [
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  '3XL',
  '4XL',
  '5XL',
  '6XL',
  '7XL',
  '8XL',
] as const;

export type Size = (typeof SIZES)[number];

type Category = 'jersey' | 'jacket';

export function sizeSurcharge(size: string, category: Category = 'jersey'): number {
  const s = size.toUpperCase();
  if (category === 'jacket') {
    // Jacket: flat +RM 15 for any plus size (3XL and up).
    switch (s) {
      case '3XL':
      case '4XL':
      case '5XL':
      case '6XL':
      case '7XL':
      case '8XL':
        return 15;
      default:
        return 0;
    }
  }
  // Jersey: 3XL-6XL +RM 5, 7XL-8XL +RM 10.
  switch (s) {
    case '3XL':
    case '4XL':
    case '5XL':
    case '6XL':
      return 5;
    case '7XL':
    case '8XL':
      return 10;
    default:
      return 0;
  }
}

export function effectiveUnitPrice(
  basePrice: number,
  size: string,
  category: Category = 'jersey',
): number {
  return Number(basePrice) + sizeSurcharge(size, category);
}

export function lineSubtotal(
  basePrice: number,
  size: string,
  qty: number,
  category: Category = 'jersey',
): number {
  return effectiveUnitPrice(basePrice, size, category) * qty;
}

export function surchargeLabel(size: string, category: Category = 'jersey'): string {
  const s = sizeSurcharge(size, category);
  return s > 0 ? `+RM ${s}.00` : '';
}
