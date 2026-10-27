import { z } from 'zod';

export const OrderSessionStatusSchema = z.enum(['OPEN', 'CLOSED']);
export type OrderSessionStatus = z.infer<typeof OrderSessionStatusSchema>;

export const ReadyParticipantSchema = z.object({
  userId: z.string().trim().min(1).max(64),
  displayName: z.string().trim().min(1).max(100),
  readyAt: z.string().datetime(),
});
export type ReadyParticipant = z.infer<typeof ReadyParticipantSchema>;

export const OrderItemOptionSnapshotSchema = z.object({
  id: z.string().uuid(),
  orderItemId: z.string().uuid(),
  optionId: z.string().uuid().nullable(),
  optionName: z.string().trim().min(1).max(255),
  price: z.number().nonnegative(),
});
export type OrderItemOptionSnapshot = z.infer<typeof OrderItemOptionSnapshotSchema>;

export const OrderItemSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  orderedByUserId: z.string().trim().min(1).max(64),
  recipientName: z.string().trim().min(1).max(100),
  menuId: z.string().uuid().nullable(),
  menuName: z.string().trim().min(1).max(255),
  variantName: z.string().trim().max(100).nullable(),
  unitPrice: z.number().nonnegative(),
  quantity: z.number().int().positive().max(99),
  note: z.string().trim().max(500).nullable(),
  createdAt: z.string().datetime(),
  options: z.array(OrderItemOptionSnapshotSchema).default([]),
});
export type OrderItem = z.infer<typeof OrderItemSchema>;

export const OrderSessionSchema = z.object({
  id: z.string().uuid(),
  lineGroupId: z.string().trim().min(1).max(64),
  hostUserId: z.string().trim().min(1).max(64),
  storeId: z.string().trim().max(32).nullable(),
  customStoreName: z.string().trim().max(255).nullable(),
  status: OrderSessionStatusSchema,
  readyUsers: z.array(ReadyParticipantSchema).default([]),
  createdAt: z.string().datetime(),
  closedAt: z.string().datetime().nullable(),
  items: z.array(OrderItemSchema).default([]),
});
export type OrderSession = z.infer<typeof OrderSessionSchema>;

// ============================================================================
// Mutation Input Schemas (Client & Server Runtime Validation)
// ============================================================================

export const CreateOrderSessionInputSchema = z
  .object({
    lineGroupId: z.string().trim().min(1, 'กรุณาระบุ LINE Group ID').max(64),
    hostUserId: z.string().trim().min(1, 'กรุณาระบุ Host User ID').max(64),
    storeId: z.string().trim().min(1).max(32).nullable().optional(),
    customStoreName: z.string().trim().max(255).nullable().optional(),
  })
  .refine(
    (data) =>
      Boolean(data.storeId && data.storeId.length > 0) ||
      Boolean(data.customStoreName && data.customStoreName.length > 0),
    {
      message: 'ต้องเลือกจากร้านค้าในระบบ หรือระบุชื่อร้านเองอย่างน้อย 1 อย่าง',
      path: ['storeId'],
    },
  );
export type CreateOrderSessionInput = z.infer<typeof CreateOrderSessionInputSchema>;

export const OrderItemOptionInputSchema = z.object({
  optionId: z.string().uuid().nullable().optional(),
  optionName: z.string().trim().min(1, 'กรุณาระบุชื่อท็อปปิ้ง/ตัวเลือก').max(255),
  price: z.number().nonnegative('ราคาท็อปปิ้งต้องไม่ติดลบ'),
});
export type OrderItemOptionInput = z.infer<typeof OrderItemOptionInputSchema>;

export const AddOrderItemInputSchema = z.object({
  sessionId: z.string().uuid(),
  orderedByUserId: z.string().trim().min(1).max(64),
  recipientName: z.string().trim().min(1, 'กรุณาระบุชื่อผู้รับอาหาร').max(100),
  menuId: z.string().uuid().nullable().optional(),
  menuName: z.string().trim().min(1, 'กรุณาระบุชื่อเมนูอาหาร').max(255),
  variantName: z.string().trim().max(100).nullable().optional(),
  unitPrice: z.number().nonnegative('ราคาต่อหน่วยต้องไม่ติดลบ'),
  quantity: z.number().int().positive('จำนวนต้องมากกว่า 0').max(99).default(1),
  note: z.string().trim().max(500).nullable().optional(),
  options: z.array(OrderItemOptionInputSchema).default([]),
});
export type AddOrderItemInput = z.infer<typeof AddOrderItemInputSchema>;

export const UpdateOrderItemInputSchema = AddOrderItemInputSchema.extend({
  itemId: z.string().uuid(),
  actorUserId: z.string().trim().min(1).max(64),
});
export type UpdateOrderItemInput = z.infer<typeof UpdateOrderItemInputSchema>;

export const DeleteOrderItemInputSchema = z.object({
  sessionId: z.string().uuid(),
  itemId: z.string().uuid(),
  actorUserId: z.string().trim().min(1).max(64),
});
export type DeleteOrderItemInput = z.infer<typeof DeleteOrderItemInputSchema>;

export const ToggleParticipantReadyInputSchema = z.object({
  sessionId: z.string().uuid(),
  userId: z.string().trim().min(1).max(64),
  displayName: z.string().trim().min(1).max(100),
  isReady: z.boolean(),
});
export type ToggleParticipantReadyInput = z.infer<typeof ToggleParticipantReadyInputSchema>;

export const CloseOrderSessionInputSchema = z.object({
  sessionId: z.string().uuid(),
  actorUserId: z.string().trim().min(1).max(64),
});
export type CloseOrderSessionInput = z.infer<typeof CloseOrderSessionInputSchema>;

export const DeleteOrderSessionInputSchema = z.object({
  sessionId: z.string().uuid(),
  actorUserId: z.string().trim().min(1).max(64),
  pin: z.string().trim().optional(),
});
export type DeleteOrderSessionInput = z.infer<typeof DeleteOrderSessionInputSchema>;

// ============================================================================
// Summarization & Breakdown Output Contracts (Business Rule 2)
// ============================================================================

export interface GroupedOrderItemSummary {
  fingerprint: string;
  menuName: string;
  variantName: string | null;
  optionNames: string[];
  note: string | null;
  unitPriceWithOptions: number;
  totalQuantity: number;
  totalPrice: number;
  recipients: Array<{
    recipientName: string;
    quantity: number;
  }>;
}

export interface RecipientOrderBreakdown {
  recipientName: string;
  totalQuantity: number;
  totalAmount: number;
  items: Array<{
    itemId: string;
    displayTitle: string;
    note: string | null;
    quantity: number;
    unitPriceWithOptions: number;
    lineTotal: number;
  }>;
}

export interface OrderSessionSummary {
  sessionId: string;
  storeDisplayName: string;
  status: OrderSessionStatus;
  totalItemsCount: number;
  grandTotalAmount: number;
  groupedItems: GroupedOrderItemSummary[];
  recipientBreakdowns: RecipientOrderBreakdown[];
  merchantCopyText: string;
  khunThongCopyText: string;
}

export interface SessionHistoryItem {
  session: OrderSession;
  summary: OrderSessionSummary;
}
