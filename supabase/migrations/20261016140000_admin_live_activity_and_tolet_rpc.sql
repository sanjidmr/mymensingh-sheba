-- Anonymous site presence stores only an opaque browser id and a heartbeat.
-- The raw table is never directly readable or writable by API roles.
CREATE TABLE IF NOT EXISTS public.site_active_visitors (
    visitor_id TEXT PRIMARY KEY
        CHECK (visitor_id ~ '^[A-Za-z0-9_-]{6,80}$'),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_active_visitors_last_seen
    ON public.site_active_visitors (last_seen_at DESC);

ALTER TABLE public.site_active_visitors ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.site_active_visitors FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.fn_record_active_visitor(p_visitor_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF p_visitor_id IS NULL OR p_visitor_id !~ '^[A-Za-z0-9_-]{6,80}$' THEN
        RAISE EXCEPTION 'invalid visitor id';
    END IF;

    INSERT INTO public.site_active_visitors (visitor_id, last_seen_at)
    VALUES (p_visitor_id, NOW())
    ON CONFLICT (visitor_id) DO UPDATE
       SET last_seen_at = EXCLUDED.last_seen_at
     WHERE public.site_active_visitors.last_seen_at < NOW() - INTERVAL '20 seconds';
END;
$$;

REVOKE ALL ON FUNCTION public.fn_record_active_visitor(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_record_active_visitor(TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.fn_admin_active_visitors()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    active_count BIGINT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'admin only' USING ERRCODE = '42501';
    END IF;

    DELETE FROM public.site_active_visitors
    WHERE last_seen_at < NOW() - INTERVAL '30 days';

    SELECT COUNT(*) INTO active_count
    FROM public.site_active_visitors
    WHERE last_seen_at >= NOW() - INTERVAL '5 minutes';

    RETURN active_count;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_admin_active_visitors() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_admin_active_visitors() TO authenticated;
COMMENT ON FUNCTION public.fn_admin_active_visitors() IS
    'Admin-only count of opaque browser visitors seen within the last five minutes.';

-- Preserve the existing analytics implementation while exposing the argument
-- names and order expected by the admin client and PostgREST.
DO $$
DECLARE
    function_count INTEGER;
    function_signature REGPROCEDURE;
BEGIN
    SELECT COUNT(*) INTO function_count
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'fn_admin_tolet_listing_analytics';

    IF function_count <> 1 THEN
        RAISE EXCEPTION
            'Expected one existing fn_admin_tolet_listing_analytics function, found %',
            function_count;
    END IF;

    SELECT p.oid::REGPROCEDURE INTO function_signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'fn_admin_tolet_listing_analytics';

    EXECUTE format(
        'ALTER FUNCTION %s RENAME TO %I',
        function_signature,
        'fn_admin_tolet_listing_analytics_impl'
    );

    SELECT p.oid::REGPROCEDURE INTO function_signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'fn_admin_tolet_listing_analytics_impl';

    EXECUTE format(
        'REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated',
        function_signature
    );
END;
$$;

CREATE FUNCTION public.fn_admin_tolet_listing_analytics(
    p_from DATE DEFAULT NULL,
    p_period TEXT DEFAULT 'day',
    p_to DATE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT public.fn_admin_tolet_listing_analytics_impl(
        p_from => $1,
        p_to => $3,
        p_period => $2
    );
$$;

REVOKE ALL ON FUNCTION public.fn_admin_tolet_listing_analytics(DATE, TEXT, DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_admin_tolet_listing_analytics(DATE, TEXT, DATE) TO authenticated;

NOTIFY pgrst, 'reload schema';
