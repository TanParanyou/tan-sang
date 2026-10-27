import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import type {
  AddOrderItemInput,
  CreateOrderSessionInput,
  OrderItem,
  OrderSession,
  ReadyParticipant,
  UpdateOrderItemInput,
} from '@/features/order-session/order-session.schema';

export interface IOrderSessionRepository {
  findOpenSessionByGroupId(lineGroupId: string): Promise<OrderSession | null>;
  findSessionById(sessionId: string): Promise<OrderSession | null>;
  findAllSessions(limit?: number): Promise<OrderSession[]>;
  createSession(input: CreateOrderSessionInput): Promise<OrderSession>;
  addOrderItem(input: AddOrderItemInput): Promise<OrderItem>;
  updateOrderItem(input: UpdateOrderItemInput): Promise<OrderItem>;
  deleteOrderItem(itemId: string): Promise<void>;
  deleteSession(sessionId: string): Promise<void>;
  updateReadyUsers(sessionId: string, readyUsers: ReadyParticipant[]): Promise<OrderSession>;
  closeSession(sessionId: string, closedAtIso: string): Promise<OrderSession>;
}

export class SupabaseOrderSessionRepository implements IOrderSessionRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async findOpenSessionByGroupId(lineGroupId: string): Promise<OrderSession | null> {
    const { data: sessionRow, error } = await this.db
      .from('order_sessions')
      .select('*')
      .eq('line_group_id', lineGroupId)
      .eq('status', 'OPEN')
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to query open session for group ${lineGroupId}: ${error.message}`);
    }
    if (!sessionRow) {
      return null;
    }

    const items = await this.fetchSessionItems(sessionRow.id);
    return this.mapSessionRow(sessionRow, items);
  }

  async findSessionById(sessionId: string): Promise<OrderSession | null> {
    const { data: sessionRow, error } = await this.db
      .from('order_sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch session ${sessionId}: ${error.message}`);
    }
    if (!sessionRow) {
      return null;
    }

    const items = await this.fetchSessionItems(sessionRow.id);
    return this.mapSessionRow(sessionRow, items);
  }

  async findAllSessions(limit = 50): Promise<OrderSession[]> {
    const { data: sessionRows, error } = await this.db
      .from('order_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to query all sessions: ${error.message}`);
    }
    if (!sessionRows || sessionRows.length === 0) {
      return [];
    }

    return Promise.all(
      sessionRows.map(async (row) => {
        const items = await this.fetchSessionItems(row.id);
        return this.mapSessionRow(row, items);
      }),
    );
  }

  async createSession(input: CreateOrderSessionInput): Promise<OrderSession> {
    const { data: sessionRow, error } = await this.db
      .from('order_sessions')
      .insert({
        line_group_id: input.lineGroupId,
        host_user_id: input.hostUserId,
        store_id: input.storeId ?? null,
        custom_store_name: input.customStoreName ?? null,
        status: 'OPEN',
        ready_user_ids: [],
      })
      .select('*')
      .single();

    if (error || !sessionRow) {
      throw new Error(`Failed to create order session: ${error?.message ?? 'Unknown error'}`);
    }

    return this.mapSessionRow(sessionRow, []);
  }

  async addOrderItem(input: AddOrderItemInput): Promise<OrderItem> {
    const { data: itemRow, error: itemErr } = await this.db
      .from('order_items')
      .insert({
        session_id: input.sessionId,
        ordered_by_user_id: input.orderedByUserId,
        recipient_name: input.recipientName,
        menu_id: input.menuId ?? null,
        menu_name: input.menuName,
        variant_name: input.variantName ?? null,
        unit_price: input.unitPrice,
        quantity: input.quantity,
        note: input.note ?? null,
      })
      .select('*')
      .single();

    if (itemErr || !itemRow) {
      throw new Error(`Failed to insert order item: ${itemErr?.message ?? 'Unknown error'}`);
    }

    if (input.options.length === 0) {
      return this.mapItemRow(itemRow, []);
    }

    const { data: optionRows, error: optionErr } = await this.db
      .from('order_item_options')
      .insert(
        input.options.map((opt) => ({
          order_item_id: itemRow.id,
          option_id: opt.optionId ?? null,
          option_name: opt.optionName,
          price: opt.price,
        })),
      )
      .select('*');

    if (optionErr) {
      throw new Error(`Failed to insert order item options: ${optionErr.message}`);
    }

    return this.mapItemRow(itemRow, optionRows ?? []);
  }

  async updateOrderItem(input: UpdateOrderItemInput): Promise<OrderItem> {
    const { data: itemRow, error: itemErr } = await this.db
      .from('order_items')
      .update({
        recipient_name: input.recipientName,
        menu_id: input.menuId ?? null,
        menu_name: input.menuName,
        variant_name: input.variantName ?? null,
        unit_price: input.unitPrice,
        quantity: input.quantity,
        note: input.note ?? null,
      })
      .eq('id', input.itemId)
      .eq('session_id', input.sessionId)
      .select('*')
      .single();

    if (itemErr || !itemRow) {
      throw new Error(`Failed to update order item: ${itemErr?.message ?? 'Unknown error'}`);
    }

    const { error: delOptErr } = await this.db
      .from('order_item_options')
      .delete()
      .eq('order_item_id', input.itemId);

    if (delOptErr) {
      throw new Error(`Failed to clear old item options: ${delOptErr.message}`);
    }

    if (input.options.length === 0) {
      return this.mapItemRow(itemRow, []);
    }

    const { data: optionRows, error: optionErr } = await this.db
      .from('order_item_options')
      .insert(
        input.options.map((opt) => ({
          order_item_id: itemRow.id,
          option_id: opt.optionId ?? null,
          option_name: opt.optionName,
          price: opt.price,
        })),
      )
      .select('*');

    if (optionErr) {
      throw new Error(`Failed to update item options: ${optionErr.message}`);
    }

    return this.mapItemRow(itemRow, optionRows ?? []);
  }

  async deleteOrderItem(itemId: string): Promise<void> {
    const { error } = await this.db.from('order_items').delete().eq('id', itemId);
    if (error) {
      throw new Error(`Failed to delete order item ${itemId}: ${error.message}`);
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    const { error } = await this.db.from('order_sessions').delete().eq('id', sessionId);
    if (error) {
      throw new Error(`Failed to delete order session ${sessionId}: ${error.message}`);
    }
  }

  async updateReadyUsers(
    sessionId: string,
    readyUsers: ReadyParticipant[],
  ): Promise<OrderSession> {
    const { data: sessionRow, error } = await this.db
      .from('order_sessions')
      .update({ ready_user_ids: readyUsers })
      .eq('id', sessionId)
      .select('*')
      .single();

    if (error || !sessionRow) {
      throw new Error(`Failed to update ready users: ${error?.message ?? 'Unknown error'}`);
    }

    const items = await this.fetchSessionItems(sessionId);
    return this.mapSessionRow(sessionRow, items);
  }

  async closeSession(sessionId: string, closedAtIso: string): Promise<OrderSession> {
    const { data: sessionRow, error } = await this.db
      .from('order_sessions')
      .update({
        status: 'CLOSED',
        closed_at: closedAtIso,
      })
      .eq('id', sessionId)
      .select('*')
      .single();

    if (error || !sessionRow) {
      throw new Error(`Failed to close session ${sessionId}: ${error?.message ?? 'Unknown error'}`);
    }

    const items = await this.fetchSessionItems(sessionId);
    return this.mapSessionRow(sessionRow, items);
  }

  private async fetchSessionItems(sessionId: string): Promise<OrderItem[]> {
    const { data: itemRows, error: itemErr } = await this.db
      .from('order_items')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (itemErr) {
      throw new Error(`Failed to fetch items for session ${sessionId}: ${itemErr.message}`);
    }

    const itemIds = (itemRows ?? []).map((i) => i.id);
    const { data: optionRows, error: optErr } =
      itemIds.length > 0
        ? await this.db.from('order_item_options').select('*').in('order_item_id', itemIds)
        : { data: [], error: null };

    if (optErr) {
      throw new Error(`Failed to fetch item options: ${optErr.message}`);
    }

    const optionsByItemId = new Map<
      string,
      Database['public']['Tables']['order_item_options']['Row'][]
    >();
    for (const row of optionRows ?? []) {
      const list = optionsByItemId.get(row.order_item_id) ?? [];
      list.push(row);
      optionsByItemId.set(row.order_item_id, list);
    }

    return (itemRows ?? []).map((item) =>
      this.mapItemRow(item, optionsByItemId.get(item.id) ?? []),
    );
  }

  private mapSessionRow(
    row: Database['public']['Tables']['order_sessions']['Row'],
    items: OrderItem[],
  ): OrderSession {
    return {
      id: row.id,
      lineGroupId: row.line_group_id,
      hostUserId: row.host_user_id,
      storeId: row.store_id,
      customStoreName: row.custom_store_name,
      status: row.status,
      readyUsers: Array.isArray(row.ready_user_ids) ? row.ready_user_ids : [],
      createdAt: new Date(row.created_at).toISOString(),
      closedAt: row.closed_at ? new Date(row.closed_at).toISOString() : null,
      items,
    };
  }

  private mapItemRow(
    row: Database['public']['Tables']['order_items']['Row'],
    optionRows: Database['public']['Tables']['order_item_options']['Row'][],
  ): OrderItem {
    return {
      id: row.id,
      sessionId: row.session_id,
      orderedByUserId: row.ordered_by_user_id,
      recipientName: row.recipient_name,
      menuId: row.menu_id,
      menuName: row.menu_name,
      variantName: row.variant_name,
      unitPrice: Number(row.unit_price),
      quantity: row.quantity,
      note: row.note,
      createdAt: new Date(row.created_at).toISOString(),
      options: optionRows.map((opt) => ({
        id: opt.id,
        orderItemId: opt.order_item_id,
        optionId: opt.option_id,
        optionName: opt.option_name,
        price: Number(opt.price),
      })),
    };
  }
}
