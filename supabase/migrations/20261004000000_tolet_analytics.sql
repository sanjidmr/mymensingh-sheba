-- Mymensingh Sheba — To-Let listing engagement tracking
--
-- Adds:
--   1. `tolet_listings.unavailable_facilities` — drives the "এই বাসায় যা নেই"
--      panel on the detail page.
--   2. `tolet_listing_events` — append-only log of view / call_click /
--      whatsapp_click / favorite / share, with RLS and an aggregation RPC for
--      the admin panel.
--
-- The full definitions and the reasoning behind each decision live inline in
-- `lib/supabase/schema.sql`; this migration is the incremental path for a
-- database that was created before these objects existed. It is safe to re-run.
--
-- REMINDER on semantics: `call_click` is a BUTTON PRESS, not a call. The
-- platform has no telephony integration and cannot know whether anyone dialled
-- or was answered. Admin-facing copy must say "কল বাটন চাপা হয়েছে".
--
-- Apply with: supabase db push
--   …or paste into the Supabase SQL editor.

-- ---------------------------------------------------------------------------
-- 1. "এই বাসায় যা নেই"
-- ---------------------------------------------------------------------------
-- Nullable-by-default on older rows: adding the column with a '{}' default
-- backfills existing listings with an empty list, which the UI renders as
-- "no absences recorded" rather than as an absence claim.
ALTER TABLE public.tolet_listings
    ADD COLUMN IF NOT EXISTS unavailable_facilities TEXT[] NOT NULL DEFAULT '{}';

-- ---------------------------------------------------------------------------
-- 2. Engagement events
-- ---------------------------------------------------------------------------
-- `listing_id` is TEXT with NO foreign key, deliberately:
--   * showcase/demo listing ids are not UUIDs and an FK would reject them;
--   * an FK would cascade-delete a listing's history when an owner removes the
--     listing, destroying the very rows an admin would want to review.
-- Denormalised area_id / property_type / rent_price keep per-property
-- reporting meaningful after deletion.
CREATE TABLE IF NOT EXISTS public.tolet_listing_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('view', 'call_click', 'whatsapp_click', 'favorite', 'share')),
    event_source TEXT NOT NULL DEFAULT 'detail_page'
        CHECK (event_source IN ('detail_page', 'sticky_bar', 'card')),
    visitor_id TEXT,          -- opaque client id; never an IP or a fingerprint
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    area_id TEXT,
    property_type TEXT,
    rent_price INTEGER,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Aggregation always reads "per listing", so that is the leading index.
CREATE INDEX IF NOT EXISTS idx_tolet_events_listing ON public.tolet_listing_events (listing_id);
CREATE INDEX IF NOT EXISTS idx_tolet_events_listing_type ON public.tolet_listing_events (listing_id, event_type);
CREATE INDEX IF NOT EXISTS idx_tolet_events_created ON public.tolet_listing_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tolet_events_area ON public.tolet_listing_events (area_id);

ALTER TABLE public.tolet_listing_events ENABLE ROW LEVEL SECURITY;

-- Public write, no public read. The WITH CHECK stops a visitor from filing an
-- event under somebody else's user_id or inventing an event_type.
DROP POLICY IF EXISTS "Anyone can record a tolet engagement event" ON public.tolet_listing_events;
CREATE POLICY "Anyone can record a tolet engagement event"
ON public.tolet_listing_events FOR INSERT
TO anon, authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- Counts are business data and a fingerprinting surface, so they are never
-- publicly readable.
DROP POLICY IF EXISTS "Admins read all tolet engagement events" ON public.tolet_listing_events;
CREATE POLICY "Admins read all tolet engagement events"
ON public.tolet_listing_events FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Owners read events for their own listings" ON public.tolet_listing_events;
CREATE POLICY "Owners read events for their own listings"
ON public.tolet_listing_events FOR SELECT
TO authenticated
USING (
    public.is_admin() OR
    EXISTS (
        SELECT 1 FROM public.tolet_listings l
        WHERE l.id::text = public.tolet_listing_events.listing_id
          AND l.owner_id = auth.uid()
    )
);

-- Aggregated rollup so the admin console renders rows instead of pulling the
-- raw event log. SECURITY DEFINER bypasses the table's SELECT policy, so the
-- function re-checks is_admin() itself before returning anything.
CREATE OR REPLACE FUNCTION public.tolet_listing_analytics(p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
    listing_id            TEXT,
    listing_title         TEXT,
    area_id               TEXT,
    property_type         TEXT,
    rent_price            INTEGER,
    status                TEXT,
    views                 BIGINT,
    call_clicks           BIGINT,
    whatsapp_clicks       BIGINT,
    favorites             BIGINT,
    shares                BIGINT,
    unique_visitors       BIGINT,
    last_activity_at      TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'admin only';
    END IF;

    RETURN QUERY
    WITH ev AS (
        SELECT e.listing_id,
               COUNT(*) FILTER (WHERE e.event_type = 'view')           AS views,
               COUNT(*) FILTER (WHERE e.event_type = 'call_click')     AS call_clicks,
               COUNT(*) FILTER (WHERE e.event_type = 'whatsapp_click') AS whatsapp_clicks,
               COUNT(*) FILTER (WHERE e.event_type = 'favorite')       AS favorites,
               COUNT(*) FILTER (WHERE e.event_type = 'share')          AS shares,
               COUNT(DISTINCT COALESCE(e.user_id::text, e.visitor_id)) AS unique_visitors,
               MAX(e.created_at)                                       AS last_activity_at,
               MIN(e.area_id)                                          AS area_id
        FROM public.tolet_listing_events e
        GROUP BY e.listing_id
    )
    SELECT ev.listing_id,
           l.title,
           COALESCE(l.area_id, ev.area_id),
           l.property_type,
           l.rent_price,
           l.status,
           ev.views,
           ev.call_clicks,
           ev.whatsapp_clicks,
           ev.favorites,
           ev.shares,
           ev.unique_visitors,
           ev.last_activity_at
    FROM ev
    LEFT JOIN public.tolet_listings l ON l.id::text = ev.listing_id
    -- Hottest first: contact clicks, then views; recency breaks ties.
    ORDER BY (ev.call_clicks + ev.whatsapp_clicks) DESC, ev.views DESC,
             ev.last_activity_at DESC NULLS LAST
    LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 50), 500));
END;
$$;