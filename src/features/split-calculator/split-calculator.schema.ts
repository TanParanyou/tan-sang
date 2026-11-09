import { z } from 'zod';

export const SplitMethodSchema = z.enum(['PROPORTIONAL', 'EQUAL']);
export type SplitMethod = z.infer<typeof SplitMethodSchema>;

export const SplitItemSchema = z.object({
  id: z.string(),
  name: z.string().trim(),
  price: z.number().min(0),
});
export type SplitItem = z.infer<typeof SplitItemSchema>;

export const SharedDishItemSchema = z.object({
  id: z.string(),
  name: z.string().trim(),
  price: z.number().min(0),
  memberIds: z.array(z.string()).default([]), // Empty array indicates shared by all members
});
export type SharedDishItem = z.infer<typeof SharedDishItemSchema>;

export const SplitBillInputSchema = z.object({
  deliveryFee: z.number().min(0).optional().default(0),
  discount: z.number().min(0).optional().default(0),
  items: z.array(SplitItemSchema).default([]),
  sharedItems: z.array(SharedDishItemSchema).optional().default([]),
  splitMethod: SplitMethodSchema.optional().default('PROPORTIONAL'),
  roundToInteger: z.boolean().optional().default(true),
});
export type SplitBillInput = z.input<typeof SplitBillInputSchema>;

export interface SplitMemberResult {
  id: string;
  name: string;
  originalPrice: number; // Personal individual price
  sharedPrice: number; // Sum of share from common dishes
  totalBeforeDiscount: number; // originalPrice + sharedPrice
  percentShare: number; // 0 to 100
  discountAmount: number; // positive = gets discount, negative = pays extra delivery
  finalPrice: number; // amount this person needs to transfer
  exactFinalPrice: number; // unrounded exact calculation for transparency
}

export interface SharedItemResult {
  id: string;
  name: string;
  price: number;
  memberIds: string[];
  costPerPerson: number;
  participantCount: number;
}

export interface SplitBillResult {
  subtotal: number; // personalSubtotal + sharedSubtotal
  personalSubtotal: number;
  sharedSubtotal: number;
  deliveryFee: number;
  discount: number;
  netDiscount: number; // discount - deliveryFee
  grandTotal: number; // subtotal + deliveryFee - discount
  totalCollected: number; // sum of all member finalPrices
  roundingDifference: number; // totalCollected - grandTotal
  members: SplitMemberResult[];
  sharedItems: SharedItemResult[];
  splitMethod: SplitMethod;
}
