import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import type {
  MenuOption,
  MenuPriceVariant,
  MenuStatus,
  Store,
  StoreCatalogAggregate,
  StoreMenu,
} from '@/features/store-catalog/store-catalog.schema';
import type {
  CreateMenuOptionInput,
  UpsertMenuInput,
  UpsertStoreInput,
} from '@/features/admin-store/admin-store.schema';

export interface IStoreRepository {
  findActiveStores(): Promise<Store[]>;
  findAllStores(): Promise<Store[]>;
  findStoreCatalogById(storeId: string): Promise<StoreCatalogAggregate | null>;
  upsertStore(input: UpsertStoreInput): Promise<Store>;
  createMenu(input: UpsertMenuInput): Promise<StoreMenu>;
  createMenuOption(input: CreateMenuOptionInput): Promise<MenuOption>;
  updateMenuStatus(menuId: string, status: MenuStatus): Promise<void>;
  incrementMenuVoteBan(menuId: string, autoBanThreshold?: number): Promise<StoreMenu | null>;
  deleteMenu(menuId: string): Promise<void>;
  deleteMenuOption(optionId: string): Promise<void>;
}

export class SupabaseStoreRepository implements IStoreRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async findActiveStores(): Promise<Store[]> {
    const { data, error } = await this.db
      .from('stores')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch active stores: ${error.message}`);
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      isActive: row.is_active,
      createdAt: new Date(row.created_at).toISOString(),
    }));
  }

  async findAllStores(): Promise<Store[]> {
    const { data, error } = await this.db
      .from('stores')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch stores: ${error.message}`);
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      isActive: row.is_active,
      createdAt: new Date(row.created_at).toISOString(),
    }));
  }

  async findStoreCatalogById(storeId: string): Promise<StoreCatalogAggregate | null> {
    const { data: storeRow, error: storeErr } = await this.db
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .maybeSingle();

    if (storeErr) {
      throw new Error(`Failed to fetch store ${storeId}: ${storeErr.message}`);
    }
    if (!storeRow) {
      return null;
    }

    const [{ data: menuRows, error: menuErr }, { data: optionRows, error: optionErr }] =
      await Promise.all([
        this.db
          .from('store_menus')
          .select('*')
          .eq('store_id', storeId)
          .order('created_at', { ascending: true }),
        this.db
          .from('menu_options')
          .select('*')
          .eq('store_id', storeId)
          .eq('is_available', true),
      ]);

    if (menuErr) {
      throw new Error(`Failed to fetch menus for store ${storeId}: ${menuErr.message}`);
    }
    if (optionErr) {
      throw new Error(`Failed to fetch options for store ${storeId}: ${optionErr.message}`);
    }

    const menuIds = (menuRows ?? []).map((m) => m.id);
    const { data: variantRows, error: variantErr } =
      menuIds.length > 0
        ? await this.db.from('menu_price_variants').select('*').in('menu_id', menuIds)
        : { data: [], error: null };

    if (variantErr) {
      throw new Error(`Failed to fetch variants for store ${storeId}: ${variantErr.message}`);
    }

    const variantsByMenuId = new Map<string, MenuPriceVariant[]>();
    for (const v of variantRows ?? []) {
      const list = variantsByMenuId.get(v.menu_id) ?? [];
      list.push({
        id: v.id,
        menuId: v.menu_id,
        name: v.name,
        price: Number(v.price),
        isDefault: v.is_default,
      });
      variantsByMenuId.set(v.menu_id, list);
    }

    const allOptions: MenuOption[] = (optionRows ?? []).map((o) => ({
      id: o.id,
      storeId: o.store_id,
      menuId: o.menu_id,
      name: o.name,
      price: Number(o.price),
      isAvailable: o.is_available,
    }));

    const storeWideOptions = allOptions.filter((o) => o.menuId === null);
    const menus: StoreMenu[] = (menuRows ?? []).map((m) => ({
      id: m.id,
      storeId: m.store_id,
      name: m.name,
      status: m.status,
      voteBanCount: m.vote_ban_count,
      createdAt: new Date(m.created_at).toISOString(),
      variants: variantsByMenuId.get(m.id) ?? [],
      options: allOptions.filter((o) => o.menuId === m.id),
    }));

    return {
      store: {
        id: storeRow.id,
        name: storeRow.name,
        isActive: storeRow.is_active,
        createdAt: new Date(storeRow.created_at).toISOString(),
      },
      menus,
      storeWideOptions,
    };
  }

  async upsertStore(input: UpsertStoreInput): Promise<Store> {
    const { data, error } = await this.db
      .from('stores')
      .upsert({
        id: input.id,
        name: input.name,
        is_active: input.isActive,
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`Failed to upsert store: ${error?.message ?? 'Unknown error'}`);
    }

    return {
      id: data.id,
      name: data.name,
      isActive: data.is_active,
      createdAt: new Date(data.created_at).toISOString(),
    };
  }

  async createMenu(input: UpsertMenuInput): Promise<StoreMenu> {
    const { data: menuRow, error: menuErr } = await this.db
      .from('store_menus')
      .insert({
        store_id: input.storeId,
        name: input.name,
        status: input.status,
      })
      .select('*')
      .single();

    if (menuErr || !menuRow) {
      throw new Error(`Failed to create menu: ${menuErr?.message ?? 'Unknown error'}`);
    }

    const { data: variantRows, error: varErr } = await this.db
      .from('menu_price_variants')
      .insert(
        input.variants.map((v) => ({
          menu_id: menuRow.id,
          name: v.name,
          price: v.price,
          is_default: v.isDefault,
        })),
      )
      .select('*');

    if (varErr) {
      throw new Error(`Failed to insert menu variants: ${varErr.message}`);
    }

    return {
      id: menuRow.id,
      storeId: menuRow.store_id,
      name: menuRow.name,
      status: menuRow.status,
      voteBanCount: menuRow.vote_ban_count,
      createdAt: new Date(menuRow.created_at).toISOString(),
      variants: (variantRows ?? []).map((v) => ({
        id: v.id,
        menuId: v.menu_id,
        name: v.name,
        price: Number(v.price),
        isDefault: v.is_default,
      })),
      options: [],
    };
  }

  async createMenuOption(input: CreateMenuOptionInput): Promise<MenuOption> {
    const { data, error } = await this.db
      .from('menu_options')
      .insert({
        store_id: input.storeId,
        menu_id: input.menuId ?? null,
        name: input.name,
        price: input.price,
        is_available: input.isAvailable,
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`Failed to create menu option: ${error?.message ?? 'Unknown error'}`);
    }

    return {
      id: data.id,
      storeId: data.store_id,
      menuId: data.menu_id,
      name: data.name,
      price: Number(data.price),
      isAvailable: data.is_available,
    };
  }

  async updateMenuStatus(menuId: string, status: MenuStatus): Promise<void> {
    const { error } = await this.db
      .from('store_menus')
      .update({ status })
      .eq('id', menuId);

    if (error) {
      throw new Error(`Failed to update menu status: ${error.message}`);
    }
  }

  async incrementMenuVoteBan(
    menuId: string,
    autoBanThreshold = 3,
  ): Promise<StoreMenu | null> {
    const { data: current, error: fetchErr } = await this.db
      .from('store_menus')
      .select('*')
      .eq('id', menuId)
      .maybeSingle();

    if (fetchErr) {
      throw new Error(`Failed to fetch menu for vote ban: ${fetchErr.message}`);
    }
    if (!current) {
      return null;
    }

    const nextCount = current.vote_ban_count + 1;
    const nextStatus: MenuStatus =
      nextCount >= autoBanThreshold ? 'BANNED' : current.status;

    const { data: updated, error: updateErr } = await this.db
      .from('store_menus')
      .update({
        vote_ban_count: nextCount,
        status: nextStatus,
      })
      .eq('id', menuId)
      .select('*')
      .single();

    if (updateErr || !updated) {
      throw new Error(`Failed to update vote ban count: ${updateErr?.message ?? 'Unknown'}`);
    }

    return {
      id: updated.id,
      storeId: updated.store_id,
      name: updated.name,
      status: updated.status,
      voteBanCount: updated.vote_ban_count,
      createdAt: new Date(updated.created_at).toISOString(),
      variants: [],
      options: [],
    };
  }

  async deleteMenu(menuId: string): Promise<void> {
    await this.db.from('menu_price_variants').delete().eq('menu_id', menuId);
    await this.db.from('menu_options').delete().eq('menu_id', menuId);
    const { error } = await this.db.from('store_menus').delete().eq('id', menuId);
    if (error) {
      throw new Error(`Failed to delete menu ${menuId}: ${error.message}`);
    }
  }

  async deleteMenuOption(optionId: string): Promise<void> {
    const { error } = await this.db.from('menu_options').delete().eq('id', optionId);
    if (error) {
      throw new Error(`Failed to delete menu option ${optionId}: ${error.message}`);
    }
  }
}
