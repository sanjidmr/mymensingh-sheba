-- Admin-only engagement rollups and a separate, manually maintained
-- completed-work counter for staff profiles.

-- A saved emergency contact is published by its active flag; a source note is
-- optional metadata, not a condition for public visibility.
DROP POLICY IF EXISTS "Active emergency contacts are public"
    ON public.emergency_contacts;
CREATE POLICY "Active emergency contacts are public"
    ON public.emergency_contacts FOR SELECT
    TO anon, authenticated
    USING (is_active = TRUE);

ALTER TABLE public.staff_profiles
    ADD COLUMN IF NOT EXISTS completed_job_count INTEGER NOT NULL DEFAULT 0;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.staff_profiles'::regclass
          AND conname = 'staff_profiles_completed_job_count_check'
    ) THEN
        ALTER TABLE public.staff_profiles
            ADD CONSTRAINT staff_profiles_completed_job_count_check
            CHECK (completed_job_count >= 0);
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_admin_engagement_analytics(p_scope TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
DECLARE
    v_paths TEXT[];
    v_categories TEXT[];
    v_directory_visits BIGINT := 0;
    v_profile_views BIGINT := 0;
    v_call_clicks BIGINT := 0;
    v_whatsapp_clicks BIGINT := 0;
    v_other_clicks BIGINT := 0;
    v_form_submits BIGINT := 0;
    v_profiles JSONB := '[]'::JSONB;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'admin only';
    END IF;

    IF p_scope IS NULL OR p_scope NOT IN (
        'tolet', 'wifi', 'coaching', 'blood-donor', 'home-tutor',
        'news', 'job', 'buy_sell', 'posts'
    ) THEN
        RAISE EXCEPTION 'invalid engagement scope';
    END IF;

    CASE p_scope
        WHEN 'tolet' THEN
            v_paths := ARRAY['/tolet'];
        WHEN 'wifi' THEN
            v_paths := ARRAY['/wifi'];
        WHEN 'coaching' THEN
            v_paths := ARRAY['/coaching'];
        WHEN 'blood-donor' THEN
            v_paths := ARRAY['/blood-donor'];
        WHEN 'home-tutor' THEN
            v_paths := ARRAY['/home-tutor'];
        WHEN 'news' THEN
            v_paths := ARRAY['/news'];
        WHEN 'job' THEN
            v_paths := ARRAY['/jobs'];
        WHEN 'buy_sell' THEN
            v_paths := ARRAY['/buy-sell'];
        WHEN 'posts' THEN
            v_paths := ARRAY['/news', '/jobs', '/buy-sell'];
    END CASE;

    IF p_scope = 'posts' THEN
        v_categories := ARRAY['news', 'job', 'buy_sell'];
    ELSE
        v_categories := ARRAY[p_scope];
    END IF;

    SELECT COUNT(*)
    INTO v_directory_visits
    FROM public.site_events_eligible AS event
    WHERE event.event_type = 'page_view'
      AND event.path = ANY(v_paths);

    IF p_scope = 'tolet' THEN
        SELECT
            COUNT(*) FILTER (WHERE event.event_type = 'view'),
            COUNT(*) FILTER (WHERE event.event_type = 'call_click'),
            COUNT(*) FILTER (WHERE event.event_type = 'whatsapp_click'),
            COUNT(*) FILTER (WHERE event.event_type IN ('favorite', 'share'))
        INTO v_profile_views, v_call_clicks, v_whatsapp_clicks, v_other_clicks
        FROM public.tolet_listing_events AS event;

        SELECT COALESCE(
            JSONB_AGG(JSONB_BUILD_OBJECT(
                'contentId', listing_id,
                'views', views,
                'callClicks', call_clicks,
                'whatsappClicks', whatsapp_clicks,
                'otherClicks', other_clicks,
                'formSubmits', 0
            ) ORDER BY listing_id),
            '[]'::JSONB
        )
        INTO v_profiles
        FROM (
            SELECT
                event.listing_id,
                COUNT(*) FILTER (WHERE event.event_type = 'view') AS views,
                COUNT(*) FILTER (WHERE event.event_type = 'call_click') AS call_clicks,
                COUNT(*) FILTER (WHERE event.event_type = 'whatsapp_click') AS whatsapp_clicks,
                COUNT(*) FILTER (WHERE event.event_type IN ('favorite', 'share')) AS other_clicks
            FROM public.tolet_listing_events AS event
            GROUP BY event.listing_id
        ) AS listing_events;
    ELSE
        SELECT
            COUNT(*) FILTER (
                WHERE event.event_type = 'page_view'
                  AND event.category = ANY(v_categories)
                  AND event.content_id IS NOT NULL
                  AND event.path <> ALL(v_paths)
            ),
            COUNT(*) FILTER (
                WHERE event.event_type = 'cta_click'
                  AND event.cta_type = 'call'
            ),
            COUNT(*) FILTER (
                WHERE event.event_type = 'cta_click'
                  AND event.cta_type = 'whatsapp'
            ),
            COUNT(*) FILTER (
                WHERE event.event_type = 'cta_click'
                  AND event.cta_type NOT IN ('call', 'whatsapp')
            ),
            COUNT(*) FILTER (WHERE event.event_type = 'form_submit')
        INTO v_profile_views, v_call_clicks, v_whatsapp_clicks, v_other_clicks, v_form_submits
        FROM public.site_events_eligible AS event
        WHERE event.category = ANY(v_categories)
           OR (event.event_type = 'page_view' AND event.path = ANY(v_paths));

        SELECT COALESCE(
            JSONB_AGG(JSONB_BUILD_OBJECT(
                'contentId', content_id,
                'views', views,
                'callClicks', call_clicks,
                'whatsappClicks', whatsapp_clicks,
                'otherClicks', other_clicks,
                'formSubmits', form_submits
            ) ORDER BY content_id),
            '[]'::JSONB
        )
        INTO v_profiles
        FROM (
            SELECT
                event.content_id,
                COUNT(*) FILTER (
                    WHERE event.event_type = 'page_view'
                      AND event.path <> ALL(v_paths)
                ) AS views,
                COUNT(*) FILTER (
                    WHERE event.event_type = 'cta_click'
                      AND event.cta_type = 'call'
                ) AS call_clicks,
                COUNT(*) FILTER (
                    WHERE event.event_type = 'cta_click'
                      AND event.cta_type = 'whatsapp'
                ) AS whatsapp_clicks,
                COUNT(*) FILTER (
                    WHERE event.event_type = 'cta_click'
                      AND event.cta_type NOT IN ('call', 'whatsapp')
                ) AS other_clicks,
                COUNT(*) FILTER (WHERE event.event_type = 'form_submit') AS form_submits
            FROM public.site_events_eligible AS event
            WHERE event.category = ANY(v_categories)
              AND event.content_id IS NOT NULL
            GROUP BY event.content_id
        ) AS profile_events;
    END IF;

    RETURN JSONB_BUILD_OBJECT(
        'directoryVisits', v_directory_visits,
        'profileViews', v_profile_views,
        'callClicks', v_call_clicks,
        'whatsappClicks', v_whatsapp_clicks,
        'otherClicks', v_other_clicks,
        'formSubmits', v_form_submits,
        'profiles', v_profiles
    );
END;
$$;

REVOKE ALL ON FUNCTION public.fn_admin_engagement_analytics(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_admin_engagement_analytics(TEXT) TO authenticated;


DROP FUNCTION IF EXISTS public.fn_admin_staff_job_counts(UUID[]);

CREATE FUNCTION public.fn_admin_staff_job_counts(p_staff_ids UUID[])
RETURNS TABLE (staff_id UUID, job_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'admin only';
    END IF;

    RETURN QUERY
    SELECT requested.staff_id, COUNT(request.id)
    FROM (
        SELECT DISTINCT input_id AS staff_id
        FROM UNNEST(COALESCE(p_staff_ids, ARRAY[]::UUID[])) AS input_ids(input_id)
        WHERE input_id IS NOT NULL
    ) AS requested
    LEFT JOIN public.service_requests AS request
        ON request.profile_id = requested.staff_id::TEXT
    GROUP BY requested.staff_id;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_admin_staff_job_counts(UUID[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_admin_staff_job_counts(UUID[]) TO authenticated;

LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'admin only';
    END IF;

    RETURN QUERY
    SELECT requested.staff_id, COUNT(request.id)
    FROM (
        SELECT DISTINCT input_id AS staff_id
        FROM UNNEST(COALESCE(p_staff_ids, ARRAY[]::UUID[])) AS input_ids(input_id)
        WHERE input_id IS NOT NULL
    ) AS requested
    LEFT JOIN public.service_requests AS request
        ON request.profile_id = requested.staff_id::TEXT
    GROUP BY requested.staff_id;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_admin_staff_job_counts(UUID[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_admin_staff_job_counts(UUID[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.fn_admin_adjust_staff_completed_jobs(
    p_staff_id UUID,
    p_delta INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'admin only';
    END IF;
    IF p_staff_id IS NULL OR p_delta IS NULL OR p_delta NOT IN (-1, 1) THEN
        RAISE EXCEPTION 'invalid staff job adjustment';
    END IF;

    UPDATE public.staff_profiles
    SET completed_job_count = completed_job_count + p_delta,
        updated_at = NOW()
    WHERE id = p_staff_id
      AND completed_job_count + p_delta >= 0
    RETURNING completed_job_count INTO v_count;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'staff profile not found or completed job count is already zero';
    END IF;

    RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_admin_adjust_staff_completed_jobs(UUID, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_admin_adjust_staff_completed_jobs(UUID, INTEGER) TO authenticated;
