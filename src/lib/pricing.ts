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

export function sizeSurcharge(size: string): number {
  switch (size.toUpperCase()) {
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

export function effectiveUnitPrice(basePrice: number, size: string): number {
  return Number(basePrice) + sizeSurcharge(size);
}

export function lineSubtotal(basePrice: number, size: string, qty: number): number {
  return effectiveUnitPrice(basePrice, size) * qty;
}

export function surchargeLabel(size: string): string {
  const s = sizeSurcharge(size);
  return s > 0 ? `+RM ${s}.00` : '';
}
