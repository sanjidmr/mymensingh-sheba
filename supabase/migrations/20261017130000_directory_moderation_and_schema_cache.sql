-- Reconcile the directory columns already defined by
-- 20261015120000_vehicle_booking_estimates.sql on databases where the older
-- migration was applied incompletely. These are existing vehicle fields, not
-- new catalog attributes.
ALTER TABLE public.service_listings
    ADD COLUMN IF NOT EXISTS rate_per_km NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS minimum_fare NUMERIC(12, 2),
    ADD COLUMN IF NOT EXISTS additional_fee NUMERIC(12, 2),
    ADD COLUMN IF NOT EXISTS additional_fee_note_bn TEXT,
    ADD COLUMN IF NOT EXISTS available_facilities TEXT[] NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS unavailable_facilities TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE public.service_listings
    ADD COLUMN IF NOT EXISTS travel_days TEXT[] NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS stops_bn TEXT[] NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS journey_duration_bn TEXT;

-- Any owner edit (including a child record update) goes back through
-- moderation. Owners cannot preserve a rejection reason or publication date
-- while resubmitting their changes.
CREATE OR REPLACE FUNCTION public.service_listings_guard_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF auth.uid() IS NULL OR public.is_admin() THEN
        RETURN NEW;
    END IF;

    IF NEW.category NOT IN ('coaching', 'wifi') THEN
        RAISE EXCEPTION 'customers may only create coaching or wifi listings';
    END IF;

    IF TG_OP = 'INSERT' THEN
        NEW.owner_id := auth.uid();
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

CREATE OR REPLACE FUNCTION public.reapprove_service_listing_child_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    listing_key UUID;
    listing_owner UUID;
BEGIN
    IF auth.uid() IS NULL OR public.is_admin() THEN
        IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
        RETURN NEW;
    END IF;

    listing_key := CASE WHEN TG_OP = 'DELETE' THEN OLD.listing_id ELSE NEW.listing_id END;
    SELECT owner_id INTO listing_owner
    FROM public.service_listings
    WHERE id = listing_key;

    IF listing_owner = auth.uid() THEN
        UPDATE public.service_listings
        SET status = 'pending',
            rejection_reason = NULL,
            published_at = NULL
        WHERE id = listing_key;
    END IF;

    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reapprove_listing_after_teacher_change ON public.coaching_teachers;
CREATE TRIGGER trg_reapprove_listing_after_teacher_change
AFTER INSERT OR UPDATE OR DELETE ON public.coaching_teachers
FOR EACH ROW EXECUTE FUNCTION public.reapprove_service_listing_child_change();

DROP TRIGGER IF EXISTS trg_reapprove_listing_after_batch_change ON public.coaching_batches;
CREATE TRIGGER trg_reapprove_listing_after_batch_change
AFTER INSERT OR UPDATE OR DELETE ON public.coaching_batches
FOR EACH ROW EXECUTE FUNCTION public.reapprove_service_listing_child_change();

DROP TRIGGER IF EXISTS trg_reapprove_listing_after_package_change ON public.wifi_packages;
CREATE TRIGGER trg_reapprove_listing_after_package_change
AFTER INSERT OR UPDATE OR DELETE ON public.wifi_packages
FOR EACH ROW EXECUTE FUNCTION public.reapprove_service_listing_child_change();

-- PostgREST embeds columns of RETURNS SETOF public.service_listings in its
-- cached composite result; reload after reconciling that table's row type.
NOTIFY pgrst, 'reload schema';
