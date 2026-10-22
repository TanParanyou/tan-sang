import { describe, expect, it } from 'vitest';
import {
  DeleteStoreInputSchema,
  UpdateMenuInputSchema,
  UpdateMenuOptionInputSchema,
  UpdateStoreInputSchema,
  UpsertMenuInputSchema,
  UpsertStoreInputSchema,
} from '@/features/admin-store/admin-store.schema';
import { getRepositories } from '@/server/container';

describe('Admin Store Schemas', () => {
  it('validates UpsertStoreInputSchema', () => {
    const valid = UpsertStoreInputSchema.safeParse({
      id: 'STORE99',
      name: { th: 'ร้านทดสอบ', en: 'Test Store' },
      isActive: true,
    });
    expect(valid.success).toBe(true);

    const invalidId = UpsertStoreInputSchema.safeParse({
      id: 'store 99!',
      name: { th: 'ร้านทดสอบ' },
    });
    expect(invalidId.success).toBe(false);
  });

  it('validates UpdateStoreInputSchema', () => {
    const valid = UpdateStoreInputSchema.safeParse({
      id: 'STORE99',
      name: { th: 'ชื่อใหม่' },
      isActive: false,
    });
    expect(valid.success).toBe(true);
  });

  it('validates DeleteStoreInputSchema', () => {
    const valid = DeleteStoreInputSchema.safeParse({
      storeId: 'STORE99',
    });
    expect(valid.success).toBe(true);
  });

  it('validates UpdateMenuInputSchema', () => {
    const valid = UpdateMenuInputSchema.safeParse({
      menuId: '11111111-1111-4111-8111-111111111101',
      name: { th: 'กะเพราเนื้อสับ', en: 'Beef Basil' },
      variants: [
        { name: { th: 'ธรรมดา' }, price: 65, isDefault: true },
        { name: { th: 'พิเศษ' }, price: 80, isDefault: false },
      ],
    });
    expect(valid.success).toBe(true);

    const invalidNoVariants = UpdateMenuInputSchema.safeParse({
      menuId: '11111111-1111-4111-8111-111111111101',
      name: { th: 'กะเพราเนื้อสับ' },
      variants: [],
    });
    expect(invalidNoVariants.success).toBe(false);
  });

  it('validates UpdateMenuOptionInputSchema', () => {
    const valid = UpdateMenuOptionInputSchema.safeParse({
      optionId: '33333333-3333-4333-8333-333333333301',
      name: { th: 'ไข่ดาวกรอบ' },
      price: 12,
      isAvailable: true,
    });
    expect(valid.success).toBe(true);
  });
});

describe('Store Repository CRUD Operations', () => {
  const { storeRepo } = getRepositories();

  it('handles store lifecycle: create, update name/status, and delete', async () => {
    const storeId = 'STORE_TEST_CRUD';

    // 1. Create
    const created = await storeRepo.upsertStore({
      id: storeId,
      name: { th: 'ร้านก่อนแก้', en: 'Before Edit' },
      isActive: true,
    });
    expect(created.id).toBe(storeId);
    expect(created.name.th).toBe('ร้านก่อนแก้');

    // 2. Update name
    const updatedName = await storeRepo.updateStore({
      id: storeId,
      name: { th: 'ร้านหลังแก้', en: 'After Edit' },
    });
    expect(updatedName.name.th).toBe('ร้านหลังแก้');
    expect(updatedName.name.en).toBe('After Edit');

    // 3. Update status (toggle inactive)
    const updatedStatus = await storeRepo.updateStore({
      id: storeId,
      isActive: false,
    });
    expect(updatedStatus.isActive).toBe(false);

    // 4. Delete store
    await storeRepo.deleteStore(storeId);
    const catalogAfterDelete = await storeRepo.findStoreCatalogById(storeId);
    expect(catalogAfterDelete).toBeNull();
  });

  it('handles menu lifecycle: create, update name/variants, and delete', async () => {
    const storeId = 'STORE01';

    // 1. Create Menu
    const newMenu = await storeRepo.createMenu({
      storeId,
      name: { th: 'เมนูทดสอบ', en: 'Test Menu' },
      status: 'ACTIVE',
      variants: [
        { name: { th: 'ธรรมดา', en: 'Regular' }, price: 40, isDefault: true },
      ],
    });
    expect(newMenu.id).toBeDefined();
    expect(newMenu.variants.length).toBe(1);

    // 2. Update Menu
    const updatedMenu = await storeRepo.updateMenu({
      menuId: newMenu.id,
      name: { th: 'เมนูทดสอบ (ปรับปรุง)', en: 'Updated Menu' },
      variants: [
        { name: { th: 'ธรรมดา', en: 'Regular' }, price: 45, isDefault: true },
        { name: { th: 'พิเศษ', en: 'Large' }, price: 55, isDefault: false },
      ],
    });
    expect(updatedMenu.name.th).toBe('เมนูทดสอบ (ปรับปรุง)');
    expect(updatedMenu.variants.length).toBe(2);
    expect(updatedMenu.variants[0]?.price).toBe(45);
    expect(updatedMenu.variants[1]?.price).toBe(55);

    // 3. Delete Menu
    await storeRepo.deleteMenu(newMenu.id);
    const catalog = await storeRepo.findStoreCatalogById(storeId);
    const deletedFound = catalog?.menus.find((m) => m.id === newMenu.id);
    expect(deletedFound).toBeUndefined();
  });

  it('handles topping/option lifecycle: create, update, and delete', async () => {
    const storeId = 'STORE01';

    // 1. Create Option
    const option = await storeRepo.createMenuOption({
      storeId,
      menuId: null,
      name: { th: 'ท็อปปิ้งทดสอบ' },
      price: 15,
      isAvailable: true,
    });
    expect(option.id).toBeDefined();
    expect(option.price).toBe(15);

    // 2. Update Option
    const updatedOption = await storeRepo.updateMenuOption({
      optionId: option.id,
      name: { th: 'ท็อปปิ้งทดสอบพิเศษ' },
      price: 25,
      isAvailable: true,
    });
    expect(updatedOption.name.th).toBe('ท็อปปิ้งทดสอบพิเศษ');
    expect(updatedOption.price).toBe(25);

    // 3. Delete Option
    await storeRepo.deleteMenuOption(option.id);
    const catalog = await storeRepo.findStoreCatalogById(storeId);
    const optionFound = catalog?.storeWideOptions.find((o) => o.id === option.id);
    expect(optionFound).toBeUndefined();
  });
});
