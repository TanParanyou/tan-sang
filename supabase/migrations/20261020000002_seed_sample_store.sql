-- ============================================================================
-- Tan-Sang (ทันสั่ง) - Sample Store Seed Migration (STORE01: ครัวตาล)
-- ============================================================================

INSERT INTO public.stores (id, name, is_active)
VALUES ('STORE01', '{"th": "ครัวตาล", "en": "Krua Tarn"}'::jsonb, TRUE)
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE
    v_menu_fried_rice UUID := '11111111-1111-4111-8111-111111111101';
    v_menu_kaprao_pork UUID := '11111111-1111-4111-8111-111111111102';
BEGIN
    -- Menus
    INSERT INTO public.store_menus (id, store_id, name, status, vote_ban_count)
    VALUES
        (v_menu_fried_rice, 'STORE01', '{"th": "ข้าวผัดหมู", "en": "Pork Fried Rice"}'::jsonb, 'ACTIVE', 0),
        (v_menu_kaprao_pork, 'STORE01', '{"th": "ข้าวกะเพราหมูสับ", "en": "Basil Minced Pork Rice"}'::jsonb, 'ACTIVE', 0)
    ON CONFLICT (id) DO NOTHING;

    -- Price Variants
    INSERT INTO public.menu_price_variants (id, menu_id, name, price, is_default)
    VALUES
        ('22222222-2222-4222-8222-222222222201', v_menu_fried_rice, '{"th": "ธรรมดา", "en": "Regular"}'::jsonb, 50.00, TRUE),
        ('22222222-2222-4222-8222-222222222202', v_menu_fried_rice, '{"th": "พิเศษ", "en": "Large"}'::jsonb, 60.00, FALSE),
        ('22222222-2222-4222-8222-222222222203', v_menu_kaprao_pork, '{"th": "ธรรมดา", "en": "Regular"}'::jsonb, 55.00, TRUE),
        ('22222222-2222-4222-8222-222222222204', v_menu_kaprao_pork, '{"th": "พิเศษ", "en": "Large"}'::jsonb, 65.00, FALSE)
    ON CONFLICT (id) DO NOTHING;

    -- Store-wide Add-on Options (menu_id IS NULL)
    INSERT INTO public.menu_options (id, store_id, menu_id, name, price, is_available)
    VALUES
        ('33333333-3333-4333-8333-333333333301', 'STORE01', NULL, '{"th": "ไข่ดาว", "en": "Fried Egg"}'::jsonb, 10.00, TRUE),
        ('33333333-3333-4333-8333-333333333302', 'STORE01', NULL, '{"th": "ไข่เจียว", "en": "Omelet"}'::jsonb, 15.00, TRUE)
    ON CONFLICT (id) DO NOTHING;
END $$;
