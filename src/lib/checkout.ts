import { z } from 'zod';

export const SHIPPING_FEE = 10;

export const itemSchema = z.object({
  productId: z.string(),
  size: z.string().min(1),
  quantity: z.number().int().positive(),
  player_name: z.string().nullable(),
  player_number: z.string().nullable(),
  player_type: z.enum(['player', 'non_player']).nullable(),
});

export const checkoutSchema = z.object({
  customer_name: z.string().min(2, 'Required').max(80),
  customer_phone: z
    .string()
    .min(8, 'Required')
    .regex(/^(\+?60|0)?[0-9-\s]{8,}$/i, 'Use Malaysian phone'),
  customer_email: z.union([z.string().email(), z.literal('')]).optional(),
  delivery_method: z.enum(['pickup', 'delivery']),
  delivery_address: z.string().optional(),
  items: z.array(itemSchema).min(1),
});

export type CheckoutPayload = z.infer<typeof checkoutSchema>;
