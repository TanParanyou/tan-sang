import { z } from 'zod';
import { LocalizedNameSchema } from '@/lib/utils/i18n.schema';
import { MenuStatusSchema } from '@/features/store-catalog/store-catalog.schema';

export const UpsertStoreInputSchema = z.object({
  id: z
    .string()
    .trim()
    .min(2)
    .max(32)
    .regex(/^[A-Z0-9_-]+$/, 'รหัสร้านต้องเป็นตัวพิมพ์ใหญ่ ตัวเลข ขีดกลาง หรือขีดล่างเท่านั้น'),
  name: LocalizedNameSchema,
  isActive: z.boolean().default(true),
});
export type UpsertStoreInput = z.infer<typeof UpsertStoreInputSchema>;

export const UpsertMenuInputSchema = z.object({
  storeId: z.string().trim().min(1).max(32),
  name: LocalizedNameSchema,
  status: MenuStatusSchema.default('ACTIVE'),
  variants: z
    .array(
      z.object({
        name: LocalizedNameSchema,
        price: z.number().nonnegative(),
        isDefault: z.boolean().default(false),
      }),
    )
    .min(1, 'ต้องมีอย่างน้อย 1 ราคา/ขนาด'),
});
export type UpsertMenuInput = z.infer<typeof UpsertMenuInputSchema>;

export const CreateMenuOptionInputSchema = z.object({
  storeId: z.string().trim().min(1).max(32),
  menuId: z.string().uuid().nullable().optional(),
  name: LocalizedNameSchema,
  price: z.number().nonnegative('ราคาท็อปปิ้งต้องไม่ติดลบ'),
  isAvailable: z.boolean().default(true),
});
export type CreateMenuOptionInput = z.infer<typeof CreateMenuOptionInputSchema>;

export const VoteBanMenuInputSchema = z.object({
  menuId: z.string().uuid(),
  autoBanThreshold: z.number().int().positive().default(3),
});
export type VoteBanMenuInput = z.infer<typeof VoteBanMenuInputSchema>;
