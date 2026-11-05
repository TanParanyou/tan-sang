import { z } from 'zod';

export const SplitMethodSchema = z.enum(['PROPORTIONAL', 'EQUAL']);
export type SplitMethod = z.infer<typeof SplitMethodSchema>;

export const SplitItemSchema = z.object({
  id: z.string(),
  name: z.string().trim(),
  price: z.number().min(0),
});
export type SplitItem = z.infer<typeof SplitItemSchema>;

export const SplitBillInputSchema = z.object({
  deliveryFee: z.number().min(0).optional().default(0),
  discount: z.number().min(0).optional().default(0),
  items: z.array(SplitItemSchema).default([]),
  splitMethod: SplitMethodSchema.optional().default('PROPORTIONAL'),
  roundToInteger: z.boolean().optional().default(true),
});
export type SplitBillInput = z.input<typeof SplitBillInputSchema>;

export interface SplitMemberResult {
  id: string;
  name: string;
  originalPrice: number;
  percentShare: number; // 0 to 100
  discountAmount: number; // positive = gets discount, negative = pays extra delivery
  finalPrice: number; // amount this person needs to transfer
  exactFinalPrice: number; // unrounded exact calculation for transparency
}

export interface SplitBillResult {
  subtotal: number;
  deliveryFee: number;
  discount: number;
  netDiscount: number; // discount - deliveryFee
  grandTotal: number; // subtotal + deliveryFee - discount
  totalCollected: number; // sum of all member finalPrices
  roundingDifference: number; // totalCollected - grandTotal
  members: SplitMemberResult[];
  splitMethod: SplitMethod;
}
