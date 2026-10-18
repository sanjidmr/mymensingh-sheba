-- =============================================================================
-- CUSTOMER PROFILE VIEW COUNTS — owner-facing read of directory page views
-- =============================================================================
--
-- WHY THIS MIGRATION EXISTS
-- -------------------------
-- A customer can open service identities beyond community posts: a home-tutor
-- profile (`/home-tutor/<id>`) and WiFi / coaching listings (`/wifi/<slug>`,
-- `/coaching/<slug>`). Every visitor opening one of those detail routes is
-- already recorded as a `page_view` in `public.site_events`
-- (20261014000000_website_analytics.sql) with `route_kind = 'directory'` and
-- `content_id` set to the tutor id or the listing slug. The only reader of that
-- table is the admin rollup, so the owner had no honest way to see how many
-- times their own profile was opened.
--
-- This migration adds exactly one narrow aggregate read:
-- `fn_my_profile_views()` returns the caller's OWN tutor profile and
-- WiFi / coaching listings with a plain view count each. It is SECURITY DEFINER
-- so it can read the admin-only events table, and ownership is re-checked
-- inside the SQL (`auth.uid()`), so a caller can never learn another member's
-- traffic. Raw event rows (visitor ids, session ids) never leave the database.
--
-- WHAT A "VIEW" MEANS HERE — and does not
-- ---------------------------------------
-- One `page_view` event for the profile's detail route. Not a person, not a
-- unique visitor, not a contact. Surfaces that render this number must label it
-- "দেখা" (views) — the same honesty contract as `fn_my_post_views()`.
--
-- IDEMPOTENT: safe to run more than once.
-- =============================================================================

DROP FUNCTION IF EXISTS public.fn_my_profile_views();

CREATE OR REPLACE FUNCTION public.fn_my_profile_views()
RETURNS TABLE (content_id TEXT, view_count BIGINT)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
    -- Home-tutor profile: /home-tutor/<id> → content_id is the profile UUID.
    SELECT t.id::text, COUNT(*)
    FROM public.site_events e
    JOIN public.home_tutor_profiles t
      ON t.id::text = e.content_id
    WHERE e.event_type = 'page_view'
      AND e.route_kind = 'directory'
      AND e.content_id IS NOT NULL
      AND t.user_id = auth.uid()
    GROUP BY t.id

    UNION ALL

    -- WiFi / coaching listings: /<category>/<slug> → content_id is the slug.
    -- Only the two categories a customer may own are included; bus and vehicle
    -- rows are admin-curated and have no customer owner to report to.
    SELECT s.slug, COUNT(*)
    FROM public.site_events e
    JOIN public.service_listings s
      ON s.slug = e.content_id
    WHERE e.event_type = 'page_view'
      AND e.route_kind = 'directory'
      AND e.content_id IS NOT NULL
      AND s.category IN ('wifi', 'coaching')
      AND s.owner_id = auth.uid()
    GROUP BY s.slug;
$$;

-- Signed-in callers only; the ownership join limits the rows returned.
REVOKE ALL ON FUNCTION public.fn_my_profile_views() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_my_profile_views() FROM anon;
GRANT EXECUTE ON FUNCTION public.fn_my_profile_views() TO authenticated;
