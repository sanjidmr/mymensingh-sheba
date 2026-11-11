-- Website media is deliberately isolated from customer uploads and private
-- documents. Public image delivery stays in Storage; admin-only metadata lives
-- here so names, search, replacement and deletion checks survive page sessions.
CREATE TABLE IF NOT EXISTS public.site_media (
    object_path TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    mime_type TEXT NOT NULL
        CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp', 'image/avif')),
    size_bytes BIGINT NOT NULL CHECK (size_bytes >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_site_media_created_at
    ON public.site_media (created_at DESC, object_path);

ALTER TABLE public.site_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read website media records" ON public.site_media;
CREATE POLICY "Admins read website media records"
    ON public.site_media FOR SELECT TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "Admins create website media records" ON public.site_media;
CREATE POLICY "Admins create website media records"
    ON public.site_media FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins update website media records" ON public.site_media;
CREATE POLICY "Admins update website media records"
    ON public.site_media FOR UPDATE TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins delete website media records" ON public.site_media;
CREATE POLICY "Admins delete website media records"
    ON public.site_media FOR DELETE TO authenticated
    USING (public.is_admin());

REVOKE ALL ON public.site_media FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_media TO authenticated;

-- Register existing website images without changing any object or public URL.
INSERT INTO public.site_media (object_path, display_name, mime_type, size_bytes, created_at, updated_at)
SELECT
    o.name,
    COALESCE(NULLIF(split_part(o.name, '/', -1), ''), o.name),
    COALESCE(o.metadata ->> 'mimetype', 'application/octet-stream'),
    CASE WHEN (o.metadata ->> 'size') ~ '^[0-9]+$'
        THEN (o.metadata ->> 'size')::BIGINT
        ELSE 0
    END,
    o.created_at,
    o.updated_at
FROM storage.objects AS o
WHERE o.bucket_id = 'site'
  AND o.metadata ->> 'mimetype' IN ('image/jpeg', 'image/png', 'image/webp', 'image/avif')
ON CONFLICT (object_path) DO NOTHING;

-- Do not impose an application-level upload size limit here. Supabase Storage
-- still enforces the project-wide maximum; NULL uses that configured maximum.
UPDATE storage.buckets
SET public = TRUE,
    file_size_limit = NULL,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
WHERE id = 'site';

DROP POLICY IF EXISTS "Admins can upload site media" ON storage.objects;
CREATE POLICY "Admins can upload site media"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'site'
        AND public.is_admin()
        AND metadata ->> 'mimetype' IN ('image/jpeg', 'image/png', 'image/webp', 'image/avif')
    );

DROP POLICY IF EXISTS "Admins can update site media" ON storage.objects;
CREATE POLICY "Admins can update site media"
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'site' AND public.is_admin())
    WITH CHECK (
        bucket_id = 'site'
        AND public.is_admin()
        AND metadata ->> 'mimetype' IN ('image/jpeg', 'image/png', 'image/webp', 'image/avif')
    );

-- Captions are supplementary. Older rows remain intact; new image-only slides
-- use an empty caption, which the public carousel renders without a text layer.
ALTER TABLE public.hero_slides
    ALTER COLUMN caption_bn DROP NOT NULL;
ALTER TABLE public.hero_slides
    ALTER COLUMN caption_bn SET DEFAULT '';
ALTER TABLE public.hero_slides
    DROP CONSTRAINT IF EXISTS hero_slides_caption_bn_check;
ALTER TABLE public.hero_slides
    ADD CONSTRAINT hero_slides_caption_bn_check
    CHECK (caption_bn IS NULL OR length(trim(caption_bn)) <= 1000);

ALTER TABLE public.hero_slides
    ADD COLUMN IF NOT EXISTS title_bn TEXT,
    ADD COLUMN IF NOT EXISTS subtitle_bn TEXT,
    ADD COLUMN IF NOT EXISTS description_bn TEXT;

UPDATE public.hero_slides
SET title_bn = caption_bn
WHERE title_bn IS NULL AND NULLIF(trim(caption_bn), '') IS NOT NULL;

-- Keep the legacy inventory RPC site-only as well; callers cannot use it to
-- enumerate profile uploads or private user documents.
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
    IF p_bucket IS NOT NULL AND p_bucket <> 'site' THEN
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
    WHERE o.bucket_id = 'site'
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
        WHERE o.bucket_id = 'site'
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
