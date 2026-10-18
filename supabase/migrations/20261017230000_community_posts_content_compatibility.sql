-- Some deployed community_posts tables retain a required legacy `content`
-- column alongside the current body_bn / summary_bn columns. Keep that legacy
-- value in sync without adding or weakening any table constraint.

CREATE OR REPLACE FUNCTION public.community_posts_sync_legacy_content()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    submitted_content TEXT;
BEGIN
    submitted_content := COALESCE(
        NULLIF(BTRIM(to_jsonb(NEW) ->> 'body_bn'), ''),
        NULLIF(BTRIM(to_jsonb(NEW) ->> 'summary_bn'), ''),
        NULLIF(BTRIM(to_jsonb(NEW) ->> 'content'), '')
    );

    IF submitted_content IS NOT NULL THEN
        NEW := jsonb_populate_record(
            NEW,
            jsonb_build_object('content', submitted_content)
        );
    END IF;

    RETURN NEW;
END;
$$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_attribute
        WHERE attrelid = 'public.community_posts'::regclass
          AND attname = 'content'
          AND attnum > 0
          AND NOT attisdropped
    ) THEN
        EXECUTE 'DROP TRIGGER IF EXISTS trg_community_posts_sync_legacy_content ON public.community_posts';
        EXECUTE '
            CREATE TRIGGER trg_community_posts_sync_legacy_content
            BEFORE INSERT OR UPDATE ON public.community_posts
            FOR EACH ROW
            EXECUTE FUNCTION public.community_posts_sync_legacy_content()
        ';
    END IF;
END;
$$;

NOTIFY pgrst, 'reload schema';
