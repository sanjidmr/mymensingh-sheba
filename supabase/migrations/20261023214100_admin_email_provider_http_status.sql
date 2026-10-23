ALTER TABLE public.admin_email_outbox
    ADD COLUMN IF NOT EXISTS provider_http_status SMALLINT
        CHECK (provider_http_status BETWEEN 100 AND 599);
