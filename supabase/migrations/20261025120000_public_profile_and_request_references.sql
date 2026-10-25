CREATE SEQUENCE IF NOT EXISTS public.public_request_reference_seq;

CREATE TABLE IF NOT EXISTS public.public_profile_id_registry (
    public_id TEXT PRIMARY KEY CHECK (public_id ~ '^[A-Za-z1-9]{4}$'),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    UNIQUE (entity_type, entity_id)
);

ALTER TABLE public.public_profile_id_registry ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.public_profile_id_registry FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.public_profile_id_registry TO service_role;

CREATE OR REPLACE FUNCTION public.assign_public_profile_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    characters TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz123456789';
    candidate TEXT;
    index_value INTEGER;
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.public_id IS NOT NULL THEN
        NEW.public_id := OLD.public_id;
        RETURN NEW;
    END IF;

    SELECT registry.public_id
      INTO candidate
      FROM public.public_profile_id_registry AS registry
     WHERE registry.entity_type = TG_TABLE_NAME
       AND registry.entity_id = NEW.id;
    IF candidate IS NOT NULL THEN
        NEW.public_id := candidate;
        RETURN NEW;
    END IF;

    LOOP
        candidate := '';
        FOR index_value IN 1..4 LOOP
            candidate := candidate || SUBSTRING(
                characters
                FROM (FLOOR(random() * LENGTH(characters))::INTEGER + 1)
                FOR 1
            );
        END LOOP;

        BEGIN
            INSERT INTO public.public_profile_id_registry (public_id, entity_type, entity_id)
            VALUES (candidate, TG_TABLE_NAME, NEW.id);
            NEW.public_id := candidate;
            RETURN NEW;
        EXCEPTION
            WHEN unique_violation THEN
                SELECT registry.public_id
                  INTO candidate
                  FROM public.public_profile_id_registry AS registry
                 WHERE registry.entity_type = TG_TABLE_NAME
                   AND registry.entity_id = NEW.id;
                IF candidate IS NOT NULL THEN
                    NEW.public_id := candidate;
                    RETURN NEW;
                END IF;
        END;
    END LOOP;
END;
$$;

DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY ARRAY[
        'profiles',
        'service_listings',
        'tolet_listings',
        'tolet_profiles',
        'home_tutor_profiles',
        'blood_donor_profiles',
        'staff_profiles'
    ] LOOP
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS public_id TEXT', table_name);
        EXECUTE format('DROP TRIGGER IF EXISTS trg_assign_public_profile_id ON public.%I', table_name);
        EXECUTE format(
            'CREATE TRIGGER trg_assign_public_profile_id BEFORE INSERT OR UPDATE OF public_id ON public.%I FOR EACH ROW EXECUTE FUNCTION public.assign_public_profile_id()',
            table_name
        );
        EXECUTE format('UPDATE public.%I SET public_id = NULL WHERE public_id IS NULL', table_name);
        EXECUTE format(
            'CREATE UNIQUE INDEX IF NOT EXISTS %I ON public.%I (public_id)',
            table_name || '_public_id_key',
            table_name
        );
        EXECUTE format('ALTER TABLE public.%I ALTER COLUMN public_id SET NOT NULL', table_name);
        IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = table_name || '_public_id_format_check'
              AND conrelid = format('public.%I', table_name)::regclass
        ) THEN
            EXECUTE format(
                'ALTER TABLE public.%I ADD CONSTRAINT %I CHECK (public_id ~ ''^[A-Za-z1-9]{4}$'')',
                table_name,
                table_name || '_public_id_format_check'
            );
        END IF;
    END LOOP;
END
$$;

ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS reference_code TEXT;
ALTER TABLE public.vehicle_requests ADD COLUMN IF NOT EXISTS reference_code TEXT;
ALTER TABLE public.service_listings ADD COLUMN IF NOT EXISTS public_code TEXT;

CREATE OR REPLACE FUNCTION public.assign_public_request_reference()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    prefix TEXT;
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.reference_code IS NOT NULL THEN
        NEW.reference_code := OLD.reference_code;
        RETURN NEW;
    END IF;

    IF TG_TABLE_NAME = 'vehicle_requests' THEN
        prefix := 'VEH';
    ELSE
        prefix := CASE LOWER(COALESCE(NEW.service_slug, ''))
            WHEN 'ambulance' THEN 'AMB'
            WHEN 'doctor' THEN 'DOC'
            WHEN 'home-moving' THEN 'MOV'
            WHEN 'home-tutor' THEN 'TUT'
            WHEN 'blood-donor' THEN 'BLD'
            WHEN 'electrician' THEN 'ELC'
            WHEN 'plumber' THEN 'PLB'
            WHEN 'kajer-bua' THEN 'KBU'
            ELSE 'REQ'
        END;
    END IF;

    NEW.reference_code := prefix || '-' || LPAD(
        NEXTVAL('public.public_request_reference_seq')::TEXT,
        3,
        '0'
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_service_request_public_reference ON public.service_requests;
CREATE TRIGGER trg_service_request_public_reference
BEFORE INSERT OR UPDATE OF reference_code ON public.service_requests
FOR EACH ROW EXECUTE FUNCTION public.assign_public_request_reference();

DROP TRIGGER IF EXISTS trg_vehicle_request_public_reference ON public.vehicle_requests;
CREATE TRIGGER trg_vehicle_request_public_reference
BEFORE INSERT OR UPDATE OF reference_code ON public.vehicle_requests
FOR EACH ROW EXECUTE FUNCTION public.assign_public_request_reference();

UPDATE public.service_requests SET reference_code = NULL WHERE reference_code IS NULL;
UPDATE public.vehicle_requests SET reference_code = NULL WHERE reference_code IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS service_requests_reference_code_key
    ON public.service_requests (reference_code);
CREATE UNIQUE INDEX IF NOT EXISTS vehicle_requests_reference_code_key
    ON public.vehicle_requests (reference_code);

CREATE OR REPLACE FUNCTION public.assign_service_listing_public_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.public_code IS NOT NULL THEN
        NEW.public_code := OLD.public_code;
        RETURN NEW;
    END IF;

    IF NEW.category = 'vehicle' THEN
        NEW.public_code := 'CAR-' || LPAD(
            NEXTVAL('public.public_request_reference_seq')::TEXT,
            3,
            '0'
        );
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_service_listing_public_code ON public.service_listings;
CREATE TRIGGER trg_service_listing_public_code
BEFORE INSERT OR UPDATE OF public_code, category ON public.service_listings
FOR EACH ROW EXECUTE FUNCTION public.assign_service_listing_public_code();
UPDATE public.service_listings
SET public_code = NULL
WHERE category = 'vehicle' AND public_code IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS service_listings_public_code_key
    ON public.service_listings (public_code)
    WHERE public_code IS NOT NULL;

DROP FUNCTION IF EXISTS public.fn_public_donor_directory(TEXT, TEXT, BOOLEAN);
CREATE FUNCTION public.fn_public_donor_directory(
    p_blood_group TEXT DEFAULT NULL,
    p_area_id TEXT DEFAULT NULL,
    p_available_only BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    id UUID,
    public_id TEXT,
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
    d.public_id,
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
    AND d.is_available IS TRUE
    AND (p_blood_group IS NULL OR p_blood_group = '' OR p_blood_group = 'all' OR d.blood_group = p_blood_group)
    AND (p_area_id IS NULL OR p_area_id = '' OR d.area_id = p_area_id)
  ORDER BY d.published_at DESC NULLS LAST, d.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.fn_public_donor_directory(TEXT, TEXT, BOOLEAN) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.assign_public_profile_id() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.assign_public_request_reference() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.assign_service_listing_public_code() FROM PUBLIC, anon, authenticated;

NOTIFY pgrst, 'reload schema';
