-- A NOT VALID CHECK is still evaluated when an existing row is updated.
-- Older posts may have categories longer than the current write limit, so
-- status-only moderation updates must not be blocked by the category check.
ALTER TABLE public.community_posts
    DROP CONSTRAINT IF EXISTS community_posts_category_check;

CREATE OR REPLACE FUNCTION public.community_posts_validate_category_length()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF NEW.category IS NOT NULL AND char_length(NEW.category) > 100 THEN
        RAISE EXCEPTION 'category must be 100 characters or fewer'
            USING ERRCODE = '23514',
                  CONSTRAINT = 'community_posts_category_check';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_community_posts_validate_category_length
    ON public.community_posts;
DROP TRIGGER IF EXISTS trg_community_posts_validate_category_length_insert
    ON public.community_posts;
DROP TRIGGER IF EXISTS trg_community_posts_validate_category_length_update
    ON public.community_posts;

CREATE TRIGGER trg_community_posts_validate_category_length_insert
BEFORE INSERT ON public.community_posts
FOR EACH ROW
EXECUTE FUNCTION public.community_posts_validate_category_length();

CREATE TRIGGER trg_community_posts_validate_category_length_update
BEFORE UPDATE OF category ON public.community_posts
FOR EACH ROW
EXECUTE FUNCTION public.community_posts_validate_category_length();

NOTIFY pgrst, 'reload schema';
