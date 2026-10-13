-- The `storage` schema is intentionally not exposed through PostgREST.
-- Provide a narrowly-scoped, paginated admin read instead of exposing that
-- internal schema or attempting to query it from the public API schema.
CREATE OR REPLACE FUNCTION public.fn_admin_media_page(
    p_bucket TEXT DEFAULT NULL,
    p_search TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
DECLARE
    total_count BIGINT;
    page_items JSONB;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'admin only';
    END IF;

    IF p_bucket IS NOT NULL
       AND p_bucket NOT IN ('site', 'listings', 'staff', 'avatars', 'documents', 'posts', 'support-attachments') THEN
        RAISE EXCEPTION 'invalid media bucket';
    END IF;
    IF p_limit IS NULL OR p_limit < 1 OR p_limit > 100
       OR p_offset IS NULL OR p_offset < 0 OR p_offset > 1000000 THEN
        RAISE EXCEPTION 'invalid media pagination';
    END IF;
    IF p_search IS NOT NULL AND length(p_search) > 200 THEN
        RAISE EXCEPTION 'media search is too long';
    END IF;

    SELECT COUNT(*)
    INTO total_count
    FROM storage.objects AS o
    WHERE o.bucket_id IN ('site', 'listings', 'staff', 'avatars', 'documents', 'posts', 'support-attachments')
      AND (p_bucket IS NULL OR o.bucket_id = p_bucket)
      AND (NULLIF(BTRIM(p_search), '') IS NULL OR o.name ILIKE '%' || BTRIM(p_search) || '%');

    SELECT COALESCE(
        JSONB_AGG(
            JSONB_BUILD_OBJECT(
                'id', page.id,
                'name', page.name,
                'bucket_id', page.bucket_id,
                'metadata', JSONB_STRIP_NULLS(JSONB_BUILD_OBJECT(
                    'size', page.metadata -> 'size',
                    'mimetype', page.metadata -> 'mimetype'
                )),
                'created_at', page.created_at
            )
            ORDER BY page.created_at DESC, page.id DESC
        ),
        '[]'::JSONB
    )
    INTO page_items
    FROM (
        SELECT o.id, o.name, o.bucket_id, o.metadata, o.created_at
        FROM storage.objects AS o
        WHERE o.bucket_id IN ('site', 'listings', 'staff', 'avatars', 'documents', 'posts', 'support-attachments')
          AND (p_bucket IS NULL OR o.bucket_id = p_bucket)
          AND (NULLIF(BTRIM(p_search), '') IS NULL OR o.name ILIKE '%' || BTRIM(p_search) || '%')
        ORDER BY o.created_at DESC, o.id DESC
        LIMIT p_limit
        OFFSET p_offset
    ) AS page;

    RETURN JSONB_BUILD_OBJECT('items', page_items, 'total', total_count);
END;
$$;

REVOKE ALL ON FUNCTION public.fn_admin_media_page(TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_admin_media_page(TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
