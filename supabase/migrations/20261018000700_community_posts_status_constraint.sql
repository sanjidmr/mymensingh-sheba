-- Keep community post moderation statuses aligned with the admin application.
-- Some existing deployments have a legacy community_posts_status_check that
-- does not permit 'approved', which blocks moderation updates.
ALTER TABLE public.community_posts
    DROP CONSTRAINT IF EXISTS community_posts_status_check;

ALTER TABLE public.community_posts
    ADD CONSTRAINT community_posts_status_check
    CHECK (status IN ('pending', 'approved', 'rejected'))
    NOT VALID;

NOTIFY pgrst, 'reload schema';
