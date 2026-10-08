-- =============================================================================
-- 20261006000000 — ADMIN PANEL SECURITY HARDENING
-- =============================================================================
--
-- WHY THIS FILE EXISTS
-- --------------------
-- The admin panel talks to the database with the ordinary authenticated client
-- and relies on Row Level Security as its only boundary. Three gaps made that
-- boundary weaker than it looked:
--
--   1. `community_post_reports` was created without `ENABLE ROW LEVEL
--      SECURITY`. Supabase grants ALL on new tables to `anon` and
--      `authenticated`, so with RLS off, ANY visitor could read the whole
--      moderation queue (reporter names and reasons) and rewrite rows --
--      including setting `status = 'dismissed'`, which hides a report from
--      the admin who needs to see it. It also had no admin SELECT policy at
--      all, so once RLS is switched on it must be given one or the admin
--      panel cannot open the queue.
--   2. `notifications` allowed any signed-in user to insert a row with
--      `target_role = 'admin'`, and every admin reads those rows. That is a
--      text-injection/phishing hole in the admin inbox.
--   3. The admin panel needs DELETE on the queues it owns; several tables had
--      no DELETE policy for anyone, admin included.
--
-- This file fixes all three and adds the indexes the admin queues need.
-- It is idempotent: safe to run more than once.
--
-- It deliberately does NOT touch the customer-facing public read policies.
-- See `docs/ADMIN_PANEL.md` -> "Known follow-ups" for the column-level
-- privacy issue on `home_tutor_profiles.private_phone`,
-- `blood_donor_profiles.private_phone`, `staff_profiles.phone_private`,
-- `service_listings.contact_phone_private` and
-- `community_posts.author_phone`. Those need a customer-facing refactor to
-- fix properly and are out of scope here.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. community_post_reports — turn RLS on and give it a real admin boundary
-- -----------------------------------------------------------------------------

ALTER TABLE public.community_post_reports ENABLE ROW LEVEL SECURITY;

-- The previous migration created this policy with `WITH CHECK (true)` and no
-- role list, so it applied to every role including `anon`. Replace it with a
-- shape-constrained version: a reporter may only file a report under their own
-- id (when they have one) and must supply a non-blank name and reason.
DROP POLICY IF EXISTS community_post_reports_insert ON public.community_post_reports;
CREATE POLICY community_post_reports_insert
    ON public.community_post_reports
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        length(trim(reporter_name)) >= 2
        AND length(trim(reason)) >= 2
        AND (reporter_id IS NULL OR reporter_id = auth.uid())
    );

-- Admins read the queue. This is the policy the admin panel depends on; it did
-- not exist before, so the queue was unopenable by anyone even though the
-- INSERT policy and the notification trigger were in place.
DROP POLICY IF EXISTS "Admins read community post reports" ON public.community_post_reports;
CREATE POLICY "Admins read community post reports"
    ON public.community_post_reports
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Admins moderate the queue: resolve, dismiss, or delete outright.
DROP POLICY IF EXISTS "Admins manage community post reports" ON public.community_post_reports;
CREATE POLICY "Admins manage community post reports"
    ON public.community_post_reports
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- The reporter may still see what happened to their own report.
DROP POLICY IF EXISTS "Reporters read own community post reports" ON public.community_post_reports;
CREATE POLICY "Reporters read own community post reports"
    ON public.community_post_reports
    FOR SELECT
    TO authenticated
    USING (reporter_id = auth.uid());

-- Queue indexes. The admin panel opens this table filtered by status and
-- ordered by recency, and (later) searched by reporter name.
CREATE INDEX IF NOT EXISTS idx_cpr_post_created
    ON public.community_post_reports (post_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- 2. notifications — stop a customer from writing into the admin inbox
-- -----------------------------------------------------------------------------
--
-- Trigger functions write admin notifications with `user_id = NULL` and
-- `target_role = 'admin'`; they are SECURITY DEFINER so they bypass this
-- policy. A regular signed-in user, by contrast, must only ever be able to
-- create notifications addressed to themselves.
DROP POLICY IF EXISTS "Users create own notifications" ON public.notifications;
CREATE POLICY "Users create own notifications"
    ON public.notifications
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_admin()
        OR (user_id = auth.uid() AND target_role = 'customer')
    );

-- -----------------------------------------------------------------------------
-- 3. Admin DELETE / update rights on the queues the panel owns
-- -----------------------------------------------------------------------------
--
-- `FOR ALL` policies already cover community_posts, tolet_listings,
-- service_listings, staff_profiles, emergency_contacts, notifications and
-- vehicle_requests. These tables had no admin DELETE at all, so an admin
-- could not clear a spam report or an abusive message from the panel.

DROP POLICY IF EXISTS "Admins delete contact messages" ON public.contact_messages;
CREATE POLICY "Admins delete contact messages"
    ON public.contact_messages
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "Admins delete service requests" ON public.service_requests;
CREATE POLICY "Admins delete service requests"
    ON public.service_requests
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- An admin logging an enquiry on a customer's behalf (a phone order taken by
-- staff) must not be blocked by `auth.uid() = customer_id`.
DROP POLICY IF EXISTS "Admins create tolet requests" ON public.tolet_requests;
CREATE POLICY "Admins create tolet requests"
    ON public.tolet_requests
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins delete tolet requests" ON public.tolet_requests;
CREATE POLICY "Admins delete tolet requests"
    ON public.tolet_requests
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "Admins delete listing reports" ON public.listing_reports;
CREATE POLICY "Admins delete listing reports"
    ON public.listing_reports
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "Admins delete staff profile reports" ON public.staff_profile_reports;
CREATE POLICY "Admins delete staff profile reports"
    ON public.staff_profile_reports
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "Admins delete tutor reports" ON public.tutor_reports;
CREATE POLICY "Admins delete tutor reports"
    ON public.tutor_reports
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "Admins delete blood donor reports" ON public.blood_donor_reports;
CREATE POLICY "Admins delete blood donor reports"
    ON public.blood_donor_reports
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "Admins delete tutor reviews" ON public.tutor_reviews;
CREATE POLICY "Admins delete tutor reviews"
    ON public.tutor_reviews
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- 4. Indexes for the admin queues
-- -----------------------------------------------------------------------------
--
-- `home_tutor_profiles` and `blood_donor_profiles` had no indexes at all, and
-- `service_requests` only had `created_at`. "Show me everything still waiting
-- for review, newest first" was a sequential scan on three of the busiest
-- queues. These are additive and change no existing query plan semantics.

CREATE INDEX IF NOT EXISTS idx_home_tutor_profiles_status_created
    ON public.home_tutor_profiles (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_home_tutor_profiles_user
    ON public.home_tutor_profiles (user_id);

CREATE INDEX IF NOT EXISTS idx_blood_donor_profiles_status_created
    ON public.blood_donor_profiles (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blood_donor_profiles_user
    ON public.blood_donor_profiles (user_id);

CREATE INDEX IF NOT EXISTS idx_blood_donor_profiles_blood_group
    ON public.blood_donor_profiles (blood_group)
    WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS idx_service_requests_status_created
    ON public.service_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_requests_customer
    ON public.service_requests (customer_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_slug_status
    ON public.service_requests (service_slug, status);

CREATE INDEX IF NOT EXISTS idx_service_requests_listing
    ON public.service_requests (listing_id)
    WHERE listing_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tolet_profiles_status_created
    ON public.tolet_profiles (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tolet_listings_status_created
    ON public.tolet_listings (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_blood_requests_status_created
    ON public.blood_requests (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tolet_requests_status_created
    ON public.tolet_requests (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contact_messages_status_created
    ON public.contact_messages (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_posts_status_created
    ON public.community_posts (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vehicle_requests_status_created
    ON public.vehicle_requests (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_role_status
    ON public.profiles (role, status);

-- -----------------------------------------------------------------------------
-- 5. Admin search indexes (B-tree prefixes, no extension required)
-- -----------------------------------------------------------------------------
--
-- The admin panel's search boxes filter with `ilike 'term%'`, which a plain
-- B-tree on `lower(col)` can serve. Deliberately NOT pg_trgm: that needs the
-- extension created in a transaction-hostile way and the admin datasets here
-- are small enough that a prefix index plus `limit`/`range` pagination is the
-- right trade-off.
CREATE INDEX IF NOT EXISTS idx_profiles_full_name_lower
    ON public.profiles (lower(full_name) text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_contact_messages_name_lower
    ON public.contact_messages (lower(name) text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_service_requests_name_lower
    ON public.service_requests (lower(customer_name) text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_community_posts_title_lower
    ON public.community_posts (lower(title_bn) text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_name_lower
    ON public.staff_profiles (lower(full_name) text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_listing_reports_reason_lower
    ON public.listing_reports (lower(reason) text_pattern_ops);

-- -----------------------------------------------------------------------------
-- 6. Storage: `site` bucket for admin-managed media (hero, banners, homepage)
-- -----------------------------------------------------------------------------
--
-- A new bucket rather than reusing `listings`, because the existing path
-- convention there is `{auth.uid()}/...` and is enforced by every policy on
-- it. Admin uploads are not owned by a user, so they need a different
-- convention (`hero/...`, `homepage/...`) and must not be able to impersonate a
-- customer folder. The bucket is PUBLIC because these images are rendered on
-- the public homepage; write access is admin-only.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'site', 'site', TRUE, 5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO NOTHING;

-- Belt-and-braces with the bucket's `public` flag, and explicit about the role
-- list this time (the older bucket policies omit it and therefore also apply
-- to `anon`).
DROP POLICY IF EXISTS "Site media is publicly readable" ON storage.objects;
CREATE POLICY "Site media is publicly readable"
    ON storage.objects
    FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'site');

-- Admin-only writes. No user-id folder requirement -- admins upload site
-- assets that belong to the site, not to a profile.
DROP POLICY IF EXISTS "Admins can upload site media" ON storage.objects;
CREATE POLICY "Admins can upload site media"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'site' AND public.is_admin());

DROP POLICY IF EXISTS "Admins can update site media" ON storage.objects;
CREATE POLICY "Admins can update site media"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'site' AND public.is_admin())
    WITH CHECK (bucket_id = 'site' AND public.is_admin());

DROP POLICY IF EXISTS "Admins can delete site media" ON storage.objects;
CREATE POLICY "Admins can delete site media"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'site' AND public.is_admin());