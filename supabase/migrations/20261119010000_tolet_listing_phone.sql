-- Back up the database before applying. The rollback note below is schema-only;
-- restore the backup to recover original phone strings and listing statuses.
ALTER TABLE public.tolet_listings
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS needs_phone BOOLEAN NOT NULL DEFAULT FALSE;

CREATE OR REPLACE FUNCTION public.validate_tolet_listing_contact_phone()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  normalized_phone TEXT;
BEGIN
  IF auth.uid() IS NOT NULL AND public.is_admin() IS NOT TRUE THEN
    NEW.needs_phone := FALSE;
  END IF;

  normalized_phone := public.normalize_bd_mobile(NEW.contact_phone);
  IF normalized_phone IS NULL THEN
    IF NEW.needs_phone IS TRUE AND NEW.status <> 'approved' AND auth.uid() IS NULL THEN
      NEW.contact_phone := NULL;
      RETURN NEW;
    END IF;
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      CONSTRAINT = 'tolet_listings_contact_phone_required',
      MESSAGE = 'ফোন নম্বর দেওয়া বাধ্যতামূলক। সঠিক বাংলাদেশি মোবাইল নম্বর দিন।';
  END IF;

  NEW.contact_phone := normalized_phone;
  NEW.needs_phone := FALSE;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_tolet_listing_contact_phone()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_tolet_listing_validate_contact_phone
  ON public.tolet_listings;
CREATE TRIGGER trg_tolet_listing_validate_contact_phone
BEFORE INSERT OR UPDATE OF contact_phone, status, needs_phone
ON public.tolet_listings
FOR EACH ROW
EXECUTE FUNCTION public.validate_tolet_listing_contact_phone();

DO $$
DECLARE
  affected_listings INTEGER;
BEGIN
  SELECT count(*) INTO affected_listings
  FROM public.tolet_listings AS listing
  LEFT JOIN public.profiles AS profile ON profile.id = listing.owner_id
  WHERE COALESCE(
    public.normalize_bd_mobile(listing.contact_phone),
    public.normalize_bd_mobile(profile.phone)
  ) IS NULL;

  RAISE NOTICE 'Before phone recovery: Basha Vara listings=%', affected_listings;

  UPDATE public.tolet_listings AS listing
  SET contact_phone = COALESCE(
        public.normalize_bd_mobile(listing.contact_phone),
        public.normalize_bd_mobile(profile.phone)
      ),
      needs_phone = COALESCE(
        public.normalize_bd_mobile(listing.contact_phone),
        public.normalize_bd_mobile(profile.phone)
      ) IS NULL,
      status = CASE
        WHEN COALESCE(
          public.normalize_bd_mobile(listing.contact_phone),
          public.normalize_bd_mobile(profile.phone)
        ) IS NULL AND listing.status = 'approved'
          THEN 'pending_review'
        ELSE listing.status
      END,
      published_at = CASE
        WHEN COALESCE(
          public.normalize_bd_mobile(listing.contact_phone),
          public.normalize_bd_mobile(profile.phone)
        ) IS NULL
          THEN NULL
        ELSE listing.published_at
      END
  FROM public.profiles AS profile
  WHERE profile.id = listing.owner_id;

  RAISE NOTICE 'After phone recovery: Basha Vara listings=%',
    (SELECT count(*) FROM public.tolet_listings WHERE needs_phone IS TRUE);
END
$$;

ALTER TABLE public.tolet_listings
  DROP CONSTRAINT IF EXISTS tolet_listings_contact_phone_required;
ALTER TABLE public.tolet_listings
  ADD CONSTRAINT tolet_listings_contact_phone_required
  CHECK (
    (needs_phone IS TRUE AND status <> 'approved')
    OR public.normalize_bd_mobile(contact_phone) IS NOT NULL
  );

-- Keep contact_phone out of anonymous table reads; public pages use the
-- approved-listing contact RPC instead.
REVOKE SELECT ON TABLE public.tolet_listings FROM PUBLIC, anon;
GRANT SELECT (
  id, owner_id, title, property_type, area_id, specific_address, rent_price,
  bedrooms, bathrooms, balconies, has_drawing_room, has_dining_room,
  total_rooms, floor, available_from, facilities, unavailable_facilities,
  description, photos, status, rejection_reason, is_verified, created_at,
  updated_at, published_at, service_code, needs_phone
) ON TABLE public.tolet_listings TO anon;
GRANT SELECT (contact_phone) ON TABLE public.tolet_listings TO authenticated;

CREATE OR REPLACE FUNCTION public.fn_public_tolet_listing_contacts(p_listing_ids UUID[])
RETURNS TABLE (listing_id UUID, phone TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT listing.id, listing.contact_phone
  FROM public.tolet_listings AS listing
  WHERE auth.uid() IS NOT NULL
    AND listing.id = ANY(COALESCE(p_listing_ids, ARRAY[]::UUID[]))
    AND listing.needs_phone IS FALSE
    AND public.normalize_bd_mobile(listing.contact_phone) IS NOT NULL
    AND (
      listing.status = 'approved'
      OR listing.owner_id = auth.uid()
    );
$$;

REVOKE ALL ON FUNCTION public.fn_public_tolet_listing_contacts(UUID[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_public_tolet_listing_contacts(UUID[]) TO authenticated;

COMMENT ON FUNCTION public.fn_public_tolet_listing_contacts(UUID[]) IS
  'Returns normalized phones for approved rentals to authenticated viewers and any owned listing to its owner.';

NOTIFY pgrst, 'reload schema';

-- Rollback: restore the database backup, or restore the prior contact
-- RPC/grants before dropping the constraint, trigger, function, and columns.
