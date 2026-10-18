-- Keep website page views limited to real content pages. To-Let detail views
-- already have their own event log, and post creation routes are workflows.
CREATE OR REPLACE FUNCTION public.site_events_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NEW.event_type IN ('page_view', 'session_start')
       AND NEW.path ~ '^/(jobs|buy-sell|news)/create(/|$)' THEN
        RAISE EXCEPTION 'post creation routes are not page-view analytics';
    END IF;
    IF NEW.event_type = 'page_view'
       AND NEW.path ~ '^/tolet/[^/]+/?$' THEN
        RAISE EXCEPTION 'To-Let detail views use tolet_listing_events';
    END IF;

    NEW.created_at := NOW();
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

-- Remove only page-view/session-start rows that were incorrectly recorded.
-- Confirmed form submissions and CTA events remain valid conversion data.
DELETE FROM public.site_events
WHERE (
    event_type IN ('page_view', 'session_start')
    AND path ~ '^/(jobs|buy-sell|news)/create(/|$)'
)
OR (
    event_type = 'page_view'
    AND path ~ '^/tolet/[^/]+/?$'
);

-- Older directory and worker-profile visits had no content_id, so they could
-- not appear in the content ranking even though they were real page views.
UPDATE public.site_events
SET route_kind = 'directory',
    content_id = COALESCE(
        NULLIF(split_part(trim(both '/' from path), '/', 2), ''),
        split_part(trim(both '/' from path), '/', 1)
    ),
    category = split_part(trim(both '/' from path), '/', 1)
WHERE event_type = 'page_view'
  AND (
      (
          route_kind = 'directory'
          AND content_id IS NULL
          AND path ~ '^/(tolet|news|jobs|buy-sell|doctors|doctor|ambulance|police|fire-service|fireservice|emergency-call|blood-donor|coaching|wifi|bus-ticket|gari-auto-cng|services|home-tutor|home-moving|how-it-works|about|contact|help|safety|mymensingh)/?$'
      )
      OR (
          route_kind = 'other'
          AND path ~ '^/(kajer-bua|electrician|plumber|basha-paltano|ac-fridge)/[^/]+/?$'
      )
  );

-- Preserve the owner's existing authorization and response shape while making
-- the delete and its admin notification one transaction.
CREATE OR REPLACE FUNCTION public.fn_delete_my_tolet_listing(p_listing_id UUID)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    listing public.tolet_listings%ROWTYPE;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'sign-in required';
    END IF;

    SELECT * INTO listing
    FROM public.tolet_listings
    WHERE id = p_listing_id AND owner_id = auth.uid()
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'listing not found';
    END IF;

    INSERT INTO public.notifications (
        user_id, target_role, title, body, type, related_type, related_id
    )
    VALUES (
        NULL,
        'admin',
        'কাস্টমার বাসাভাড়ার পোস্ট ডিলিট করেছেন',
        '“' || listing.title || '” পোস্টটি মালিক মুছে দিয়েছেন।',
        'info',
        'tolet_listing_deleted',
        listing.id::TEXT
    );

    DELETE FROM public.tolet_listings
    WHERE id = p_listing_id AND owner_id = auth.uid();

    RETURN COALESCE(listing.photos, ARRAY[]::TEXT[]);
END;
$$;

REVOKE ALL ON FUNCTION public.fn_delete_my_tolet_listing(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_delete_my_tolet_listing(UUID) TO authenticated;

-- Page-level totals for the admin listing queue. This uses the existing
-- tolet_listing_events log and returns zeroes for listings with no activity.
CREATE OR REPLACE FUNCTION public.fn_admin_tolet_listing_metrics(p_listing_ids UUID[])
RETURNS TABLE (
    listing_id UUID,
    views BIGINT,
    call_clicks BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'admin only' USING ERRCODE = '42501';
    END IF;
    IF COALESCE(array_length(p_listing_ids, 1), 0) > 100 THEN
        RAISE EXCEPTION 'at most 100 To-Let listing ids may be requested';
    END IF;

    RETURN QUERY
    SELECT requested.id,
           COUNT(event.id) FILTER (WHERE event.event_type = 'view'),
           COUNT(event.id) FILTER (WHERE event.event_type = 'call_click')
    FROM (
        SELECT DISTINCT input_id AS id
        FROM unnest(COALESCE(p_listing_ids, ARRAY[]::UUID[])) AS requested_ids(input_id)
        WHERE input_id IS NOT NULL
    ) requested
    LEFT JOIN public.tolet_listing_events event
        ON event.listing_id = requested.id::TEXT
    GROUP BY requested.id;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_admin_tolet_listing_metrics(UUID[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_admin_tolet_listing_metrics(UUID[]) TO authenticated;

ALTER TABLE public.service_listings
    ADD COLUMN IF NOT EXISTS driver_name_bn TEXT;

ALTER TABLE public.service_listings
    DROP CONSTRAINT IF EXISTS service_listings_driver_name_bn_check;

ALTER TABLE public.service_listings
    ADD CONSTRAINT service_listings_driver_name_bn_check
    CHECK (
        driver_name_bn IS NULL
        OR length(btrim(driver_name_bn)) BETWEEN 1 AND 120
    )
    NOT VALID;

NOTIFY pgrst, 'reload schema';
