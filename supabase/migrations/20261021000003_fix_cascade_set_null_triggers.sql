-- ============================================================================
-- Tan-Sang (ทันสั่ง) - Fix Trigger Cascade on Menu and Option Deletion
-- Allows foreign key ON DELETE SET NULL to proceed even if order session is CLOSED
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prevent_closed_session_item_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    target_session_id UUID;
    current_session_status VARCHAR(20);
BEGIN
    -- If foreign key ON DELETE SET NULL on menu_id occurs, allow it even if closed
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

CREATE OR REPLACE FUNCTION public.prevent_closed_session_item_option_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    target_order_item_id UUID;
    current_session_status VARCHAR(20);
BEGIN
    -- If foreign key ON DELETE SET NULL on option_id occurs, allow it even if closed
    IF TG_OP = 'UPDATE' AND (OLD.option_id IS DISTINCT FROM NEW.option_id) AND NEW.option_id IS NULL
       AND (OLD.order_item_id, OLD.option_name, OLD.price)
           IS NOT DISTINCT FROM
           (NEW.order_item_id, NEW.option_name, NEW.price) THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'DELETE' THEN 
        target_order_item_id := OLD.order_item_id;
    ELSE 
        target_order_item_id := NEW.order_item_id; 
    END IF;

    SELECT s.status INTO current_session_status
    FROM public.order_items i
    JOIN public.order_sessions s ON s.id = i.session_id
    WHERE i.id = target_order_item_id;

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
