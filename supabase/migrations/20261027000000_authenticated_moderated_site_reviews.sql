-- Homepage reviews are submitted by signed-in users and remain private until
-- an admin approves them.
ALTER TABLE public.site_reviews
    ALTER COLUMN status SET DEFAULT 'pending';

ALTER TABLE public.site_reviews
    DROP CONSTRAINT IF EXISTS site_reviews_status_check;

ALTER TABLE public.site_reviews
    ADD CONSTRAINT site_reviews_status_check
    CHECK (status IN ('pending', 'published', 'hidden'));

DROP POLICY IF EXISTS "Guests can submit site reviews" ON public.site_reviews;
DROP POLICY IF EXISTS "Authenticated users can submit site reviews" ON public.site_reviews;

CREATE POLICY "Authenticated users can submit site reviews"
ON public.site_reviews FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
    AND status = 'pending'
    AND name IS NOT NULL AND length(trim(name)) >= 2
    AND service IS NOT NULL AND length(trim(service)) >= 2
    AND rating BETWEEN 1 AND 5
    AND body IS NOT NULL AND length(trim(body)) >= 10 AND length(body) <= 1500
);

COMMENT ON TABLE public.site_reviews IS
    'Authenticated users submit pending homepage reviews; admins moderate; only published reviews are public.';

NOTIFY pgrst, 'reload schema';
