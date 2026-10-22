-- ============================================================================
-- Tan-Sang (ทันสั่ง) - Preserve Store Name on Order Sessions on Store Deletion
-- Ensures check constraint order_sessions_store_or_custom_check is never violated
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_store_before_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Preserve store name in order_sessions before store_id becomes NULL
    UPDATE public.order_sessions
    SET custom_store_name = COALESCE(OLD.name->>'th', OLD.name->>'en', OLD.id)
    WHERE store_id = OLD.id AND (custom_store_name IS NULL OR btrim(custom_store_name) = '');

    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_handle_store_before_delete ON public.stores;
CREATE TRIGGER trg_handle_store_before_delete
BEFORE DELETE ON public.stores
FOR EACH ROW
EXECUTE FUNCTION public.handle_store_before_delete();
