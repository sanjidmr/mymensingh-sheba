-- One private draft per signed-in customer and community-post category.
CREATE TABLE IF NOT EXISTS public.customer_post_drafts (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('news', 'job', 'buy_sell')),
    draft JSONB NOT NULL CHECK (JSONB_TYPEOF(draft) = 'object'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    PRIMARY KEY (user_id, kind)
);

ALTER TABLE public.customer_post_drafts ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_post_drafts TO authenticated;

DROP POLICY IF EXISTS "Customers manage own post drafts"
    ON public.customer_post_drafts;
CREATE POLICY "Customers manage own post drafts"
    ON public.customer_post_drafts FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
