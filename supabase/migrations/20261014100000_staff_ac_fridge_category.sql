-- ====================================================================
-- Staff category: allow 'ac-fridge' (এসি ও ফ্রিজ মেরামত)
-- ====================================================================
-- WHY
-- ---
-- The admin "কর্মী / সেবা" console can manage worker profiles for four
-- services: কাজের বুয়া, Electrician, Plumber and — added here — এসি ও
-- ফ্রিজ মেরামত. The two staff tables carried an inline CHECK that only
-- allowed the first three slugs, so an `ac-fridge` row was rejected by the
-- database even though the application now offers it.
--
-- WHAT
-- ----
-- Relax the `service_slug` CHECK on `public.staff_profiles` and
-- `public.staff_profile_reports` to include 'ac-fridge'.
--
-- The original constraints were written inline (`service_slug TEXT ... CHECK
-- (service_slug IN (...))`), so Postgres auto-named them. Rather than guess a
-- name, the block below finds and drops EVERY check constraint whose definition
-- mentions `service_slug`, then re-adds one named, explicit constraint. The
-- migration is therefore safe to run more than once: a second run drops the
-- constraint it added and immediately re-creates the identical one.
--
-- RLS, indexes and all existing rows are untouched. Nothing else is modified.
-- ====================================================================

DO $do$
DECLARE
    con RECORD;
BEGIN
    FOR con IN
        SELECT c.conname
        FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE n.nspname = 'public'
          AND t.relname = 'staff_profiles'
          AND c.contype = 'c'
          AND pg_get_constraintdef(c.oid) ILIKE '%service_slug%'
    LOOP
        EXECUTE format('ALTER TABLE public.staff_profiles DROP CONSTRAINT %I', con.conname);
    END LOOP;
END
$do$;

ALTER TABLE public.staff_profiles
    ADD CONSTRAINT staff_profiles_service_slug_check
    CHECK (service_slug IN ('kajer-bua', 'electrician', 'plumber', 'ac-fridge'));

DO $do$
DECLARE
    con RECORD;
BEGIN
    FOR con IN
        SELECT c.conname
        FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE n.nspname = 'public'
          AND t.relname = 'staff_profile_reports'
          AND c.contype = 'c'
          AND pg_get_constraintdef(c.oid) ILIKE '%service_slug%'
    LOOP
        EXECUTE format('ALTER TABLE public.staff_profile_reports DROP CONSTRAINT %I', con.conname);
    END LOOP;
END
$do$;

ALTER TABLE public.staff_profile_reports
    ADD CONSTRAINT staff_profile_reports_service_slug_check
    CHECK (service_slug IN ('kajer-bua', 'electrician', 'plumber', 'ac-fridge'));
