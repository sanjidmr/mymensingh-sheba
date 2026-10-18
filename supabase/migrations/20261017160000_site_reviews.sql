-- Site-wide reviews submitted from the homepage "আপনার রিভিউ দিন" modal.
--
-- Before this table existed, the modal persisted reviews only in the visitor's
-- browser (localStorage), so a review never reached the platform and was lost on
-- any other device. This table is the real store.
--
-- Anyone (no login required) may submit a review. A review is public by default
-- so the homepage can show it immediately; admins can hide abusive entries by
-- flipping `status` to 'hidden'.
CREATE TABLE IF NOT EXISTS public.site_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    service TEXT NOT NULL,
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'hidden')),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_site_reviews_status_created
ON public.site_reviews (status, created_at DESC);

-- --- SITE REVIEWS RLS ---
ALTER TABLE public.site_reviews ENABLE ROW LEVEL SECURITY;

-- Published reviews are readable by everyone so the homepage can render them.
DROP POLICY IF EXISTS "Published site reviews are public" ON public.site_reviews;
CREATE POLICY "Published site reviews are public"
ON public.site_reviews FOR SELECT
TO anon, authenticated
USING (status = 'published');

-- Guests may submit a review. Length checks mirror the client rules so a
-- hand-rolled request cannot bypass them. A submitted review is always
-- 'published' on insert; only admins can hide it afterwards.
DROP POLICY IF EXISTS "Guests can submit site reviews" ON public.site_reviews;
CREATE POLICY "Guests can submit site reviews"
ON public.site_reviews FOR INSERT
TO anon, authenticated
WITH CHECK (
    name IS NOT NULL AND length(trim(name)) >= 2
    AND service IS NOT NULL AND length(trim(service)) >= 2
    AND rating BETWEEN 1 AND 5
    AND body IS NOT NULL AND length(trim(body)) >= 10 AND length(body) <= 1500
    AND status = 'published'
);

-- Admins can read every review (including hidden) and moderate/remove them.
DROP POLICY IF EXISTS "Admins read site reviews" ON public.site_reviews;
CREATE POLICY "Admins read site reviews"
ON public.site_reviews FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins update site reviews" ON public.site_reviews;
CREATE POLICY "Admins update site reviews"
ON public.site_reviews FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins delete site reviews" ON public.site_reviews;
CREATE POLICY "Admins delete site reviews"
ON public.site_reviews FOR DELETE
TO authenticated
USING (public.is_admin());

COMMENT ON TABLE public.site_reviews IS
    'Homepage service reviews. Public insert + public read of published rows; admins moderate.';

-- Make PostgREST pick the table up immediately instead of waiting for its next
-- schema-cache refresh.
NOTIFY pgrst, 'reload schema';
