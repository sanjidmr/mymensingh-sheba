-- ============================================================================
-- Customer Dashboard (/dashboard) — additive changes only
--
-- The dashboard itself is a front-end concern: it reads the tables this
-- project already has and writes through the existing service layer. Exactly
-- three things it needs do not exist yet, and all three are additive:
--
--   1. THE `posts` STORAGE BUCKET.
--      `lib/catalog-service.ts → uploadPostImage()` already uploads every
--      post cover / gallery image to a bucket named `posts`, but no bucket of
--      that name is ever created, so image upload fails at runtime with
--      "Bucket not found" on any database built from `lib/supabase/schema.sql`.
--      This creates it plus the owner-scoped policies every other bucket here
--      already has (see the `listings` and `avatars` policies for the pattern).
--      The first path segment must be the uploader's own uid, so one account
--      can never overwrite or delete another account's photo.
--
--   2. `community_posts.rejection_reason`.
--      `tolet_listings`, `home_tutor_profiles` and `blood_donor_profiles`
--      already carry a rejection reason the author can read, but community
--      posts (news / jobs / buy-sell) could only say "অনুমোদিত হয়নি". An
--      author who cannot see why was asked to guess. Nullable, author-scoped by
--      RLS like every other column on the row.
--
--   3. `community_posts.organization_bn`.
--      The job form asks for the hiring organisation, which had nowhere to
--      live — `tags` are taxonomy slugs, not a company name. Nullable TEXT, and
--      NULL for every existing row so nothing changes for current posts.
--
-- PLUS: one trigger that tells the author what a moderator decided. There was
-- a notification when a post was CREATED (admin hub only) and nothing at all
-- when it was approved or rejected, so the author had to keep reloading the
-- dashboard to find out. The trigger is SECURITY DEFINER and fires server-side,
-- so it cannot be spoofed or spammed by a client.
--
-- SECURITY: no RLS policy is created, dropped or widened here. Adding nullable
-- columns cannot widen row access, and the storage policies below are scoped to
-- `auth.uid()`. Author ownership stays enforced by the existing policies:
--   * insert  -> author_id = auth.uid() AND status = 'pending'
--   * update  -> author_id = auth.uid() AND status = 'pending'
--   * delete  -> author_id = auth.uid()
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. posts bucket (referenced by uploadPostImage in lib/catalog-service.ts)
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('posts', 'posts', true)
ON CONFLICT (id) DO NOTHING;

-- Post photos are public: an approved post's cover image is shown on public
-- pages. The object is reachable by URL, which is exactly how `cover_image_url`
-- and `gallery` are stored, so a private bucket would break the public site.
DROP POLICY IF EXISTS "Post photos are public" ON storage.objects;
CREATE POLICY "Post photos are public"
ON storage.objects FOR SELECT
USING (bucket_id = 'posts');

-- Upload path is `<uid>/<file>`, so the first folder must be the uploader.
DROP POLICY IF EXISTS "Authors upload their own post photos" ON storage.objects;
CREATE POLICY "Authors upload their own post photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'posts'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Authors update their own post photos" ON storage.objects;
CREATE POLICY "Authors update their own post photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'posts' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'posts' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Authors delete their own post photos" ON storage.objects;
CREATE POLICY "Authors delete their own post photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'posts' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ----------------------------------------------------------------------------
-- 2 + 3. community_posts columns
-- ----------------------------------------------------------------------------
ALTER TABLE public.community_posts
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

ALTER TABLE public.community_posts
  ADD COLUMN IF NOT EXISTS organization_bn TEXT;

COMMENT ON COLUMN public.community_posts.rejection_reason IS
  'Why a moderator rejected this post. Set by an admin only; readable by the author through the existing "Authors read own posts" policy and shown on /dashboard.';

COMMENT ON COLUMN public.community_posts.organization_bn IS
  'Hiring organisation / company for a kind = ''job'' post. NULL for every other kind.';

-- -------------------------------------------------------------------------------
-- 5. Moderation column guard (RLS alone does not restrict WHICH columns change)
-- -------------------------------------------------------------------------------
-- The policies above prove the row belongs to the caller and force
-- status = 'pending', but a crafted request could still write is_featured or
-- overwrite the moderator's rejection_reason on the author's OWN row — making
-- a post featured the moment it is approved, or erasing why it was rejected.
-- The service layer strips those fields as well, but that is convenience, not
-- a boundary. SECURITY DEFINER; NULL auth.uid() = migration/service-role write,
-- which has no session to judge and must keep working.
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

    IF TG_OP = 'INSERT' THEN
        NEW.author_id := auth.uid();
        NEW.status := 'pending';
        NEW.is_featured := FALSE;
        NEW.published_at := NULL;
        NEW.rejection_reason := NULL;
    ELSE
        NEW.author_id := OLD.author_id;
        NEW.status := 'pending';
        NEW.is_featured := OLD.is_featured;
        NEW.published_at := OLD.published_at;
        NEW.rejection_reason := OLD.rejection_reason;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_community_posts_moderation_guard ON public.community_posts;
CREATE TRIGGER trg_community_posts_moderation_guard
BEFORE INSERT OR UPDATE ON public.community_posts
FOR EACH ROW EXECUTE FUNCTION public.community_posts_guard_moderation();

-- ----------------------------------------------------------------------------
-- 4. Notify the author when a moderator decides
-- ----------------------------------------------------------------------------
-- Fires only on a real status CHANGE. An author editing their own post also
-- flips status back to 'pending', which must not produce a notification (the
-- author caused it and is already looking at the screen), so the trigger keys
-- on the two states only a moderator can set: approved and rejected.
CREATE OR REPLACE FUNCTION public.notif_community_post_status_changed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NEW.status = OLD.status THEN
        RETURN NEW;
    END IF;

    IF NEW.status = 'approved' THEN
        INSERT INTO public.notifications (user_id, target_role, title, body, type, related_type, related_id)
        VALUES (
            NEW.author_id, 'customer',
            'আপনার পোস্ট অনুমোদিত হয়েছে',
            '“' || NEW.title_bn || '” এখন সবার জন্য দেখা যাচ্ছে।',
            'success', 'community_post', NEW.id::text
        );
    ELSIF NEW.status = 'rejected' THEN
        INSERT INTO public.notifications (user_id, target_role, title, body, type, related_type, related_id)
        VALUES (
            NEW.author_id, 'customer',
            'পোস্টটি অনুমোদিত হয়নি',
            CASE
                WHEN NULLIF(BTRIM(NEW.rejection_reason), '') IS NOT NULL
                    THEN '“' || NEW.title_bn || '” অনুমোদিত হয়নি। কারণ: '
                         || BTRIM(NEW.rejection_reason)
                         || ' — কারণটি পড়ে সম্পাদনা করে আবার পাঠান।'
                ELSE '“' || NEW.title_bn || '” অনুমোদিত হয়নি। সম্পাদনা করে আবার পাঠাতে পারেন।'
            END,
            'warning', 'community_post', NEW.id::text
        );
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notif_community_post_status ON public.community_posts;
CREATE TRIGGER trg_notif_community_post_status
AFTER UPDATE OF status ON public.community_posts
FOR EACH ROW EXECUTE FUNCTION public.notif_community_post_status_changed();