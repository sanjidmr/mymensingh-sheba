DROP TRIGGER IF EXISTS trg_service_requests_admin_telegram_outbox
    ON public.service_requests;

DROP TRIGGER IF EXISTS trg_tolet_listings_admin_telegram_outbox
    ON public.tolet_listings;

ALTER TABLE public.tolet_listings REPLICA IDENTITY FULL;
