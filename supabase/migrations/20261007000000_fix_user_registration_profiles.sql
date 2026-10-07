-- ============================================================================
-- Fix: "Database error saving new user" during registration
-- ----------------------------------------------------------------------------
-- SYMPTOM
--   POST /auth/v1/signup fails with a 500 inside the auth.users INSERT
--   transaction, surfaced in the app as "Database error saving new user".
--   The Postgres detail looks like:
--
--     null value in column "primary_area_id" of relation "profiles"
--     violates not-null constraint
--
-- ROOT CAUSE
--   A signup-time trigger on `auth.users` tries to create the new user's row
--   in `public.profiles` but does not supply the NOT NULL columns (it only
--   fills id / full_name / phone from `raw_user_meta_data`). Any missing
--   column aborts the auth insert, so no user is ever created.
--
-- FIX
--   Replace the ad-hoc trigger wiring with ONE canonical, defensive
--   `handle_new_user()` trigger that:
--     * runs SECURITY DEFINER so it bypasses RLS (at signup there is no
--       session yet, so `auth.uid()` is NULL and the INSERT RLS policy
--       `auth.uid() = id AND role='customer' AND status='active' AND
--       is_verified=FALSE` can never be satisfied by the trigger itself),
--     * inserts every profile column the RLS INSERT policy requires for a
--       brand-new customer (role='customer', status='active',
--       is_verified=false) plus the row's real data, read from the
--       registration metadata that `lib/auth-context.tsx` now sends
--       (`full_name`, `phone`, `primary_area_id`, `email`),
--     * is defensive: when the metadata is absent (e.g. users created by an
--       admin or invited through the dashboard) it simply skips the insert
--       instead of aborting signup — those accounts keep working, and the
--       row can still be created later by the app when a session exists,
--     * is idempotent and safe to re-run.
--
-- Does not touch login, admin roles or any other account type's policies.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. Belt-and-braces: give `primary_area_id` a sane default.
--    The app always sends the area explicitly (register page default:
--    'charpara' = first MCC ward area), so this only ever matters for
--    third-party / legacy signup-trigger inserts that omit the column — the
--    exact case that produced the NOT NULL error above. The register page and
--    trigger both stay authoritative; this just guarantees no signup-time
--    insert can abort the auth transaction over a missing area.
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ALTER COLUMN primary_area_id SET DEFAULT 'charpara';

-- ---------------------------------------------------------------------------
-- 1. Drop the old (broken) trigger function if present. CASCADE removes any
--    trigger wired to it, so there can be no stale duplicate wiring left.
--    Must run BEFORE (re)creating the function.
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    meta       jsonb := NEW.raw_user_meta_data;
    _full_name text;
    _phone     text;
    _area_id   text;
    _email     text;
BEGIN
    -- Pull the self-registration payload out of the auth user metadata.
    _full_name := BTRIM(NULLIF(meta->>'full_name', ''));
    _phone     := BTRIM(NULLIF(meta->>'phone', ''));
    _area_id   := BTRIM(NULLIF(meta->>'primary_area_id', ''));
    _email     := COALESCE(NULLIF(BTRIM(meta->>'email'), ''), NEW.email);

    -- Only app self-registration carries this metadata. When it is missing
    -- (admin dashboard signups, invites, phone OTP accounts) skip the insert
    -- so a NOT NULL profile column can never abort the auth transaction —
    -- such accounts keep working and the row can be created later.
    IF _full_name IS NULL OR _phone IS NULL OR _area_id IS NULL THEN
        RETURN NEW;
    END IF;

    INSERT INTO public.profiles
        (id, full_name, phone, email, primary_area_id, role, status, is_verified)
    VALUES
        (NEW.id, _full_name, _phone, _email, _area_id, 'customer', 'active', FALSE)
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;

-- Not meant to be callable as a public RPC — it is a trigger only.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- 2. Wire up the canonical trigger (drop known older names first).
--    `on_auth_user_created` is the standard Supabase snippet name (the one
--    that produced this bug); `handle_new_user` covers renames.
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();