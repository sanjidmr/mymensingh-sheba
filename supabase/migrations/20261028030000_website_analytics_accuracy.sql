-- Route website analytics writes through the server so authenticated identity,
-- internal accounts and known automation can be classified from trusted data.
-- Existing event rows are retained and explicitly marked as legacy/unclassified.

ALTER TABLE public.site_events
    ADD COLUMN IF NOT EXISTS event_id UUID,
    ADD COLUMN IF NOT EXISTS traffic_class TEXT NOT NULL DEFAULT 'legacy';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.site_events'::regclass
          AND conname = 'site_events_traffic_class_check'
    ) THEN
        ALTER TABLE public.site_events
            ADD CONSTRAINT site_events_traffic_class_check
            CHECK (traffic_class IN ('guest', 'authenticated', 'internal', 'bot', 'unidentified', 'legacy'));
    END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_site_events_event_id
    ON public.site_events (event_id);
CREATE INDEX IF NOT EXISTS idx_site_events_traffic_created
    ON public.site_events (traffic_class, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_events_user_created
    ON public.site_events (user_id, created_at DESC)
    WHERE user_id IS NOT NULL;

-- Only the server-side event endpoint may write site events. The endpoint uses
-- the service-role key exclusively on the server and validates auth/role first.
REVOKE INSERT, UPDATE, DELETE ON public.site_events FROM anon, authenticated;
GRANT INSERT, UPDATE ON public.site_events TO service_role;

CREATE OR REPLACE FUNCTION public.site_events_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NEW.event_id IS NOT NULL
       AND EXISTS (
           SELECT 1 FROM public.site_events e WHERE e.event_id = NEW.event_id
       ) THEN
        RETURN NULL;
    END IF;

    NEW.created_at := NOW();
    NEW.is_new_visitor := FALSE;

    IF NEW.event_type = 'page_view'
       AND NEW.traffic_class IN ('guest', 'authenticated', 'legacy') THEN
        NEW.is_new_visitor := NOT EXISTS (
            SELECT 1
            FROM public.site_events e
            WHERE e.visitor_id = NEW.visitor_id
              AND e.event_type = 'page_view'
              AND e.traffic_class IN ('guest', 'authenticated', 'legacy')
        );
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.site_events e
        WHERE e.visitor_id = NEW.visitor_id
          AND e.created_at > NOW() - INTERVAL '60 seconds'
        OFFSET 119
    ) THEN
        RAISE EXCEPTION 'analytics rate limit exceeded';
    END IF;

    RETURN NEW;
END;
$$;

-- Historical rows remain available as legacy/unclassified. The view and
-- rollup exclude only traffic positively identified as internal or automated.
CREATE OR REPLACE VIEW public.site_events_eligible
WITH (security_barrier = TRUE)
AS
SELECT *
FROM public.site_events
WHERE traffic_class IN ('guest', 'authenticated', 'unidentified', 'legacy');

REVOKE ALL ON public.site_events_eligible FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_website_analytics_v2(
    p_from DATE,
    p_to DATE,
    p_category TEXT DEFAULT NULL,
    p_route TEXT DEFAULT NULL,
    p_event_type TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
DECLARE
    v_from TIMESTAMPTZ;
    v_to TIMESTAMPTZ;
    v_today TIMESTAMPTZ;
    v_tomorrow TIMESTAMPTZ;
    v_yesterday TIMESTAMPTZ;
    v_totals JSONB;
    v_daily JSONB;
    v_weekly JSONB;
    v_monthly JSONB;
    v_top_pages JSONB;
    v_landing_pages JSONB;
    v_top_content JSONB;
    v_top_categories JSONB;
    v_ctas JSONB;
    v_forms JSONB;
    v_service_ctas JSONB;
    v_devices JSONB;
    v_referrers JSONB;
    v_traffic JSONB;
    v_tolet_views BIGINT;
    v_tolet_calls BIGINT;
    v_tolet_whatsapp BIGINT;
    v_tolet_favorites BIGINT;
    v_tolet_shares BIGINT;
    v_tolet_visitors BIGINT;
    v_tolet_top JSONB;
    v_service_requests JSONB;
    v_vehicle_requests BIGINT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'admin only' USING ERRCODE = '42501';
    END IF;
    IF p_from IS NULL OR p_to IS NULL OR p_to < p_from OR p_to - p_from > 366 THEN
        RAISE EXCEPTION 'invalid analytics date range';
    END IF;
    IF p_event_type IS NOT NULL
       AND p_event_type NOT IN ('page_view', 'session_start', 'cta_click', 'form_submit') THEN
        RAISE EXCEPTION 'invalid analytics event type';
    END IF;
    IF p_category IS NOT NULL AND length(p_category) > 80 THEN
        RAISE EXCEPTION 'invalid analytics category';
    END IF;
    IF p_route IS NOT NULL AND (length(p_route) > 300 OR p_route NOT LIKE '/%') THEN
        RAISE EXCEPTION 'invalid analytics route';
    END IF;

    v_from := p_from::TIMESTAMP AT TIME ZONE 'Asia/Dhaka';
    v_to := (p_to + 1)::TIMESTAMP AT TIME ZONE 'Asia/Dhaka';
    v_today := ((NOW() AT TIME ZONE 'Asia/Dhaka')::DATE)::TIMESTAMP AT TIME ZONE 'Asia/Dhaka';
    v_tomorrow := v_today + INTERVAL '1 day';
    v_yesterday := v_today - INTERVAL '1 day';

    SELECT JSONB_BUILD_OBJECT(
        'pageViews', COUNT(*) FILTER (WHERE e.event_type = 'page_view'),
        'sessions', COUNT(DISTINCT e.session_id),
        'uniqueVisitors', COUNT(DISTINCT COALESCE(
            'u:' || e.user_id::TEXT, 'v:' || e.visitor_id
        )) FILTER (
            WHERE e.event_type = 'page_view'
              AND e.traffic_class IN ('guest', 'authenticated', 'legacy')
        ),
        'newVisitors', COUNT(DISTINCT COALESCE(
            'u:' || e.user_id::TEXT, 'v:' || e.visitor_id
        ))
            FILTER (
                WHERE e.event_type = 'page_view'
                  AND e.traffic_class IN ('guest', 'authenticated')
                  AND e.is_new_visitor
            ),
        'returningVisitors', GREATEST(
            COUNT(DISTINCT COALESCE('u:' || e.user_id::TEXT, 'v:' || e.visitor_id))
                FILTER (
                    WHERE e.event_type = 'page_view'
                      AND e.traffic_class IN ('guest', 'authenticated')
                )
            - COUNT(DISTINCT COALESCE('u:' || e.user_id::TEXT, 'v:' || e.visitor_id))
                FILTER (
                    WHERE e.event_type = 'page_view'
                      AND e.traffic_class IN ('guest', 'authenticated')
                      AND e.is_new_visitor
                ),
            0
        ),
        'guestVisitors', COUNT(DISTINCT e.visitor_id)
            FILTER (WHERE e.event_type = 'page_view' AND e.traffic_class = 'guest'),
        'loggedInVisitors', COUNT(DISTINCT e.user_id)
            FILTER (WHERE e.event_type = 'page_view' AND e.traffic_class = 'authenticated'),
        'ctaClicks', COUNT(*) FILTER (WHERE e.event_type = 'cta_click'),
        'formSubmits', COUNT(*) FILTER (WHERE e.event_type = 'form_submit'),
        'todayPageViews', (
            SELECT COUNT(*) FROM public.site_events_eligible t
            WHERE t.event_type = 'page_view'
              AND t.created_at >= v_today AND t.created_at < v_tomorrow
              AND (p_category IS NULL OR t.category = p_category)
              AND (p_route IS NULL OR t.path = p_route)
              AND (p_event_type IS NULL OR t.event_type = p_event_type)
        ),
        'todayVisitors', (
            SELECT COUNT(DISTINCT COALESCE('u:' || t.user_id::TEXT, 'v:' || t.visitor_id))
            FROM public.site_events_eligible t
            WHERE t.event_type = 'page_view'
              AND t.created_at >= v_today AND t.created_at < v_tomorrow
              AND t.traffic_class IN ('guest', 'authenticated', 'legacy')
              AND (p_category IS NULL OR t.category = p_category)
              AND (p_route IS NULL OR t.path = p_route)
              AND (p_event_type IS NULL OR t.event_type = p_event_type)
        ),
        'previousDayPageViews', (
            SELECT COUNT(*) FROM public.site_events_eligible t
            WHERE t.event_type = 'page_view'
              AND t.created_at >= v_yesterday AND t.created_at < v_today
              AND (p_category IS NULL OR t.category = p_category)
              AND (p_route IS NULL OR t.path = p_route)
              AND (p_event_type IS NULL OR t.event_type = p_event_type)
        ),
        'previousDayVisitors', (
            SELECT COUNT(DISTINCT COALESCE('u:' || t.user_id::TEXT, 'v:' || t.visitor_id))
            FROM public.site_events_eligible t
            WHERE t.event_type = 'page_view'
              AND t.created_at >= v_yesterday AND t.created_at < v_today
              AND t.traffic_class IN ('guest', 'authenticated', 'legacy')
              AND (p_category IS NULL OR t.category = p_category)
              AND (p_route IS NULL OR t.path = p_route)
              AND (p_event_type IS NULL OR t.event_type = p_event_type)
        )
    )
    INTO v_totals
    FROM public.site_events_eligible e
    WHERE e.created_at >= v_from AND e.created_at < v_to
      AND (p_category IS NULL OR e.category = p_category)
      AND (p_route IS NULL OR e.path = p_route)
      AND (p_event_type IS NULL OR e.event_type = p_event_type);

    SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT(
        'key', d.day::DATE::TEXT,
        'pageViews', COALESCE(s.page_views, 0),
        'visitors', COALESCE(s.visitors, 0),
        'sessions', COALESCE(s.sessions, 0)
    ) ORDER BY d.day), '[]'::JSONB)
    INTO v_daily
    FROM GENERATE_SERIES(p_from, p_to, INTERVAL '1 day') AS d(day)
    LEFT JOIN (
        SELECT (e.created_at AT TIME ZONE 'Asia/Dhaka')::DATE AS day,
               COUNT(*) FILTER (WHERE e.event_type = 'page_view') AS page_views,
               COUNT(DISTINCT COALESCE('u:' || e.user_id::TEXT, 'v:' || e.visitor_id))
                   FILTER (
                       WHERE e.event_type = 'page_view'
                         AND e.traffic_class IN ('guest', 'authenticated', 'legacy')
                   ) AS visitors,
               COUNT(DISTINCT e.session_id) AS sessions
        FROM public.site_events_eligible e
        WHERE e.created_at >= v_from AND e.created_at < v_to
          AND (p_category IS NULL OR e.category = p_category)
          AND (p_route IS NULL OR e.path = p_route)
          AND (p_event_type IS NULL OR e.event_type = p_event_type)
        GROUP BY 1
    ) s ON s.day = d.day::DATE;

    SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT(
        'key', w.bucket::DATE::TEXT, 'pageViews', w.page_views, 'visitors', w.visitors
    ) ORDER BY w.bucket), '[]'::JSONB)
    INTO v_weekly
    FROM (
        SELECT DATE_TRUNC('week', (e.created_at AT TIME ZONE 'Asia/Dhaka')::DATE) AS bucket,
               COUNT(*) FILTER (WHERE e.event_type = 'page_view') AS page_views,
               COUNT(DISTINCT COALESCE('u:' || e.user_id::TEXT, 'v:' || e.visitor_id))
                   FILTER (
                       WHERE e.event_type = 'page_view'
                         AND e.traffic_class IN ('guest', 'authenticated', 'legacy')
                   ) AS visitors
        FROM public.site_events_eligible e
        WHERE e.created_at >= v_from AND e.created_at < v_to
          AND (p_category IS NULL OR e.category = p_category)
          AND (p_route IS NULL OR e.path = p_route)
          AND (p_event_type IS NULL OR e.event_type = p_event_type)
        GROUP BY 1
    ) w;

    SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT(
        'key', m.bucket::DATE::TEXT, 'pageViews', m.page_views, 'visitors', m.visitors
    ) ORDER BY m.bucket), '[]'::JSONB)
    INTO v_monthly
    FROM (
        SELECT DATE_TRUNC('month', (e.created_at AT TIME ZONE 'Asia/Dhaka')::DATE) AS bucket,
               COUNT(*) FILTER (WHERE e.event_type = 'page_view') AS page_views,
               COUNT(DISTINCT COALESCE('u:' || e.user_id::TEXT, 'v:' || e.visitor_id))
                   FILTER (
                       WHERE e.event_type = 'page_view'
                         AND e.traffic_class IN ('guest', 'authenticated', 'legacy')
                   ) AS visitors
        FROM public.site_events_eligible e
        WHERE e.created_at >= v_from AND e.created_at < v_to
          AND (p_category IS NULL OR e.category = p_category)
          AND (p_route IS NULL OR e.path = p_route)
          AND (p_event_type IS NULL OR e.event_type = p_event_type)
        GROUP BY 1
    ) m;

    SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT(
        'key', p.path, 'count', p.views, 'secondaryCount', p.visitors
    ) ORDER BY p.views DESC, p.path), '[]'::JSONB)
    INTO v_top_pages
    FROM (
        SELECT e.path, COUNT(*) AS views,
               COUNT(DISTINCT COALESCE('u:' || e.user_id::TEXT, 'v:' || e.visitor_id))
                   FILTER (WHERE e.traffic_class IN ('guest', 'authenticated', 'legacy')) AS visitors
        FROM public.site_events_eligible e
        WHERE e.created_at >= v_from AND e.created_at < v_to
          AND e.event_type = 'page_view'
          AND (p_category IS NULL OR e.category = p_category)
          AND (p_route IS NULL OR e.path = p_route)
          AND (p_event_type IS NULL OR p_event_type = 'page_view')
        GROUP BY e.path ORDER BY COUNT(*) DESC, e.path LIMIT 25
    ) p;

    SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT(
        'key', p.path, 'count', p.sessions, 'secondaryCount', p.visitors
    ) ORDER BY p.sessions DESC, p.path), '[]'::JSONB)
    INTO v_landing_pages
    FROM (
        SELECT e.path, COUNT(DISTINCT e.session_id) AS sessions,
               COUNT(DISTINCT COALESCE('u:' || e.user_id::TEXT, 'v:' || e.visitor_id))
                   FILTER (WHERE e.traffic_class IN ('guest', 'authenticated', 'legacy')) AS visitors
        FROM public.site_events_eligible e
        WHERE e.created_at >= v_from AND e.created_at < v_to
          AND e.event_type = 'session_start'
          AND (p_category IS NULL OR e.category = p_category)
          AND (p_route IS NULL OR e.path = p_route)
          AND (p_event_type IS NULL OR p_event_type = 'session_start')
        GROUP BY e.path ORDER BY COUNT(DISTINCT e.session_id) DESC, e.path LIMIT 20
    ) p;

    SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT(
        'key', p.path, 'count', p.views, 'secondaryCount', p.visitors,
        'kind', p.route_kind, 'contentId', p.content_id
    ) ORDER BY p.views DESC, p.path), '[]'::JSONB)
    INTO v_top_content
    FROM (
        SELECT e.path, e.route_kind, e.content_id,
               COUNT(*) AS views,
               COUNT(DISTINCT COALESCE('u:' || e.user_id::TEXT, 'v:' || e.visitor_id))
                   FILTER (WHERE e.traffic_class IN ('guest', 'authenticated', 'legacy')) AS visitors
        FROM public.site_events_eligible e
        WHERE e.created_at >= v_from AND e.created_at < v_to
          AND e.event_type = 'page_view' AND e.content_id IS NOT NULL
          AND (p_category IS NULL OR e.category = p_category)
          AND (p_route IS NULL OR e.path = p_route)
          AND (p_event_type IS NULL OR p_event_type = 'page_view')
        GROUP BY e.path, e.route_kind, e.content_id
        ORDER BY COUNT(*) DESC, e.path LIMIT 25
    ) p;

    SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT(
        'key', p.category, 'count', p.views, 'secondaryCount', p.visitors
    ) ORDER BY p.views DESC, p.category), '[]'::JSONB)
    INTO v_top_categories
    FROM (
        SELECT e.category, COUNT(*) AS views,
               COUNT(DISTINCT COALESCE('u:' || e.user_id::TEXT, 'v:' || e.visitor_id))
                   FILTER (WHERE e.traffic_class IN ('guest', 'authenticated', 'legacy')) AS visitors
        FROM public.site_events_eligible e
        WHERE e.created_at >= v_from AND e.created_at < v_to
          AND e.event_type = 'page_view' AND e.category IS NOT NULL
          AND (p_category IS NULL OR e.category = p_category)
          AND (p_route IS NULL OR e.path = p_route)
          AND (p_event_type IS NULL OR p_event_type = 'page_view')
        GROUP BY e.category ORDER BY COUNT(*) DESC, e.category LIMIT 20
    ) p;

    SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT(
        'key', p.cta_type, 'count', p.total, 'secondaryCount', p.visitors
    ) ORDER BY p.total DESC, p.cta_type), '[]'::JSONB)
    INTO v_ctas
    FROM (
        SELECT e.cta_type, COUNT(*) AS total,
               COUNT(DISTINCT COALESCE('u:' || e.user_id::TEXT, 'v:' || e.visitor_id))
                   FILTER (WHERE e.traffic_class IN ('guest', 'authenticated', 'legacy')) AS visitors
        FROM public.site_events_eligible e
        WHERE e.created_at >= v_from AND e.created_at < v_to
          AND e.event_type = 'cta_click'
          AND (p_category IS NULL OR e.category = p_category)
          AND (p_route IS NULL OR e.path = p_route)
          AND (p_event_type IS NULL OR p_event_type = 'cta_click')
        GROUP BY e.cta_type ORDER BY COUNT(*) DESC, e.cta_type LIMIT 25
    ) p;

    SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT(
        'key', p.cta_type, 'count', p.total
    ) ORDER BY p.total DESC, p.cta_type), '[]'::JSONB)
    INTO v_forms
    FROM (
        SELECT e.cta_type, COUNT(*) AS total
        FROM public.site_events_eligible e
        WHERE e.created_at >= v_from AND e.created_at < v_to
          AND e.event_type = 'form_submit'
          AND (p_category IS NULL OR e.category = p_category)
          AND (p_route IS NULL OR e.path = p_route)
          AND (p_event_type IS NULL OR p_event_type = 'form_submit')
        GROUP BY e.cta_type ORDER BY COUNT(*) DESC, e.cta_type LIMIT 25
    ) p;

    SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT(
        'key', p.path, 'count', p.total, 'category', p.category
    ) ORDER BY p.total DESC, p.path), '[]'::JSONB)
    INTO v_service_ctas
    FROM (
        SELECT e.path, e.category, COUNT(*) AS total
        FROM public.site_events_eligible e
        WHERE e.created_at >= v_from AND e.created_at < v_to
          AND e.event_type = 'cta_click' AND e.cta_type = 'get_service'
          AND (p_category IS NULL OR e.category = p_category)
          AND (p_route IS NULL OR e.path = p_route)
          AND (p_event_type IS NULL OR p_event_type = 'cta_click')
        GROUP BY e.path, e.category ORDER BY COUNT(*) DESC, e.path LIMIT 20
    ) p;

    SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT(
        'key', COALESCE(p.device_type, 'unknown'),
        'count', p.sessions, 'secondaryCount', p.visitors
    ) ORDER BY p.sessions DESC, p.device_type), '[]'::JSONB)
    INTO v_devices
    FROM (
        SELECT e.device_type, COUNT(DISTINCT e.session_id) AS sessions,
               COUNT(DISTINCT COALESCE('u:' || e.user_id::TEXT, 'v:' || e.visitor_id))
                   FILTER (WHERE e.traffic_class IN ('guest', 'authenticated', 'legacy')) AS visitors
        FROM public.site_events_eligible e
        WHERE e.created_at >= v_from AND e.created_at < v_to
          AND (p_category IS NULL OR e.category = p_category)
          AND (p_route IS NULL OR e.path = p_route)
          AND (p_event_type IS NULL OR e.event_type = p_event_type)
        GROUP BY e.device_type
    ) p;

    SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT(
        'key', p.host, 'count', p.sessions
    ) ORDER BY p.sessions DESC, p.host), '[]'::JSONB)
    INTO v_referrers
    FROM (
        SELECT COALESCE(e.referrer_host, 'direct') AS host,
               COUNT(DISTINCT e.session_id) AS sessions
        FROM public.site_events_eligible e
        WHERE e.created_at >= v_from AND e.created_at < v_to
          AND e.event_type = 'session_start'
          AND (p_event_type IS NULL OR p_event_type = 'session_start')
        GROUP BY 1 ORDER BY COUNT(DISTINCT e.session_id) DESC, 1 LIMIT 15
    ) p;

    SELECT
        COUNT(*) FILTER (WHERE e.event_type = 'view'),
        COUNT(*) FILTER (WHERE e.event_type = 'call_click'),
        COUNT(*) FILTER (WHERE e.event_type = 'whatsapp_click'),
        COUNT(*) FILTER (WHERE e.event_type = 'favorite'),
        COUNT(*) FILTER (WHERE e.event_type = 'share'),
        COUNT(DISTINCT COALESCE(e.user_id::TEXT, e.visitor_id))
    INTO v_tolet_views, v_tolet_calls, v_tolet_whatsapp, v_tolet_favorites, v_tolet_shares, v_tolet_visitors
    FROM public.tolet_listing_events e
    WHERE e.created_at >= v_from AND e.created_at < v_to;

    SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT(
        'listingId', t.listing_id,
        'title', t.title,
        'areaId', t.area_id,
        'propertyType', t.property_type,
        'rentPrice', t.rent_price,
        'status', t.status,
        'views', t.views,
        'callClicks', t.call_clicks,
        'whatsappClicks', t.whatsapp_clicks,
        'contactClicks', t.call_clicks + t.whatsapp_clicks
    ) ORDER BY (t.call_clicks + t.whatsapp_clicks) DESC, t.views DESC), '[]'::JSONB)
    INTO v_tolet_top
    FROM (
        SELECT e.listing_id, l.title,
               COALESCE(l.area_id, MIN(e.area_id)) AS area_id,
               l.property_type, l.rent_price, l.status,
               COUNT(*) FILTER (WHERE e.event_type = 'view') AS views,
               COUNT(*) FILTER (WHERE e.event_type = 'call_click') AS call_clicks,
               COUNT(*) FILTER (WHERE e.event_type = 'whatsapp_click') AS whatsapp_clicks
        FROM public.tolet_listing_events e
        LEFT JOIN public.tolet_listings l ON l.id::TEXT = e.listing_id
        WHERE e.created_at >= v_from AND e.created_at < v_to
        GROUP BY e.listing_id, l.title, l.area_id, l.property_type, l.rent_price, l.status
        ORDER BY (
            COUNT(*) FILTER (WHERE e.event_type = 'call_click') +
            COUNT(*) FILTER (WHERE e.event_type = 'whatsapp_click')
        ) DESC, COUNT(*) FILTER (WHERE e.event_type = 'view') DESC
        LIMIT 25
    ) t;

    SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT('key', r.service_slug, 'count', r.total)
        ORDER BY r.total DESC, r.service_slug), '[]'::JSONB)
    INTO v_service_requests
    FROM (
        SELECT r.service_slug, COUNT(*) AS total
        FROM public.service_requests r
        WHERE r.created_at >= v_from AND r.created_at < v_to
        GROUP BY r.service_slug
    ) r;

    SELECT COUNT(*) INTO v_vehicle_requests
    FROM public.vehicle_requests v
    WHERE v.created_at >= v_from AND v.created_at < v_to;

    SELECT JSONB_BUILD_OBJECT(
        'botEvents', COUNT(*) FILTER (WHERE e.traffic_class = 'bot'),
        'internalEvents', COUNT(*) FILTER (WHERE e.traffic_class = 'internal'),
        'unidentifiedEvents', COUNT(*) FILTER (WHERE e.traffic_class = 'unidentified'),
        'legacyEvents', COUNT(*) FILTER (WHERE e.traffic_class = 'legacy')
    )
    INTO v_traffic
    FROM public.site_events e
    WHERE e.created_at >= v_from AND e.created_at < v_to
      AND (p_category IS NULL OR e.category = p_category)
      AND (p_route IS NULL OR e.path = p_route)
      AND (p_event_type IS NULL OR e.event_type = p_event_type);

    RETURN JSONB_BUILD_OBJECT(
        'range', JSONB_BUILD_OBJECT('from', TO_CHAR(p_from, 'YYYY-MM-DD'), 'to', TO_CHAR(p_to, 'YYYY-MM-DD')),
        'totals', v_totals,
        'daily', v_daily,
        'weekly', v_weekly,
        'monthly', v_monthly,
        'topPages', v_top_pages,
        'landingPages', v_landing_pages,
        'topContent', v_top_content,
        'topCategories', v_top_categories,
        'ctaClicks', v_ctas,
        'formSubmits', v_forms,
        'serviceCtas', v_service_ctas,
        'devices', v_devices,
        'referrers', v_referrers,
        'trafficQuality', v_traffic,
        'tolet', JSONB_BUILD_OBJECT(
            'views', v_tolet_views,
            'callClicks', v_tolet_calls,
            'whatsappClicks', v_tolet_whatsapp,
            'favorites', v_tolet_favorites,
            'shares', v_tolet_shares,
            'uniqueVisitors', v_tolet_visitors,
            'topListings', v_tolet_top
        ),
        'requests', JSONB_BUILD_OBJECT(
            'serviceRequests', v_service_requests,
            'vehicleRequests', v_vehicle_requests
        )
    );
END;
$$;

REVOKE ALL ON FUNCTION public.get_website_analytics_v2(DATE, DATE, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_website_analytics_v2(DATE, DATE, TEXT, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_website_business_analytics(
    p_from DATE,
    p_to DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
DECLARE
    v_from TIMESTAMPTZ;
    v_to TIMESTAMPTZ;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'admin only' USING ERRCODE = '42501';
    END IF;
    IF p_from IS NULL OR p_to IS NULL OR p_to < p_from OR p_to - p_from > 366 THEN
        RAISE EXCEPTION 'invalid analytics date range';
    END IF;

    v_from := p_from::TIMESTAMP AT TIME ZONE 'Asia/Dhaka';
    v_to := (p_to + 1)::TIMESTAMP AT TIME ZONE 'Asia/Dhaka';

    RETURN JSONB_BUILD_OBJECT(
        'accounts', JSONB_BUILD_OBJECT(
            'total', (SELECT COUNT(*) FROM public.profiles),
            'new', (
                SELECT COUNT(*) FROM public.profiles p
                WHERE p.created_at >= v_from AND p.created_at < v_to
            ),
            'byRole', (
                SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT('key', r.role, 'count', r.total)
                    ORDER BY r.role), '[]'::JSONB)
                FROM (
                    SELECT COALESCE(p.role, 'unknown') AS role, COUNT(*) AS total
                    FROM public.profiles p
                    WHERE p.created_at >= v_from AND p.created_at < v_to
                    GROUP BY p.role
                ) r
            )
        ),
        'profiles', (
            SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT('key', r.key, 'count', r.total)
                ORDER BY r.key), '[]'::JSONB)
            FROM (
                SELECT 'created:tolet:' || p.status AS key, COUNT(*) AS total
                FROM public.tolet_profiles p WHERE p.created_at >= v_from AND p.created_at < v_to
                GROUP BY p.status
                UNION ALL
                SELECT 'total:tolet:' || p.status, COUNT(*)
                FROM public.tolet_profiles p GROUP BY p.status
                UNION ALL
                SELECT 'created:home_tutor:' || p.status, COUNT(*)
                FROM public.home_tutor_profiles p WHERE p.created_at >= v_from AND p.created_at < v_to
                GROUP BY p.status
                UNION ALL
                SELECT 'total:home_tutor:' || p.status, COUNT(*)
                FROM public.home_tutor_profiles p GROUP BY p.status
                UNION ALL
                SELECT 'created:blood_donor:' || p.status, COUNT(*)
                FROM public.blood_donor_profiles p WHERE p.created_at >= v_from AND p.created_at < v_to
                GROUP BY p.status
                UNION ALL
                SELECT 'total:blood_donor:' || p.status, COUNT(*)
                FROM public.blood_donor_profiles p GROUP BY p.status
                UNION ALL
                SELECT 'created:staff:' || p.service_slug || ':' ||
                       CASE WHEN COALESCE(p.is_active, FALSE) THEN 'active' ELSE 'inactive' END,
                       COUNT(*)
                FROM public.staff_profiles p
                WHERE p.created_at >= v_from AND p.created_at < v_to
                GROUP BY p.service_slug, COALESCE(p.is_active, FALSE)
                UNION ALL
                SELECT 'total:staff:' || p.service_slug || ':' ||
                       CASE WHEN COALESCE(p.is_active, FALSE) THEN 'active' ELSE 'inactive' END,
                       COUNT(*)
                FROM public.staff_profiles p
                GROUP BY p.service_slug, COALESCE(p.is_active, FALSE)
                UNION ALL
                SELECT 'created:service_listing:' || p.category || ':' ||
                       CASE WHEN COALESCE(p.is_active, FALSE) THEN 'active' ELSE 'inactive' END,
                       COUNT(*)
                FROM public.service_listings p
                WHERE p.created_at >= v_from AND p.created_at < v_to
                GROUP BY p.category, COALESCE(p.is_active, FALSE)
                UNION ALL
                SELECT 'total:service_listing:' || p.category || ':' ||
                       CASE WHEN COALESCE(p.is_active, FALSE) THEN 'active' ELSE 'inactive' END,
                       COUNT(*)
                FROM public.service_listings p
                GROUP BY p.category, COALESCE(p.is_active, FALSE)
            ) r
        ),
        'posts', (
            SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT('key', r.key, 'count', r.total)
                ORDER BY r.key), '[]'::JSONB)
            FROM (
                SELECT 'new:' || p.kind || ':' || p.status AS key, COUNT(*) AS total
                FROM public.community_posts p
                WHERE p.created_at >= v_from AND p.created_at < v_to
                GROUP BY p.kind, p.status
                UNION ALL
                SELECT 'published:' || p.kind, COUNT(*)
                FROM public.community_posts p
                WHERE p.published_at >= v_from AND p.published_at < v_to
                GROUP BY p.kind
                UNION ALL
                SELECT 'pending:' || p.kind, COUNT(*)
                FROM public.community_posts p
                WHERE p.status = 'pending'
                  AND p.created_at >= v_from AND p.created_at < v_to
                GROUP BY p.kind
                UNION ALL
                SELECT 'current:' || p.kind || ':' || p.status, COUNT(*)
                FROM public.community_posts p
                GROUP BY p.kind, p.status
            ) r
        ),
        'requests', (
            SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT('key', r.key, 'count', r.total)
                ORDER BY r.key), '[]'::JSONB)
            FROM (
                SELECT 'service:' || r.service_slug || ':' || r.status AS key, COUNT(*) AS total
                FROM public.service_requests r
                WHERE r.created_at >= v_from AND r.created_at < v_to
                GROUP BY r.service_slug, r.status
                UNION ALL
                SELECT 'tolet:' || r.status, COUNT(*)
                FROM public.tolet_requests r
                WHERE r.created_at >= v_from AND r.created_at < v_to
                GROUP BY r.status
                UNION ALL
                SELECT 'vehicle:' || r.status, COUNT(*)
                FROM public.vehicle_requests r
                WHERE r.created_at >= v_from AND r.created_at < v_to
                GROUP BY r.status
                UNION ALL
                SELECT 'blood:' || r.status, COUNT(*)
                FROM public.blood_requests r
                WHERE r.created_at >= v_from AND r.created_at < v_to
                GROUP BY r.status
            ) r
        ),
        'finance', JSONB_BUILD_OBJECT(
            'income', COALESCE((
                SELECT SUM(r.income_amount) FROM public.admin_financial_records r
                WHERE r.record_date BETWEEN p_from AND p_to
            ), 0),
            'due', COALESCE((
                SELECT SUM(r.due_amount) FROM public.admin_financial_records r
                WHERE r.record_date BETWEEN p_from AND p_to
            ), 0),
            'records', (
                SELECT COUNT(*) FROM public.admin_financial_records r
                WHERE r.record_date BETWEEN p_from AND p_to
            ),
            'byService', (
                SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT(
                    'key', r.service_key,
                    'income', r.income_total,
                    'due', r.due_total,
                    'records', r.record_count
                ) ORDER BY r.service_key), '[]'::JSONB)
                FROM (
                    SELECT r.service_key,
                           SUM(r.income_amount) AS income_total,
                           SUM(r.due_amount) AS due_total,
                           COUNT(*) AS record_count
                    FROM public.admin_financial_records r
                    WHERE r.record_date BETWEEN p_from AND p_to
                    GROUP BY r.service_key
                ) r
            ),
            'expensesTracked', FALSE
        )
    );
END;
$$;

REVOKE ALL ON FUNCTION public.get_website_business_analytics(DATE, DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_website_business_analytics(DATE, DATE) TO authenticated;

ALTER TABLE public.site_active_visitors
    ADD COLUMN IF NOT EXISTS traffic_class TEXT NOT NULL DEFAULT 'legacy';
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.site_active_visitors'::regclass
          AND conname = 'site_active_visitors_traffic_class_check'
    ) THEN
        ALTER TABLE public.site_active_visitors
            ADD CONSTRAINT site_active_visitors_traffic_class_check
            CHECK (traffic_class IN ('guest', 'authenticated', 'internal', 'bot', 'unidentified', 'legacy'));
    END IF;
END
$$;
GRANT INSERT, UPDATE ON public.site_active_visitors TO service_role;
REVOKE INSERT, UPDATE, DELETE ON public.site_active_visitors FROM anon, authenticated;

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
    WHERE last_seen_at >= NOW() - INTERVAL '5 minutes'
      AND traffic_class IN ('guest', 'authenticated', 'legacy');
    RETURN active_count;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_admin_active_visitors() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_admin_active_visitors() TO authenticated;
REVOKE ALL ON FUNCTION public.fn_record_active_visitor(TEXT) FROM PUBLIC, anon, authenticated;

-- Keep the existing general admin analytics contract while aligning its
-- business-data day boundaries with the Asia/Dhaka dates shown in the UI.
CREATE OR REPLACE FUNCTION public.get_admin_analytics(p_from DATE, p_to DATE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
DECLARE
    result JSONB;
    range_start TIMESTAMPTZ;
    range_end TIMESTAMPTZ;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'admin only';
    END IF;
    IF p_from IS NULL OR p_to IS NULL OR p_to < p_from OR p_to - p_from > 366 THEN
        RAISE EXCEPTION 'invalid analytics date range';
    END IF;
    range_start := p_from::TIMESTAMP AT TIME ZONE 'Asia/Dhaka';
    range_end := (p_to + 1)::TIMESTAMP AT TIME ZONE 'Asia/Dhaka';

    SELECT JSONB_BUILD_OBJECT(
        'customerTotal', (
            SELECT COUNT(*) FROM public.profiles p WHERE p.role = 'customer'
        ),
        'newCustomersByDay', (
            SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT('key', d.day::TEXT, 'count', d.total) ORDER BY d.day), '[]'::JSONB)
            FROM (
                SELECT (p.created_at AT TIME ZONE 'Asia/Dhaka')::DATE AS day, COUNT(*) AS total
                FROM public.profiles p
                WHERE p.role = 'customer'
                  AND p.created_at >= range_start AND p.created_at < range_end
                GROUP BY (p.created_at AT TIME ZONE 'Asia/Dhaka')::DATE
            ) d
        ),
        'toletListings', (
            SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT('key', l.property_type || ':' || l.status, 'count', l.total) ORDER BY l.property_type, l.status), '[]'::JSONB)
            FROM (
                SELECT property_type, status, COUNT(*) AS total
                FROM public.tolet_listings
                WHERE created_at >= range_start AND created_at < range_end
                GROUP BY property_type, status
            ) l
        ),
        'serviceListings', (
            SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT('key', s.category || ':' || CASE WHEN s.active THEN 'active' ELSE 'inactive' END, 'count', s.total) ORDER BY s.category, s.active), '[]'::JSONB)
            FROM (
                SELECT category, COALESCE(is_active, FALSE) AS active, COUNT(*) AS total
                FROM public.service_listings
                WHERE created_at >= range_start AND created_at < range_end
                GROUP BY category, COALESCE(is_active, FALSE)
            ) s
        ),
        'communityPosts', (
            SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT('key', p.kind || ':' || p.status, 'count', p.total) ORDER BY p.kind, p.status), '[]'::JSONB)
            FROM (
                SELECT kind, status, COUNT(*) AS total
                FROM public.community_posts
                WHERE created_at >= range_start AND created_at < range_end
                GROUP BY kind, status
            ) p
        ),
        'serviceRequests', (
            SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT('key', r.service_slug || ':' || r.status, 'count', r.total) ORDER BY r.service_slug, r.status), '[]'::JSONB)
            FROM (
                SELECT service_slug, status, COUNT(*) AS total
                FROM public.service_requests
                WHERE created_at >= range_start AND created_at < range_end
                GROUP BY service_slug, status
            ) r
        ),
        'toletRequests', (
            SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT('key', r.status, 'count', r.total) ORDER BY r.status), '[]'::JSONB)
            FROM (
                SELECT status, COUNT(*) AS total FROM public.tolet_requests
                WHERE created_at >= range_start AND created_at < range_end
                GROUP BY status
            ) r
        ),
        'vehicleRequests', (
            SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT('key', r.status, 'count', r.total) ORDER BY r.status), '[]'::JSONB)
            FROM (
                SELECT status, COUNT(*) AS total FROM public.vehicle_requests
                WHERE created_at >= range_start AND created_at < range_end
                GROUP BY status
            ) r
        ),
        'bloodRequests', (
            SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT('key', r.status, 'count', r.total) ORDER BY r.status), '[]'::JSONB)
            FROM (
                SELECT status, COUNT(*) AS total FROM public.blood_requests
                WHERE created_at >= range_start AND created_at < range_end
                GROUP BY status
            ) r
        ),
        'bloodDonors', (
            SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT(
                'key', d.status, 'count', d.total, 'secondaryCount', d.available
            ) ORDER BY d.status), '[]'::JSONB)
            FROM (
                SELECT status, COUNT(*) AS total,
                       COUNT(*) FILTER (WHERE is_available IS TRUE AND status = 'approved') AS available
                FROM public.blood_donor_profiles
                GROUP BY status
            ) d
        ),
        'reports', (
            SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT('key', r.category || ':' || r.status, 'count', r.total) ORDER BY r.category, r.status), '[]'::JSONB)
            FROM (
                SELECT category, status, COUNT(*) AS total
                FROM (
                    SELECT 'tolet'::TEXT AS category, status, created_at FROM public.listing_reports
                    UNION ALL SELECT 'tutor', status, created_at FROM public.tutor_reports
                    UNION ALL SELECT 'blood_donor', status, created_at FROM public.blood_donor_reports
                    UNION ALL SELECT 'staff', status, created_at FROM public.staff_profile_reports
                    UNION ALL SELECT 'community_post', status, created_at FROM public.community_post_reports
                ) report_rows
                WHERE created_at >= range_start AND created_at < range_end
                GROUP BY category, status
            ) r
        ),
        'toletEvents', (
            SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT('key', e.event_type, 'count', e.total) ORDER BY e.event_type), '[]'::JSONB)
            FROM (
                SELECT event_type, COUNT(*) AS total FROM public.tolet_listing_events
                WHERE created_at >= range_start AND created_at < range_end
                GROUP BY event_type
            ) e
        ),
        'supportMessages', (
            SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT('key', m.status, 'count', m.total) ORDER BY m.status), '[]'::JSONB)
            FROM (
                SELECT status, COUNT(*) AS total FROM public.contact_messages
                WHERE created_at >= range_start AND created_at < range_end
                GROUP BY status
            ) m
        ),
        'adminNotifications', (
            SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT('key', n.read_state, 'count', n.total) ORDER BY n.read_state), '[]'::JSONB)
            FROM (
                SELECT CASE WHEN is_read THEN 'read' ELSE 'unread' END AS read_state, COUNT(*) AS total
                FROM public.notifications
                WHERE target_role = 'admin'
                  AND created_at >= range_start AND created_at < range_end
                GROUP BY is_read
            ) n
        ),
        'auditActions', (
            SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT('key', a.entity_table || ':' || a.operation, 'count', a.total) ORDER BY a.entity_table, a.operation), '[]'::JSONB)
            FROM (
                SELECT entity_table, operation, COUNT(*) AS total FROM public.admin_audit_log
                WHERE created_at >= range_start AND created_at < range_end
                GROUP BY entity_table, operation
            ) a
        )
    ) INTO result;
    RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_analytics(DATE, DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_analytics(DATE, DATE) TO authenticated;

NOTIFY pgrst, 'reload schema';
