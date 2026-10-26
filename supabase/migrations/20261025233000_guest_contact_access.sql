-- Guests can browse donor and marketplace listings, but contact details are
-- released only to authenticated visitors.
CREATE OR REPLACE FUNCTION public.fn_public_donor_directory(
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
        CASE WHEN auth.uid() IS NOT NULL THEN d.private_phone ELSE NULL END
    FROM public.blood_donor_profiles AS d
    WHERE d.status = 'approved'
      AND d.is_available IS TRUE
      AND (p_blood_group IS NULL OR p_blood_group = '' OR p_blood_group = 'all' OR d.blood_group = p_blood_group)
      AND (p_area_id IS NULL OR p_area_id = '' OR d.area_id = p_area_id)
    ORDER BY d.published_at DESC NULLS LAST, d.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.fn_public_donor_directory(TEXT, TEXT, BOOLEAN)
    TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.fetch_market_contact(p_slug TEXT)
RETURNS TABLE (
    post_id UUID,
    author_name TEXT,
    author_phone TEXT,
    whatsapp_number TEXT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
    SELECT p.id, p.author_name, p.author_phone, p.whatsapp_number
    FROM public.community_posts AS p
    WHERE auth.uid() IS NOT NULL
      AND p.slug = p_slug
      AND p.kind = 'buy_sell'
      AND p.status = 'approved'
      AND p.marketplace_status = 'available'
    LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.fetch_market_contact(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fetch_market_contact(TEXT) TO authenticated;

REVOKE SELECT (contact_phone_public)
    ON public.service_listings FROM anon;
GRANT SELECT (contact_phone_public)
    ON public.service_listings TO authenticated;

CREATE OR REPLACE FUNCTION public.fn_authenticated_service_listing_contact(
    p_category TEXT,
    p_slug TEXT
)
RETURNS TABLE (contact_phone_public TEXT)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
    SELECT listing.contact_phone_public
    FROM public.service_listings AS listing
    WHERE auth.uid() IS NOT NULL
      AND p_category IN ('coaching', 'wifi')
      AND listing.category = p_category
      AND listing.slug = p_slug
      AND listing.is_active IS TRUE
      AND listing.status = 'approved'
      AND NULLIF(BTRIM(listing.contact_phone_public), '') IS NOT NULL
    LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.fn_authenticated_service_listing_contact(TEXT, TEXT)
    FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_authenticated_service_listing_contact(TEXT, TEXT)
    TO authenticated;

NOTIFY pgrst, 'reload schema';
