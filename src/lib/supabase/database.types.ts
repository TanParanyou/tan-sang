import type { LocalizedName } from '@/lib/utils/i18n.schema';

export interface ReadyParticipantRecord {
  userId: string;
  displayName: string;
  readyAt: string;
}

export type Database = {
  public: {
    Tables: {
      stores: {
        Row: {
          id: string;
          name: LocalizedName;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          name: LocalizedName;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: LocalizedName;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      store_menus: {
        Row: {
          id: string;
          store_id: string;
          name: LocalizedName;
          status: 'ACTIVE' | 'BANNED' | 'OUT_OF_STOCK';
          vote_ban_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          name: LocalizedName;
          status?: 'ACTIVE' | 'BANNED' | 'OUT_OF_STOCK';
          vote_ban_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          name?: LocalizedName;
          status?: 'ACTIVE' | 'BANNED' | 'OUT_OF_STOCK';
          vote_ban_count?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      menu_price_variants: {
        Row: {
          id: string;
          menu_id: string;
          name: LocalizedName;
          price: number | string;
          is_default: boolean;
        };
        Insert: {
          id?: string;
          menu_id: string;
          name: LocalizedName;
          price?: number;
          is_default?: boolean;
        };
        Update: {
          id?: string;
          menu_id?: string;
          name?: LocalizedName;
          price?: number;
          is_default?: boolean;
        };
        Relationships: [];
      };
      menu_options: {
        Row: {
          id: string;
          store_id: string;
          menu_id: string | null;
          name: LocalizedName;
          price: number | string;
          is_available: boolean;
        };
        Insert: {
          id?: string;
          store_id: string;
          menu_id?: string | null;
          name: LocalizedName;
          price?: number;
          is_available?: boolean;
        };
        Update: {
          id?: string;
          store_id?: string;
          menu_id?: string | null;
          name?: LocalizedName;
          price?: number;
          is_available?: boolean;
        };
        Relationships: [];
      };
      order_sessions: {
        Row: {
          id: string;
          line_group_id: string;
          host_user_id: string;
          store_id: string | null;
          custom_store_name: string | null;
          status: 'OPEN' | 'CLOSED';
          ready_user_ids: ReadyParticipantRecord[];
          created_at: string;
          closed_at: string | null;
        };
        Insert: {
          id?: string;
          line_group_id: string;
          host_user_id: string;
          store_id?: string | null;
          custom_store_name?: string | null;
          status?: 'OPEN' | 'CLOSED';
          ready_user_ids?: ReadyParticipantRecord[];
          created_at?: string;
          closed_at?: string | null;
        };
        Update: {
          id?: string;
          line_group_id?: string;
          host_user_id?: string;
          store_id?: string | null;
          custom_store_name?: string | null;
          status?: 'OPEN' | 'CLOSED';
          ready_user_ids?: ReadyParticipantRecord[];
          created_at?: string;
          closed_at?: string | null;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          session_id: string;
          ordered_by_user_id: string;
          recipient_name: string;
          menu_id: string | null;
          menu_name: string;
          variant_name: string | null;
          unit_price: number | string;
          quantity: number;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          ordered_by_user_id: string;
          recipient_name: string;
          menu_id?: string | null;
          menu_name: string;
          variant_name?: string | null;
          unit_price: number;
          quantity?: number;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          ordered_by_user_id?: string;
          recipient_name?: string;
          menu_id?: string | null;
          menu_name?: string;
          variant_name?: string | null;
          unit_price?: number;
          quantity?: number;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      order_item_options: {
        Row: {
          id: string;
          order_item_id: string;
          option_id: string | null;
          option_name: string;
          price: number | string;
        };
        Insert: {
          id?: string;
          order_item_id: string;
          option_id?: string | null;
          option_name: string;
          price?: number;
        };
        Update: {
          id?: string;
          order_item_id?: string;
          option_id?: string | null;
          option_name?: string;
          price?: number;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
