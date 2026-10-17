-- =============================================================================
-- CUSTOMER POST VIEW COUNTS — owner-facing read of first-party page views
-- =============================================================================
--
-- WHY THIS MIGRATION EXISTS
-- -------------------------
-- `public.site_events` (20261014000000_website_analytics.sql) already records a
-- `page_view` for every route a visitor opens, including individual community
-- posts: for those rows `route_kind = 'post'`, `content_id` is the post slug and
-- `category` is the post kind (news / job / buy_sell). The admin rollup
-- (`get_website_analytics`) is the only reader, and its SELECT policy is gated on
-- `public.is_admin()` — so an author could not see how many people read their
-- own post without either opening raw events to every signed-in member or
-- shipping a made-up number. Neither is acceptable: this platform never invents
-- a statistic, and raw event rows (visitor ids, session ids) are not something a
-- customer should be able to enumerate.
--
-- This migration adds exactly one narrow, aggregate read: `fn_my_post_views()`
-- returns the caller's OWN posts with a plain view count per post. It is
-- SECURITY DEFINER precisely so it can read the admin-only table, and it checks
-- ownership inside the query (`p.author_id = auth.uid()`), so a caller can never
-- learn the traffic of someone else's post.
--
-- WHAT A "VIEW" MEANS HERE — and does not
-- ---------------------------------------
-- One `page_view` event for the post's detail route. It is not a person, not a
-- unique visitor and not a completed read — the same honesty contract the To-Let
-- and website analytics modules already follow. Surfaces that render this number
-- must therefore label it "দেখা" (views), never "পাঠক" (readers).
--
-- IDEMPOTENT: safe to run more than once. The function is dropped and recreated
-- so a future return-type change cannot leave a stale definition behind.
-- =============================================================================

-- The join below filters on content_id together with route_kind; the existing
-- site_events indexes are (path, category, event_type, created_at), none of
-- which makes a per-slug lookup cheap. This one does.
CREATE INDEX IF NOT EXISTS idx_site_events_content_id
    ON public.site_events (content_id);

-- -----------------------------------------------------------------------------
-- Owner-facing view count, one row per authored post slug
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.fn_my_post_views();

CREATE OR REPLACE FUNCTION public.fn_my_post_views()
RETURNS TABLE (post_slug TEXT, view_count BIGINT)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
    SELECT e.content_id, COUNT(*)
    FROM public.site_events e
    JOIN public.community_posts p
      ON p.slug = e.content_id
     -- Older rows may not carry a category; accept NULL as "unknown kind" and
     -- still match on the slug rather than silently dropping the view.
     AND (e.category IS NULL OR e.category = p.kind)
    WHERE e.event_type = 'page_view'
      AND e.route_kind = 'post'
      AND e.content_id IS NOT NULL
      AND p.author_id = auth.uid()
    GROUP BY e.content_id;
$$;

-- Signed-in callers only; the ownership join is what limits the rows returned,
-- and it is re-evaluated on every call (never trusted from the client).
REVOKE ALL ON FUNCTION public.fn_my_post_views() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_my_post_views() FROM anon;
GRANT EXECUTE ON FUNCTION public.fn_my_post_views() TO authenticated;
