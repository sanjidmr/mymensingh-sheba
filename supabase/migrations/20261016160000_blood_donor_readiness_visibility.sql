-- ============================================================================
-- Blood donors — donor-controlled "রক্তদানের বর্তমান প্রস্তুতি" visibility
-- ============================================================================
--
-- What this adds
-- --------------
-- A single owner-controlled flag, `show_readiness`, on `blood_donor_profiles`.
-- The public donor card renders an optional "রক্তদানের বর্তমান প্রস্তুতি" panel;
-- it is shown ONLY when the donor has switched it on. Default is FALSE, so the
-- panel is hidden unless the donor explicitly chose to publish it — a readiness
-- statement is the donor's to make, not something to infer for them.
--
-- `fn_public_donor_directory` is recreated to carry the flag through to the
-- public card. Its return type changes, so the function is dropped first; the
-- grants are re-applied immediately afterwards. Nothing else is touched: no
-- table, row, policy or trigger is dropped, and the `private_phone` /
-- `admin_notes` / `rejection_reason` column REVOKEs are re-asserted so the
-- underlying table stays as locked down as before.
--
-- Only the owner may write `show_readiness`: the existing owner-only UPDATE RLS
-- policy on `blood_donor_profiles` already scopes writes to `auth.uid()`, and the
-- public read still happens ONLY through the SECURITY DEFINER function, which
-- never exposes the private phone column.

-- 1. The preference column. Hidden by default ----------------------------------------
ALTER TABLE public.blood_donor_profiles
    ADD COLUMN IF NOT EXISTS show_readiness BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.blood_donor_profiles.show_readiness IS
    'Owner opt-in: when true, the public donor card may show the '
    '"রক্তদানের বর্তমান প্রস্তুতি" (current donation readiness) panel. Defaults '
    'to FALSE so no donor is published as ready without choosing to be.';

-- 2. Recreate the public directory RPC with the new column -----------------------------
-- The return type changes, so the function must be dropped and rebuilt; a plain
-- CREATE OR REPLACE would be rejected by Postgres.
DROP FUNCTION IF EXISTS public.fn_public_donor_directory(TEXT, TEXT, BOOLEAN);

CREATE FUNCTION public.fn_public_donor_directory(
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
    show_readiness BOOLEAN,
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
    d.show_readiness,
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

GRANT EXECUTE ON FUNCTION public.fn_public_donor_directory(TEXT, TEXT, BOOLEAN) TO anon, authenticated;

-- Keep the underlying table locked down — the RPC above is the only public door.
REVOKE SELECT ON TABLE public.blood_donor_profiles FROM anon;
REVOKE SELECT (private_phone, admin_notes)
ON public.blood_donor_profiles FROM anon, authenticated;
REVOKE SELECT (rejection_reason) ON public.blood_donor_profiles FROM anon;

NOTIFY pgrst, 'reload schema';
