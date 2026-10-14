-- =============================================================================
-- WEBSITE ANALYTICS — first-party page views and CTA engagement
-- =============================================================================
--
-- WHY THIS MIGRATION EXISTS
-- -------------------------
-- Before this file the only engagement data the platform stored was
-- `tolet_listing_events` (To-Let listing views and contact-button presses).
-- There was no record of how many people visit the site, which pages they
-- read, where they arrive from, what device they use, or which "সেবা নিন"
-- buttons they actually press. The admin dashboard could therefore show
-- To-Let engagement but had to stay silent about website traffic — and it is
-- a hard rule in this codebase never to invent a statistic.
--
-- WHAT THIS ADDS
-- --------------
--   1. `public.site_events` — one append-only row per visitor action:
--        page_view     a route was opened (client-side navigation included)
--        session_start the first page_view of a browser session (landing page)
--        cta_click     an important button was pressed
--        form_submit   a form's row was CONFIRMED written by the database
--   2. A `BEFORE INSERT` throttle so a script cannot flood the table.
--   3. `public.get_website_analytics(...)` — the admin-only rollup. Aggregation
--      happens in Postgres; raw events never travel to the browser.
--
-- PRIVACY CONTRACT (do not relax)
-- -------------------------------
--   * `visitor_id` and `session_id` are opaque, client-generated UUIDs. No IP
--     address, no user agent string, no fingerprint, no full referrer URL.
--   * `referrer_host` stores the hostname only (e.g. "facebook.com"), never a
--     path or query string that could carry a search term or a token.
--   * No names, phone numbers, message bodies or free text are ever stored.
--     `label` does not exist; if a metric needs a human label, it is derived
--     from a controlled vocabulary (category / cta_type) at render time.
--   * Guests are `user_id = NULL` by design. A signed-in customer is linked
--     only when the browser reports the same id it is authenticated as.
--   * `page_view` and `session_start` versus a button press versus a stored
--     request are four different things; the rollup keeps them apart and the
--     dashboard labels them apart.
--
-- IDEMPOTENT: safe to run more than once, and safe on a database that already
-- has the consolidated schema plus the To-Let analytics from
-- 20261004000000_tolet_analytics.sql.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. The event log
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL CHECK (event_type IN ('page_view', 'session_start', 'cta_click', 'form_submit')),
    -- Pathname only: no query string, so a search term or token in the URL is
    -- never written to analytics.
    path TEXT NOT NULL CHECK (path LIKE '/%' AND length(path) <= 300),
    route_kind TEXT CHECK (route_kind IS NULL OR route_kind IN ('home', 'service', 'tolet', 'post', 'directory', 'auth', 'other')),
    -- Slug or id parsed from the route / supplied by the instrumented button.
    content_id TEXT CHECK (content_id IS NULL OR (length(content_id) BETWEEN 1 AND 120)),
    -- Service slug, post kind, or listing category. Controlled vocabulary.
    category TEXT CHECK (category IS NULL OR (length(category) BETWEEN 1 AND 80)),
    cta_type TEXT,
    device_type TEXT CHECK (device_type IS NULL OR device_type IN ('mobile', 'tablet', 'desktop')),
    referrer_host TEXT CHECK (referrer_host IS NULL OR (length(referrer_host) BETWEEN 1 AND 200)),
    visitor_id TEXT NOT NULL CHECK (visitor_id ~ '^[A-Za-z0-9_-]{6,80}$'),
    session_id TEXT NOT NULL CHECK (session_id ~ '^[A-Za-z0-9_-]{6,80}$'),
    is_new_visitor BOOLEAN NOT NULL DEFAULT FALSE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    -- A page view has no CTA; a click and a confirmed submit have disjoint
    -- vocabularies. This keeps a forged payload from inventing a metric pair
    -- the dashboard would misread.
    CONSTRAINT site_events_cta_vocabulary CHECK (
        (event_type IN ('page_view', 'session_start') AND cta_type IS NULL)
        OR (event_type = 'cta_click' AND cta_type IN (
            'get_service', 'call', 'whatsapp', 'contact_request',
            'tutor_contact', 'apply', 'other'
        ))
        OR (event_type = 'form_submit' AND cta_type IN (
            'service_request', 'vehicle_request', 'tutor_request',
            'buy_sell_request', 'home_moving_request', 'staff_request',
            'contact_message'
        ))
    )
);

-- Every hot query filters by time, usually within one event type. These are
-- the exact shapes the rollup below issues.
CREATE INDEX IF NOT EXISTS idx_site_events_created
    ON public.site_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_events_type_created
    ON public.site_events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_events_path_created
    ON public.site_events (path, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_events_category_created
    ON public.site_events (category, created_at DESC);
-- Visitor + time supports the per-visitor throttle below with a bounded scan.
CREATE INDEX IF NOT EXISTS idx_site_events_visitor_created
    ON public.site_events (visitor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_events_session
    ON public.site_events (session_id);

-- -----------------------------------------------------------------------------
-- 2. Row Level Security
-- -----------------------------------------------------------------------------
ALTER TABLE public.site_events ENABLE ROW LEVEL SECURITY;

-- Public writes only, and a visitor may only attribute a row to their own
-- account. Column-level shape (vocabulary, lengths, formats) is enforced by the
-- CHECK constraints above, which is stronger than a policy expression because
-- it applies to every path into the table — including a future service that
-- forgets the policy.
DROP POLICY IF EXISTS "Anyone can record a website analytics event" ON public.site_events;
CREATE POLICY "Anyone can record a website analytics event"
ON public.site_events FOR INSERT
TO anon, authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- Reads are admin-only. There is deliberately no UPDATE or DELETE policy: the
-- log is append-only through the API, and a mistaken event should not be
-- silently rewritten in place.
DROP POLICY IF EXISTS "Admins read website analytics events" ON public.site_events;
CREATE POLICY "Admins read website analytics events"
ON public.site_events FOR SELECT
TO authenticated
USING (public.is_admin());

-- Supabase's default privileges normally cover these already; stating them
-- explicitly means the browser write path cannot silently break on a project
-- where the defaults were customised. RLS still narrows what each role sees.
GRANT INSERT ON public.site_events TO anon, authenticated;
GRANT SELECT ON public.site_events TO authenticated;

-- -----------------------------------------------------------------------------
-- 3. Abuse protection: a hard per-visitor ceiling, and server-side time
-- -----------------------------------------------------------------------------
-- The created_at the client could send is discarded; the server stamps its own
-- clock so history cannot be backdated or placed in the future.
--
-- The throttle rejects a visitor who has already written 120 events in the last
-- 60 seconds. 120 is far above any genuine session (a fast reader on a listing
-- site produces a handful) and the index `(visitor_id, created_at DESC)` makes
-- the check an OFFSET-bounded scan that stops after 121 rows regardless of how
-- large the table grows.
CREATE OR REPLACE FUNCTION public.site_events_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- The server stamps its own clock; a client-supplied created_at is discarded
    -- so history cannot be backdated or placed in the future.
    NEW.created_at := NOW();

    -- "New" is decided here, not by the browser: a visitor is new only when no
    -- earlier row exists for them, ever. This cannot be inflated by a forged
    -- payload, and it stays correct across the range boundary.
    NEW.is_new_visitor := NOT EXISTS (
        SELECT 1 FROM public.site_events e WHERE e.visitor_id = NEW.visitor_id
    );

    IF EXISTS (
        SELECT 1
        FROM public.site_events e
        WHERE e.visitor_id = NEW.visitor_id
          AND e.created_at > (TIMEZONE('utc'::text, NOW()) - INTERVAL '60 seconds')
        OFFSET 120
    ) THEN
        RAISE EXCEPTION 'analytics rate limit exceeded';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_site_events_guard ON public.site_events;
CREATE TRIGGER trg_site_events_guard
BEFORE INSERT ON public.site_events
FOR EACH ROW EXECUTE FUNCTION public.site_events_guard();

-- -----------------------------------------------------------------------------
-- 4. Admin rollup
-- -----------------------------------------------------------------------------
-- One round trip, aggregated in Postgres. Day boundaries are Asia/Dhaka because
-- every date the admin console prints is in Mymensingh local time; a "today"
-- computed in UTC would disagree with the date shown beside it.
--
-- Definitions the dashboard must not blur together:
--   page view  = one page_view event
--   session    = one distinct session_id seen in range
--   visitor    = one distinct visitor_id seen in range
--   new        = a visitor whose very first ever event is inside the range
--   returning  = unique visitors minus new visitors
CREATE OR REPLACE FUNCTION public.get_website_analytics(
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
    v_page_views BIGINT;
    v_sessions BIGINT;
    v_visitors BIGINT;
    v_new_visitors BIGINT;
    v_cta_clicks BIGINT;
    v_form_submits BIGINT;
    v_today_page_views BIGINT;
    v_today_visitors BIGINT;
    v_daily JSONB;
    v_weekly JSONB;
    v_monthly JSONB;
    v_top_pages JSONB;
    v_landing_pages JSONB;
    v_top_content JSONB;
    v_top_categories JSONB;
    v_cta_clicks_by_type JSONB;
    v_form_submits_by_type JSONB;
    v_service_ctas JSONB;
    v_devices JSONB;
    v_referrers JSONB;
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
        RAISE EXCEPTION 'admin only';
    END IF;
    IF p_from IS NULL OR p_to IS NULL OR p_to < p_from OR (p_to - p_from) > 366 THEN
        RAISE EXCEPTION 'invalid analytics date range';
    END IF;
    IF p_event_type IS NOT NULL
       AND p_event_type NOT IN ('page_view', 'session_start', 'cta_click', 'form_submit') THEN
        RAISE EXCEPTION 'invalid event type filter';
    END IF;
    IF p_category IS NOT NULL AND length(p_category) > 80 THEN
        RAISE EXCEPTION 'invalid category filter';
    END IF;
    IF p_route IS NOT NULL AND (length(p_route) > 300 OR p_route NOT LIKE '/%') THEN
        RAISE EXCEPTION 'invalid route filter';
    END IF;

    -- Half-open [from, to) in Dhaka time.
    v_from := (p_from::TIMESTAMP AT TIME ZONE 'Asia/Dhaka');
    v_to   := ((p_to + 1)::TIMESTAMP AT TIME ZONE 'Asia/Dhaka');
    v_today := ((NOW() AT TIME ZONE 'Asia/Dhaka')::DATE)::TIMESTAMP AT TIME ZONE 'Asia/Dhaka';
    v_tomorrow := v_today + INTERVAL '1 day';

    -- Totals over the filtered event set.
    SELECT
        COUNT(*) FILTER (WHERE e.event_type = 'page_view'),
        COUNT(DISTINCT e.session_id),
        COUNT(DISTINCT e.visitor_id),
        COUNT(DISTINCT e.visitor_id) FILTER (WHERE e.is_new_visitor),
        COUNT(*) FILTER (WHERE e.event_type = 'cta_click'),
        COUNT(*) FILTER (WHERE e.event_type = 'form_submit')
    INTO v_page_views, v_sessions, v_visitors, v_new_visitors, v_cta_clicks, v_form_submits
    FROM public.site_events e
    WHERE e.created_at >= v_from AND e.created_at < v_to
      AND (p_category IS NULL OR e.category = p_category)
      AND (p_route IS NULL OR e.path = p_route)
      AND (p_event_type IS NULL OR e.event_type = p_event_type);

    -- Today's numbers ignore the chosen range so the tiles always mean "today".
    SELECT
        COUNT(*) FILTER (WHERE e.event_type = 'page_view'),
        COUNT(DISTINCT e.visitor_id)
    INTO v_today_page_views, v_today_visitors
    FROM public.site_events e
    WHERE e.created_at >= v_today AND e.created_at < v_tomorrow
      AND (p_category IS NULL OR e.category = p_category)
      AND (p_route IS NULL OR e.path = p_route)
      AND (p_event_type IS NULL OR e.event_type = p_event_type);

    -- Daily series, zero-filled across the whole range.
    SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT(
               'key', to_char(d.day, 'YYYY-MM-DD'),
               'pageViews', COALESCE(a.page_views, 0),
               'visitors', COALESCE(a.visitors, 0),
               'sessions', COALESCE(a.sessions, 0)
           ) ORDER BY d.day), '[]'::JSONB)
    INTO v_daily
    FROM (SELECT generate_series(p_from, p_to, INTERVAL '1 day')::DATE AS day) d
    LEFT JOIN (
        SELECT (e.created_at AT TIME ZONE 'Asia/Dhaka')::DATE AS day,
               COUNT(*) FILTER (WHERE e.event_type = 'page_view') AS page_views,
               COUNT(DISTINCT e.visitor_id) AS visitors,
               COUNT(DISTINCT e.session_id) AS sessions
        FROM public.site_events e
        WHERE e.created_at >= v_from AND e.created_at < v_to
          AND (p_category IS NULL OR e.category = p_category)
          AND (p_route IS NULL OR e.path = p_route)
          AND (p_event_type IS NULL OR e.event_type = p_event_type)
        GROUP BY 1
    ) a ON a.day = d.day;

    -- Weekly and monthly roll-ups from the same filtered set.
    SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT(
               'key', to_char(g.bucket, 'YYYY-MM-DD'),
               'pageViews', g.page_views,
               'visitors', g.visitors
           ) ORDER BY g.bucket), '[]'::JSONB)
    INTO v_weekly
    FROM (
        SELECT date_trunc('week', (e.created_at AT TIME ZONE 'Asia/Dhaka')::DATE) AS bucket,
               COUNT(*) FILTER (WHERE e.event_type = 'page_view') AS page_views,
               COUNT(DISTINCT e.visitor_id) AS visitors
        FROM public.site_events e
        WHERE e.created_at >= v_from AND e.created_at < v_to
          AND (p_category IS NULL OR e.category = p_category)
          AND (p_route IS NULL OR e.path = p_route)
          AND (p_event_type IS NULL OR e.event_type = p_event_type)
        GROUP BY 1
    ) g;

    SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT(
               'key', to_char(g.bucket, 'YYYY-MM'),
               'pageViews', g.page_views,
               'visitors', g.visitors
           ) ORDER BY g.bucket), '[]'::JSONB)
    INTO v_monthly
    FROM (
        SELECT date_trunc('month', (e.created_at AT TIME ZONE 'Asia/Dhaka')::DATE) AS bucket,
               COUNT(*) FILTER (WHERE e.event_type = 'page_view') AS page_views,
               COUNT(DISTINCT e.visitor_id) AS visitors
        FROM public.site_events e
        WHERE e.created_at >= v_from AND e.created_at < v_to
          AND (p_category IS NULL OR e.category = p_category)
          AND (p_route IS NULL OR e.path = p_route)
          AND (p_event_type IS NULL OR e.event_type = p_event_type)
        GROUP BY 1
    ) g;

    -- Most visited pages.
    SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT(
               'key', p.path, 'count', p.page_views, 'secondaryCount', p.visitors
           ) ORDER BY p.page_views DESC, p.path), '[]'::JSONB)
    INTO v_top_pages
    FROM (
        SELECT e.path,
               COUNT(*) AS page_views,
               COUNT(DISTINCT e.visitor_id) AS visitors
        FROM public.site_events e
        WHERE e.created_at >= v_from AND e.created_at < v_to
          AND e.event_type = 'page_view'
          AND (p_category IS NULL OR e.category = p_category)
          AND (p_route IS NULL OR e.path = p_route)
          AND (p_event_type IS NULL OR p_event_type = 'page_view')
        GROUP BY e.path
        ORDER BY COUNT(*) DESC, e.path
        LIMIT 25
    ) p;

    -- Landing pages = the path of each session's first page_view.
    SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT(
               'key', l.path, 'count', l.sessions, 'secondaryCount', l.visitors
           ) ORDER BY l.sessions DESC, l.path), '[]'::JSONB)
    INTO v_landing_pages
    FROM (
        SELECT e.path,
               COUNT(DISTINCT e.session_id) AS sessions,
               COUNT(DISTINCT e.visitor_id) AS visitors
        FROM public.site_events e
        WHERE e.created_at >= v_from AND e.created_at < v_to
          AND e.event_type = 'session_start'
          AND (p_category IS NULL OR e.category = p_category)
          AND (p_route IS NULL OR e.path = p_route)
          AND (p_event_type IS NULL OR p_event_type = 'session_start')
        GROUP BY e.path
        ORDER BY COUNT(DISTINCT e.session_id) DESC, e.path
        LIMIT 20
    ) l;

    -- Individual posts / listings / service pages.
    SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT(
               'key', c.path, 'count', c.page_views, 'secondaryCount', c.visitors,
               'kind', c.route_kind, 'contentId', c.content_id
           ) ORDER BY c.page_views DESC, c.path), '[]'::JSONB)
    INTO v_top_content
    FROM (
        SELECT e.path, e.route_kind, e.content_id,
               COUNT(*) AS page_views,
               COUNT(DISTINCT e.visitor_id) AS visitors
        FROM public.site_events e
        WHERE e.created_at >= v_from AND e.created_at < v_to
          AND e.event_type = 'page_view'
          AND e.content_id IS NOT NULL
          AND (p_category IS NULL OR e.category = p_category)
          AND (p_route IS NULL OR e.path = p_route)
          AND (p_event_type IS NULL OR p_event_type = 'page_view')
        GROUP BY e.path, e.route_kind, e.content_id
        ORDER BY COUNT(*) DESC, e.path
        LIMIT 25
    ) c;

    -- Popular service categories (by service-page traffic).
    SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT(
               'key', t.category, 'count', t.page_views, 'secondaryCount', t.visitors
           ) ORDER BY t.page_views DESC, t.category), '[]'::JSONB)
    INTO v_top_categories
    FROM (
        SELECT e.category,
               COUNT(*) AS page_views,
               COUNT(DISTINCT e.visitor_id) AS visitors
        FROM public.site_events e
        WHERE e.created_at >= v_from AND e.created_at < v_to
          AND e.event_type = 'page_view'
          AND e.category IS NOT NULL
          AND (p_category IS NULL OR e.category = p_category)
          AND (p_route IS NULL OR e.path = p_route)
          AND (p_event_type IS NULL OR p_event_type = 'page_view')
        GROUP BY e.category
        ORDER BY COUNT(*) DESC, e.category
        LIMIT 20
    ) t;

    -- Button presses, by CTA type.
    SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT(
               'key', k.cta_type, 'count', k.clicks, 'secondaryCount', k.visitors
           ) ORDER BY k.clicks DESC, k.cta_type), '[]'::JSONB)
    INTO v_cta_clicks_by_type
    FROM (
        SELECT e.cta_type,
               COUNT(*) AS clicks,
               COUNT(DISTINCT e.visitor_id) AS visitors
        FROM public.site_events e
        WHERE e.created_at >= v_from AND e.created_at < v_to
          AND e.event_type = 'cta_click'
          AND (p_category IS NULL OR e.category = p_category)
          AND (p_route IS NULL OR e.path = p_route)
          AND (p_event_type IS NULL OR p_event_type = 'cta_click')
        GROUP BY e.cta_type
        ORDER BY COUNT(*) DESC, e.cta_type
        LIMIT 25
    ) k;

    -- Confirmed form submissions, by CTA type. These rows only exist after the
    -- database accepted the underlying record.
    SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT(
               'key', k.cta_type, 'count', k.submits
           ) ORDER BY k.submits DESC, k.cta_type), '[]'::JSONB)
    INTO v_form_submits_by_type
    FROM (
        SELECT e.cta_type, COUNT(*) AS submits
        FROM public.site_events e
        WHERE e.created_at >= v_from AND e.created_at < v_to
          AND e.event_type = 'form_submit'
          AND (p_category IS NULL OR e.category = p_category)
          AND (p_route IS NULL OR e.path = p_route)
          AND (p_event_type IS NULL OR p_event_type = 'form_submit')
        GROUP BY e.cta_type
        ORDER BY COUNT(*) DESC, e.cta_type
        LIMIT 25
    ) k;

    -- Most-pressed "সেবা নিন" buttons, by page + category.
    SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT(
               'key', s.path, 'count', s.clicks, 'category', s.category
           ) ORDER BY s.clicks DESC, s.path), '[]'::JSONB)
    INTO v_service_ctas
    FROM (
        SELECT e.path, e.category, COUNT(*) AS clicks
        FROM public.site_events e
        WHERE e.created_at >= v_from AND e.created_at < v_to
          AND e.event_type = 'cta_click'
          AND e.cta_type = 'get_service'
          AND (p_category IS NULL OR e.category = p_category)
          AND (p_route IS NULL OR e.path = p_route)
          AND (p_event_type IS NULL OR p_event_type = 'cta_click')
        GROUP BY e.path, e.category
        ORDER BY COUNT(*) DESC, e.path
        LIMIT 20
    ) s;

    -- Device split (by session, so a multi-page visit counts once).
    SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT(
               'key', COALESCE(e.device_type, 'unknown'),
               'count', e.sessions,
               'secondaryCount', e.visitors
           ) ORDER BY e.sessions DESC, e.device_type), '[]'::JSONB)
    INTO v_devices
    FROM (
        SELECT e.device_type,
               COUNT(DISTINCT e.session_id) AS sessions,
               COUNT(DISTINCT e.visitor_id) AS visitors
        FROM public.site_events e
        WHERE e.created_at >= v_from AND e.created_at < v_to
          AND (p_category IS NULL OR e.category = p_category)
          AND (p_route IS NULL OR e.path = p_route)
          AND (p_event_type IS NULL OR e.event_type = p_event_type)
        GROUP BY e.device_type
    ) e;

    -- Referral sources (hostname only), from landing sessions.
    SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT(
               'key', r.host, 'count', r.sessions
           ) ORDER BY r.sessions DESC, r.host), '[]'::JSONB)
    INTO v_referrers
    FROM (
        SELECT COALESCE(e.referrer_host, 'direct') AS host,
               COUNT(DISTINCT e.session_id) AS sessions
        FROM public.site_events e
        WHERE e.created_at >= v_from AND e.created_at < v_to
          AND e.event_type = 'session_start'
          AND (p_event_type IS NULL OR p_event_type = 'session_start')
        GROUP BY 1
        ORDER BY COUNT(DISTINCT e.session_id) DESC, 1
        LIMIT 15
    ) r;

    -- To-Let engagement, counted from the existing table so the two systems
    -- never disagree about a listing's buttons.
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
        SELECT e.listing_id,
               l.title,
               COALESCE(l.area_id, MIN(e.area_id)) AS area_id,
               l.property_type,
               l.rent_price,
               l.status,
               COUNT(*) FILTER (WHERE e.event_type = 'view') AS views,
               COUNT(*) FILTER (WHERE e.event_type = 'call_click') AS call_clicks,
               COUNT(*) FILTER (WHERE e.event_type = 'whatsapp_click') AS whatsapp_clicks
        FROM public.tolet_listing_events e
        LEFT JOIN public.tolet_listings l ON l.id::TEXT = e.listing_id
        WHERE e.created_at >= v_from AND e.created_at < v_to
        GROUP BY e.listing_id, l.title, l.area_id, l.property_type, l.rent_price, l.status
        ORDER BY (COUNT(*) FILTER (WHERE e.event_type = 'call_click')
                + COUNT(*) FILTER (WHERE e.event_type = 'whatsapp_click')) DESC,
                 COUNT(*) FILTER (WHERE e.event_type = 'view') DESC
        LIMIT 25
    ) t;

    -- Confirmed requests — read from the real tables, not from the click log.
    -- A row here is proof the database accepted the submission.
    SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT('key', s.service_slug, 'count', s.total)
           ORDER BY s.total DESC, s.service_slug), '[]'::JSONB)
    INTO v_service_requests
    FROM (
        SELECT r.service_slug, COUNT(*) AS total
        FROM public.service_requests r
        WHERE r.created_at >= v_from AND r.created_at < v_to
        GROUP BY r.service_slug
    ) s;

    SELECT COUNT(*) INTO v_vehicle_requests
    FROM public.vehicle_requests v
    WHERE v.created_at >= v_from AND v.created_at < v_to;

    RETURN JSONB_BUILD_OBJECT(
        'range', JSONB_BUILD_OBJECT('from', to_char(p_from, 'YYYY-MM-DD'), 'to', to_char(p_to, 'YYYY-MM-DD')),
        'totals', JSONB_BUILD_OBJECT(
            'pageViews', v_page_views,
            'sessions', v_sessions,
            'uniqueVisitors', v_visitors,
            'newVisitors', v_new_visitors,
            'returningVisitors', GREATEST(v_visitors - v_new_visitors, 0),
            'ctaClicks', v_cta_clicks,
            'formSubmits', v_form_submits,
            'todayPageViews', v_today_page_views,
            'todayVisitors', v_today_visitors
        ),
        'daily', v_daily,
        'weekly', v_weekly,
        'monthly', v_monthly,
        'topPages', v_top_pages,
        'landingPages', v_landing_pages,
        'topContent', v_top_content,
        'topCategories', v_top_categories,
        'ctaClicks', v_cta_clicks_by_type,
        'formSubmits', v_form_submits_by_type,
        'serviceCtas', v_service_ctas,
        'devices', v_devices,
        'referrers', v_referrers,
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

-- Only signed-in callers may reach the rollup, and it re-checks is_admin()
-- internally. Anonymous visitors must not be able to probe platform traffic.
REVOKE ALL ON FUNCTION public.get_website_analytics(DATE, DATE, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_website_analytics(DATE, DATE, TEXT, TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_website_analytics(DATE, DATE, TEXT, TEXT, TEXT) TO authenticated;
