-- ============================================================================
-- Privacy & security hardening
-- ----------------------------------------------------------------------------
-- Applies the 2026-10-06 privacy audit findings end to end.
--
-- WHAT THIS DOES
--  1. Column-level REVOKE of PII from `anon` and `authenticated`. The web app
--     runs with the anon publishable key (JWT role `authenticated`), so any
--     `select('*')` on these tables from the client can no longer read phone
--     numbers, NID details, addresses or admin notes.
--  2. SECURITY DEFINER RPCs (search_path pinned to '') that BYPASS the column
--     revokes for the flows that genuinely need the data:
--       * owner self-reads  -> fn_my_*        (gated by auth.uid())
--       * admin moderation  -> fn_admin_*     (gated by public.is_admin())
--     Each returns `SETOF <table>` so PostgREST exposes it like a normal table
--     read; callers filter/order/limit as usual and map rows unchanged.
--  3. `is_admin()` now requires `status = 'active'` (a suspended admin is not
--     an admin).
--  4. Owner UPDATE policies gain a `WITH CHECK` so an owner can only ever write
--     `pending_approval` / `approved` — moderation statuses stay admin-owned.
--  5. `prevent_self_approval` learns the "keep me published" update: an owner
--     editing an already-APPROVED profile may re-assert `approved` (OLD = NEW),
--     but may never INSERT it or transition INTO it.
--  6. `fetch_market_contact` pins search_path = '' like every other SECURITY
--     DEFINER helper.
--  7. `blood_contact_releases` gains a `contact_phone` snapshot column so the
--     customer's own-contact-releases read does not need to join the donor's
--     private_phone (which is now revoked). The phone is baked in at release
--     time and back-filled for existing rows.
--
-- Idempotent: safe to run against schema.sql (which mirrors everything here).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. is_admin() must require an ACTIVE admin profile
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 2. prevent_self_approval: allow the owner's "keep me published" re-assert
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_self_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _role TEXT;
BEGIN
  IF NEW.status IN ('approved', 'suspended', 'rejected') THEN
    -- Editing an already-published profile keeps it approved: the UPDATE just
    -- re-asserts the status it already holds. Every other path into a guarded
    -- status (self-INSERT or a real transition) still requires an admin.
    IF TG_OP = 'UPDATE' AND OLD.status = NEW.status THEN
      RETURN NEW;
    END IF;
    SELECT role INTO _role FROM public.profiles WHERE id = auth.uid();
    IF COALESCE(_role, '') <> 'admin' THEN
      RAISE EXCEPTION 'Status change to % requires admin approval', NEW.status;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. Owner UPDATE policies: hard-write-check the statuses an owner may set
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Owners can update their tolet profile" ON public.tolet_profiles;
CREATE POLICY "Owners can update their tolet profile"
ON public.tolet_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND status IN ('pending_approval', 'approved'));

DROP POLICY IF EXISTS "Users can update their tutor profile" ON public.home_tutor_profiles;
CREATE POLICY "Users can update their tutor profile"
ON public.home_tutor_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND status IN ('pending_approval', 'approved'));

DROP POLICY IF EXISTS "Users can update their donor profile" ON public.blood_donor_profiles;
CREATE POLICY "Users can update their donor profile"
ON public.blood_donor_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND status IN ('pending_approval', 'approved'));

-- ---------------------------------------------------------------------------
-- 4. Column-level REVOKEs (PII is no longer readable by the anon key)
-- ---------------------------------------------------------------------------
-- tolet_profiles: landlord's contact + NID + holding address.
REVOKE SELECT (phone, emergency_phone, nid_number, nid_doc_url, holding_number, address_line)
ON public.tolet_profiles FROM anon, authenticated;

-- home_tutor_profiles: private phone + NID + admin notes. `rejection_reason`
-- stays readable to authenticated (the moderated owner sees their own); it is
-- removed from anon only.
REVOKE SELECT (private_phone, nid_number, admin_notes)
ON public.home_tutor_profiles FROM anon, authenticated;
REVOKE SELECT (rejection_reason) ON public.home_tutor_profiles FROM anon;

-- blood_donor_profiles: private phone + admin notes.
REVOKE SELECT (private_phone, admin_notes)
ON public.blood_donor_profiles FROM anon, authenticated;
REVOKE SELECT (rejection_reason) ON public.blood_donor_profiles FROM anon;

-- staff_profiles: the number customers may only call after a booking.
REVOKE SELECT (phone_private) ON public.staff_profiles FROM anon, authenticated;

-- community_posts: seller contact + moderation notes.
REVOKE SELECT (author_phone, whatsapp_number, rejection_reason)
ON public.community_posts FROM anon, authenticated;

-- service_listings: the admin-curated contact number (shown in-app only after
-- an admin check; a public reader gets the request CTA).
REVOKE SELECT (contact_phone_private) ON public.service_listings FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. blood_contact_releases: snapshot the released number on the audit row so
--    the requester can read it from THEIR OWN row without donor_private_phone
-- ---------------------------------------------------------------------------
ALTER TABLE public.blood_contact_releases
  ADD COLUMN IF NOT EXISTS contact_phone TEXT;

UPDATE public.blood_contact_releases r
SET contact_phone = d.private_phone
FROM public.blood_donor_profiles d
WHERE r.donor_profile_id = d.id
  AND r.contact_phone IS NULL;

-- ---------------------------------------------------------------------------
-- 6. fetch_market_contact: pin search_path (it already schema-qualifies)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fetch_market_contact(p_slug TEXT)
RETURNS TABLE (
    post_id UUID,
    author_name TEXT,
    author_phone TEXT,
    whatsapp_number TEXT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
    SELECT p.id, p.author_name, p.author_phone, p.whatsapp_number
    FROM public.community_posts p
    WHERE p.slug = p_slug
      AND p.kind = 'buy_sell'
      AND p.status = 'approved'
    LIMIT 1;
$$;

-- ---------------------------------------------------------------------------
-- 7. Owner self-read RPCs — full rows (incl. PII) for the row they own
-- ---------------------------------------------------------------------------
-- The sign-in bootstrap and the profile setup/edit screens need the owner's own
-- phone / NID / address to prefill. Column REVOKEs made that a privileged read,
-- so these SECURITY DEFINER helpers hand back the caller's own row only.

CREATE OR REPLACE FUNCTION public.fn_my_tolet_profile()
RETURNS SETOF public.tolet_profiles
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT t.* FROM public.tolet_profiles t WHERE t.user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.fn_my_tutor_profile()
RETURNS SETOF public.home_tutor_profiles
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT t.* FROM public.home_tutor_profiles t WHERE t.user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.fn_my_donor_profile()
RETURNS SETOF public.blood_donor_profiles
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT t.* FROM public.blood_donor_profiles t WHERE t.user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.fn_my_posts()
RETURNS SETOF public.community_posts
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT p.* FROM public.community_posts p
  WHERE p.author_id = auth.uid()
  ORDER BY p.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.fn_my_post_by_id(p_id UUID)
RETURNS SETOF public.community_posts
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT p.* FROM public.community_posts p
  WHERE p.id = p_id AND p.author_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.fn_my_post_by_slug(p_kind TEXT, p_slug TEXT)
RETURNS SETOF public.community_posts
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT p.* FROM public.community_posts p
  WHERE p.kind = p_kind AND p.slug = p_slug AND p.author_id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- 8. Admin RPCs — full moderation reads, gated by is_admin() server-side.
--    Non-admins receive zero rows (no error, no PII).
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.fn_admin_tutor_profiles()
RETURNS SETOF public.home_tutor_profiles
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT t.* FROM public.home_tutor_profiles t
  WHERE public.is_admin()
  ORDER BY t.updated_at DESC NULLS LAST;
$$;

CREATE OR REPLACE FUNCTION public.fn_admin_tutor_profile(p_id UUID)
RETURNS SETOF public.home_tutor_profiles
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT t.* FROM public.home_tutor_profiles t
  WHERE public.is_admin() AND t.id = p_id;
$$;

CREATE OR REPLACE FUNCTION public.fn_admin_donor_profiles()
RETURNS SETOF public.blood_donor_profiles
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT t.* FROM public.blood_donor_profiles t
  WHERE public.is_admin()
  ORDER BY t.updated_at DESC NULLS LAST;
$$;

CREATE OR REPLACE FUNCTION public.fn_admin_donor_profile(p_id UUID)
RETURNS SETOF public.blood_donor_profiles
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT t.* FROM public.blood_donor_profiles t
  WHERE public.is_admin() AND t.id = p_id;
$$;

-- The donor's private phone for the ADMIN contact-release flow (a snapshot then
-- lands on the audit row so the customer can read it from their own row).
CREATE OR REPLACE FUNCTION public.fn_admin_donor_phone(p_donor_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT t.private_phone FROM public.blood_donor_profiles t
  WHERE public.is_admin() AND t.id = p_donor_id;
$$;

CREATE OR REPLACE FUNCTION public.fn_admin_staff_profiles()
RETURNS SETOF public.staff_profiles
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT s.* FROM public.staff_profiles s
  WHERE public.is_admin()
  ORDER BY s.updated_at DESC NULLS LAST;
$$;

CREATE OR REPLACE FUNCTION public.fn_admin_staff_profile(p_id UUID)
RETURNS SETOF public.staff_profiles
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT s.* FROM public.staff_profiles s
  WHERE public.is_admin() AND s.id = p_id;
$$;

-- Full community-posts moderation feed (incl. author_phone, rejection_reason).
CREATE OR REPLACE FUNCTION public.fn_admin_posts()
RETURNS SETOF public.community_posts
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT p.* FROM public.community_posts p WHERE public.is_admin();
$$;

-- Full curated listings (incl. contact_phone_private).
CREATE OR REPLACE FUNCTION public.fn_admin_service_listings(p_category TEXT)
RETURNS SETOF public.service_listings
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT l.* FROM public.service_listings l
  WHERE public.is_admin() AND l.category = p_category
  ORDER BY l.is_featured DESC, l.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.fn_admin_service_listing(p_category TEXT, p_slug TEXT)
RETURNS SETOF public.service_listings
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT l.* FROM public.service_listings l
  WHERE public.is_admin() AND l.category = p_category AND l.slug = p_slug;
$$;

-- ---------------------------------------------------------------------------
-- 9. Grants — nothing is exposed to roles that were not thought about
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_my_tolet_profile() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_my_tutor_profile() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_my_donor_profile() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_my_posts() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_my_post_by_id(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_my_post_by_slug(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_admin_tutor_profiles() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_admin_tutor_profile(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_admin_donor_profiles() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_admin_donor_profile(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_admin_donor_phone(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_admin_staff_profiles() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_admin_staff_profile(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_admin_posts() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_admin_service_listings(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_admin_service_listing(TEXT, TEXT) FROM PUBLIC;
-- keep custom helpers callable by everyone the pre-existing grants already covered
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_my_tolet_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_my_tutor_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_my_donor_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_my_posts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_my_post_by_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_my_post_by_slug(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_admin_tutor_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_admin_tutor_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_admin_donor_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_admin_donor_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_admin_donor_phone(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_admin_staff_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_admin_staff_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_admin_posts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_admin_service_listings(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_admin_service_listing(TEXT, TEXT) TO authenticated;