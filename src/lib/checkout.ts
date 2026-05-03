import { z } from 'zod';
import { SIZES } from '@/lib/pricing';

export const itemSchema = z.object({
  productId: z.string(),
  size: z.enum(SIZES),
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
  customer_email: z.string().email('Valid email required'),
  items: z.array(itemSchema).min(1),
});

export type CheckoutPayload = z.infer<typeof checkoutSchema>;
