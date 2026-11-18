CREATE INDEX IF NOT EXISTS idx_service_requests_customer_created_id
    ON public.service_requests (customer_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_saved_items_user_created_id
    ON public.saved_items (user_id, created_at DESC, id DESC);
