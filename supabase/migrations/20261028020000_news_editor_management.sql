ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('customer', 'admin', 'news_editor'));

ALTER TABLE public.community_posts
    DROP CONSTRAINT IF EXISTS community_posts_status_check;

ALTER TABLE public.community_posts
    ADD CONSTRAINT community_posts_status_check
    CHECK (status IN ('draft', 'pending', 'approved', 'rejected'))
    NOT VALID;

CREATE TABLE IF NOT EXISTS public.news_editor_settings (
    editor_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    can_publish BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE public.news_editor_settings ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_active_news_editor()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'news_editor'
          AND p.status = 'active'
    );
$$;

CREATE OR REPLACE FUNCTION public.can_publish_news()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
    SELECT public.is_active_news_editor()
       AND EXISTS (
           SELECT 1
           FROM public.news_editor_settings s
           WHERE s.editor_id = auth.uid()
             AND s.can_publish = TRUE
       );
$$;

REVOKE ALL ON FUNCTION public.is_active_news_editor() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_publish_news() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_active_news_editor() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_publish_news() TO authenticated;

DROP POLICY IF EXISTS "Admins manage news editor settings" ON public.news_editor_settings;
CREATE POLICY "Admins manage news editor settings"
ON public.news_editor_settings FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Editors read own news settings" ON public.news_editor_settings;
CREATE POLICY "Editors read own news settings"
ON public.news_editor_settings FOR SELECT
TO authenticated
USING (editor_id = auth.uid() AND public.is_active_news_editor());

DROP POLICY IF EXISTS "Approved community posts are public" ON public.community_posts;
CREATE POLICY "Approved community posts are public"
ON public.community_posts FOR SELECT
TO anon, authenticated
USING (status = 'approved');

DROP POLICY IF EXISTS "Authors read own posts" ON public.community_posts;
CREATE POLICY "Authors read own posts"
ON public.community_posts FOR SELECT
TO authenticated
USING (
    author_id = auth.uid()
    AND (kind <> 'news' OR public.is_active_news_editor())
);

DROP POLICY IF EXISTS "News editors read news posts" ON public.community_posts;
CREATE POLICY "News editors read news posts"
ON public.community_posts FOR SELECT
TO authenticated
USING (kind = 'news' AND public.is_active_news_editor());

DROP POLICY IF EXISTS "Authors create own posts" ON public.community_posts;
CREATE POLICY "Authors create own posts"
ON public.community_posts FOR INSERT
TO authenticated
WITH CHECK (
    author_id = auth.uid()
    AND (
        (kind <> 'news' AND status = 'pending')
        OR (
            kind = 'news'
            AND public.is_active_news_editor()
            AND (
                status IN ('draft', 'pending')
                OR (status = 'approved' AND public.can_publish_news())
            )
        )
    )
);

DROP POLICY IF EXISTS "Authors update own posts" ON public.community_posts;
CREATE POLICY "Authors update own posts"
ON public.community_posts FOR UPDATE
TO authenticated
USING (author_id = auth.uid() AND kind <> 'news')
WITH CHECK (author_id = auth.uid() AND kind <> 'news' AND status = 'pending');

DROP POLICY IF EXISTS "News editors update news posts" ON public.community_posts;
CREATE POLICY "News editors update news posts"
ON public.community_posts FOR UPDATE
TO authenticated
USING (kind = 'news' AND public.is_active_news_editor())
WITH CHECK (
    kind = 'news'
    AND public.is_active_news_editor()
    AND (
        status IN ('draft', 'pending')
        OR (status = 'approved' AND public.can_publish_news())
    )
);

DROP POLICY IF EXISTS "Authors delete own posts" ON public.community_posts;
CREATE POLICY "Authors delete own posts"
ON public.community_posts FOR DELETE
TO authenticated
USING (author_id = auth.uid() AND kind <> 'news');

DROP POLICY IF EXISTS "News editors delete news posts" ON public.community_posts;
CREATE POLICY "News editors delete news posts"
ON public.community_posts FOR DELETE
TO authenticated
USING (kind = 'news' AND public.is_active_news_editor());

CREATE OR REPLACE FUNCTION public.community_posts_guard_moderation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF auth.uid() IS NULL OR public.is_admin() THEN
        RETURN NEW;
    END IF;

    IF public.is_active_news_editor() THEN
        IF TG_OP = 'INSERT' THEN
            IF NEW.kind <> 'news' THEN
                RAISE EXCEPTION 'news editors may only create news posts'
                    USING ERRCODE = '42501';
            END IF;
            NEW.author_id := auth.uid();
            NEW.is_featured := FALSE;
            NEW.rejection_reason := NULL;
        ELSE
            IF OLD.kind <> 'news' OR NEW.kind <> 'news' THEN
                RAISE EXCEPTION 'news editors may only update news posts'
                    USING ERRCODE = '42501';
            END IF;
            NEW.author_id := OLD.author_id;
            NEW.author_name := OLD.author_name;
            NEW.is_featured := OLD.is_featured;
            NEW.rejection_reason := OLD.rejection_reason;
        END IF;

        IF NEW.status = 'approved' AND NOT public.can_publish_news() THEN
            RAISE EXCEPTION 'news editor requires approval to publish'
                USING ERRCODE = '42501';
        END IF;
        IF NEW.status NOT IN ('draft', 'pending', 'approved') THEN
            RAISE EXCEPTION 'news editor cannot reject a news post'
                USING ERRCODE = '42501';
        END IF;
        NEW.published_at := CASE
            WHEN NEW.status = 'approved' THEN COALESCE(NEW.published_at, NOW())
            ELSE NULL
        END;
        RETURN NEW;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'news_editor'
    ) THEN
        RAISE EXCEPTION 'inactive news editors cannot manage community posts'
            USING ERRCODE = '42501';
    END IF;

    IF TG_OP = 'INSERT' THEN
        IF NEW.kind = 'news' THEN
            RAISE EXCEPTION 'only news editors may create news posts'
                USING ERRCODE = '42501';
        END IF;
        NEW.author_id := auth.uid();
        NEW.status := 'pending';
        NEW.is_featured := FALSE;
        NEW.published_at := NULL;
        NEW.rejection_reason := NULL;
    ELSE
        IF OLD.kind = 'news' OR NEW.kind = 'news' THEN
            RAISE EXCEPTION 'only news editors may update news posts'
                USING ERRCODE = '42501';
        END IF;
        NEW.author_id := OLD.author_id;
        NEW.status := 'pending';
        NEW.is_featured := OLD.is_featured;
        NEW.published_at := OLD.published_at;
        NEW.rejection_reason := OLD.rejection_reason;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_news_post_views()
RETURNS TABLE (post_slug TEXT, view_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
BEGIN
    IF NOT public.is_admin() AND NOT public.is_active_news_editor() THEN
        RAISE EXCEPTION 'news analytics access required'
            USING ERRCODE = '42501';
    END IF;

    RETURN QUERY
    SELECT p.slug, COUNT(e.id)
    FROM public.community_posts p
    LEFT JOIN public.site_events e
      ON e.content_id = p.slug
     AND e.event_type = 'page_view'
     AND e.route_kind = 'post'
     AND (e.category IS NULL OR e.category = 'news')
    WHERE p.kind = 'news'
    GROUP BY p.slug;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_news_post_views() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_news_post_views() TO authenticated;

NOTIFY pgrst, 'reload schema';
