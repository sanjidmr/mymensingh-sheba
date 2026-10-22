ALTER TABLE public.service_listings
    ADD COLUMN IF NOT EXISTS coaching_category TEXT;

ALTER TABLE public.service_listings
    DROP CONSTRAINT IF EXISTS service_listings_coaching_category_check;

ALTER TABLE public.service_listings
    ADD CONSTRAINT service_listings_coaching_category_check
    CHECK (
        coaching_category IS NULL
        OR coaching_category IN ('class_1_8', 'ssc', 'hsc', 'admission')
    );

-- Backfill only legacy tags with an unambiguous match. Unclassified legacy rows
-- stay intact and can be assigned a category when their owner next edits them.
UPDATE public.service_listings
SET coaching_category = CASE
    WHEN tags && ARRAY['admission', 'university-admission', 'university', 'competitive', 'government']::TEXT[]
        THEN 'admission'
    WHEN tags @> ARRAY['hsc']::TEXT[]
        THEN 'hsc'
    WHEN tags @> ARRAY['primary']::TEXT[]
        AND NOT (tags && ARRAY['secondary', 'hsc', 'alim', 'admission', 'university-admission', 'university', 'competitive', 'government']::TEXT[])
        THEN 'class_1_8'
    ELSE coaching_category
END
WHERE category = 'coaching'
  AND coaching_category IS NULL;

CREATE INDEX IF NOT EXISTS idx_service_listings_coaching_category
    ON public.service_listings (coaching_category)
    WHERE category = 'coaching';

CREATE OR REPLACE FUNCTION public.service_listings_guard_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NEW.category = 'coaching' THEN
        IF NEW.coaching_category IS NULL
           OR NEW.coaching_category NOT IN ('class_1_8', 'ssc', 'hsc', 'admission') THEN
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

DROP POLICY IF EXISTS "Users can delete their tutor profile" ON public.home_tutor_profiles;
CREATE POLICY "Users can delete their tutor profile"
ON public.home_tutor_profiles FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their donor profile" ON public.blood_donor_profiles;
CREATE POLICY "Users can delete their donor profile"
ON public.blood_donor_profiles FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
