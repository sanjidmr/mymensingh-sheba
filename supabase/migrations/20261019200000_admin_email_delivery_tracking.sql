 CREATE TABLE IF NOT EXISTS public.admin_email_deliveries (
    event_key TEXT PRIMARY KEY,
    related_type TEXT NOT NULL,
    related_id UUID NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('sending', 'sent', 'failed')),
    attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
    provider_message_id TEXT,
    last_error TEXT,
    last_attempt_at TIMESTAMPTZ,
    next_attempt_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_admin_email_deliveries_created
    ON public.admin_email_deliveries (created_at DESC);

ALTER TABLE public.admin_email_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_email_deliveries FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.admin_email_deliveries TO service_role;
