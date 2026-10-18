-- Keep the stored category contract compatible with all post kinds. News and
-- marketplace use curated values in the application; job categories are text.
ALTER TABLE public.community_posts
    DROP CONSTRAINT IF EXISTS community_posts_category_check;

ALTER TABLE public.community_posts
    ADD CONSTRAINT community_posts_category_check
    CHECK (category IS NULL OR char_length(category) <= 100)
    NOT VALID;

CREATE OR REPLACE FUNCTION public.community_posts_sync_legacy_content()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    submitted_content TEXT;
    profile_name TEXT;
    post_kind TEXT;
BEGIN
    post_kind := to_jsonb(NEW) ->> 'kind';
    IF post_kind = 'news' THEN
        submitted_content := COALESCE(
            NULLIF(BTRIM(to_jsonb(NEW) ->> 'body_bn'), ''),
            NULLIF(BTRIM(to_jsonb(NEW) ->> 'summary_bn'), ''),
            NULLIF(BTRIM(to_jsonb(NEW) ->> 'content'), '')
        );
    ELSE
        submitted_content := COALESCE(
            NULLIF(BTRIM(to_jsonb(NEW) ->> 'summary_bn'), ''),
            NULLIF(BTRIM(to_jsonb(NEW) ->> 'body_bn'), ''),
            NULLIF(BTRIM(to_jsonb(NEW) ->> 'content'), '')
        );
    END IF;

    IF submitted_content IS NOT NULL AND to_jsonb(NEW) ? 'content' THEN
        NEW := jsonb_populate_record(
            NEW,
            jsonb_build_object('content', submitted_content)
        );
    END IF;

    IF auth.uid() IS NOT NULL AND public.is_admin() IS NOT TRUE THEN
        SELECT profiles.full_name
          INTO profile_name
          FROM public.profiles
         WHERE profiles.id = auth.uid();

        IF NULLIF(BTRIM(profile_name), '') IS NOT NULL THEN
            NEW.author_name := BTRIM(profile_name);
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_community_posts_sync_legacy_content
    ON public.community_posts;

CREATE TRIGGER trg_community_posts_sync_legacy_content
BEFORE INSERT OR UPDATE ON public.community_posts
FOR EACH ROW
EXECUTE FUNCTION public.community_posts_sync_legacy_content();

NOTIFY pgrst, 'reload schema';
