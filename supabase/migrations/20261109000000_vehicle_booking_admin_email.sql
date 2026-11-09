CREATE OR REPLACE FUNCTION public.enqueue_vehicle_booking_admin_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.admin_email_outbox (
        idempotency_key,
        related_type,
        related_id,
        payload,
        created_at
    )
    VALUES (
        'vehicle_booking:' || NEW.id::text,
        'vehicle_booking',
        NEW.id,
        jsonb_build_object(
            'occurred_at', NEW.created_at,
            'title', CASE NEW.service_type
                WHEN 'auto' THEN 'নতুন অটো বুকিং অনুরোধ'
                ELSE 'নতুন CNG বুকিং অনুরোধ'
            END,
            'summary', 'একটি নতুন যাত্রার বুকিং অনুরোধ পর্যালোচনার অপেক্ষায় আছে।',
            'admin_path', '/admin/vehicle-bookings/' || NEW.service_type
        ),
        NEW.created_at
    )
    ON CONFLICT (idempotency_key) DO NOTHING;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_vehicle_booking_admin_email() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_vehicle_bookings_admin_email_outbox ON public.vehicle_bookings;
CREATE TRIGGER trg_vehicle_bookings_admin_email_outbox
AFTER INSERT ON public.vehicle_bookings
FOR EACH ROW EXECUTE FUNCTION public.enqueue_vehicle_booking_admin_email();
