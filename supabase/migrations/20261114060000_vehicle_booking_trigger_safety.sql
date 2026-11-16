CREATE OR REPLACE FUNCTION public.enqueue_vehicle_booking_admin_telegram_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    occurred_at TIMESTAMPTZ := COALESCE(NEW.updated_at, NEW.created_at, NOW());
    event_title TEXT := 'নতুন যানবাহন বুকিং: ' || NEW.service_type;
    details TEXT := CONCAT_WS(E'\n',
        'পিকআপ: ' || NEW.pickup_location,
        'গন্তব্য: ' || NEW.destination,
        'যাত্রার সময়: ' || NEW.requested_at
    );
BEGIN
    IF TG_OP <> 'INSERT' THEN
        RETURN NEW;
    END IF;

    BEGIN
        INSERT INTO public.admin_telegram_outbox (
            idempotency_key,
            related_type,
            related_id,
            payload,
            created_at
        )
        VALUES (
            'vehicle_booking:' || NEW.id::TEXT,
            'vehicle_booking',
            NEW.id,
            JSONB_BUILD_OBJECT(
                'event_type', 'vehicle_booking',
                'occurred_at', occurred_at,
                'title', event_title,
                'summary', LEFT(CONCAT_WS(E'\n',
                    'নাম: ' || NEW.passenger_name,
                    'ফোন: ' || NEW.mobile_number,
                    'এলাকা: ' || NEW.pickup_location,
                    NULLIF(details, '')
                ), 3000),
                'user_name', NEW.passenger_name,
                'user_phone', NEW.mobile_number,
                'area', NEW.pickup_location,
                'item_title', NULL,
                'details', details,
                'admin_path', '/admin/vehicle-bookings/' || NEW.service_type
            ),
            occurred_at
        )
        ON CONFLICT (idempotency_key) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Vehicle booking admin event enqueue failed (id %): %',
            NEW.id, SQLERRM;
    END;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_vehicle_booking_admin_telegram_event()
    FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_vehicle_bookings_admin_telegram_outbox
    ON public.vehicle_bookings;

CREATE TRIGGER trg_vehicle_bookings_admin_telegram_outbox
AFTER INSERT ON public.vehicle_bookings
FOR EACH ROW EXECUTE FUNCTION public.enqueue_vehicle_booking_admin_telegram_event();
