ALTER TABLE public.service_listings
    DROP CONSTRAINT IF EXISTS service_listings_coaching_category_check;

ALTER TABLE public.service_listings
    ADD CONSTRAINT service_listings_coaching_category_check
    CHECK (
        coaching_category IS NULL
        OR coaching_category IN ('class_1_8', 'ssc', 'hsc', 'bba', 'admission')
    );

CREATE OR REPLACE FUNCTION public.service_listings_guard_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NEW.category = 'coaching' THEN
        IF NEW.coaching_category IS NULL
           OR NEW.coaching_category NOT IN ('class_1_8', 'ssc', 'hsc', 'bba', 'admission') THEN
            RAISE EXCEPTION 'a valid coaching category is required';
        END IF;
        IF cardinality(COALESCE(NEW.area_ids, ARRAY[]::TEXT[])) = 0
           OR EXISTS (
               SELECT 1
               FROM unnest(NEW.area_ids) AS area(area_id)
               WHERE btrim(area.area_id) = ''
           ) THEN
            RAISE EXCEPTION 'at least one coaching area is required';
        END IF;
    END IF;

    IF auth.uid() IS NULL OR public.is_admin() THEN
        RETURN NEW;
    END IF;

    IF NEW.category NOT IN ('coaching', 'wifi') THEN
        RAISE EXCEPTION 'customers may only create coaching or wifi listings';
    END IF;

    IF TG_OP = 'INSERT' THEN
        NEW.owner_id := auth.uid();
        PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::TEXT || ':' || NEW.category, 0));
        IF EXISTS (
            SELECT 1
            FROM public.service_listings AS existing
            WHERE existing.owner_id = NEW.owner_id
              AND existing.category = NEW.category
        ) THEN
            RAISE EXCEPTION 'a service profile for this category already exists';
        END IF;
        NEW.status := CASE WHEN NEW.status = 'draft' THEN 'draft' ELSE 'pending' END;
        NEW.is_active := TRUE;
    ELSE
        NEW.owner_id := OLD.owner_id;
        NEW.status := CASE WHEN NEW.status = 'draft' THEN 'draft' ELSE 'pending' END;
        NEW.is_active := OLD.is_active;
    END IF;

    NEW.rejection_reason := NULL;
    NEW.published_at := NULL;
    NEW.is_featured := FALSE;
    NEW.contact_phone_private := NULL;
    RETURN NEW;
END;
$$;

ALTER TABLE public.coaching_batches
    ADD COLUMN IF NOT EXISTS batch_year INTEGER,
    ADD COLUMN IF NOT EXISTS batch_status TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.coaching_batches'::regclass
          AND conname = 'coaching_batches_batch_year_valid'
    ) THEN
        ALTER TABLE public.coaching_batches
            ADD CONSTRAINT coaching_batches_batch_year_valid
            CHECK (batch_year IS NULL OR batch_year BETWEEN 2027 AND 2100) NOT VALID;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.coaching_batches'::regclass
          AND conname = 'coaching_batches_batch_status_valid'
    ) THEN
        ALTER TABLE public.coaching_batches
            ADD CONSTRAINT coaching_batches_batch_status_valid
            CHECK (batch_status IS NULL OR batch_status IN ('new', 'old')) NOT VALID;
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_coaching_batches_active_year
    ON public.coaching_batches (batch_year, listing_id)
    WHERE is_active = TRUE AND batch_year IS NOT NULL;

NOTIFY pgrst, 'reload schema';
