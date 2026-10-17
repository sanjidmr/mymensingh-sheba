-- ============================================================================
-- community_posts — make sure every column the app reads and writes exists
-- ============================================================================
--
-- Why this file exists
-- --------------------
-- `community_posts` is created with `CREATE TABLE IF NOT EXISTS` in the
-- consolidated schema (20261008000000_master_consolidated_schema.sql). On a
-- database that already had the table, that statement is a NO-OP: it does not
-- add any column that the *current* definition lists but the deployed table
-- lacks. Several columns were only ever added that way — most importantly
-- `area_id` — so a fresh write such as a news or job post fails with:
--
--   Could not find the 'area_id' column of 'community_posts' in the schema cache
--
-- The same gap silently breaks the public SELECTs, because the service layer's
-- column list (`PUBLIC_POST_COLUMNS`) names `area_id`, `category`, `tags`,
-- `organization_bn`, and so on. An insert and a read must therefore both be
-- fixed by ensuring the columns are present.
--
-- What this does
-- --------------
-- Adds, idempotently, exactly the columns the current definition + service
-- layer expect. `ADD COLUMN IF NOT EXISTS` never rewrites or drops data on a
-- database that is already correct, and never touches row content on one that
-- is not. No column is dropped and no row is changed. Types and nullability
-- mirror 20261008000000_master_consolidated_schema.sql.
--
-- Refreshes the PostgREST schema cache at the end so the API stops reporting
-- the stale "column not found" error immediately after the columns land.

ALTER TABLE public.community_posts
    ADD COLUMN IF NOT EXISTS kind TEXT;

ALTER TABLE public.community_posts
    ADD COLUMN IF NOT EXISTS slug TEXT;

ALTER TABLE public.community_posts
    ADD COLUMN IF NOT EXISTS author_id UUID;

ALTER TABLE public.community_posts
    ADD COLUMN IF NOT EXISTS title_bn TEXT;

ALTER TABLE public.community_posts
    ADD COLUMN IF NOT EXISTS summary_bn TEXT;

ALTER TABLE public.community_posts
    ADD COLUMN IF NOT EXISTS body_bn TEXT;

ALTER TABLE public.community_posts
    ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

ALTER TABLE public.community_posts
    ADD COLUMN IF NOT EXISTS category TEXT;

-- The column whose absence produced the reported error.
ALTER TABLE public.community_posts
    ADD COLUMN IF NOT EXISTS area_id TEXT;

ALTER TABLE public.community_posts
    ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE public.community_posts
    ADD COLUMN IF NOT EXISTS salary_min INTEGER;

ALTER TABLE public.community_posts
    ADD COLUMN IF NOT EXISTS salary_max INTEGER;

ALTER TABLE public.community_posts
    ADD COLUMN IF NOT EXISTS price INTEGER;

ALTER TABLE public.community_posts
    ADD COLUMN IF NOT EXISTS job_type TEXT;

ALTER TABLE public.community_posts
    ADD COLUMN IF NOT EXISTS organization_bn TEXT;

ALTER TABLE public.community_posts
    ADD COLUMN IF NOT EXISTS deadline DATE;

ALTER TABLE public.community_posts
    ADD COLUMN IF NOT EXISTS condition_label TEXT;

ALTER TABLE public.community_posts
    ADD COLUMN IF NOT EXISTS author_name TEXT;

ALTER TABLE public.community_posts
    ADD COLUMN IF NOT EXISTS author_phone TEXT;

ALTER TABLE public.community_posts
    ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

ALTER TABLE public.community_posts
    ADD COLUMN IF NOT EXISTS gallery TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE public.community_posts
    ADD COLUMN IF NOT EXISTS status TEXT;

ALTER TABLE public.community_posts
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

ALTER TABLE public.community_posts
    ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

ALTER TABLE public.community_posts
    ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

ALTER TABLE public.community_posts
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW());

ALTER TABLE public.community_posts
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW());

-- A not-yet-migrated table may also be missing these indexes; they are the ones
-- the directory queries rely on and are safe to (re)create.
CREATE INDEX IF NOT EXISTS idx_community_posts_kind_status
    ON public.community_posts (kind, status);

CREATE INDEX IF NOT EXISTS idx_community_posts_author
    ON public.community_posts (author_id);

-- Make the change visible to PostgREST without waiting for its next poll.
NOTIFY pgrst, 'reload schema';
