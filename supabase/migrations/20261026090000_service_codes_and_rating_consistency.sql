CREATE SEQUENCE IF NOT EXISTS public.service_entity_code_seq;

CREATE TABLE IF NOT EXISTS public.service_entity_code_registry (
    service_code TEXT PRIMARY KEY
        CHECK (service_code ~ '^[A-Z]{2,4}-[A-Z0-9]{3}$'),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    UNIQUE (entity_type, entity_id)
);

ALTER TABLE public.service_entity_code_registry ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.service_entity_code_registry FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.service_entity_code_registry TO service_role;

ALTER TABLE public.home_tutor_profiles
    ADD COLUMN IF NOT EXISTS service_code TEXT;
ALTER TABLE public.blood_donor_profiles
    ADD COLUMN IF NOT EXISTS service_code TEXT;
ALTER TABLE public.tolet_listings
    ADD COLUMN IF NOT EXISTS service_code TEXT;
ALTER TABLE public.staff_profiles
    ADD COLUMN IF NOT EXISTS service_code TEXT;

GRANT SELECT (service_code)
    ON public.home_tutor_profiles, public.tolet_listings, public.staff_profiles
    TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.allocate_service_entity_code(
    p_prefix TEXT,
    p_entity_type TEXT,
    p_entity_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    existing_code TEXT;
    serial_value BIGINT;
    serial_index BIGINT;
    characters TEXT := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    serial_code TEXT;
    candidate TEXT;
BEGIN
    SELECT registry.service_code
      INTO existing_code
      FROM public.service_entity_code_registry AS registry
     WHERE registry.entity_type = p_entity_type
       AND registry.entity_id = p_entity_id;
    IF existing_code IS NOT NULL THEN
        RETURN existing_code;
    END IF;

    LOOP
        serial_value := NEXTVAL('public.service_entity_code_seq');
        IF serial_value > 33696 THEN
            RAISE EXCEPTION 'Service code capacity exhausted';
        END IF;

        serial_index := serial_value - 1;
        serial_code :=
            SUBSTRING('ABCDEFGHIJKLMNOPQRSTUVWXYZ' FROM (serial_index / 1296)::INTEGER + 1 FOR 1)
            || SUBSTRING(characters FROM ((serial_index / 36)::INTEGER % 36) + 1 FOR 1)
            || SUBSTRING(characters FROM (serial_index % 36)::INTEGER + 1 FOR 1);
        candidate := p_prefix || '-' || serial_code;

        BEGIN
            INSERT INTO public.service_entity_code_registry (service_code, entity_type, entity_id)
            VALUES (candidate, p_entity_type, p_entity_id);
            RETURN candidate;
        EXCEPTION
            WHEN unique_violation THEN
                SELECT registry.service_code
                  INTO existing_code
                  FROM public.service_entity_code_registry AS registry
                 WHERE registry.entity_type = p_entity_type
                   AND registry.entity_id = p_entity_id;
                IF existing_code IS NOT NULL THEN
                    RETURN existing_code;
                END IF;
        END;
    END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.allocate_service_entity_code(TEXT, TEXT, UUID)
    FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_service_listing_public_code ON public.service_listings;
UPDATE public.service_listings
   SET public_code = NULL
 WHERE public_code IS NOT NULL
   AND public_code !~ '^[A-Z]{2,4}-[A-Z0-9]{3}$';
UPDATE public.service_listings
   SET public_code = NULL
 WHERE (category = 'vehicle' AND public_code !~ '^CAR-[A-Z0-9]{3}$')
    OR (category = 'wifi' AND public_code !~ '^WIF-[A-Z0-9]{3}$')
    OR (category = 'coaching' AND public_code !~ '^COA-[A-Z0-9]{3}$')
    OR (category = 'bus' AND public_code !~ '^BUS-[A-Z0-9]{3}$');

INSERT INTO public.service_entity_code_registry (service_code, entity_type, entity_id)
SELECT listing.public_code, 'service_listings', listing.id
  FROM public.service_listings AS listing
 WHERE listing.public_code ~ '^[A-Z]{2,4}-[A-Z0-9]{3}$'
ON CONFLICT (entity_type, entity_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.assign_service_listing_public_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    code_prefix TEXT;
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.public_code IS NOT NULL THEN
        NEW.public_code := OLD.public_code;
        RETURN NEW;
    END IF;

    code_prefix := CASE LOWER(COALESCE(NEW.category, ''))
        WHEN 'vehicle' THEN 'CAR'
        WHEN 'wifi' THEN 'WIF'
        WHEN 'coaching' THEN 'COA'
        WHEN 'bus' THEN 'BUS'
        ELSE CASE
            WHEN LENGTH(REGEXP_REPLACE(UPPER(COALESCE(NEW.category, '')), '[^A-Z0-9]', '', 'g')) >= 2
            THEN LEFT(REGEXP_REPLACE(UPPER(COALESCE(NEW.category, '')), '[^A-Z0-9]', '', 'g'), 4)
            ELSE 'SRV'
        END
    END;

    NEW.public_code := public.allocate_service_entity_code(
        code_prefix,
        TG_TABLE_NAME,
        NEW.id
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_service_listing_public_code
BEFORE INSERT OR UPDATE OF public_code, category ON public.service_listings
FOR EACH ROW EXECUTE FUNCTION public.assign_service_listing_public_code();

UPDATE public.service_listings
   SET public_code = NULL
 WHERE public_code IS NULL;

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

    code_prefix := CASE TG_TABLE_NAME
        WHEN 'home_tutor_profiles' THEN 'HT'
        WHEN 'blood_donor_profiles' THEN 'BLD'
        WHEN 'tolet_listings' THEN 'TOL'
        WHEN 'staff_profiles' THEN CASE NEW.service_slug
            WHEN 'kajer-bua' THEN 'KBU'
            WHEN 'electrician' THEN 'ELC'
            WHEN 'plumber' THEN 'PLB'
            WHEN 'ac-fridge' THEN 'ACR'
            ELSE 'STF'
        END
        ELSE 'SRV'
    END;

    NEW.service_code := public.allocate_service_entity_code(
        code_prefix,
        TG_TABLE_NAME,
        NEW.id
    );
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.assign_service_listing_public_code()
    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.assign_profile_service_code()
    FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_home_tutor_service_code ON public.home_tutor_profiles;
CREATE TRIGGER trg_home_tutor_service_code
BEFORE INSERT OR UPDATE OF service_code ON public.home_tutor_profiles
FOR EACH ROW EXECUTE FUNCTION public.assign_profile_service_code();

DROP TRIGGER IF EXISTS trg_blood_donor_service_code ON public.blood_donor_profiles;
CREATE TRIGGER trg_blood_donor_service_code
BEFORE INSERT OR UPDATE OF service_code ON public.blood_donor_profiles
FOR EACH ROW EXECUTE FUNCTION public.assign_profile_service_code();

DROP TRIGGER IF EXISTS trg_tolet_service_code ON public.tolet_listings;
CREATE TRIGGER trg_tolet_service_code
BEFORE INSERT OR UPDATE OF service_code ON public.tolet_listings
FOR EACH ROW EXECUTE FUNCTION public.assign_profile_service_code();

DROP TRIGGER IF EXISTS trg_staff_service_code ON public.staff_profiles;
CREATE TRIGGER trg_staff_service_code
BEFORE INSERT OR UPDATE OF service_code ON public.staff_profiles
FOR EACH ROW EXECUTE FUNCTION public.assign_profile_service_code();

UPDATE public.home_tutor_profiles SET service_code = NULL WHERE service_code IS NULL;
UPDATE public.blood_donor_profiles SET service_code = NULL WHERE service_code IS NULL;
UPDATE public.tolet_listings SET service_code = NULL WHERE service_code IS NULL;
UPDATE public.staff_profiles SET service_code = NULL WHERE service_code IS NULL;

ALTER TABLE public.service_listings ALTER COLUMN public_code SET NOT NULL;
ALTER TABLE public.home_tutor_profiles ALTER COLUMN service_code SET NOT NULL;
ALTER TABLE public.blood_donor_profiles ALTER COLUMN service_code SET NOT NULL;
ALTER TABLE public.tolet_listings ALTER COLUMN service_code SET NOT NULL;
ALTER TABLE public.staff_profiles ALTER COLUMN service_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS service_listings_public_code_key
    ON public.service_listings (public_code);
CREATE UNIQUE INDEX IF NOT EXISTS home_tutor_profiles_service_code_key
    ON public.home_tutor_profiles (service_code);
CREATE UNIQUE INDEX IF NOT EXISTS blood_donor_profiles_service_code_key
    ON public.blood_donor_profiles (service_code);
CREATE UNIQUE INDEX IF NOT EXISTS tolet_listings_service_code_key
    ON public.tolet_listings (service_code);
CREATE UNIQUE INDEX IF NOT EXISTS staff_profiles_service_code_key
    ON public.staff_profiles (service_code);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
         WHERE conname = 'service_listings_public_code_format_check'
           AND conrelid = 'public.service_listings'::regclass
    ) THEN
        ALTER TABLE public.service_listings
            ADD CONSTRAINT service_listings_public_code_format_check
            CHECK (
                public_code ~ '^[A-Z]{2,4}-[A-Z0-9]{3}$'
                AND CASE category
                    WHEN 'vehicle' THEN public_code ~ '^CAR-[A-Z0-9]{3}$'
                    WHEN 'wifi' THEN public_code ~ '^WIF-[A-Z0-9]{3}$'
                    WHEN 'coaching' THEN public_code ~ '^COA-[A-Z0-9]{3}$'
                    WHEN 'bus' THEN public_code ~ '^BUS-[A-Z0-9]{3}$'
                    ELSE TRUE
                END
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
         WHERE conname = 'home_tutor_profiles_service_code_format_check'
           AND conrelid = 'public.home_tutor_profiles'::regclass
    ) THEN
        ALTER TABLE public.home_tutor_profiles
            ADD CONSTRAINT home_tutor_profiles_service_code_format_check
            CHECK (service_code ~ '^HT-[A-Z0-9]{3}$');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
         WHERE conname = 'blood_donor_profiles_service_code_format_check'
           AND conrelid = 'public.blood_donor_profiles'::regclass
    ) THEN
        ALTER TABLE public.blood_donor_profiles
            ADD CONSTRAINT blood_donor_profiles_service_code_format_check
            CHECK (service_code ~ '^BLD-[A-Z0-9]{3}$');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
         WHERE conname = 'tolet_listings_service_code_format_check'
           AND conrelid = 'public.tolet_listings'::regclass
    ) THEN
        ALTER TABLE public.tolet_listings
            ADD CONSTRAINT tolet_listings_service_code_format_check
            CHECK (service_code ~ '^TOL-[A-Z0-9]{3}$');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
         WHERE conname = 'staff_profiles_service_code_format_check'
           AND conrelid = 'public.staff_profiles'::regclass
    ) THEN
        ALTER TABLE public.staff_profiles
            ADD CONSTRAINT staff_profiles_service_code_format_check
            CHECK (service_code ~ '^(KBU|ELC|PLB|ACR)-[A-Z0-9]{3}$');
    END IF;
END;
$$;

DROP FUNCTION IF EXISTS public.fn_public_donor_directory(TEXT, TEXT, BOOLEAN);
CREATE FUNCTION public.fn_public_donor_directory(
    p_blood_group TEXT DEFAULT NULL,
    p_area_id TEXT DEFAULT NULL,
    p_available_only BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    id UUID,
    public_id TEXT,
    service_code TEXT,
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
        d.service_code,
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
        CASE
            WHEN auth.uid() IS NOT NULL AND d.is_available IS TRUE THEN d.private_phone
            ELSE NULL
        END
    FROM public.blood_donor_profiles AS d
    WHERE d.status = 'approved'
      AND (p_available_only IS FALSE OR d.is_available IS TRUE)
      AND (p_blood_group IS NULL OR p_blood_group = '' OR p_blood_group = 'all' OR d.blood_group = p_blood_group)
      AND (p_area_id IS NULL OR p_area_id = '' OR d.area_id = p_area_id)
    ORDER BY d.published_at DESC NULLS LAST, d.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.fn_public_donor_directory(TEXT, TEXT, BOOLEAN)
    TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.refresh_directory_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    listing_id_to_refresh UUID;
    listing_ids UUID[];
BEGIN
    IF TG_OP = 'DELETE' THEN
        listing_ids := ARRAY[OLD.listing_id];
    ELSIF TG_OP = 'UPDATE' AND OLD.listing_id IS DISTINCT FROM NEW.listing_id THEN
        listing_ids := ARRAY[OLD.listing_id, NEW.listing_id];
    ELSE
        listing_ids := ARRAY[NEW.listing_id];
    END IF;

    FOREACH listing_id_to_refresh IN ARRAY listing_ids LOOP
        PERFORM pg_advisory_xact_lock(
            hashtextextended(listing_id_to_refresh::TEXT, 0)
        );

        UPDATE public.service_listings AS listing
           SET rating_count = aggregate.count,
               rating_avg = aggregate.average
          FROM (
              SELECT
                  COUNT(*)::INTEGER AS count,
                  COALESCE(ROUND(AVG(review.rating)::NUMERIC, 2), 0)::NUMERIC(3,2) AS average
                FROM public.directory_reviews AS review
               WHERE review.listing_id = listing_id_to_refresh
                 AND review.is_published IS TRUE
          ) AS aggregate
         WHERE listing.id = listing_id_to_refresh;
    END LOOP;

    RETURN NULL;
END;
$$;

UPDATE public.service_listings AS listing
   SET rating_count = aggregate.count,
       rating_avg = aggregate.average
  FROM (
      SELECT
          listing_id,
          COUNT(*)::INTEGER AS count,
          COALESCE(ROUND(AVG(rating)::NUMERIC, 2), 0)::NUMERIC(3,2) AS average
        FROM public.directory_reviews
       WHERE is_published IS TRUE
       GROUP BY listing_id
  ) AS aggregate
 WHERE listing.id = aggregate.listing_id;

UPDATE public.service_listings AS listing
   SET rating_count = 0,
       rating_avg = 0
 WHERE listing.category IN ('wifi', 'coaching')
   AND NOT EXISTS (
       SELECT 1 FROM public.directory_reviews AS review
        WHERE review.listing_id = listing.id
          AND review.is_published IS TRUE
   );

NOTIFY pgrst, 'reload schema';
