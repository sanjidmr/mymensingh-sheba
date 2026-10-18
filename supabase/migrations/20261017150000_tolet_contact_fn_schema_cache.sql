-- Repair for: "Could not find the function
-- public.fn_public_tolet_listing_contacts(p_listing_ids) in the schema cache".
--
-- The function was introduced by 20261014110000_tolet_contact_and_listing_analytics.sql,
-- but databases where that migration was never applied (or where PostgREST kept a
-- stale schema cache) reject the public listing-contact RPC, which used to blank
-- the whole To-Let directory. Recreate the function defensively and force a
-- PostgREST reload so the RPC resolves again.
--
-- DROP + CREATE (rather than CREATE OR REPLACE) guarantees the parameter name is
-- exactly p_listing_ids: PostgREST dispatches on argument names from the payload,
-- and CREATE OR REPLACE cannot rename an existing input parameter.
DROP FUNCTION IF EXISTS public.fn_public_tolet_listing_contacts(UUID[]);

CREATE FUNCTION public.fn_public_tolet_listing_contacts(p_listing_ids UUID[])
RETURNS TABLE (listing_id UUID, phone TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT l.id, p.phone
    FROM public.tolet_listings l
    JOIN public.profiles p ON p.id = l.owner_id
    WHERE l.id = ANY(COALESCE(p_listing_ids, ARRAY[]::UUID[]))
      AND l.status = 'approved'
      AND NULLIF(BTRIM(p.phone), '') IS NOT NULL;
$$;

-- Phone numbers are released only for approved listings, never through the
-- profiles table policies themselves.
REVOKE ALL ON FUNCTION public.fn_public_tolet_listing_contacts(UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_public_tolet_listing_contacts(UUID[]) TO anon, authenticated;

COMMENT ON FUNCTION public.fn_public_tolet_listing_contacts(UUID[]) IS
    'Public lookup of owner contact phones, restricted to approved To-Let listings.';

-- Make PostgREST pick the function up immediately instead of waiting for its
-- next schema-cache refresh.
NOTIFY pgrst, 'reload schema';
