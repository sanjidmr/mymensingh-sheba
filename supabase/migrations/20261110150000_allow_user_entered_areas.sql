-- Profiles without an area remain valid until the user completes onboarding.
-- Existing values are preserved; newly entered areas continue using the text column.
ALTER TABLE public.profiles
    ALTER COLUMN primary_area_id DROP DEFAULT,
    ALTER COLUMN primary_area_id DROP NOT NULL;

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
    _email := COALESCE(NULLIF(BTRIM(meta->>'email'), ''), NEW.email);
    _full_name := COALESCE(
        NULLIF(BTRIM(meta->>'full_name'), ''),
        NULLIF(BTRIM(meta->>'name'), ''),
        NULLIF(SPLIT_PART(_email, '@', 1), ''),
        'নতুন ব্যবহারকারী'
    );
    _phone := NULLIF(BTRIM(meta->>'phone'), '');
    _area_id := NULLIF(BTRIM(meta->>'primary_area_id'), '');

    INSERT INTO public.profiles
        (id, full_name, phone, email, primary_area_id, role, status, is_verified)
    VALUES
        (NEW.id, _full_name, _phone, _email, _area_id, 'customer', 'active', FALSE)
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;
