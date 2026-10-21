import { z } from 'zod';
import type {
  GroupedOrderItemSummary,
  OrderSessionStatus,
  RecipientOrderBreakdown,
} from '@/features/order-session/order-session.schema';

export const ReceiptPrintFormatSchema = z.enum(['THERMAL_80MM', 'A4']);
export type ReceiptPrintFormat = z.infer<typeof ReceiptPrintFormatSchema>;

export const ReceiptViewModeSchema = z.enum(['GROUPED', 'INDIVIDUAL']);
export type ReceiptViewMode = z.infer<typeof ReceiptViewModeSchema>;

export interface ReceiptViewModel {
  sessionId: string;
  storeDisplayName: string;
  status: OrderSessionStatus;
  createdAtIso: string;
  closedAtIso: string | null;
  totalQuantity: number;
  grandTotalAmount: number;
  groupedItems: GroupedOrderItemSummary[];
  recipientBreakdowns: RecipientOrderBreakdown[];
  merchantCopyText: string;
}
