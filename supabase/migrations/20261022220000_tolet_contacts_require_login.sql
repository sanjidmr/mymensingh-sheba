-- Release rental-owner phone numbers only to authenticated visitors.
-- The client also omits contact lookup for guests, but this RPC check is the
-- security boundary because a caller can invoke PostgREST directly.
CREATE OR REPLACE FUNCTION public.fn_public_tolet_listing_contacts(p_listing_ids UUID[])
RETURNS TABLE (listing_id UUID, phone TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT l.id, p.phone
    FROM public.tolet_listings l
    JOIN public.profiles p ON p.id = l.owner_id
    WHERE auth.uid() IS NOT NULL
      AND l.id = ANY(COALESCE(p_listing_ids, ARRAY[]::UUID[]))
      AND l.status = 'approved'
      AND NULLIF(BTRIM(p.phone), '') IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.fn_public_tolet_listing_contacts(UUID[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_public_tolet_listing_contacts(UUID[]) TO authenticated;

COMMENT ON FUNCTION public.fn_public_tolet_listing_contacts(UUID[]) IS
    'Returns contact phones for approved To-Let listings to authenticated visitors only.';

NOTIFY pgrst, 'reload schema';
