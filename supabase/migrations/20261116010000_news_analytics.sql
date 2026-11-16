CREATE OR REPLACE FUNCTION public.get_news_analytics(
    p_from DATE DEFAULT NULL,
    p_to DATE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
DECLARE
    v_from TIMESTAMPTZ;
    v_to TIMESTAMPTZ;
    v_today TIMESTAMPTZ;
    v_today_date DATE;
    v_week TIMESTAMPTZ;
    v_month TIMESTAMPTZ;
    v_trend_from DATE;
    v_trend_to DATE;
    v_daily_from DATE;
    v_weekly_from DATE;
    v_monthly_from DATE;
    v_totals JSONB;
    v_articles JSONB;
    v_daily JSONB;
    v_weekly JSONB;
    v_monthly JSONB;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'admin only' USING ERRCODE = '42501';
    END IF;
    IF (p_from IS NULL) <> (p_to IS NULL)
       OR (p_from IS NOT NULL AND (p_to < p_from OR p_to - p_from > 366)) THEN
        RAISE EXCEPTION 'invalid news analytics date range';
    END IF;

    v_from := COALESCE(p_from::TIMESTAMP AT TIME ZONE 'Asia/Dhaka', '-infinity'::TIMESTAMPTZ);
    v_to := COALESCE((p_to + 1)::TIMESTAMP AT TIME ZONE 'Asia/Dhaka', 'infinity'::TIMESTAMPTZ);
    v_today_date := (NOW() AT TIME ZONE 'Asia/Dhaka')::DATE;
    v_today := v_today_date::TIMESTAMP AT TIME ZONE 'Asia/Dhaka';
    v_week := (v_today_date - 6)::TIMESTAMP AT TIME ZONE 'Asia/Dhaka';
    v_month := (v_today_date - 29)::TIMESTAMP AT TIME ZONE 'Asia/Dhaka';

    SELECT JSONB_BUILD_OBJECT(
        'published', (SELECT COUNT(*) FROM public.community_posts p WHERE p.kind = 'news' AND p.status = 'approved'),
        'views', COUNT(*) FILTER (WHERE e.created_at >= v_from AND e.created_at < v_to),
        'uniqueVisitors', COUNT(DISTINCT COALESCE('u:' || e.user_id::TEXT, 'v:' || e.visitor_id))
            FILTER (WHERE e.created_at >= v_from AND e.created_at < v_to AND e.traffic_class IN ('guest', 'authenticated', 'legacy')),
        'totalViews', COUNT(*),
        'totalUniqueVisitors', COUNT(DISTINCT COALESCE('u:' || e.user_id::TEXT, 'v:' || e.visitor_id))
            FILTER (WHERE e.traffic_class IN ('guest', 'authenticated', 'legacy')),
        'todayViews', COUNT(*) FILTER (WHERE e.created_at >= v_today),
        'todayVisitors', COUNT(DISTINCT COALESCE('u:' || e.user_id::TEXT, 'v:' || e.visitor_id))
            FILTER (WHERE e.created_at >= v_today AND e.traffic_class IN ('guest', 'authenticated', 'legacy')),
        'weeklyViews', COUNT(*) FILTER (WHERE e.created_at >= v_week),
        'weeklyVisitors', COUNT(DISTINCT COALESCE('u:' || e.user_id::TEXT, 'v:' || e.visitor_id))
            FILTER (WHERE e.created_at >= v_week AND e.traffic_class IN ('guest', 'authenticated', 'legacy')),
        'monthlyViews', COUNT(*) FILTER (WHERE e.created_at >= v_month),
        'monthlyVisitors', COUNT(DISTINCT COALESCE('u:' || e.user_id::TEXT, 'v:' || e.visitor_id))
            FILTER (WHERE e.created_at >= v_month AND e.traffic_class IN ('guest', 'authenticated', 'legacy'))
    )
    INTO v_totals
    FROM public.site_events_eligible e
    JOIN public.community_posts p
      ON p.kind = 'news'
     AND e.path = '/news/' || p.slug
    WHERE e.event_type = 'page_view'
      AND e.route_kind = 'post'
      AND (e.category IS NULL OR e.category = 'news');

    WITH article_events AS (
        SELECT
            p.slug,
            e.created_at,
            CASE
                WHEN e.traffic_class IN ('guest', 'authenticated', 'legacy')
                THEN COALESCE('u:' || e.user_id::TEXT, 'v:' || e.visitor_id)
            END AS visitor_key
        FROM public.site_events_eligible e
        JOIN public.community_posts p
          ON p.kind = 'news'
         AND e.path = '/news/' || p.slug
        WHERE e.event_type = 'page_view'
          AND e.route_kind = 'post'
          AND (e.category IS NULL OR e.category = 'news')
    ),
    article_metrics AS (
        SELECT
            slug,
            COUNT(*) AS total_views,
            COUNT(DISTINCT visitor_key) AS total_visitors,
            COUNT(*) FILTER (WHERE created_at >= v_from AND created_at < v_to) AS period_views,
            COUNT(DISTINCT visitor_key) FILTER (WHERE created_at >= v_from AND created_at < v_to) AS period_visitors,
            COUNT(*) FILTER (WHERE created_at >= v_today) AS today_views,
            COUNT(DISTINCT visitor_key) FILTER (WHERE created_at >= v_today) AS today_visitors,
            COUNT(*) FILTER (WHERE created_at >= v_week) AS weekly_views,
            COUNT(DISTINCT visitor_key) FILTER (WHERE created_at >= v_week) AS weekly_visitors,
            COUNT(*) FILTER (WHERE created_at >= v_month) AS monthly_views,
            COUNT(DISTINCT visitor_key) FILTER (WHERE created_at >= v_month) AS monthly_visitors,
            COUNT(*) FILTER (
                WHERE created_at >= (v_today_date - 13)::TIMESTAMP AT TIME ZONE 'Asia/Dhaka'
                  AND created_at < v_week
            ) AS previous_week_views
        FROM article_events
        GROUP BY slug
    )
    SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT(
        'slug', p.slug,
        'title', p.title_bn,
        'thumbnail', p.cover_image_url,
        'status', p.status,
        'publishedAt', p.published_at,
        'totalViews', COALESCE(m.total_views, 0),
        'totalVisitors', COALESCE(m.total_visitors, 0),
        'views', COALESCE(m.period_views, 0),
        'uniqueVisitors', COALESCE(m.period_visitors, 0),
        'todayViews', COALESCE(m.today_views, 0),
        'todayVisitors', COALESCE(m.today_visitors, 0),
        'weeklyViews', COALESCE(m.weekly_views, 0),
        'weeklyVisitors', COALESCE(m.weekly_visitors, 0),
        'monthlyViews', COALESCE(m.monthly_views, 0),
        'monthlyVisitors', COALESCE(m.monthly_visitors, 0),
        'previousWeekViews', COALESCE(m.previous_week_views, 0)
    ) ORDER BY COALESCE(m.period_views, 0) DESC, p.published_at DESC NULLS LAST, p.slug), '[]'::JSONB)
    INTO v_articles
    FROM public.community_posts p
    LEFT JOIN article_metrics m ON m.slug = p.slug
    WHERE p.kind = 'news';

    v_trend_to := COALESCE(p_to, v_today_date);
    v_trend_from := COALESCE(p_from, v_today_date - 29);
    v_daily_from := CASE WHEN p_from IS NULL THEN GREATEST(v_trend_from, v_trend_to - 29) ELSE v_trend_from END;
    v_weekly_from := CASE WHEN p_from IS NULL THEN GREATEST(v_trend_from, v_trend_to - 77) ELSE v_trend_from END;
    v_monthly_from := CASE WHEN p_from IS NULL THEN GREATEST(v_trend_from, (v_trend_to - INTERVAL '11 months')::DATE) ELSE v_trend_from END;

    SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT(
        'key', d.day::DATE::TEXT,
        'pageViews', COALESCE(t.views, 0),
        'visitors', COALESCE(t.visitors, 0)
    ) ORDER BY d.day), '[]'::JSONB)
    INTO v_daily
    FROM GENERATE_SERIES(v_daily_from, v_trend_to, INTERVAL '1 day') AS d(day)
    LEFT JOIN (
        SELECT (e.created_at AT TIME ZONE 'Asia/Dhaka')::DATE AS day,
               COUNT(*) AS views,
               COUNT(DISTINCT COALESCE('u:' || e.user_id::TEXT, 'v:' || e.visitor_id))
                   FILTER (WHERE e.traffic_class IN ('guest', 'authenticated', 'legacy')) AS visitors
        FROM public.site_events_eligible e
        JOIN public.community_posts p ON p.kind = 'news' AND e.path = '/news/' || p.slug
        WHERE e.event_type = 'page_view'
          AND e.route_kind = 'post'
          AND (e.category IS NULL OR e.category = 'news')
          AND e.created_at >= v_daily_from::TIMESTAMP AT TIME ZONE 'Asia/Dhaka'
          AND e.created_at < (v_trend_to + 1)::TIMESTAMP AT TIME ZONE 'Asia/Dhaka'
        GROUP BY 1
    ) t ON t.day = d.day::DATE;

    SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT(
        'key', w.week::DATE::TEXT,
        'pageViews', COALESCE(t.views, 0),
        'visitors', COALESCE(t.visitors, 0)
    ) ORDER BY w.week), '[]'::JSONB)
    INTO v_weekly
    FROM GENERATE_SERIES(
        DATE_TRUNC('week', v_weekly_from::TIMESTAMP),
        DATE_TRUNC('week', v_trend_to::TIMESTAMP),
        INTERVAL '1 week'
    ) AS w(week)
    LEFT JOIN (
        SELECT DATE_TRUNC('week', (e.created_at AT TIME ZONE 'Asia/Dhaka')::DATE::TIMESTAMP) AS week,
               COUNT(*) AS views,
               COUNT(DISTINCT COALESCE('u:' || e.user_id::TEXT, 'v:' || e.visitor_id))
                   FILTER (WHERE e.traffic_class IN ('guest', 'authenticated', 'legacy')) AS visitors
        FROM public.site_events_eligible e
        JOIN public.community_posts p ON p.kind = 'news' AND e.path = '/news/' || p.slug
        WHERE e.event_type = 'page_view'
          AND e.route_kind = 'post'
          AND (e.category IS NULL OR e.category = 'news')
          AND e.created_at >= v_weekly_from::TIMESTAMP AT TIME ZONE 'Asia/Dhaka'
          AND e.created_at < (v_trend_to + 1)::TIMESTAMP AT TIME ZONE 'Asia/Dhaka'
        GROUP BY 1
    ) t ON t.week = w.week;

    SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT(
        'key', m.month::DATE::TEXT,
        'pageViews', COALESCE(t.views, 0),
        'visitors', COALESCE(t.visitors, 0)
    ) ORDER BY m.month), '[]'::JSONB)
    INTO v_monthly
    FROM GENERATE_SERIES(
        DATE_TRUNC('month', v_monthly_from::TIMESTAMP),
        DATE_TRUNC('month', v_trend_to::TIMESTAMP),
        INTERVAL '1 month'
    ) AS m(month)
    LEFT JOIN (
        SELECT DATE_TRUNC('month', (e.created_at AT TIME ZONE 'Asia/Dhaka')::DATE::TIMESTAMP) AS month,
               COUNT(*) AS views,
               COUNT(DISTINCT COALESCE('u:' || e.user_id::TEXT, 'v:' || e.visitor_id))
                   FILTER (WHERE e.traffic_class IN ('guest', 'authenticated', 'legacy')) AS visitors
        FROM public.site_events_eligible e
        JOIN public.community_posts p ON p.kind = 'news' AND e.path = '/news/' || p.slug
        WHERE e.event_type = 'page_view'
          AND e.route_kind = 'post'
          AND (e.category IS NULL OR e.category = 'news')
          AND e.created_at >= v_monthly_from::TIMESTAMP AT TIME ZONE 'Asia/Dhaka'
          AND e.created_at < (v_trend_to + 1)::TIMESTAMP AT TIME ZONE 'Asia/Dhaka'
        GROUP BY 1
    ) t ON t.month = m.month;

    RETURN JSONB_BUILD_OBJECT(
        'totals', v_totals,
        'articles', v_articles,
        'daily', v_daily,
        'weekly', v_weekly,
        'monthly', v_monthly
    );
END;
$$;

REVOKE ALL ON FUNCTION public.get_news_analytics(DATE, DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_news_analytics(DATE, DATE) TO authenticated;

NOTIFY pgrst, 'reload schema';
