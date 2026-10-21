-- ============================================================================
-- Tan-Sang (ทันสั่ง) - Initial Database Schema Migration
-- PostgreSQL / Supabase
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. stores
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stores (
    id VARCHAR(32) PRIMARY KEY,
    name JSONB NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT stores_name_has_th CHECK (jsonb_typeof(name) = 'object' AND (name ? 'th'))
);

CREATE INDEX IF NOT EXISTS idx_stores_is_active ON public.stores (is_active);

-- ----------------------------------------------------------------------------
-- 2. store_menus
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_menus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id VARCHAR(32) NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name JSONB NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    vote_ban_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT store_menus_status_check CHECK (status IN ('ACTIVE', 'BANNED', 'OUT_OF_STOCK')),
    CONSTRAINT store_menus_vote_ban_non_negative CHECK (vote_ban_count >= 0),
    CONSTRAINT store_menus_name_has_th CHECK (jsonb_typeof(name) = 'object' AND (name ? 'th'))
);

CREATE INDEX IF NOT EXISTS idx_store_menus_store_id_status ON public.store_menus (store_id, status);

-- ----------------------------------------------------------------------------
-- 3. menu_price_variants
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.menu_price_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_id UUID NOT NULL REFERENCES public.store_menus(id) ON DELETE CASCADE,
    name JSONB NOT NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT menu_price_variants_price_non_negative CHECK (price >= 0),
    CONSTRAINT menu_price_variants_name_has_th CHECK (jsonb_typeof(name) = 'object' AND (name ? 'th'))
);

CREATE INDEX IF NOT EXISTS idx_menu_price_variants_menu_id ON public.menu_price_variants (menu_id);

-- ----------------------------------------------------------------------------
-- 4. menu_options
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.menu_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id VARCHAR(32) NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    menu_id UUID REFERENCES public.store_menus(id) ON DELETE CASCADE,
    name JSONB NOT NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT menu_options_price_non_negative CHECK (price >= 0),
    CONSTRAINT menu_options_name_has_th CHECK (jsonb_typeof(name) = 'object' AND (name ? 'th'))
);

CREATE INDEX IF NOT EXISTS idx_menu_options_store_menu ON public.menu_options (store_id, menu_id);

-- ----------------------------------------------------------------------------
-- 5. order_sessions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    line_group_id VARCHAR(64) NOT NULL,
    host_user_id VARCHAR(64) NOT NULL,
    store_id VARCHAR(32) REFERENCES public.stores(id) ON DELETE SET NULL,
    custom_store_name VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    ready_user_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    CONSTRAINT order_sessions_status_check CHECK (status IN ('OPEN', 'CLOSED')),
    CONSTRAINT order_sessions_store_or_custom_check CHECK (
        store_id IS NOT NULL OR (custom_store_name IS NOT NULL AND btrim(custom_store_name) <> '')
    ),
    CONSTRAINT order_sessions_ready_users_is_array CHECK (jsonb_typeof(ready_user_ids) = 'array')
);

-- Business Rule 1: Only 1 active (OPEN) session allowed per line_group_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_order_sessions_one_open_per_group
    ON public.order_sessions (line_group_id)
    WHERE status = 'OPEN';

CREATE INDEX IF NOT EXISTS idx_order_sessions_line_group_status
    ON public.order_sessions (line_group_id, status);

-- ----------------------------------------------------------------------------
-- 6. order_items
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.order_sessions(id) ON DELETE CASCADE,
    ordered_by_user_id VARCHAR(64) NOT NULL,
    recipient_name VARCHAR(100) NOT NULL,
    menu_id UUID REFERENCES public.store_menus(id) ON DELETE SET NULL,
    menu_name VARCHAR(255) NOT NULL,
    variant_name VARCHAR(100),
    unit_price NUMERIC(10, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT order_items_unit_price_non_negative CHECK (unit_price >= 0),
    CONSTRAINT order_items_quantity_positive CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS idx_order_items_session_id ON public.order_items (session_id);
CREATE INDEX IF NOT EXISTS idx_order_items_ordered_by ON public.order_items (session_id, ordered_by_user_id);

-- ----------------------------------------------------------------------------
-- 7. order_item_options
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_item_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
    option_id UUID REFERENCES public.menu_options(id) ON DELETE SET NULL,
    option_name VARCHAR(255) NOT NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    CONSTRAINT order_item_options_price_non_negative CHECK (price >= 0)
);

CREATE INDEX IF NOT EXISTS idx_order_item_options_order_item_id ON public.order_item_options (order_item_id);

-- ============================================================================
-- Database-Level Session Locking Guards (Business Rule 1)
-- ============================================================================
-- Reject any INSERT, UPDATE, or DELETE on order_items when parent session is CLOSED
CREATE OR REPLACE FUNCTION public.prevent_closed_session_item_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    target_session_id UUID;
    current_session_status VARCHAR(20);
BEGIN
    IF TG_OP = 'DELETE' THEN
        target_session_id := OLD.session_id;
    ELSE
        target_session_id := NEW.session_id;
    END IF;

    SELECT status INTO current_session_status
    FROM public.order_sessions
    WHERE id = target_session_id;

    IF current_session_status IS DISTINCT FROM 'OPEN' THEN
        RAISE EXCEPTION 'ORDER_SESSION_CLOSED: Cannot mutate order_items when session (%) is %',
            target_session_id, COALESCE(current_session_status, 'NOT_FOUND')
            USING ERRCODE = 'P0001';
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_closed_session_item_mutation ON public.order_items;
CREATE TRIGGER trg_prevent_closed_session_item_mutation
BEFORE INSERT OR UPDATE OR DELETE ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.prevent_closed_session_item_mutation();

-- Reject any INSERT, UPDATE, or DELETE on order_item_options when parent session is CLOSED
CREATE OR REPLACE FUNCTION public.prevent_closed_session_item_option_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    target_order_item_id UUID;
    current_session_status VARCHAR(20);
BEGIN
    IF TG_OP = 'DELETE' THEN
        target_order_item_id := OLD.order_item_id;
    ELSE
        target_order_item_id := NEW.order_item_id;
    END IF;

    SELECT s.status INTO current_session_status
    FROM public.order_items i
    JOIN public.order_sessions s ON s.id = i.session_id
    WHERE i.id = target_order_item_id;

    -- Allow CASCADE deletes only when session itself is being removed, otherwise block if CLOSED
    IF current_session_status = 'CLOSED' THEN
        RAISE EXCEPTION 'ORDER_SESSION_CLOSED: Cannot mutate order_item_options when session is CLOSED'
            USING ERRCODE = 'P0001';
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_closed_session_item_option_mutation ON public.order_item_options;
CREATE TRIGGER trg_prevent_closed_session_item_option_mutation
BEFORE INSERT OR UPDATE OR DELETE ON public.order_item_options
FOR EACH ROW
EXECUTE FUNCTION public.prevent_closed_session_item_option_mutation();

-- ============================================================================
-- Row Level Security (RLS) - Enabled on all public tables per Supabase Skill
-- ============================================================================
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_price_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_item_options ENABLE ROW LEVEL SECURITY;

