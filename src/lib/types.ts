export type ProductCategory = 'jersey' | 'jacket';

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: ProductCategory;
  sleeve_type: 'short' | 'long' | null;
  color: string;
  price: number;
  stock: number;
  image_url: string;
  description: string | null;
  sizes: string[];
  active: boolean;
  created_at: string;
};

export type OrderStatus =
  | 'pending_payment'
  | 'verifying'
  | 'paid'
  | 'shipped'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  delivery_method: 'pickup' | 'delivery';
  delivery_address: string | null;
  subtotal: number;
  shipping_fee: number;
  total_amount: number;
  status: OrderStatus;
  receipt_url: string | null;
  ocr_result: OcrResult | null;
  ocr_match: boolean | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  category: 'jersey' | 'jacket';
  size: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  player_name: string | null;
  player_number: string | null;
  player_type: 'player' | 'non_player' | null;
  sleeve_type: 'short' | 'long' | null;
};

export type OcrResult = {
  detected_amount: number | null;
  detected_recipient: string | null;
  detected_reference: string | null;
  detected_date: string | null;
  detected_bank: string | null;
  raw_text: string;
  is_likely_real: boolean;
  confidence: 'high' | 'medium' | 'low';
  notes: string;
};

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  category: 'jersey' | 'jacket';
  sleeve_type: 'short' | 'long' | null;
  image_url: string;
  size: string;
  quantity: number;
  unit_price: number;
  player_name: string | null;
  player_number: string | null;
  player_type: 'player' | 'non_player' | null;
  // Stable identity for line within the cart
  lineId: string;
};
