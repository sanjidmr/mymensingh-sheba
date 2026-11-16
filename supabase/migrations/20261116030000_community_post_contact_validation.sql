ALTER TABLE public.community_posts
    ADD COLUMN IF NOT EXISTS author_phone TEXT;

ALTER TABLE public.community_posts
    ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

ALTER TABLE public.community_posts
    ADD COLUMN IF NOT EXISTS marketplace_status TEXT;

UPDATE public.community_posts
SET marketplace_status = 'available'
WHERE kind = 'buy_sell' AND marketplace_status IS NULL;

CREATE OR REPLACE FUNCTION public.normalize_bd_mobile(p_phone TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
DECLARE
    compact_phone TEXT;
BEGIN
    IF p_phone IS NULL THEN
        RETURN NULL;
    END IF;

    compact_phone := regexp_replace(
        translate(p_phone, '০১২৩৪৫৬৭৮৯', '0123456789'),
        '[[:space:]().-]',
        '',
        'g'
    );

    IF compact_phone ~ '^01[3-9][0-9]{8}$' THEN
        RETURN compact_phone;
    ELSIF compact_phone ~ '^8801[3-9][0-9]{8}$' THEN
        RETURN '0' || substr(compact_phone, 4);
    ELSIF compact_phone ~ '^\+8801[3-9][0-9]{8}$' THEN
        RETURN '0' || substr(compact_phone, 5);
    ELSIF compact_phone ~ '^008801[3-9][0-9]{8}$' THEN
        RETURN '0' || substr(compact_phone, 6);
    END IF;

    RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.normalize_bd_mobile(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.normalize_bd_mobile(TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.validate_community_post_contacts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    should_validate BOOLEAN;
    normalized_phone TEXT;
    normalized_whatsapp TEXT;
BEGIN
    IF NEW.kind = 'buy_sell' AND NEW.marketplace_status IS NULL THEN
        NEW.marketplace_status := 'available';
    END IF;

    IF TG_OP = 'INSERT' THEN
        should_validate := TRUE;
    ELSE
        should_validate :=
            NEW.kind IS DISTINCT FROM OLD.kind
            OR NEW.author_phone IS DISTINCT FROM OLD.author_phone
            OR NEW.whatsapp_number IS DISTINCT FROM OLD.whatsapp_number
            OR (
                NEW.status = 'approved'
                AND OLD.status IS DISTINCT FROM 'approved'
            );
    END IF;

    IF NOT should_validate OR NEW.kind NOT IN ('job', 'buy_sell') THEN
        RETURN NEW;
    END IF;

    normalized_phone := public.normalize_bd_mobile(NEW.author_phone);
    IF normalized_phone IS NULL THEN
        RAISE EXCEPTION USING
            ERRCODE = '23514',
            CONSTRAINT = 'community_posts_contact_phone_required',
            MESSAGE = 'সঠিক বাংলাদেশি যোগাযোগের মোবাইল নম্বর দিতে হবে।';
    END IF;

    normalized_whatsapp := public.normalize_bd_mobile(NEW.whatsapp_number);
    IF NULLIF(BTRIM(NEW.whatsapp_number), '') IS NULL THEN
        normalized_whatsapp := normalized_phone;
    ELSIF normalized_whatsapp IS NULL THEN
        RAISE EXCEPTION USING
            ERRCODE = '23514',
            CONSTRAINT = 'community_posts_whatsapp_number_valid',
            MESSAGE = 'সঠিক বাংলাদেশি হোয়াটসঅ্যাপ নম্বর দিন।';
    END IF;

    NEW.author_phone := normalized_phone;
    NEW.whatsapp_number := normalized_whatsapp;
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_community_post_contacts() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_community_posts_validate_contacts ON public.community_posts;
CREATE TRIGGER trg_community_posts_validate_contacts
BEFORE INSERT OR UPDATE OF kind, status, marketplace_status, author_phone, whatsapp_number
ON public.community_posts
FOR EACH ROW
EXECUTE FUNCTION public.validate_community_post_contacts();

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
    SELECT
        p.id,
        p.author_name,
        public.normalize_bd_mobile(p.author_phone),
        COALESCE(
            public.normalize_bd_mobile(p.whatsapp_number),
            public.normalize_bd_mobile(p.author_phone)
        )
    FROM public.community_posts AS p
    WHERE p.slug = p_slug
      AND p.status = 'approved'
      AND (
          p.kind = 'job'
          OR (p.kind = 'buy_sell' AND p.marketplace_status = 'available')
      )
      AND (
          public.normalize_bd_mobile(p.author_phone) IS NOT NULL
          OR public.normalize_bd_mobile(p.whatsapp_number) IS NOT NULL
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
    SELECT
        p.slug,
        public.normalize_bd_mobile(p.author_phone),
        COALESCE(
            public.normalize_bd_mobile(p.whatsapp_number),
            public.normalize_bd_mobile(p.author_phone)
        )
    FROM public.community_posts AS p
    WHERE p.slug = ANY(COALESCE(p_slugs, ARRAY[]::TEXT[]))
      AND p.status = 'approved'
      AND (
          p.kind = 'job'
          OR (p.kind = 'buy_sell' AND p.marketplace_status = 'available')
      )
      AND (
          public.normalize_bd_mobile(p.author_phone) IS NOT NULL
          OR public.normalize_bd_mobile(p.whatsapp_number) IS NOT NULL
      );
$$;

COMMENT ON FUNCTION public.fetch_market_contact(TEXT) IS
    'Public contact for approved jobs and available approved buy_sell posts only.';
COMMENT ON FUNCTION public.fetch_public_community_post_contacts(TEXT[]) IS
    'Public contacts for approved jobs and available approved buy_sell posts only.';

REVOKE ALL ON FUNCTION public.fetch_market_contact(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fetch_market_contact(TEXT) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.fetch_public_community_post_contacts(TEXT[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fetch_public_community_post_contacts(TEXT[]) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
