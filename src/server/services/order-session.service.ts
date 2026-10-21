import {
  AddOrderItemInputSchema,
  CloseOrderSessionInputSchema,
  CreateOrderSessionInputSchema,
  DeleteOrderItemInputSchema,
  ToggleParticipantReadyInputSchema,
  UpdateOrderItemInputSchema,
  type AddOrderItemInput,
  type CloseOrderSessionInput,
  type CreateOrderSessionInput,
  type DeleteOrderItemInput,
  type OrderItem,
  type OrderSession,
  type OrderSessionSummary,
  type SessionHistoryItem,
  type ToggleParticipantReadyInput,
  type UpdateOrderItemInput,
} from '@/features/order-session/order-session.schema';
import { getLocalizedText } from '@/lib/utils/i18n.schema';
import { DomainError } from '@/server/errors/domain.error';
import type { IOrderSessionRepository } from '@/server/repositories/order-session.repository';
import type { IStoreRepository } from '@/server/repositories/store.repository';
import { buildOrderSessionSummary } from '@/server/services/order-calculator.service';

export class OrderSessionService {
  constructor(
    private readonly sessionRepo: IOrderSessionRepository,
    private readonly storeRepo?: IStoreRepository,
  ) {}

  /**
   * Starts a new ordering session in a LINE group.
   * Enforces Business Rule 1: Only 1 active (OPEN) session allowed per line_group_id.
   */
  async createSession(rawInput: CreateOrderSessionInput): Promise<OrderSession> {
    const input = CreateOrderSessionInputSchema.parse(rawInput);

    const existingOpen = await this.sessionRepo.findOpenSessionByGroupId(input.lineGroupId);
    if (existingOpen) {
      throw new DomainError(
        'ACTIVE_SESSION_ALREADY_EXISTS',
        'กลุ่มนี้มีห้องสั่งอาหารที่กำลังเปิดรับออเดอร์อยู่แล้ว กรุณาปิดห้องเดิมก่อนสร้างห้องใหม่',
        409,
      );
    }

    return this.sessionRepo.createSession(input);
  }

  /**
   * Adds an item to an OPEN session. Rejects immediately if session is CLOSED.
   */
  async addOrderItem(rawInput: AddOrderItemInput): Promise<OrderItem> {
    const input = AddOrderItemInputSchema.parse(rawInput);
    const session = await this.requireOpenSession(input.sessionId);

    return this.sessionRepo.addOrderItem({
      ...input,
      sessionId: session.id,
    });
  }

  /**
   * Updates an existing item in an OPEN session. Only the item creator or Host can edit it.
   */
  async updateOrderItem(rawInput: UpdateOrderItemInput): Promise<OrderItem> {
    const input = UpdateOrderItemInputSchema.parse(rawInput);
    const session = await this.requireOpenSession(input.sessionId);

    const targetItem = session.items.find((item) => item.id === input.itemId);
    if (!targetItem) {
      throw new DomainError('RESOURCE_NOT_FOUND', 'ไม่พบรายการอาหารที่ต้องการแก้ไข', 404);
    }

    const isOwner = targetItem.orderedByUserId === input.actorUserId;
    const isHost = session.hostUserId === input.actorUserId;
    if (!isOwner && !isHost) {
      throw new DomainError(
        'UNAUTHORIZED_ITEM_MUTATION',
        'คุณสามารถแก้ไขได้เฉพาะรายการที่คุณสั่งเอง หรือต้องเป็นหัวหน้าห้อง (Host) เท่านั้น',
        403,
      );
    }

    return this.sessionRepo.updateOrderItem(input);
  }

  /**
   * Deletes an item from an OPEN session. Only the item creator or the session Host can delete it.
   */
  async deleteOrderItem(rawInput: DeleteOrderItemInput): Promise<void> {
    const input = DeleteOrderItemInputSchema.parse(rawInput);
    const session = await this.requireOpenSession(input.sessionId);

    const targetItem = session.items.find((item) => item.id === input.itemId);
    if (!targetItem) {
      throw new DomainError('RESOURCE_NOT_FOUND', 'ไม่พบรายการอาหารที่ต้องการลบ', 404);
    }

    const isOwner = targetItem.orderedByUserId === input.actorUserId;
    const isHost = session.hostUserId === input.actorUserId;
    if (!isOwner && !isHost) {
      throw new DomainError(
        'UNAUTHORIZED_ITEM_MUTATION',
        'คุณสามารถลบได้เฉพาะรายการอาหารที่คุณสั่งเอง หรือต้องเป็นหัวหน้าห้อง (Host) เท่านั้น',
        403,
      );
    }

    await this.sessionRepo.deleteOrderItem(targetItem.id);
  }

  /**
   * Toggles a member's "Ready" status while the session is OPEN.
   */
  async toggleParticipantReady(rawInput: ToggleParticipantReadyInput): Promise<OrderSession> {
    const input = ToggleParticipantReadyInputSchema.parse(rawInput);
    const session = await this.requireOpenSession(input.sessionId);

    const filtered = session.readyUsers.filter((u) => u.userId !== input.userId);
    const updatedReadyUsers = input.isReady
      ? [
          ...filtered,
          {
            userId: input.userId,
            displayName: input.displayName,
            readyAt: new Date().toISOString(),
          },
        ]
      : filtered;

    return this.sessionRepo.updateReadyUsers(session.id, updatedReadyUsers);
  }

  /**
   * Locks ("CLOSE") the session. Only the Host can close the session.
   */
  async closeSession(rawInput: CloseOrderSessionInput): Promise<OrderSession> {
    const input = CloseOrderSessionInputSchema.parse(rawInput);
    const session = await this.requireSession(input.sessionId);

    if (session.hostUserId !== input.actorUserId) {
      throw new DomainError(
        'UNAUTHORIZED_HOST_ACTION',
        'เฉพาะผู้เปิดบิล (Host) เท่านั้นที่สามารถปิดรับออเดอร์ได้',
        403,
      );
    }

    if (session.status === 'CLOSED') {
      return session;
    }

    return this.sessionRepo.closeSession(session.id, new Date().toISOString());
  }

  /**
   * Generates the Grouped & Individual summary + Merchant copy text for a session.
   */
  async getSessionSummary(sessionId: string): Promise<OrderSessionSummary> {
    const session = await this.requireSession(sessionId);
    let storeDisplayName = session.customStoreName?.trim() || 'ร้านอาหาร';

    if (session.storeId && this.storeRepo) {
      const catalog = await this.storeRepo.findStoreCatalogById(session.storeId);
      if (catalog) {
        storeDisplayName = getLocalizedText(catalog.store.name, 'th');
      }
    }

    return buildOrderSessionSummary(session, storeDisplayName);
  }

  /**
   * Retrieves the full session, associated store catalog (if any), and computed summary.
   */
  async getSessionDetail(sessionId: string) {
    const session = await this.requireSession(sessionId);
    const catalog =
      session.storeId && this.storeRepo
        ? await this.storeRepo.findStoreCatalogById(session.storeId)
        : null;

    const storeDisplayName = catalog
      ? getLocalizedText(catalog.store.name, 'th')
      : session.customStoreName?.trim() || 'ร้านอาหารตามสั่ง';

    const summary = buildOrderSessionSummary(session, storeDisplayName);

    return {
      session,
      catalog,
      summary,
    };
  }

  /**
   * Lists all sessions with resolved store name and computed summary.
   */
  async listSessionHistory(limit?: number): Promise<SessionHistoryItem[]> {
    const sessions = await this.sessionRepo.findAllSessions(limit);
    return Promise.all(
      sessions.map(async (session) => {
        let storeDisplayName = session.customStoreName?.trim() || 'ร้านอาหารตามสั่ง';
        if (session.storeId && this.storeRepo) {
          const catalog = await this.storeRepo.findStoreCatalogById(session.storeId);
          if (catalog) {
            storeDisplayName = getLocalizedText(catalog.store.name, 'th');
          }
        }
        const summary = buildOrderSessionSummary(session, storeDisplayName);
        return { session, summary };
      }),
    );
  }

  private async requireSession(sessionId: string): Promise<OrderSession> {
    const session = await this.sessionRepo.findSessionById(sessionId);
    if (!session) {
      throw new DomainError('RESOURCE_NOT_FOUND', 'ไม่พบห้องสั่งอาหารที่ระบุ', 404);
    }
    return session;
  }

  private async requireOpenSession(sessionId: string): Promise<OrderSession> {
    const session = await this.requireSession(sessionId);
    if (session.status !== 'OPEN') {
      throw new DomainError(
        'ORDER_SESSION_CLOSED',
        'ห้องสั่งอาหารนี้ปิดรับออเดอร์แล้ว ไม่สามารถเพิ่ม แก้ไข หรือลบรายการได้',
        409,
      );
    }
    return session;
  }
}
