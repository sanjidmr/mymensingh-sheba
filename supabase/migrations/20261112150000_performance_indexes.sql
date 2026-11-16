CREATE INDEX IF NOT EXISTS idx_perf_tolet_listings_status_area_created
    ON public.tolet_listings (status, area_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_perf_tolet_listings_owner_created
    ON public.tolet_listings (owner_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_perf_service_requests_customer_created
    ON public.service_requests (customer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_perf_service_requests_slug_status_created
    ON public.service_requests (service_slug, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_perf_service_listings_public_order
    ON public.service_listings (
        category,
        status,
        is_active,
        is_featured DESC,
        created_at DESC
    );

CREATE INDEX IF NOT EXISTS idx_perf_home_tutor_profiles_status_published
    ON public.home_tutor_profiles (status, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_perf_community_posts_kind_status_created
    ON public.community_posts (kind, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_perf_staff_profiles_service_active_name
    ON public.staff_profiles (service_slug, is_active, name_bn);

CREATE INDEX IF NOT EXISTS idx_perf_notifications_user_unread_created
    ON public.notifications (user_id, created_at DESC)
    WHERE is_read = FALSE;

CREATE INDEX IF NOT EXISTS idx_perf_notifications_admin_unread_created
    ON public.notifications (target_role, created_at DESC)
    WHERE target_role = 'admin' AND is_read = FALSE;

CREATE INDEX IF NOT EXISTS idx_perf_blood_donors_area_blood_created
    ON public.blood_donor_profiles (area_id, blood_group, created_at DESC)
    WHERE status = 'approved';
