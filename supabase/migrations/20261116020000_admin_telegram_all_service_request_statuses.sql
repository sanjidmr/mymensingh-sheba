CREATE OR REPLACE FUNCTION public.enqueue_non_new_service_request_admin_telegram()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    event_time TIMESTAMPTZ := COALESCE(NEW.created_at, NOW());
    event_title TEXT := 'নতুন সার্ভিস রিকোয়েস্ট: ' || COALESCE(NEW.service_slug, 'অন্যান্য');
    item_title TEXT := COALESCE(
        NULLIF(NEW.profile_title, ''),
        NULLIF(NEW.service_type, ''),
        NEW.service_slug
    );
    event_details TEXT := COALESCE(
        NULLIF(NEW.details, ''),
        NULLIF(NEW.service_type, '')
    );
BEGIN
    BEGIN
        INSERT INTO public.admin_telegram_outbox (
            idempotency_key,
            related_type,
            related_id,
            payload,
            created_at
        )
        VALUES (
            'service_request:' || NEW.id::TEXT,
            'service_request',
            NEW.id,
            JSONB_BUILD_OBJECT(
                'event_type', 'service_request',
                'occurred_at', event_time,
                'title', event_title,
                'summary', LEFT(CONCAT_WS(E'\n',
                    CASE WHEN NEW.contact_name IS NOT NULL THEN 'নাম: ' || NEW.contact_name END,
                    CASE WHEN NEW.contact_phone IS NOT NULL THEN 'ফোন: ' || NEW.contact_phone END,
                    CASE WHEN NEW.area_id IS NOT NULL THEN 'এলাকা: ' || NEW.area_id END,
                    CASE WHEN item_title IS NOT NULL THEN 'শিরোনাম: ' || item_title END,
                    NULLIF(event_details, '')
                ), 3000),
                'user_name', NEW.contact_name,
                'user_phone', NEW.contact_phone,
                'area', NEW.area_id,
                'item_title', item_title,
                'details', event_details,
                'admin_path', '/admin/requests/' || NEW.id::TEXT
            ),
            event_time
        )
        ON CONFLICT (idempotency_key) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Admin Telegram service-request enqueue failed (id %): %',
            NEW.id, SQLERRM;
    END;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_non_new_service_request_admin_telegram()
    FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_non_new_service_requests_admin_telegram_outbox
AFTER INSERT ON public.service_requests
FOR EACH ROW
WHEN (NEW.status IS DISTINCT FROM 'new')
EXECUTE FUNCTION public.enqueue_non_new_service_request_admin_telegram();
