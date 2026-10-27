import { describe, expect, it } from 'vitest';
import type {
  AddOrderItemInput,
  CreateOrderSessionInput,
  OrderItem,
  OrderSession,
  ReadyParticipant,
  UpdateOrderItemInput,
} from '@/features/order-session/order-session.schema';
import { DomainError } from '@/server/errors/domain.error';
import type { IOrderSessionRepository } from '@/server/repositories/order-session.repository';
import {
  formatKhunThongSplitText,
  formatMerchantOrderText,
  groupOrderItemsByRecipient,
  groupOrderItemsForMerchant,
} from '@/server/services/order-calculator.service';
import { OrderSessionService } from '@/server/services/order-session.service';

// ============================================================================
// In-Memory Repository Stub for Core Lifecycle Testing
// ============================================================================
class InMemoryOrderSessionRepository implements IOrderSessionRepository {
  public sessions = new Map<string, OrderSession>();

  async findOpenSessionByGroupId(lineGroupId: string): Promise<OrderSession | null> {
    for (const session of this.sessions.values()) {
      if (session.lineGroupId === lineGroupId && session.status === 'OPEN') {
        return session;
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
    const newSession: OrderSession = {
      id: '99999999-9999-4999-8999-999999999901',
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
    this.sessions.set(newSession.id, newSession);
    return newSession;
  }

  async addOrderItem(input: AddOrderItemInput): Promise<OrderItem> {
    const session = this.sessions.get(input.sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const itemId = `aaaa1111-1111-4111-8111-11111111110${session.items.length + 1}`;
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
      options: input.options.map((opt, idx) => ({
        id: `bbbb1111-1111-4111-8111-11111111110${idx + 1}`,
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
    if (!session) throw new Error('Session not found');
    const target = session.items.find((i) => i.id === input.itemId);
    if (!target) throw new Error('Item not found');

    target.recipientName = input.recipientName;
    target.menuName = input.menuName;
    target.variantName = input.variantName ?? null;
    target.unitPrice = input.unitPrice;
    target.quantity = input.quantity;
    target.note = input.note ?? null;
    return target;
  }

  async deleteOrderItem(itemId: string): Promise<void> {
    for (const session of this.sessions.values()) {
      session.items = session.items.filter((i) => i.id !== itemId);
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  async updateReadyUsers(
    sessionId: string,
    readyUsers: ReadyParticipant[],
  ): Promise<OrderSession> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');
    session.readyUsers = readyUsers;
    return session;
  }

  async closeSession(sessionId: string, closedAtIso: string): Promise<OrderSession> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');
    session.status = 'CLOSED';
    session.closedAt = closedAtIso;
    return session;
  }
}

// ============================================================================
// Core Business Logic Tests
// ============================================================================
describe('Tan-Sang Core Business Logic', () => {
  const sampleItems: OrderItem[] = [
    {
      id: 'aaaa1111-1111-4111-8111-111111111101',
      sessionId: '99999999-9999-4999-8999-999999999901',
      orderedByUserId: 'U001',
      recipientName: 'ต้น',
      menuId: null,
      menuName: 'ข้าวผัดหมู',
      variantName: 'ธรรมดา',
      unitPrice: 50,
      quantity: 1,
      note: null,
      createdAt: '2026-10-20T10:00:00.000Z',
      options: [
        {
          id: 'bbbb1111-1111-4111-8111-111111111101',
          orderItemId: 'aaaa1111-1111-4111-8111-111111111101',
          optionId: null,
          optionName: 'ไข่ดาว',
          price: 10,
        },
      ],
    },
    {
      id: 'aaaa1111-1111-4111-8111-111111111102',
      sessionId: '99999999-9999-4999-8999-999999999901',
      orderedByUserId: 'U002',
      recipientName: 'แพรว',
      menuId: null,
      menuName: 'ข้าวผัดหมู',
      variantName: 'ธรรมดา',
      unitPrice: 50,
      quantity: 2,
      note: null,
      createdAt: '2026-10-20T10:01:00.000Z',
      options: [
        {
          id: 'bbbb1111-1111-4111-8111-111111111102',
          orderItemId: 'aaaa1111-1111-4111-8111-111111111102',
          optionId: null,
          optionName: 'ไข่ดาว',
          price: 10,
        },
      ],
    },
  ];

  it('combines identical menu items, variants, and add-ons for Merchant Grouped View and formats copy text', () => {
    const grouped = groupOrderItemsForMerchant(sampleItems);

    expect(grouped).toHaveLength(1);
    expect(grouped[0]?.totalQuantity).toBe(3);
    expect(grouped[0]?.unitPriceWithOptions).toBe(60);
    expect(grouped[0]?.totalPrice).toBe(180);

    const copyText = formatMerchantOrderText('ครัวตาล', grouped);
    expect(copyText).toContain('1. ข้าวผัดหมู (ธรรมดา) + ไข่ดาว x 3');
    expect(copyText).toContain('รวมทั้งหมด: 3 รายการ (180 บาท)');
  });

  it('omits 0 baht amount in merchant order text when grand total is 0', () => {
    const zeroPriceItems: OrderItem[] = [
      {
        id: 'zero-1',
        sessionId: 'session-zero',
        orderedByUserId: 'U001',
        recipientName: 'ต้น',
        menuId: null,
        menuName: 'กะเพราไก่ไข่ดาว (สั่งปากเปล่า)',
        variantName: null,
        unitPrice: 0,
        quantity: 2,
        note: null,
        createdAt: '2026-10-20T10:00:00.000Z',
        options: [],
      },
    ];

    const grouped = groupOrderItemsForMerchant(zeroPriceItems);
    const copyText = formatMerchantOrderText('ป้าหน้าปากซอย', grouped);

    expect(copyText).toContain('1. กะเพราไก่ไข่ดาว (สั่งปากเปล่า) x 2');
    expect(copyText).toContain('รวมทั้งหมด: 2 รายการ');
    expect(copyText).not.toContain('0 บาท');
  });

  it('calculates Individual Breakdown per recipient accurately', () => {
    const breakdown = groupOrderItemsByRecipient(sampleItems);

    expect(breakdown).toHaveLength(2);
    expect(breakdown[0]).toMatchObject({
      recipientName: 'ต้น',
      totalQuantity: 1,
      totalAmount: 60,
    });
    expect(breakdown[1]).toMatchObject({
      recipientName: 'แพรว',
      totalQuantity: 2,
      totalAmount: 120,
    });
  });

  it('enforces 1 OPEN session per LINE group, item edit ownership, Host-only closing, and rejects mutations once CLOSED', async () => {
    const repo = new InMemoryOrderSessionRepository();
    const service = new OrderSessionService(repo);

    // 1. Create first OPEN session
    const session = await service.createSession({
      lineGroupId: 'C_GROUP_01',
      hostUserId: 'U_HOST',
      storeId: 'STORE01',
    });
    expect(session.status).toBe('OPEN');

    // 2. Reject second OPEN session in the same LINE group
    await expect(
      service.createSession({
        lineGroupId: 'C_GROUP_01',
        hostUserId: 'U_OTHER',
        storeId: 'STORE01',
      }),
    ).rejects.toMatchObject({
      code: 'ACTIVE_SESSION_ALREADY_EXISTS',
      statusCode: 409,
    } satisfies Partial<DomainError>);

    // 3. Add item & edit item while OPEN
    const addedItem = await service.addOrderItem({
      sessionId: session.id,
      orderedByUserId: 'U_MEMBER',
      recipientName: 'เมย์',
      menuName: 'กะเพราหมูกรอบ',
      unitPrice: 65,
      quantity: 1,
      options: [],
    });

    const editedItem = await service.updateOrderItem({
      sessionId: session.id,
      itemId: addedItem.id,
      actorUserId: 'U_MEMBER',
      orderedByUserId: 'U_MEMBER',
      recipientName: 'เมย์',
      menuName: 'กะเพราหมูกรอบ',
      unitPrice: 65,
      quantity: 2,
      note: 'เผ็ดน้อย',
      options: [],
    });
    expect(editedItem.quantity).toBe(2);
    expect(editedItem.note).toBe('เผ็ดน้อย');

    // 4. Reject non-host trying to close the session
    await expect(
      service.closeSession({
        sessionId: session.id,
        actorUserId: 'U_MEMBER',
      }),
    ).rejects.toMatchObject({
      code: 'UNAUTHORIZED_HOST_ACTION',
      statusCode: 403,
    } satisfies Partial<DomainError>);

    // 5. Host closes the session
    const closedSession = await service.closeSession({
      sessionId: session.id,
      actorUserId: 'U_HOST',
    });
    expect(closedSession.status).toBe('CLOSED');

    // 6. Reject adding or editing items after session is CLOSED
    await expect(
      service.addOrderItem({
        sessionId: session.id,
        orderedByUserId: 'U_MEMBER',
        recipientName: 'เมย์',
        menuName: 'กะเพราหมูกรอบ',
        unitPrice: 65,
        quantity: 1,
        options: [],
      }),
    ).rejects.toMatchObject({
      code: 'ORDER_SESSION_CLOSED',
      statusCode: 409,
    } satisfies Partial<DomainError>);
  });

  it('lists session history ordered with computed summaries', async () => {
    const repo = new InMemoryOrderSessionRepository();
    const service = new OrderSessionService(repo);

    await service.createSession({
      lineGroupId: 'C_GROUP_HISTORY_1',
      hostUserId: 'U_HOST_1',
      customStoreName: 'ข้าวมันไก่ตอน',
    });

    const history = await service.listSessionHistory();
    expect(history).toHaveLength(1);
    expect(history[0]?.session.lineGroupId).toBe('C_GROUP_HISTORY_1');
    expect(history[0]?.summary.storeDisplayName).toBe('ข้าวมันไก่ตอน');
    expect(history[0]?.summary.totalItemsCount).toBe(0);
    expect(history[0]?.summary.grandTotalAmount).toBe(0);
  });

  describe('deleteSession authorization & business rules', () => {
    it('allows Host to delete session directly without PIN', async () => {
      const repo = new InMemoryOrderSessionRepository();
      const service = new OrderSessionService(repo);

      const session = await service.createSession({
        lineGroupId: 'C_GROUP_DEL_1',
        hostUserId: 'U_HOST',
        customStoreName: 'ร้านต้มเลือดหมู',
      });

      await service.deleteSession({
        sessionId: session.id,
        actorUserId: 'U_HOST',
      });

      const found = await repo.findSessionById(session.id);
      expect(found).toBeNull();
    });

    it('rejects deletion by non-host when PIN is missing or incorrect', async () => {
      const repo = new InMemoryOrderSessionRepository();
      const service = new OrderSessionService(repo);

      const session = await service.createSession({
        lineGroupId: 'C_GROUP_DEL_2',
        hostUserId: 'U_HOST',
        customStoreName: 'ร้านส้มตำ',
      });

      // Missing PIN
      await expect(
        service.deleteSession({
          sessionId: session.id,
          actorUserId: 'U_OTHER',
        }),
      ).rejects.toMatchObject({
        code: 'UNAUTHORIZED_SESSION_DELETION',
        statusCode: 403,
      } satisfies Partial<DomainError>);

      // Incorrect PIN
      await expect(
        service.deleteSession({
          sessionId: session.id,
          actorUserId: 'U_OTHER',
          pin: '9999',
        }),
      ).rejects.toMatchObject({
        code: 'UNAUTHORIZED_SESSION_DELETION',
        statusCode: 403,
      } satisfies Partial<DomainError>);

      // Verify session was not deleted
      const found = await repo.findSessionById(session.id);
      expect(found).not.toBeNull();
    });

    it('allows non-host to delete session when valid Admin PIN is provided', async () => {
      const repo = new InMemoryOrderSessionRepository();
      const service = new OrderSessionService(repo);

      process.env.ORDER_DELETE_PIN = '5678';

      const session = await service.createSession({
        lineGroupId: 'C_GROUP_DEL_3',
        hostUserId: 'U_HOST',
        customStoreName: 'ร้านก๋วยเตี๋ยวเรือ',
      });

      await service.deleteSession({
        sessionId: session.id,
        actorUserId: 'U_OTHER',
        pin: '5678',
      });

      const found = await repo.findSessionById(session.id);
      expect(found).toBeNull();

      delete process.env.ORDER_DELETE_PIN;
    });

    it('allows deleting a CLOSED session by Host or authorized user with PIN', async () => {
      const repo = new InMemoryOrderSessionRepository();
      const service = new OrderSessionService(repo);

      const session = await service.createSession({
        lineGroupId: 'C_GROUP_DEL_4',
        hostUserId: 'U_HOST',
        customStoreName: 'ร้านกาแฟโบราณ',
      });

      await service.closeSession({
        sessionId: session.id,
        actorUserId: 'U_HOST',
      });

      await service.deleteSession({
        sessionId: session.id,
        actorUserId: 'U_HOST',
      });

      const found = await repo.findSessionById(session.id);
      expect(found).toBeNull();
    });

    it('throws 404 DomainError if session does not exist', async () => {
      const repo = new InMemoryOrderSessionRepository();
      const service = new OrderSessionService(repo);

      await expect(
        service.deleteSession({
          sessionId: '00000000-0000-4000-8000-000000000000',
          actorUserId: 'U_HOST',
        }),
      ).rejects.toMatchObject({
        code: 'RESOURCE_NOT_FOUND',
        statusCode: 404,
      } satisfies Partial<DomainError>);
    });
  });

  it('formats split-bill breakdown text specifically for KhunThong', () => {
    const text = formatKhunThongSplitText(
      'ข้าวมันไก่ตอน',
      [
        {
          recipientName: 'ตาล',
          totalQuantity: 2,
          totalAmount: 130,
          items: [
            {
              itemId: '1',
              displayTitle: 'ข้าวมันไก่พิเศษ',
              note: null,
              quantity: 1,
              unitPriceWithOptions: 65,
              lineTotal: 65,
            },
            {
              itemId: '2',
              displayTitle: 'ชามะนาว',
              note: null,
              quantity: 1,
              unitPriceWithOptions: 65,
              lineTotal: 65,
            },
          ],
        },
        {
          recipientName: 'บอย',
          totalQuantity: 1,
          totalAmount: 50,
          items: [
            {
              itemId: '3',
              displayTitle: 'ข้าวมันไก่ธรรมดา',
              note: null,
              quantity: 1,
              unitPriceWithOptions: 50,
              lineTotal: 50,
            },
          ],
        },
      ],
      180,
      3,
    );

    expect(text).toContain('สรุปยอดสั่งอาหาร: ข้าวมันไก่ตอน');
    expect(text).toContain('ยอดรวมทั้งหมด: 180 บาท (3 รายการ)');
    expect(text).toContain('1. ตาล: 130 บาท (ข้าวมันไก่พิเศษ x1, ชามะนาว x1)');
    expect(text).toContain('2. บอย: 50 บาท (ข้าวมันไก่ธรรมดา x1)');
    expect(text).toContain('ขุนทอง');
  });

  it('formats split-bill breakdown text when grand total or individual total is 0 baht', () => {
    const textZeroGrandTotal = formatKhunThongSplitText(
      'ร้านป้าตามสั่ง',
      [
        {
          recipientName: 'ตาล',
          totalQuantity: 1,
          totalAmount: 0,
          items: [
            {
              itemId: '1',
              displayTitle: 'กะเพราหมูกรอบ',
              note: null,
              quantity: 1,
              unitPriceWithOptions: 0,
              lineTotal: 0,
            },
          ],
        },
      ],
      0,
      1,
    );

    expect(textZeroGrandTotal).toContain('ยอดรวมทั้งหมด: 1 รายการ (รอร้านคิดเงิน)');
    expect(textZeroGrandTotal).toContain('1. ตาล: รอคิดเงิน (กะเพราหมูกรอบ x1)');
    expect(textZeroGrandTotal).not.toContain('0 บาท');

    const textFreeItem = formatKhunThongSplitText(
      'ข้าวมันไก่ตอน',
      [
        {
          recipientName: 'ตาล',
          totalQuantity: 1,
          totalAmount: 50,
          items: [
            {
              itemId: '1',
              displayTitle: 'ข้าวมันไก่',
              note: null,
              quantity: 1,
              unitPriceWithOptions: 50,
              lineTotal: 50,
            },
          ],
        },
        {
          recipientName: 'บอย',
          totalQuantity: 1,
          totalAmount: 0,
          items: [
            {
              itemId: '2',
              displayTitle: 'น้ำซุปฟรี',
              note: null,
              quantity: 1,
              unitPriceWithOptions: 0,
              lineTotal: 0,
            },
          ],
        },
      ],
      50,
      2,
    );

    expect(textFreeItem).toContain('1. ตาล: 50 บาท (ข้าวมันไก่ x1)');
    expect(textFreeItem).toContain('2. บอย: ฟรี (น้ำซุปฟรี x1)');
  });
});
