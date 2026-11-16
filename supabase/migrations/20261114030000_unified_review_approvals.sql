ALTER TABLE public.tutor_reviews
    ALTER COLUMN is_published SET DEFAULT FALSE;

ALTER TABLE public.tutor_reviews
    ADD COLUMN IF NOT EXISTS moderation_status TEXT;

UPDATE public.tutor_reviews
SET moderation_status = CASE WHEN is_published THEN 'approved' ELSE 'rejected' END
WHERE moderation_status IS NULL;

ALTER TABLE public.tutor_reviews
    ALTER COLUMN moderation_status SET DEFAULT 'pending',
    ALTER COLUMN moderation_status SET NOT NULL;

ALTER TABLE public.tutor_reviews
    DROP CONSTRAINT IF EXISTS tutor_reviews_moderation_status_check;

ALTER TABLE public.tutor_reviews
    ADD CONSTRAINT tutor_reviews_moderation_status_check
    CHECK (moderation_status IN ('pending', 'approved', 'rejected'));

ALTER TABLE public.directory_reviews
    ADD COLUMN IF NOT EXISTS moderation_status TEXT;

UPDATE public.directory_reviews
SET moderation_status = CASE WHEN is_published THEN 'approved' ELSE 'rejected' END
WHERE moderation_status IS NULL;

ALTER TABLE public.directory_reviews
    ALTER COLUMN moderation_status SET DEFAULT 'pending',
    ALTER COLUMN moderation_status SET NOT NULL;

ALTER TABLE public.directory_reviews
    DROP CONSTRAINT IF EXISTS directory_reviews_moderation_status_check;

ALTER TABLE public.directory_reviews
    ADD CONSTRAINT directory_reviews_moderation_status_check
    CHECK (moderation_status IN ('pending', 'approved', 'rejected'));

CREATE OR REPLACE FUNCTION public.tutor_review_insert_validate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NEW.customer_id <> auth.uid()
       AND COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000') <> NEW.customer_id THEN
        RAISE EXCEPTION 'Review must be submitted by the request customer';
    END IF;
    IF NOT EXISTS (
        SELECT 1
        FROM public.service_requests sr
        WHERE sr.id = NEW.request_id
          AND sr.customer_id = NEW.customer_id
          AND sr.service_slug = 'home-tutor'
          AND sr.status = 'completed'
          AND sr.profile_id::uuid = NEW.tutor_id
    ) THEN
        RAISE EXCEPTION 'Review requires a completed tutor request for this tutor';
    END IF;
    IF NOT public.is_admin() THEN
        NEW.is_published := FALSE;
        NEW.moderation_status := 'pending';
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_directory_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        NEW.author_id := auth.uid();
        IF NOT public.is_admin() THEN
            NEW.is_published := FALSE;
            NEW.moderation_status := 'pending';
        END IF;
        IF NOT EXISTS (
            SELECT 1
            FROM public.service_listings sl
            WHERE sl.id = NEW.listing_id
              AND sl.category = NEW.category
              AND sl.category IN ('coaching', 'wifi')
        ) THEN
            RAISE EXCEPTION 'directory review listing/category mismatch';
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF NOT public.is_admin() THEN
            NEW.author_id := OLD.author_id;
            NEW.listing_id := OLD.listing_id;
            NEW.category := OLD.category;
            NEW.is_published := OLD.is_published;
            NEW.moderation_status := OLD.moderation_status;
        ELSIF NEW.is_published IS DISTINCT FROM OLD.is_published THEN
            NEW.moderation_status := CASE WHEN NEW.is_published THEN 'approved' ELSE 'rejected' END;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_admin_approval_queue(
    p_limit INTEGER DEFAULT 25,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    approval_kind TEXT,
    service_key TEXT,
    title TEXT,
    summary TEXT,
    owner_id UUID,
    owner_name TEXT,
    owner_phone TEXT,
    created_at TIMESTAMPTZ,
    total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
BEGIN
    IF NOT public.is_admin()
       AND COALESCE(CURRENT_SETTING('request.jwt.claim.role', TRUE), '') <> 'service_role' THEN
        RAISE EXCEPTION 'admin access required' USING ERRCODE = '42501';
    END IF;

    RETURN QUERY
    WITH pending_items AS (
        SELECT p.id, 'post'::TEXT AS approval_kind, p.kind::TEXT AS service_key,
               p.title_bn::TEXT AS title, p.summary_bn::TEXT AS summary,
               p.author_id AS owner_id, p.author_name::TEXT AS owner_name,
               u.phone::TEXT AS owner_phone, p.created_at
        FROM public.community_posts p
        LEFT JOIN public.profiles u ON u.id = p.author_id
        WHERE p.status = 'pending'

        UNION ALL

        SELECT l.id, 'tolet_listing'::TEXT, l.property_type::TEXT, l.title::TEXT,
               concat_ws(' · ', l.area_id, '৳' || l.rent_price)::TEXT,
               l.owner_id, u.full_name::TEXT, u.phone::TEXT, l.created_at
        FROM public.tolet_listings l
        LEFT JOIN public.profiles u ON u.id = l.owner_id
        WHERE l.status = 'pending_review'

        UNION ALL

        SELECT t.id, 'tutor_profile'::TEXT, 'home_tutor'::TEXT, t.full_name::TEXT,
               concat_ws(' · ', t.qualification, t.institution)::TEXT,
               t.user_id, u.full_name::TEXT, u.phone::TEXT, t.created_at
        FROM public.home_tutor_profiles t
        LEFT JOIN public.profiles u ON u.id = t.user_id
        WHERE t.status = 'pending_approval'

        UNION ALL

        SELECT d.id, 'donor_profile'::TEXT, 'blood_donor'::TEXT, d.full_name::TEXT,
               concat_ws(' · ', d.blood_group, d.area_id)::TEXT,
               d.user_id, u.full_name::TEXT, u.phone::TEXT, d.created_at
        FROM public.blood_donor_profiles d
        LEFT JOIN public.profiles u ON u.id = d.user_id
        WHERE d.status = 'pending_approval'

        UNION ALL

        SELECT s.id, 'service_listing'::TEXT, s.category::TEXT, s.title_bn::TEXT,
               concat_ws(' · ', s.subtitle_bn, array_to_string(s.area_ids, ', '))::TEXT,
               s.owner_id, u.full_name::TEXT, u.phone::TEXT, s.created_at
        FROM public.service_listings s
        LEFT JOIN public.profiles u ON u.id = s.owner_id
        WHERE s.status = 'pending'
          AND s.owner_id IS NOT NULL

        UNION ALL

        SELECT tp.id, 'tolet_profile'::TEXT, 'tolet_owner'::TEXT, tp.owner_name::TEXT,
               concat_ws(' · ', tp.primary_area_id, tp.address_line)::TEXT,
               tp.user_id, u.full_name::TEXT, u.phone::TEXT, tp.created_at
        FROM public.tolet_profiles tp
        LEFT JOIN public.profiles u ON u.id = tp.user_id
        WHERE tp.status = 'pending_approval'

        UNION ALL

        SELECT r.id, 'site_review'::TEXT, r.service::TEXT, r.name::TEXT,
               ('★ ' || r.rating::TEXT || ' · ' || r.body)::TEXT,
               r.user_id, u.full_name::TEXT, u.phone::TEXT, r.created_at
        FROM public.site_reviews r
        LEFT JOIN public.profiles u ON u.id = r.user_id
        WHERE r.status = 'pending'

        UNION ALL

        SELECT r.id, 'tutor_review'::TEXT, 'home_tutor'::TEXT,
               COALESCE(NULLIF(ht.full_name, ''), 'গৃহশিক্ষক রিভিউ')::TEXT,
               ('★ ' || r.rating::TEXT || ' · ' || COALESCE(r.comment, 'মন্তব্য নেই'))::TEXT,
               r.customer_id, u.full_name::TEXT, u.phone::TEXT, r.created_at
        FROM public.tutor_reviews r
        JOIN public.home_tutor_profiles ht ON ht.id = r.tutor_id
        LEFT JOIN public.profiles u ON u.id = r.customer_id
        WHERE r.moderation_status = 'pending'

        UNION ALL

        SELECT r.id, 'directory_review'::TEXT, r.category::TEXT,
               COALESCE(NULLIF(sl.title_bn, ''), 'সার্ভিস রিভিউ')::TEXT,
               ('★ ' || r.rating::TEXT || ' · ' || COALESCE(r.comment_bn, 'মন্তব্য নেই'))::TEXT,
               r.author_id, u.full_name::TEXT, u.phone::TEXT, r.created_at
        FROM public.directory_reviews r
        LEFT JOIN public.service_listings sl ON sl.id = r.listing_id
        LEFT JOIN public.profiles u ON u.id = r.author_id
        WHERE r.moderation_status = 'pending'
    ),
    counted AS (
        SELECT pending_items.*, COUNT(*) OVER () AS total_count
        FROM pending_items
    )
    SELECT counted.id, counted.approval_kind, counted.service_key, counted.title,
           counted.summary, counted.owner_id, counted.owner_name, counted.owner_phone,
           counted.created_at, counted.total_count
    FROM counted
    ORDER BY counted.created_at DESC, counted.id
    LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 25), 100))
    OFFSET GREATEST(COALESCE(p_offset, 0), 0);
END;
$$;

REVOKE ALL ON FUNCTION public.fn_admin_approval_queue(INTEGER, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_admin_approval_queue(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_admin_approval_queue(INTEGER, INTEGER) TO service_role;

NOTIFY pgrst, 'reload schema';
