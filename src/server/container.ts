import { randomUUID } from 'node:crypto';
import type {
  CreateMenuOptionInput,
  UpsertMenuInput,
  UpsertStoreInput,
} from '@/features/admin-store/admin-store.schema';
import type {
  AddOrderItemInput,
  CreateOrderSessionInput,
  OrderItem,
  OrderSession,
  ReadyParticipant,
  UpdateOrderItemInput,
} from '@/features/order-session/order-session.schema';
import type {
  MenuOption,
  MenuStatus,
  Store,
  StoreCatalogAggregate,
  StoreMenu,
} from '@/features/store-catalog/store-catalog.schema';
import { getServerSupabaseClient } from '@/lib/supabase/server';
import {
  SupabaseOrderSessionRepository,
  type IOrderSessionRepository,
} from '@/server/repositories/order-session.repository';
import {
  SupabaseStoreRepository,
  type IStoreRepository,
} from '@/server/repositories/store.repository';
import { OrderSessionService } from '@/server/services/order-session.service';

export const DEMO_SESSION_ID = '00000000-0000-4000-8000-000000000001';
export const CLOSED_DEMO_SESSION_ID = '00000000-0000-4000-8000-000000000002';
export const DEMO_HOST_USER_ID = 'U_HOST_TAN';

// ============================================================================
// Pre-seeded Fallback Repositories (Used automatically when .env is not set)
// ============================================================================

class FallbackStoreRepository implements IStoreRepository {
  private catalogs = new Map<string, StoreCatalogAggregate>();

  constructor() {
    const now = '2026-10-20T09:00:00.000Z';
    const storeId = 'STORE01';
    const menu1Id = '11111111-1111-4111-8111-111111111101';
    const menu2Id = '11111111-1111-4111-8111-111111111102';
    const menu3Id = '11111111-1111-4111-8111-111111111103';
    const menu4Id = '11111111-1111-4111-8111-111111111104';

    this.catalogs.set(storeId, {
      store: {
        id: storeId,
        name: { th: 'ครัวตาล (ตามสั่งโชคชัย 4)', en: 'Krua Tarn' },
        isActive: true,
        createdAt: now,
      },
      storeWideOptions: [
        {
          id: '33333333-3333-4333-8333-333333333301',
          storeId,
          menuId: null,
          name: { th: 'ไข่ดาว', en: 'Fried Egg' },
          price: 10,
          isAvailable: true,
        },
        {
          id: '33333333-3333-4333-8333-333333333302',
          storeId,
          menuId: null,
          name: { th: 'ไข่เจียว', en: 'Omelet' },
          price: 15,
          isAvailable: true,
        },
        {
          id: '33333333-3333-4333-8333-333333333303',
          storeId,
          menuId: null,
          name: { th: 'ไข่ข้น', en: 'Creamy Egg' },
          price: 20,
          isAvailable: true,
        },
      ],
      menus: [
        {
          id: menu1Id,
          storeId,
          name: { th: 'ข้าวกะเพราหมูสับ', en: 'Basil Minced Pork Rice' },
          status: 'ACTIVE',
          voteBanCount: 0,
          createdAt: now,
          variants: [
            {
              id: '22222222-2222-4222-8222-222222222201',
              menuId: menu1Id,
              name: { th: 'ธรรมดา', en: 'Regular' },
              price: 55,
              isDefault: true,
            },
            {
              id: '22222222-2222-4222-8222-222222222202',
              menuId: menu1Id,
              name: { th: 'พิเศษ', en: 'Large' },
              price: 65,
              isDefault: false,
            },
          ],
          options: [],
        },
        {
          id: menu2Id,
          storeId,
          name: { th: 'ข้าวผัดหมูโบราณ', en: 'Classic Pork Fried Rice' },
          status: 'ACTIVE',
          voteBanCount: 0,
          createdAt: now,
          variants: [
            {
              id: '22222222-2222-4222-8222-222222222203',
              menuId: menu2Id,
              name: { th: 'ธรรมดา', en: 'Regular' },
              price: 50,
              isDefault: true,
            },
            {
              id: '22222222-2222-4222-8222-222222222204',
              menuId: menu2Id,
              name: { th: 'พิเศษ', en: 'Large' },
              price: 60,
              isDefault: false,
            },
          ],
          options: [],
        },
        {
          id: menu3Id,
          storeId,
          name: { th: 'ข้าวหมูกรอบคั่วพริกเกลือ', en: 'Crispy Pork Chili Salt Rice' },
          status: 'ACTIVE',
          voteBanCount: 0,
          createdAt: now,
          variants: [
            {
              id: '22222222-2222-4222-8222-222222222205',
              menuId: menu3Id,
              name: { th: 'ธรรมดา', en: 'Regular' },
              price: 65,
              isDefault: true,
            },
            {
              id: '22222222-2222-4222-8222-222222222206',
              menuId: menu3Id,
              name: { th: 'พิเศษ', en: 'Large' },
              price: 75,
              isDefault: false,
            },
          ],
          options: [],
        },
        {
          id: menu4Id,
          storeId,
          name: { th: 'สุกี้แห้งทะเล', en: 'Dry Seafood Suki' },
          status: 'OUT_OF_STOCK',
          voteBanCount: 1,
          createdAt: now,
          variants: [
            {
              id: '22222222-2222-4222-8222-222222222207',
              menuId: menu4Id,
              name: { th: 'ธรรมดา', en: 'Regular' },
              price: 70,
              isDefault: true,
            },
          ],
          options: [],
        },
      ],
    });
  }

  async findActiveStores(): Promise<Store[]> {
    return Array.from(this.catalogs.values())
      .map((c) => c.store)
      .filter((s) => s.isActive);
  }

  async findAllStores(): Promise<Store[]> {
    return Array.from(this.catalogs.values()).map((c) => c.store);
  }

  async findStoreCatalogById(storeId: string): Promise<StoreCatalogAggregate | null> {
    return this.catalogs.get(storeId) ?? null;
  }

  async upsertStore(input: UpsertStoreInput): Promise<Store> {
    const existing = this.catalogs.get(input.id);
    const store: Store = {
      id: input.id,
      name: input.name,
      isActive: input.isActive,
      createdAt: existing?.store.createdAt ?? new Date().toISOString(),
    };
    this.catalogs.set(input.id, {
      store,
      menus: existing?.menus ?? [],
      storeWideOptions: existing?.storeWideOptions ?? [],
    });
    return store;
  }

  async createMenu(input: UpsertMenuInput): Promise<StoreMenu> {
    const catalog = this.catalogs.get(input.storeId);
    if (!catalog) {
      throw new Error(`Store ${input.storeId} not found`);
    }
    const menuId = randomUUID();
    const newMenu: StoreMenu = {
      id: menuId,
      storeId: input.storeId,
      name: input.name,
      status: input.status,
      voteBanCount: 0,
      createdAt: new Date().toISOString(),
      variants: input.variants.map((v) => ({
        id: randomUUID(),
        menuId,
        name: v.name,
        price: v.price,
        isDefault: v.isDefault,
      })),
      options: [],
    };
    catalog.menus.push(newMenu);
    return newMenu;
  }

  async createMenuOption(input: CreateMenuOptionInput): Promise<MenuOption> {
    const catalog = this.catalogs.get(input.storeId);
    if (!catalog) {
      throw new Error(`Store ${input.storeId} not found`);
    }
    const newOption: MenuOption = {
      id: randomUUID(),
      storeId: input.storeId,
      menuId: input.menuId ?? null,
      name: input.name,
      price: input.price,
      isAvailable: input.isAvailable,
    };

    if (!newOption.menuId) {
      catalog.storeWideOptions.push(newOption);
    } else {
      const targetMenu = catalog.menus.find((m) => m.id === newOption.menuId);
      if (targetMenu) {
        targetMenu.options.push(newOption);
      }
    }
    return newOption;
  }

  async updateMenuStatus(menuId: string, status: MenuStatus): Promise<void> {
    for (const catalog of this.catalogs.values()) {
      const target = catalog.menus.find((m) => m.id === menuId);
      if (target) {
        target.status = status;
        return;
      }
    }
  }

  async incrementMenuVoteBan(
    menuId: string,
    autoBanThreshold = 3,
  ): Promise<StoreMenu | null> {
    for (const catalog of this.catalogs.values()) {
      const target = catalog.menus.find((m) => m.id === menuId);
      if (target) {
        target.voteBanCount += 1;
        if (target.voteBanCount >= autoBanThreshold) {
          target.status = 'BANNED';
        }
        return target;
      }
    }
    return null;
  }

  async deleteMenu(menuId: string): Promise<void> {
    for (const catalog of this.catalogs.values()) {
      const index = catalog.menus.findIndex((m) => m.id === menuId);
      if (index !== -1) {
        catalog.menus.splice(index, 1);
        return;
      }
    }
  }

  async deleteMenuOption(optionId: string): Promise<void> {
    for (const catalog of this.catalogs.values()) {
      const wideIdx = catalog.storeWideOptions.findIndex((o) => o.id === optionId);
      if (wideIdx !== -1) {
        catalog.storeWideOptions.splice(wideIdx, 1);
        return;
      }
      for (const menu of catalog.menus) {
        const menuOptIdx = menu.options.findIndex((o) => o.id === optionId);
        if (menuOptIdx !== -1) {
          menu.options.splice(menuOptIdx, 1);
          return;
        }
      }
    }
  }
}

class FallbackOrderSessionRepository implements IOrderSessionRepository {
  private sessions = new Map<string, OrderSession>();

  constructor() {
    // Start clean without pre-loaded mock sessions
  }

  async findOpenSessionByGroupId(lineGroupId: string): Promise<OrderSession | null> {
    for (const s of this.sessions.values()) {
      if (s.lineGroupId === lineGroupId && s.status === 'OPEN') {
        return s;
      }
    }
    return null;
  }

  async findSessionById(sessionId: string): Promise<OrderSession | null> {
    return this.sessions.get(sessionId) ?? null;
  }

  async findAllSessions(limit = 50): Promise<OrderSession[]> {
    return Array.from(this.sessions.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async createSession(input: CreateOrderSessionInput): Promise<OrderSession> {
    const id = randomUUID();
    const session: OrderSession = {
      id,
      lineGroupId: input.lineGroupId,
      hostUserId: input.hostUserId,
      storeId: input.storeId ?? null,
      customStoreName: input.customStoreName ?? null,
      status: 'OPEN',
      readyUsers: [],
      createdAt: new Date().toISOString(),
      closedAt: null,
      items: [],
    };
    this.sessions.set(id, session);
    return session;
  }

  async addOrderItem(input: AddOrderItemInput): Promise<OrderItem> {
    const session = this.sessions.get(input.sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    const itemId = randomUUID();
    const newItem: OrderItem = {
      id: itemId,
      sessionId: input.sessionId,
      orderedByUserId: input.orderedByUserId,
      recipientName: input.recipientName,
      menuId: input.menuId ?? null,
      menuName: input.menuName,
      variantName: input.variantName ?? null,
      unitPrice: input.unitPrice,
      quantity: input.quantity,
      note: input.note ?? null,
      createdAt: new Date().toISOString(),
      options: input.options.map((opt) => ({
        id: randomUUID(),
        orderItemId: itemId,
        optionId: opt.optionId ?? null,
        optionName: opt.optionName,
        price: opt.price,
      })),
    };
    session.items.push(newItem);
    return newItem;
  }

  async updateOrderItem(input: UpdateOrderItemInput): Promise<OrderItem> {
    const session = this.sessions.get(input.sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    const target = session.items.find((i) => i.id === input.itemId);
    if (!target) {
      throw new Error('Order item not found');
    }

    target.recipientName = input.recipientName;
    target.menuId = input.menuId ?? null;
    target.menuName = input.menuName;
    target.variantName = input.variantName ?? null;
    target.unitPrice = input.unitPrice;
    target.quantity = input.quantity;
    target.note = input.note ?? null;
    target.options = input.options.map((opt) => ({
      id: randomUUID(),
      orderItemId: target.id,
      optionId: opt.optionId ?? null,
      optionName: opt.optionName,
      price: opt.price,
    }));

    return target;
  }

  async deleteOrderItem(itemId: string): Promise<void> {
    for (const session of this.sessions.values()) {
      session.items = session.items.filter((i) => i.id !== itemId);
    }
  }

  async updateReadyUsers(
    sessionId: string,
    readyUsers: ReadyParticipant[],
  ): Promise<OrderSession> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    session.readyUsers = readyUsers;
    return session;
  }

  async closeSession(sessionId: string, closedAtIso: string): Promise<OrderSession> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    session.status = 'CLOSED';
    session.closedAt = closedAtIso;
    return session;
  }
}

// ============================================================================
// Global Singleton Container (Preserved across Next.js HMR reloads)
// ============================================================================

const globalForTanSang = globalThis as unknown as {
  fallbackStoreRepo?: FallbackStoreRepository;
  fallbackSessionRepo?: FallbackOrderSessionRepository;
};

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(
    url &&
      serviceKey &&
      !url.includes('your-project-ref') &&
      !serviceKey.includes('your-supabase-service-role-key'),
  );
}

export function getRepositories(): {
  storeRepo: IStoreRepository;
  sessionRepo: IOrderSessionRepository;
  isLiveSupabase: boolean;
} {
  if (isSupabaseConfigured()) {
    const db = getServerSupabaseClient();
    return {
      storeRepo: new SupabaseStoreRepository(db),
      sessionRepo: new SupabaseOrderSessionRepository(db),
      isLiveSupabase: true,
    };
  }

  if (!globalForTanSang.fallbackStoreRepo) {
    globalForTanSang.fallbackStoreRepo = new FallbackStoreRepository();
  }
  if (!globalForTanSang.fallbackSessionRepo) {
    globalForTanSang.fallbackSessionRepo = new FallbackOrderSessionRepository();
  }

  return {
    storeRepo: globalForTanSang.fallbackStoreRepo,
    sessionRepo: globalForTanSang.fallbackSessionRepo,
    isLiveSupabase: false,
  };
}

export function getOrderSessionService(): OrderSessionService {
  const { sessionRepo, storeRepo } = getRepositories();
  return new OrderSessionService(sessionRepo, storeRepo);
}
