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
    WHERE p.slug = p_slug
      AND p.status = 'approved'
      AND (
          p.kind = 'job'
          OR (p.kind = 'buy_sell' AND p.marketplace_status = 'available')
      )
      AND (
          NULLIF(BTRIM(p.author_phone), '') IS NOT NULL
          OR NULLIF(BTRIM(p.whatsapp_number), '') IS NOT NULL
      )
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.fetch_public_community_post_contacts(p_slugs TEXT[])
RETURNS TABLE (
    slug TEXT,
    author_phone TEXT,
    whatsapp_number TEXT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
    SELECT p.slug, p.author_phone, p.whatsapp_number
    FROM public.community_posts AS p
    WHERE p.slug = ANY(COALESCE(p_slugs, ARRAY[]::TEXT[]))
      AND p.status = 'approved'
      AND (
          p.kind = 'job'
          OR (p.kind = 'buy_sell' AND p.marketplace_status = 'available')
      )
      AND (
          NULLIF(BTRIM(p.author_phone), '') IS NOT NULL
          OR NULLIF(BTRIM(p.whatsapp_number), '') IS NOT NULL
      );
$$;

REVOKE ALL ON FUNCTION public.fetch_market_contact(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fetch_market_contact(TEXT) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.fetch_public_community_post_contacts(TEXT[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fetch_public_community_post_contacts(TEXT[]) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
