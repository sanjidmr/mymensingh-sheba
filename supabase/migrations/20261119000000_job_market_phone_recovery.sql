-- Use contact_phone as the canonical field for jobs and marketplace posts.
-- author_phone remains synchronized for older admin and database callers.
-- Back up the database before applying. The rollback note below is schema-only;
-- restore the backup to recover original phone strings and statuses.
ALTER TABLE public.community_posts
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS needs_phone BOOLEAN NOT NULL DEFAULT FALSE;

CREATE OR REPLACE FUNCTION public.validate_community_post_contacts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  source_phone TEXT;
  normalized_phone TEXT;
  normalized_whatsapp TEXT;
BEGIN
  IF NEW.kind = 'buy_sell' AND NEW.marketplace_status IS NULL THEN
    NEW.marketplace_status := 'available';
  END IF;

  IF NEW.kind NOT IN ('job', 'buy_sell') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    source_phone := COALESCE(NEW.contact_phone, NEW.author_phone);
  ELSIF NEW.contact_phone IS DISTINCT FROM OLD.contact_phone THEN
    source_phone := NEW.contact_phone;
  ELSIF NEW.author_phone IS DISTINCT FROM OLD.author_phone THEN
    source_phone := NEW.author_phone;
  ELSE
    source_phone := COALESCE(NEW.contact_phone, NEW.author_phone);
  END IF;

  IF auth.uid() IS NOT NULL AND public.is_admin() IS NOT TRUE THEN
    NEW.needs_phone := FALSE;
  END IF;

  normalized_phone := public.normalize_bd_mobile(source_phone);
  IF normalized_phone IS NULL THEN
    IF NEW.needs_phone IS TRUE AND NEW.status <> 'approved' AND auth.uid() IS NULL THEN
      NEW.contact_phone := NULL;
      NEW.author_phone := NULL;
      NEW.whatsapp_number := NULL;
      RETURN NEW;
    END IF;
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      CONSTRAINT = 'community_posts_contact_phone_required',
      MESSAGE = 'ফোন নম্বর দেওয়া বাধ্যতামূলক। সঠিক বাংলাদেশি মোবাইল নম্বর দিন।';
  END IF;

  normalized_whatsapp := public.normalize_bd_mobile(NEW.whatsapp_number);
  IF NULLIF(BTRIM(NEW.whatsapp_number), '') IS NULL THEN
    normalized_whatsapp := normalized_phone;
  ELSIF normalized_whatsapp IS NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      CONSTRAINT = 'community_posts_whatsapp_number_valid',
      MESSAGE = 'সঠিক বাংলাদেশি হোয়াটসঅ্যাপ নম্বর দিন।';
  END IF;

  NEW.contact_phone := normalized_phone;
  NEW.author_phone := normalized_phone;
  NEW.whatsapp_number := normalized_whatsapp;
  NEW.needs_phone := FALSE;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_community_post_contacts()
  FROM PUBLIC, anon, authenticated;
REVOKE SELECT (contact_phone)
  ON public.community_posts FROM PUBLIC, anon, authenticated;
GRANT INSERT (contact_phone), UPDATE (contact_phone)
  ON public.community_posts TO authenticated;

DROP TRIGGER IF EXISTS trg_community_posts_validate_contacts
  ON public.community_posts;
CREATE TRIGGER trg_community_posts_validate_contacts
BEFORE INSERT OR UPDATE OF kind, status, marketplace_status,
  contact_phone, author_phone, whatsapp_number, needs_phone
ON public.community_posts
FOR EACH ROW
EXECUTE FUNCTION public.validate_community_post_contacts();

DO $$
DECLARE
  affected_jobs INTEGER;
  affected_market_posts INTEGER;
BEGIN
  SELECT count(*) INTO affected_jobs
  FROM public.community_posts AS post
  WHERE post.kind = 'job'
    AND COALESCE(
      public.normalize_bd_mobile(post.contact_phone),
      public.normalize_bd_mobile(post.author_phone),
      public.normalize_bd_mobile(post.whatsapp_number)
    ) IS NULL;

  SELECT count(*) INTO affected_market_posts
  FROM public.community_posts AS post
  WHERE post.kind = 'buy_sell'
    AND COALESCE(
      public.normalize_bd_mobile(post.contact_phone),
      public.normalize_bd_mobile(post.author_phone),
      public.normalize_bd_mobile(post.whatsapp_number)
    ) IS NULL;

  RAISE NOTICE 'Before phone recovery: jobs=%, marketplace posts=%',
    affected_jobs, affected_market_posts;

  WITH recovered AS (
    SELECT post.id,
      COALESCE(
        public.normalize_bd_mobile(post.contact_phone),
        public.normalize_bd_mobile(post.author_phone),
        public.normalize_bd_mobile(post.whatsapp_number)
      ) AS phone
    FROM public.community_posts AS post
    WHERE post.kind IN ('job', 'buy_sell')
  )
  UPDATE public.community_posts AS post
  SET contact_phone = recovered.phone,
      author_phone = recovered.phone,
      needs_phone = recovered.phone IS NULL,
      status = CASE
        WHEN recovered.phone IS NULL THEN 'pending'
        ELSE post.status
      END
  FROM recovered
  WHERE post.id = recovered.id;

  RAISE NOTICE 'After phone recovery: jobs=%, marketplace posts=%',
    (SELECT count(*) FROM public.community_posts
      WHERE kind = 'job' AND needs_phone),
    (SELECT count(*) FROM public.community_posts
      WHERE kind = 'buy_sell' AND needs_phone);
END
$$;

ALTER TABLE public.community_posts
  DROP CONSTRAINT IF EXISTS community_posts_contact_phone_required;
ALTER TABLE public.community_posts
  ADD CONSTRAINT community_posts_contact_phone_required
  CHECK (
    kind NOT IN ('job', 'buy_sell')
    OR (needs_phone IS TRUE AND status <> 'approved')
    OR public.normalize_bd_mobile(contact_phone) IS NOT NULL
  );

CREATE OR REPLACE FUNCTION public.fetch_market_contact(p_slug TEXT)
RETURNS TABLE (
  post_id UUID,
  author_name TEXT,
  author_phone TEXT,
  whatsapp_number TEXT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT post.id, post.author_name, post.contact_phone, post.whatsapp_number
  FROM public.community_posts AS post
  WHERE post.slug = p_slug
    AND post.status = 'approved'
    AND (
      post.kind = 'job'
      OR (post.kind = 'buy_sell' AND post.marketplace_status = 'available')
    )
    AND public.normalize_bd_mobile(post.contact_phone) IS NOT NULL
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.fetch_public_community_post_contacts(p_slugs TEXT[])
RETURNS TABLE (
  slug TEXT,
  author_phone TEXT,
  whatsapp_number TEXT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT post.slug, post.contact_phone, post.whatsapp_number
  FROM public.community_posts AS post
  WHERE post.slug = ANY(COALESCE(p_slugs, ARRAY[]::TEXT[]))
    AND post.status = 'approved'
    AND (
      post.kind = 'job'
      OR (post.kind = 'buy_sell' AND post.marketplace_status = 'available')
    )
    AND public.normalize_bd_mobile(post.contact_phone) IS NOT NULL;
$$;

NOTIFY pgrst, 'reload schema';

-- Rollback: restore the database backup, or restore prior contact functions
-- and grants before dropping this constraint, trigger, and added columns.
