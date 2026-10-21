import { z } from 'zod';
import { LocalizedNameSchema } from '@/lib/utils/i18n.schema';

export const MenuStatusSchema = z.enum(['ACTIVE', 'BANNED', 'OUT_OF_STOCK']);
export type MenuStatus = z.infer<typeof MenuStatusSchema>;

export const StoreSchema = z.object({
  id: z.string().trim().min(1).max(32),
  name: LocalizedNameSchema,
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime(),
});
export type Store = z.infer<typeof StoreSchema>;

export const MenuPriceVariantSchema = z.object({
  id: z.string().uuid(),
  menuId: z.string().uuid(),
  name: LocalizedNameSchema,
  price: z.number().nonnegative(),
  isDefault: z.boolean().default(false),
});
export type MenuPriceVariant = z.infer<typeof MenuPriceVariantSchema>;

export const MenuOptionSchema = z.object({
  id: z.string().uuid(),
  storeId: z.string().trim().min(1).max(32),
  menuId: z.string().uuid().nullable(),
  name: LocalizedNameSchema,
  price: z.number().nonnegative(),
  isAvailable: z.boolean().default(true),
});
export type MenuOption = z.infer<typeof MenuOptionSchema>;

export const StoreMenuSchema = z.object({
  id: z.string().uuid(),
  storeId: z.string().trim().min(1).max(32),
  name: LocalizedNameSchema,
  status: MenuStatusSchema,
  voteBanCount: z.number().int().nonnegative().default(0),
  createdAt: z.string().datetime(),
  variants: z.array(MenuPriceVariantSchema).default([]),
  options: z.array(MenuOptionSchema).default([]),
});
export type StoreMenu = z.infer<typeof StoreMenuSchema>;

export const StoreCatalogAggregateSchema = z.object({
  store: StoreSchema,
  menus: z.array(StoreMenuSchema),
  storeWideOptions: z.array(MenuOptionSchema),
});
export type StoreCatalogAggregate = z.infer<typeof StoreCatalogAggregateSchema>;
