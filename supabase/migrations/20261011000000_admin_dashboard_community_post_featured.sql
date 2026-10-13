-- The canonical schema includes this moderation flag, but older databases may
-- predate it. Dashboard statistics and admin post lists both read this column.
ALTER TABLE public.community_posts
    ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

NOTIFY pgrst, 'reload schema';
