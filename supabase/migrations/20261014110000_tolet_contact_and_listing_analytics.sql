-- Public contact data is released only for approved listings, never by
-- exposing profile rows or phone columns through the public table policies.
CREATE OR REPLACE FUNCTION public.fn_public_tolet_listing_contacts(p_listing_ids UUID[])
RETURNS TABLE (listing_id UUID, phone TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT l.id, p.phone
    FROM public.tolet_listings l
    JOIN public.profiles p ON p.id = l.owner_id
    WHERE l.id = ANY(COALESCE(p_listing_ids, ARRAY[]::UUID[]))
      AND l.status = 'approved'
      AND NULLIF(BTRIM(p.phone), '') IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.fn_public_tolet_listing_contacts(UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_public_tolet_listing_contacts(UUID[]) TO anon, authenticated;

-- Route all public event writes through a function that takes its user identity
-- and listing metadata from the authenticated session and database.
DROP POLICY IF EXISTS "Anyone can record a tolet engagement event" ON public.tolet_listing_events;
REVOKE INSERT ON public.tolet_listing_events FROM PUBLIC, anon, authenticated;
CREATE INDEX IF NOT EXISTS idx_tolet_events_visitor_created
    ON public.tolet_listing_events (visitor_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.fn_record_tolet_listing_event(
    p_event_id UUID,
    p_listing_id UUID,
    p_event_type TEXT,
    p_event_source TEXT,
    p_visitor_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    listing public.tolet_listings%ROWTYPE;
    recent_events INTEGER;
BEGIN
    IF p_event_type IS NULL OR p_event_type NOT IN ('view', 'call_click', 'whatsapp_click', 'favorite', 'share') THEN
        RAISE EXCEPTION 'invalid To-Let event type';
    END IF;
    IF p_event_source IS NULL OR p_event_source NOT IN ('detail_page', 'sticky_bar', 'card') THEN
        RAISE EXCEPTION 'invalid To-Let event source';
    END IF;
    IF p_visitor_id IS NULL OR p_visitor_id !~ '^[A-Za-z0-9_-]{6,80}$' THEN
        RAISE EXCEPTION 'invalid visitor id';
    END IF;

    SELECT * INTO listing
    FROM public.tolet_listings
    WHERE id = p_listing_id AND status = 'approved';
    IF NOT FOUND THEN
        RAISE EXCEPTION 'approved listing not found';
    END IF;

    SELECT COUNT(*) INTO recent_events
    FROM public.tolet_listing_events
    WHERE visitor_id = p_visitor_id
      AND created_at >= NOW() - INTERVAL '1 minute';
    IF recent_events >= 120 THEN
        RAISE EXCEPTION 'To-Let event rate limit exceeded';
    END IF;

    INSERT INTO public.tolet_listing_events (
        id, listing_id, event_type, event_source, visitor_id, user_id,
        area_id, property_type, rent_price, created_at
    )
    VALUES (
        p_event_id, p_listing_id::TEXT, p_event_type, p_event_source, p_visitor_id,
        auth.uid(), listing.area_id, listing.property_type, listing.rent_price, NOW()
    )
    ON CONFLICT (id) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_record_tolet_listing_event(UUID, UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_record_tolet_listing_event(UUID, UUID, TEXT, TEXT, TEXT)
    TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.fn_admin_tolet_listing_analytics(
    p_from DATE DEFAULT NULL,
    p_to DATE DEFAULT NULL,
    p_period TEXT DEFAULT 'day'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_from DATE := COALESCE(p_from, (NOW() AT TIME ZONE 'Asia/Dhaka')::DATE - 29);
    v_to DATE := COALESCE(p_to, (NOW() AT TIME ZONE 'Asia/Dhaka')::DATE);
    v_from_ts TIMESTAMPTZ;
    v_to_ts TIMESTAMPTZ;
    v_listings JSONB;
    v_trends JSONB;
    v_totals JSONB;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'admin only';
    END IF;
    IF p_period IS NULL OR p_period NOT IN ('day', 'week', 'month') THEN
        RAISE EXCEPTION 'invalid analytics period';
    END IF;
    IF v_from > v_to OR v_to - v_from > 365 THEN
        RAISE EXCEPTION 'analytics date range must be ordered and no longer than 366 days';
    END IF;

    v_from_ts := v_from::TIMESTAMP AT TIME ZONE 'Asia/Dhaka';
    v_to_ts := (v_to + 1)::TIMESTAMP AT TIME ZONE 'Asia/Dhaka';

    WITH filtered AS (
        SELECT e.*
        FROM public.tolet_listing_events e
        WHERE e.created_at >= v_from_ts AND e.created_at < v_to_ts
    ),
    counts AS (
        SELECT e.listing_id,
               COUNT(*) FILTER (WHERE e.event_type = 'view') AS views,
               COUNT(*) FILTER (WHERE e.event_type = 'call_click') AS call_clicks,
               COUNT(*) FILTER (WHERE e.event_type = 'whatsapp_click') AS whatsapp_clicks,
               COUNT(*) FILTER (WHERE e.event_type = 'favorite') AS favorites,
               COUNT(*) FILTER (WHERE e.event_type = 'share') AS shares,
               COUNT(DISTINCT COALESCE(e.user_id::TEXT, e.visitor_id)) AS unique_visitors,
               MAX(e.created_at) AS last_activity_at,
               MIN(e.area_id) AS event_area_id
        FROM filtered e
        GROUP BY e.listing_id
    ),
    listing_rows AS (
        SELECT COALESCE(l.id::TEXT, c.listing_id) AS listing_id,
               COALESCE(l.title, 'বিজ্ঞাপন অপসারণ করা হয়েছে') AS title,
               p.full_name AS owner_name,
               COALESCE(l.area_id, c.event_area_id) AS area_id,
               l.specific_address,
               l.status,
               COALESCE(c.views, 0) AS views,
               COALESCE(c.call_clicks, 0) AS call_clicks,
               COALESCE(c.whatsapp_clicks, 0) AS whatsapp_clicks,
               COALESCE(c.favorites, 0) AS favorites,
               COALESCE(c.shares, 0) AS shares,
               COALESCE(c.unique_visitors, 0) AS unique_visitors,
               c.last_activity_at
        FROM public.tolet_listings l
        FULL OUTER JOIN counts c ON c.listing_id = l.id::TEXT
        LEFT JOIN public.profiles p ON p.id = l.owner_id
        WHERE c.listing_id IS NOT NULL OR l.status = 'approved'
    )
    SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT(
               'listingId', r.listing_id,
               'title', r.title,
               'ownerName', r.owner_name,
               'areaId', r.area_id,
               'specificAddress', r.specific_address,
               'status', r.status,
               'views', r.views,
               'callClicks', r.call_clicks,
               'whatsappClicks', r.whatsapp_clicks,
               'favorites', r.favorites,
               'shares', r.shares,
               'uniqueVisitors', r.unique_visitors,
               'lastActivityAt', r.last_activity_at
           ) ORDER BY r.call_clicks DESC, r.views DESC, r.last_activity_at DESC NULLS LAST), '[]'::JSONB)
    INTO v_listings
    FROM (
        SELECT * FROM listing_rows
        ORDER BY call_clicks DESC, views DESC, last_activity_at DESC NULLS LAST
    ) r;

    WITH filtered AS (
        SELECT e.*
        FROM public.tolet_listing_events e
        WHERE e.created_at >= v_from_ts AND e.created_at < v_to_ts
    ),
    buckets AS (
        SELECT DATE_TRUNC(p_period, e.created_at AT TIME ZONE 'Asia/Dhaka')::DATE AS bucket,
               COUNT(*) FILTER (WHERE e.event_type = 'view') AS views,
               COUNT(*) FILTER (WHERE e.event_type = 'call_click') AS call_clicks,
               COUNT(*) FILTER (WHERE e.event_type = 'whatsapp_click') AS whatsapp_clicks
        FROM filtered e
        GROUP BY 1
    )
    SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT(
               'date', b.bucket,
               'views', b.views,
               'callClicks', b.call_clicks,
               'whatsappClicks', b.whatsapp_clicks
           ) ORDER BY b.bucket), '[]'::JSONB)
    INTO v_trends
    FROM buckets b;

    SELECT JSONB_BUILD_OBJECT(
               'views', COUNT(*) FILTER (WHERE e.event_type = 'view'),
               'callClicks', COUNT(*) FILTER (WHERE e.event_type = 'call_click'),
               'whatsappClicks', COUNT(*) FILTER (WHERE e.event_type = 'whatsapp_click')
           )
    INTO v_totals
    FROM public.tolet_listing_events e
    WHERE e.created_at >= v_from_ts AND e.created_at < v_to_ts;

    RETURN JSONB_BUILD_OBJECT(
        'from', v_from,
        'to', v_to,
        'period', p_period,
        'totals', v_totals,
        'listings', v_listings,
        'trends', v_trends
    );
END;
$$;

REVOKE ALL ON FUNCTION public.fn_admin_tolet_listing_analytics(DATE, DATE, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_admin_tolet_listing_analytics(DATE, DATE, TEXT) TO authenticated;
