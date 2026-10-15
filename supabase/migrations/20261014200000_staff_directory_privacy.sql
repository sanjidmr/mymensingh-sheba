-- ====================================================================
-- Staff directory privacy: worker profiles are ADMIN-ONLY
-- ====================================================================
-- WHY
-- ---
-- "কর্মী ও সেবা" (/admin/services) is an INTERNAL worker directory. Customers
-- must never see an individual worker profile or a worker phone number; they
-- submit a service request form and an admin assigns the worker.
--
-- The database carried a public read policy:
--
--     CREATE POLICY "Active staff profiles are public"
--     ON public.staff_profiles FOR SELECT USING (is_active = TRUE);
--
-- That policy exposed every active worker row — name, title, area and work
-- type — to anonymous visitors and every signed-in customer. The
-- `phone_private` column was also meant to be REVOKEd from anon/authenticated.
-- Relying on the app layer to "not ask" is not a guarantee, so this migration
-- makes the database itself the boundary.
--
-- WHAT
-- ----
-- 1. Ensure RLS is enabled on public.staff_profiles.
-- 2. Drop the public SELECT policy, so anon / authenticated customers can read
--    no rows at all.
-- 3. Grant reads to authenticated admins only (is_admin()), and re-create the
--    admin write policy so the internal directory keeps working even if this
--    migration runs against a database that predates the consolidated schema.
-- 4. Re-assert the column-level REVOKE of `phone_private`. Admin phone reads
--    keep going through the SECURITY DEFINER RPCs `fn_admin_staff_profiles`
--    and `fn_admin_staff_profile`, which carry their own is_admin() gate.
--
-- WHAT IS NOT TOUCHED
-- -------------------
-- No table, column, constraint, index or row is dropped or changed. Existing
-- worker records keep all of their data; only who may SELECT / write changes.
-- The `service_role` key bypasses RLS as usual, and admin requests keep working
-- through their is_admin() policy.
--
-- APPLY
-- -----
--   supabase db push
--   -- or, without the CLI:
--   psql "$DATABASE_URL" -f supabase/migrations/20261014200000_staff_directory_privacy.sql
--
-- Safe to run more than once.
-- ====================================================================

-- 1. RLS on ------------------------------------------------------------------------
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Remove the public read policy -------------------------------------------------
DROP POLICY IF EXISTS "Active staff profiles are public" ON public.staff_profiles;

-- 3. Admin-only read + write -------------------------------------------------------
DROP POLICY IF EXISTS "Admins read staff profiles" ON public.staff_profiles;
CREATE POLICY "Admins read staff profiles"
ON public.staff_profiles FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins manage staff profiles" ON public.staff_profiles;
CREATE POLICY "Admins manage staff profiles"
ON public.staff_profiles FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 4. Re-assert the private column REVOKE ------------------------------------------
REVOKE SELECT (phone_private) ON public.staff_profiles FROM anon, authenticated;
