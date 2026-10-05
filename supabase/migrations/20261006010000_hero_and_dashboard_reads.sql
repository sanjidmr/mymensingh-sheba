-- =============================================================================
-- 20261006010000 — HERO SLIDES + ADMIN DASHBOARD READ MODELS
-- =============================================================================
--
-- Three additions, all additive:
--
--   1. `hero_slides` — moves the homepage hero carousel out of a hardcoded
--      array in `components/home/HeroCarousel.tsx` and into the database, so
--      the admin panel can reorder, replace and disable slides. The table is
--      SEEDED with the four slides that are live on the website right now
--      (same images, same captions, same order), so the public homepage is
--      unchanged by this migration. `HeroCarousel` still falls back to its
--      hardcoded array when this table is empty or unreachable.
--   2. `get_admin_dashboard_stats()` — one round trip for the dashboard
--      instead of nine separate count queries, and it counts in Postgres
--      rather than by downloading whole tables to the browser.
--   3. `get_admin_recent_activity()` — the Recent Activity feed, assembled
--      from real rows across every table that changes during normal use.
--
-- Idempotent: safe to run more than once.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Re-declare the shared trigger function (self-sufficiency)
-- -----------------------------------------------------------------------------
-- `supabase db push` does not expand `\i lib/supabase/schema.sql`, so a
-- migration can never rely on a helper defined there. This mirrors the
-- pattern already used by 20261004000000_tolet_analytics.sql.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- 1. HERO SLIDES
-- -----------------------------------------------------------------------------
--
-- `image_url` is a full URL. It is either a path under /public (the current
-- seeded state) or an absolute Supabase Storage URL once an admin uploads a
-- replacement into the `site` bucket. `storage_path` records the object path
-- so the panel can delete the underlying file when a slide is removed --
-- without it, replacing an image would orphan the old object forever.
CREATE TABLE IF NOT EXISTS public.hero_slides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caption_bn TEXT NOT NULL CHECK (length(trim(caption_bn)) > 0),
    image_url TEXT NOT NULL CHECK (length(trim(image_url)) > 0),
    storage_path TEXT,
    alt_text_bn TEXT,
    href TEXT,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.hero_slides ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE public.hero_slides ADD COLUMN IF NOT EXISTS alt_text_bn TEXT;
ALTER TABLE public.hero_slides ADD COLUMN IF NOT EXISTS href TEXT;

CREATE INDEX IF NOT EXISTS idx_hero_slides_order
    ON public.hero_slides (sort_order);
CREATE INDEX IF NOT EXISTS idx_hero_slides_enabled
    ON public.hero_slides (is_enabled, sort_order);

DROP TRIGGER IF EXISTS trg_hero_slides_updated ON public.hero_slides;
CREATE TRIGGER trg_hero_slides_updated
    BEFORE UPDATE ON public.hero_slides
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

-- The public homepage reads the enabled slides, in order. `anon` is listed
-- explicitly: the homepage must render for a logged-out visitor.
DROP POLICY IF EXISTS "Enabled hero slides are public" ON public.hero_slides;
CREATE POLICY "Enabled hero slides are public"
    ON public.hero_slides
    FOR SELECT
    TO anon, authenticated
    USING (is_enabled = TRUE);

-- Only admins write. A customer cannot enable, reorder or invent a slide.
DROP POLICY IF EXISTS "Admins manage hero slides" ON public.hero_slides;
CREATE POLICY "Admins manage hero slides"
    ON public.hero_slides
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Seed the four slides that are live on the website today, unchanged.
-- Guarded on the caption so re-running this never duplicates or overwrites a
-- slide an admin has since edited: an existing row with the same caption keeps
-- whatever the admin has done to it.
INSERT INTO public.hero_slides (caption_bn, image_url, sort_order, is_enabled)
SELECT v.caption, v.image, v.ord, TRUE
FROM (VALUES
    ('প্রতিদিনের সেবা, এক জায়গায়',  '/sheba1.png', 1),
    ('বাসা থেকে মেরামত — সবই স্থানীয়', '/sheba2.png', 2),
    ('ময়মনসিংহের মানুষের হাতেই গড়া', '/sheba3.png', 3),
    ('জরুরি সেবা, সঠিক নম্বরে',        '/sheba4.png', 4)
) AS v(caption, image, ord)
WHERE NOT EXISTS (
    SELECT 1 FROM public.hero_slides h WHERE h.caption_bn = v.caption
);

-- -----------------------------------------------------------------------------
-- 2. DASHBOARD STATISTICS
-- -----------------------------------------------------------------------------
-- SECURITY DEFINER because the counts span tables whose admin policies are
-- per-table `USING (public.is_admin())`; a plain function would otherwise have
-- to be granted a table privilege. The `is_admin()` check below is the real
-- gate and it runs first. `search_path = ''` plus fully-qualified references
-- means this cannot be subverted by a hijacked search_path.
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS TABLE (
    total_users                  BIGINT,
    active_users                 BIGINT,
    blocked_users                BIGINT,
    new_users_7d                 BIGINT,

    total_posts                  BIGINT,
    pending_posts                BIGINT,
    approved_posts               BIGINT,
    rejected_posts               BIGINT,
    featured_posts               BIGINT,

    total_requests               BIGINT,
    open_requests                BIGINT,
    total_tolet_requests         BIGINT,
    open_tolet_requests          BIGINT,
    total_blood_requests         BIGINT,
    open_blood_requests          BIGINT,
    total_vehicle_requests       BIGINT,
    open_vehicle_requests        BIGINT,

    total_messages               BIGINT,
    unread_messages              BIGINT,

    total_reports                BIGINT,
    open_reports                 BIGINT,

    pending_verifications        BIGINT,
    active_tolet_listings        BIGINT,
    pending_tolet_listings       BIGINT,
    active_staff                 BIGINT,
    active_service_listings      BIGINT,
    active_emergency_contacts    BIGINT,

    unread_admin_notifications   BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'admin only' USING ERRCODE = '42501';
    END IF;

    RETURN QUERY
    SELECT
        -- People
        (SELECT count(*) FROM public.profiles),
        (SELECT count(*) FROM public.profiles WHERE status = 'active'),
        (SELECT count(*) FROM public.profiles WHERE status IN ('suspended', 'blocked')),
        (SELECT count(*) FROM public.profiles WHERE created_at >= NOW() - INTERVAL '7 days'),

        -- Community posts (news / jobs / buy-sell)
        (SELECT count(*) FROM public.community_posts),
        (SELECT count(*) FROM public.community_posts WHERE status = 'pending'),
        (SELECT count(*) FROM public.community_posts WHERE status = 'approved'),
        (SELECT count(*) FROM public.community_posts WHERE status = 'rejected'),
        (SELECT count(*) FROM public.community_posts WHERE is_featured = TRUE),

        -- Service requests
        (SELECT count(*) FROM public.service_requests),
        (SELECT count(*) FROM public.service_requests
            WHERE status NOT IN ('completed', 'cancelled', 'rejected')),
        (SELECT count(*) FROM public.tolet_requests),
        (SELECT count(*) FROM public.tolet_requests WHERE status NOT IN ('completed', 'cancelled')),
        (SELECT count(*) FROM public.blood_requests),
        (SELECT count(*) FROM public.blood_requests WHERE status NOT IN ('completed', 'cancelled')),
        (SELECT count(*) FROM public.vehicle_requests),
        (SELECT count(*) FROM public.vehicle_requests WHERE status = 'new'),

        -- Contact inbox
        (SELECT count(*) FROM public.contact_messages),
        (SELECT count(*) FROM public.contact_messages WHERE status = 'new'),

        -- Reports, summed across all five report tables
        (SELECT
            (SELECT count(*) FROM public.listing_reports)
          + (SELECT count(*) FROM public.staff_profile_reports)
          + (SELECT count(*) FROM public.tutor_reports)
          + (SELECT count(*) FROM public.blood_donor_reports)
          + (SELECT count(*) FROM public.community_post_reports)),
        (SELECT
            (SELECT count(*) FROM public.listing_reports WHERE status = 'open')
          + (SELECT count(*) FROM public.staff_profile_reports WHERE status = 'open')
          + (SELECT count(*) FROM public.tutor_reports WHERE status = 'open')
          + (SELECT count(*) FROM public.blood_donor_reports WHERE status = 'open')
          + (SELECT count(*) FROM public.community_post_reports WHERE status = 'open')),

        -- Moderation
        ((SELECT count(*) FROM public.home_tutor_profiles WHERE status = 'pending_approval')
       + (SELECT count(*) FROM public.blood_donor_profiles WHERE status = 'pending_approval')
       + (SELECT count(*) FROM public.tolet_profiles WHERE status = 'pending_approval')),
        (SELECT count(*) FROM public.tolet_listings WHERE status = 'approved'),
        (SELECT count(*) FROM public.tolet_listings WHERE status = 'pending_review'),
        (SELECT count(*) FROM public.staff_profiles WHERE is_active = TRUE),
        (SELECT count(*) FROM public.service_listings WHERE is_active = TRUE),
        (SELECT count(*) FROM public.emergency_contacts WHERE is_active = TRUE),

        -- Admin hub
        (SELECT count(*) FROM public.notifications
            WHERE target_role = 'admin' AND is_read = FALSE);
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_dashboard_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO authenticated;

COMMENT ON FUNCTION public.get_admin_dashboard_stats() IS
    'Admin dashboard counters. Admin-only; every figure is a live count.';

-- -----------------------------------------------------------------------------
-- 3. RECENT ACTIVITY
-- -----------------------------------------------------------------------------
-- One UNION ALL over the tables that actually receive new rows during normal
-- use, newest first. `href` values are the admin routes that open the record,
-- so a click from the feed lands on the right screen.
CREATE OR REPLACE FUNCTION public.get_admin_recent_activity(p_limit INT DEFAULT 12)
RETURNS TABLE (
    id          TEXT,
    occurred_at TIMESTAMPTZ,
    category    TEXT,
    action      TEXT,
    title       TEXT,
    detail      TEXT,
    href        TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    WITH feed AS (
        -- Community posts: submitted
        SELECT 'cp-new-' || p.id::text            AS id,
               p.created_at                       AS occurred_at,
               'post'::TEXT                       AS category,
               'submitted'::TEXT                  AS action,
               p.title_bn                         AS title,
               COALESCE(
                   CASE p.kind
                       WHEN 'news'     THEN 'খবর'
                       WHEN 'job'      THEN 'চাকরির বিজ্ঞাপন'
                       WHEN 'buy_sell' THEN 'কেনাবেচা'
                   END, p.kind
               ) || ' — অনুমোদনের অপেক্ষায়'  AS detail,
               '/admin/posts'::TEXT               AS href
        FROM public.community_posts p
        WHERE p.status = 'pending'

        UNION ALL
        -- Community posts: approved
        SELECT 'cp-app-' || p.id::text, p.updated_at, 'post', 'approved',
               p.title_bn, 'সর্বজনীনভাবে প্রকাশ করা হয়েছে', '/admin/posts'
        FROM public.community_posts p
        WHERE p.status = 'approved' AND p.published_at IS NOT NULL

        UNION ALL
        -- Community posts: rejected
        SELECT 'cp-rej-' || p.id::text, p.updated_at, 'post', 'rejected',
               p.title_bn, 'প্রকাশ করা হয়নি', '/admin/posts'
        FROM public.community_posts p
        WHERE p.status = 'rejected'

        UNION ALL
        -- Service requests
        SELECT 'sr-' || r.id::text, r.created_at, 'request', 'submitted',
               COALESCE(NULLIF(r.profile_title, ''), r.service_slug, 'সেবা রিকোয়েস্ট'),
               COALESCE(r.contact_name, 'অজানা') || ' — ' || COALESCE(r.status, 'new'),
               '/admin/requests'
        FROM public.service_requests r

        UNION ALL
        -- To-let enquiries
        SELECT 'tr-' || r.id::text, r.created_at, 'request', 'submitted',
               'বাসা ভাড়া সংক্রান্ত অনুসন্ধান',
               COALESCE(NULLIF(r.customer_name, ''), 'অজানা', ' — ', r.status),
               '/admin/tolet-requests'
        FROM public.tolet_requests r

        UNION ALL
        -- Blood requests
        SELECT 'br-' || r.id::text, r.created_at, 'request', 'submitted',
               'রক্ত রিকোয়েস্ট',
               COALESCE(r.blood_group, '') || ' — ' || COALESCE(r.patient_name, 'অজানা'),
               '/admin/blood'
        FROM public.blood_requests r

        UNION ALL
        -- Vehicle requests. This table is guest-submitted, so the contact
        -- columns are `contact_name` / `contact_phone`, not a customer_id.
        SELECT 'vr-' || r.id::text, r.created_at, 'request', 'submitted',
               'গাড়ি / অটো / সিএনজি রিকোয়েস্ট',
               COALESCE(NULLIF(r.vehicle_name, ''), r.vehicle_kind) || ' — ' || r.contact_name,
               '/admin/vehicle-requests'
        FROM public.vehicle_requests r

        UNION ALL
        -- Contact messages
        SELECT 'cm-' || m.id::text, m.created_at, 'message', 'submitted',
               m.name,
               COALESCE(m.subject, '') || ' — ' || left(m.message, 90),
               '/admin/messages'
        FROM public.contact_messages m

        UNION ALL
        -- Reports, all five tables
        SELECT 'rp-l-' || r.id::text, r.created_at, 'report', 'submitted',
               COALESCE(r.reason, 'রিপোর্ট'), 'বাসা ভাড়া বিজ্ঞাপন', '/admin/reports'
        FROM public.listing_reports r WHERE r.status = 'open'
        UNION ALL
        SELECT 'rp-s-' || r.id::text, r.created_at, 'report', 'submitted',
               COALESCE(r.reason, 'রিপোর্ট'), 'কর্মী প্রোফাইল', '/admin/reports'
        FROM public.staff_profile_reports r WHERE r.status = 'open'
        UNION ALL
        SELECT 'rp-t-' || r.id::text, r.created_at, 'report', 'submitted',
               COALESCE(r.reason, 'রিপোর্ট'), 'গৃহশিক্ষক প্রোফাইল', '/admin/reports'
        FROM public.tutor_reports r WHERE r.status = 'open'
        UNION ALL
        SELECT 'rp-b-' || r.id::text, r.created_at, 'report', 'submitted',
               COALESCE(r.reason, 'রিপোর্ট'), 'রক্তদাতা প্রোফাইল', '/admin/reports'
        FROM public.blood_donor_reports r WHERE r.status = 'open'
        UNION ALL
        SELECT 'rp-c-' || r.id::text, r.created_at, 'report', 'submitted',
               COALESCE(r.reason, 'রিপোর্ট'), 'কেনাবেচা/খবর/চাকরি পোস্ট', '/admin/reports'
        FROM public.community_post_reports r WHERE r.status = 'open'

        UNION ALL
        -- New accounts
        SELECT 'pf-' || u.id::text, u.created_at, 'user', 'registered',
               COALESCE(NULLIF(u.full_name, ''), u.phone, 'নতুন ব্যবহারকারী'),
               'নতুন অ্যাকাউন্ট তৈরি হয়েছে', '/admin/users'
        FROM public.profiles u
    )
    SELECT f.id, f.occurred_at, f.category, f.action, f.title, f.detail, f.href
    FROM feed f
    WHERE public.is_admin()
    ORDER BY f.occurred_at DESC NULLS LAST
    LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 12), 50));
$$;

REVOKE ALL ON FUNCTION public.get_admin_recent_activity(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_recent_activity(INTEGER) TO authenticated;

COMMENT ON FUNCTION public.get_admin_recent_activity(INTEGER) IS
    'Admin activity feed assembled from real rows. Returns nothing for non-admins.';