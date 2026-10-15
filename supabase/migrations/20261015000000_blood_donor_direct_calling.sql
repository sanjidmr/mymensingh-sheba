-- ====================================================================
-- Blood donors: direct calling from the public directory
-- ====================================================================
-- WHY
-- ---
-- The public রক্তদাতা directory now lets a visitor call an APPROVED donor
-- directly (a `tel:` link on the card / কল করুন button). The previous design
-- routed every contact through an admin-reviewed "blood request" release flow,
-- which no longer exists.
--
-- The card never PRINTS a phone number, but the browser still needs the value
-- to build the `tel:` link. `private_phone` is column-REVOKEd from `anon` and
-- `authenticated` (see 20261008000000_master_consolidated_schema.sql), and that
-- REVOKE is left in place: a bulk `select private_phone from blood_donor_profiles`
-- with the public key keeps failing. Instead this migration adds a single
-- SECURITY DEFINER function that returns ONLY approved donors, with the contact
-- number, and nothing else sensitive (no admin_notes, no rejection_reason).
--
-- WHAT
-- ----
-- 1. Create `fn_public_donor_directory(...)`: approved donors + `contact_phone`,
--    with optional blood-group / area / availability filters.
-- 2. Grant EXECUTE to `anon` and `authenticated`.
-- 3. Re-assert the `private_phone` / `admin_notes` column REVOKEs so the table
--    itself stays locked down.
--
-- WHAT IS NOT TOUCHED
-- -------------------
-- No table, column, row, policy or trigger is dropped. Owner-only UPDATE and
-- admin-only management policies are unchanged: a customer can still manage
-- ONLY their own profile, and only `status = 'approved'` rows are returned here.
--
-- APPLY
-- -----
--   supabase db push
--   -- or, without the CLI:
--   psql "$DATABASE_URL" -f supabase/migrations/20261015000000_blood_donor_direct_calling.sql
--
-- Safe to run more than once.
-- ====================================================================

-- 1. Public, approved-only donor directory (controlled phone access) -----------------
CREATE OR REPLACE FUNCTION public.fn_public_donor_directory(
  p_blood_group TEXT DEFAULT NULL,
  p_area_id TEXT DEFAULT NULL,
  p_available_only BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  status TEXT,
  full_name TEXT,
  blood_group TEXT,
  area_id TEXT,
  gender TEXT,
  birth_year INTEGER,
  weight_kg INTEGER,
  is_available BOOLEAN,
  last_donation_date DATE,
  donation_count INTEGER,
  is_verified BOOLEAN,
  intro TEXT,
  profile_photo_url TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  contact_phone TEXT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT
    d.id,
    d.user_id,
    d.status,
    d.full_name,
    d.blood_group,
    d.area_id,
    d.gender,
    d.birth_year,
    d.weight_kg,
    d.is_available,
    d.last_donation_date,
    d.donation_count,
    d.is_verified,
    d.intro,
    d.profile_photo_url,
    d.published_at,
    d.created_at,
    d.updated_at,
    d.private_phone
  FROM public.blood_donor_profiles d
  WHERE d.status = 'approved'
    AND (p_blood_group IS NULL OR p_blood_group = '' OR p_blood_group = 'all' OR d.blood_group = p_blood_group)
    AND (p_area_id IS NULL OR p_area_id = '' OR d.area_id = p_area_id)
    AND (p_available_only IS NOT TRUE OR d.is_available IS TRUE)
  ORDER BY d.published_at DESC NULLS LAST, d.created_at DESC;
$$;

-- 2. Let the public directory call it -------------------------------------------------
GRANT EXECUTE ON FUNCTION public.fn_public_donor_directory(TEXT, TEXT, BOOLEAN) TO anon, authenticated;

-- 3. Keep the underlying table locked down --------------------------------------------
-- The public row set is intentionally read through the SECURITY DEFINER RPC only.
REVOKE SELECT ON TABLE public.blood_donor_profiles FROM anon;
REVOKE SELECT (private_phone, admin_notes)
ON public.blood_donor_profiles FROM anon, authenticated;
REVOKE SELECT (rejection_reason) ON public.blood_donor_profiles FROM anon;
