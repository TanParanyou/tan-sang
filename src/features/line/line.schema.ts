import { z } from 'zod';

export const LiffUserProfileSchema = z.object({
  userId: z.string().trim().min(1),
  displayName: z.string().trim().min(1),
  pictureUrl: z.string().url().optional(),
});
export type LiffUserProfile = z.infer<typeof LiffUserProfileSchema>;

export const LineFlexReceiptSharePayloadSchema = z.object({
  sessionId: z.string().uuid(),
  storeDisplayName: z.string().trim().min(1),
  totalQuantity: z.number().int().nonnegative(),
  grandTotalAmount: z.number().nonnegative(),
  receiptUrl: z.string().url(),
  orderUrl: z.string().url(),
});
export type LineFlexReceiptSharePayload = z.infer<typeof LineFlexReceiptSharePayloadSchema>;
