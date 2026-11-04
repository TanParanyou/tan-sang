-- ============================================================================
-- Tan-Sang (ทันสั่ง) - Fix Trigger Cascade on Order Session Deletion
-- Allows foreign key ON DELETE CASCADE on order_items when session itself is deleted
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prevent_closed_session_item_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    target_session_id UUID;
    current_session_status VARCHAR(20);
BEGIN
    -- 1. If foreign key ON DELETE SET NULL on menu_id occurs, allow it even if closed
    IF TG_OP = 'UPDATE' AND (OLD.menu_id IS DISTINCT FROM NEW.menu_id) AND NEW.menu_id IS NULL
       AND (OLD.session_id, OLD.ordered_by_user_id, OLD.recipient_name, OLD.menu_name, OLD.variant_name, OLD.unit_price, OLD.quantity, OLD.note)
           IS NOT DISTINCT FROM
           (NEW.session_id, NEW.ordered_by_user_id, NEW.recipient_name, NEW.menu_name, NEW.variant_name, NEW.unit_price, NEW.quantity, NEW.note) THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'DELETE' THEN 
        target_session_id := OLD.session_id;
    ELSE 
        target_session_id := NEW.session_id; 
    END IF;

    SELECT status INTO current_session_status 
    FROM public.order_sessions 
    WHERE id = target_session_id;

    -- 2. Allow CASCADE deletes when the order session itself is being removed
    IF TG_OP = 'DELETE' AND current_session_status IS NULL THEN
        RETURN OLD;
    END IF;

    -- 3. Block mutations on items when session is not OPEN
    IF current_session_status IS DISTINCT FROM 'OPEN' THEN
        RAISE EXCEPTION 'ORDER_SESSION_CLOSED: Cannot mutate order_items when session is %', 
            COALESCE(current_session_status, 'NOT_FOUND') 
            USING ERRCODE = 'P0001';
    END IF;

    IF TG_OP = 'DELETE' THEN 
        RETURN OLD; 
    END IF;
    RETURN NEW;
END;
$$;
