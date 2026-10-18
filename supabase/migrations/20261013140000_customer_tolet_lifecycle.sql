CREATE OR REPLACE FUNCTION public.tolet_listings_owner_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF auth.uid() IS NULL OR public.is_admin() THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
        IF NEW.status IS NULL
           OR NEW.status NOT IN ('draft', 'pending_review', 'unavailable') THEN
            NEW.status := 'pending_review';
        END IF;
        NEW.is_verified := FALSE;
        NEW.rejection_reason := NULL;
        NEW.published_at := NULL;
    ELSE
        NEW.owner_id := OLD.owner_id;
        NEW.is_verified := OLD.is_verified;
        NEW.published_at := OLD.published_at;

        IF NEW.status IS DISTINCT FROM OLD.status
           AND NEW.status NOT IN ('draft', 'pending_review', 'archived', 'unavailable') THEN
            RAISE EXCEPTION 'Only an admin can move a listing to status %', NEW.status
                USING ERRCODE = '42501';
        END IF;

        IF OLD.status = 'archived' AND NEW.status = 'pending_review' THEN
            NEW.rejection_reason := NULL;
        ELSE
            NEW.rejection_reason := OLD.rejection_reason;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_set_my_tolet_visibility(
    p_listing_id UUID,
    p_action TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    listing public.tolet_listings%ROWTYPE;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'sign-in required';
    END IF;
    IF p_action NOT IN ('archive', 'restore') THEN
        RAISE EXCEPTION 'invalid lifecycle action';
    END IF;

    SELECT * INTO listing
    FROM public.tolet_listings
    WHERE id = p_listing_id AND owner_id = auth.uid()
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'listing not found';
    END IF;

    IF p_action = 'archive' THEN
        IF listing.status IN ('archived', 'suspended') THEN
            RAISE EXCEPTION 'listing cannot be removed from display in its current status';
        END IF;
        UPDATE public.tolet_listings SET status = 'archived'
        WHERE id = p_listing_id AND owner_id = auth.uid();
        RETURN 'archived';
    END IF;

    IF listing.status <> 'archived' THEN
        RAISE EXCEPTION 'only an archived listing can be restored';
    END IF;
    IF length(btrim(listing.title)) < 8
       OR listing.property_type NOT IN ('flat', 'room', 'sublet', 'family', 'bachelor', 'mess', 'hostel', 'seat')
       OR NULLIF(btrim(listing.area_id), '') IS NULL
       OR length(btrim(COALESCE(listing.specific_address, ''))) < 5
       OR listing.rent_price NOT BETWEEN 100 AND 500000
       OR (listing.property_type IN ('mess', 'hostel', 'seat') AND COALESCE(listing.total_rooms, 0) < 1)
       OR (listing.property_type NOT IN ('mess', 'hostel', 'seat') AND listing.bedrooms < 1)
        OR listing.bathrooms < 0
        OR listing.balconies < 0 THEN
        RAISE EXCEPTION 'listing details are incomplete; edit and save the listing before restoring';
    END IF;

    UPDATE public.tolet_listings SET status = 'pending_review'
    WHERE id = p_listing_id AND owner_id = auth.uid();
    RETURN 'pending_review';
END;
$$;

REVOKE ALL ON FUNCTION public.fn_set_my_tolet_visibility(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_set_my_tolet_visibility(UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.fn_delete_my_tolet_listing(p_listing_id UUID)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    listing_photos TEXT[];
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'sign-in required';
    END IF;

    SELECT photos INTO listing_photos
    FROM public.tolet_listings
    WHERE id = p_listing_id AND owner_id = auth.uid()
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'listing not found';
    END IF;

    DELETE FROM public.tolet_listing_events
    WHERE listing_id = p_listing_id::TEXT;

    DELETE FROM public.tolet_listings
    WHERE id = p_listing_id AND owner_id = auth.uid();

    RETURN COALESCE(listing_photos, ARRAY[]::TEXT[]);
END;
$$;

REVOKE ALL ON FUNCTION public.fn_delete_my_tolet_listing(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_delete_my_tolet_listing(UUID) TO authenticated;
