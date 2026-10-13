ALTER TABLE public.community_posts
    ADD COLUMN IF NOT EXISTS marketplace_status TEXT;

UPDATE public.community_posts
SET marketplace_status = 'available'
WHERE kind = 'buy_sell' AND marketplace_status IS NULL;

UPDATE public.community_posts
SET marketplace_status = NULL
WHERE kind <> 'buy_sell';

ALTER TABLE public.community_posts
    DROP CONSTRAINT IF EXISTS community_posts_marketplace_status_check;
ALTER TABLE public.community_posts
    ADD CONSTRAINT community_posts_marketplace_status_check
    CHECK (
        (kind = 'buy_sell' AND marketplace_status IN ('available', 'sold', 'closed'))
        OR (kind <> 'buy_sell' AND marketplace_status IS NULL)
    );

DROP POLICY IF EXISTS "Approved community posts are public" ON public.community_posts;
CREATE POLICY "Approved community posts are public"
ON public.community_posts FOR SELECT
TO anon, authenticated
USING (
    status = 'approved'
    AND (kind <> 'buy_sell' OR marketplace_status = 'available')
    AND (
        kind <> 'job'
        OR deadline IS NULL
        OR deadline >= (TIMEZONE('Asia/Dhaka', NOW()))::DATE
    )
);

CREATE OR REPLACE FUNCTION public.community_posts_guard_moderation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF auth.uid() IS NULL OR public.is_admin() THEN
        IF TG_OP = 'INSERT' THEN
            NEW.marketplace_status := CASE
                WHEN NEW.kind = 'buy_sell' THEN COALESCE(NEW.marketplace_status, 'available')
                ELSE NULL
            END;
        END IF;
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
        NEW.author_id := auth.uid();
        NEW.status := 'pending';
        NEW.is_featured := FALSE;
        NEW.published_at := NULL;
        NEW.rejection_reason := NULL;
        NEW.marketplace_status := CASE WHEN NEW.kind = 'buy_sell' THEN 'available' ELSE NULL END;
    ELSE
        IF OLD.kind = 'buy_sell'
           AND OLD.status = 'approved'
           AND NEW.status = OLD.status
           AND NEW.author_id = OLD.author_id
           AND NEW.kind = OLD.kind
           AND NEW.marketplace_status IN ('available', 'sold', 'closed')
           AND (to_jsonb(NEW) - 'marketplace_status' - 'updated_at')
               = (to_jsonb(OLD) - 'marketplace_status' - 'updated_at') THEN
            RETURN NEW;
        END IF;

        NEW.author_id := OLD.author_id;
        NEW.status := 'pending';
        NEW.is_featured := OLD.is_featured;
        NEW.published_at := OLD.published_at;
        NEW.rejection_reason := OLD.rejection_reason;
        NEW.marketplace_status := OLD.marketplace_status;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_set_my_marketplace_status(
    p_id UUID,
    p_status TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    updated_status TEXT;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'sign-in required';
    END IF;
    IF p_status NOT IN ('available', 'sold', 'closed') THEN
        RAISE EXCEPTION 'invalid marketplace status';
    END IF;

    UPDATE public.community_posts
    SET marketplace_status = p_status,
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = p_id
      AND author_id = auth.uid()
      AND kind = 'buy_sell'
      AND status = 'approved'
    RETURNING marketplace_status INTO updated_status;

    IF updated_status IS NULL THEN
        RAISE EXCEPTION 'marketplace post not found or not approved';
    END IF;
    RETURN updated_status;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_set_my_marketplace_status(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_set_my_marketplace_status(UUID, TEXT) TO authenticated;

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
    FROM public.community_posts p
    WHERE p.slug = p_slug
      AND p.kind = 'buy_sell'
      AND p.status = 'approved'
      AND p.marketplace_status = 'available'
    LIMIT 1;
$$;

COMMENT ON FUNCTION public.fetch_market_contact(TEXT) IS
    'Seller contact for an approved and available buy_sell post only.';
