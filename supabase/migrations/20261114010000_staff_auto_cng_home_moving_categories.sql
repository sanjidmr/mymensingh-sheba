-- Allow the admin staff directory to store workers for Auto, CNG and Home Moving.
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
    CHECK (service_slug IN ('kajer-bua', 'electrician', 'plumber', 'ac-fridge', 'auto', 'cng', 'home-moving'));

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
    CHECK (service_slug IN ('kajer-bua', 'electrician', 'plumber', 'ac-fridge', 'auto', 'cng', 'home-moving'));

CREATE OR REPLACE FUNCTION public.assign_profile_service_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    code_prefix TEXT;
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.service_code IS NOT NULL THEN
        NEW.service_code := OLD.service_code;
        RETURN NEW;
    END IF;

    IF TG_TABLE_NAME = 'staff_profiles' THEN
        code_prefix := CASE NEW.service_slug
            WHEN 'kajer-bua' THEN 'KBU'
            WHEN 'electrician' THEN 'ELC'
            WHEN 'plumber' THEN 'PLB'
            WHEN 'ac-fridge' THEN 'ACR'
            WHEN 'auto' THEN 'AUT'
            WHEN 'cng' THEN 'CNG'
            WHEN 'home-moving' THEN 'MOV'
            ELSE 'STF'
        END;
    ELSE
        code_prefix := CASE TG_TABLE_NAME
            WHEN 'home_tutor_profiles' THEN 'HT'
            WHEN 'blood_donor_profiles' THEN 'BLD'
            WHEN 'tolet_listings' THEN 'TOL'
            ELSE 'SRV'
        END;
    END IF;

    NEW.service_code := public.allocate_service_entity_code(
        code_prefix,
        TG_TABLE_NAME,
        NEW.id
    );
    RETURN NEW;
END;
$$;

ALTER TABLE public.staff_profiles
    DROP CONSTRAINT IF EXISTS staff_profiles_service_code_format_check;
ALTER TABLE public.staff_profiles
    ADD CONSTRAINT staff_profiles_service_code_format_check
    CHECK (service_code ~ '^(KBU|ELC|PLB|ACR|AUT|CNG|MOV)-[A-Z0-9]{3}$');
