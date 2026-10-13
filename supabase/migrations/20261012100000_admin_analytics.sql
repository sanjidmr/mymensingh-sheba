-- Bounded, admin-only analytics aggregates. Raw records and customer contact
-- fields never leave Postgres for the analytics screen.
CREATE OR REPLACE FUNCTION public.get_admin_analytics(p_from DATE, p_to DATE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
DECLARE
    result JSONB;
    range_start TIMESTAMPTZ;
    range_end TIMESTAMPTZ;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'admin only';
    END IF;
    IF p_from IS NULL OR p_to IS NULL OR p_to < p_from OR p_to - p_from > 366 THEN
        RAISE EXCEPTION 'invalid analytics date range';
    END IF;
    range_start := p_from::TIMESTAMP AT TIME ZONE 'UTC';
    range_end := (p_to + 1)::TIMESTAMP AT TIME ZONE 'UTC';

    SELECT JSONB_BUILD_OBJECT(
        'customerTotal', (
            SELECT COUNT(*) FROM public.profiles p WHERE p.role = 'customer'
        ),
        'newCustomersByDay', (
            SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT('key', d.day::TEXT, 'count', d.total) ORDER BY d.day), '[]'::JSONB)
            FROM (
                SELECT (p.created_at AT TIME ZONE 'UTC')::DATE AS day, COUNT(*) AS total
                FROM public.profiles p
                WHERE p.role = 'customer'
                  AND p.created_at >= range_start
                  AND p.created_at < range_end
                GROUP BY (p.created_at AT TIME ZONE 'UTC')::DATE
            ) d
        ),
        'toletListings', (
            SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT('key', l.property_type || ':' || l.status, 'count', l.total) ORDER BY l.property_type, l.status), '[]'::JSONB)
            FROM (
                SELECT property_type, status, COUNT(*) AS total
                FROM public.tolet_listings
                WHERE created_at >= range_start AND created_at < range_end
                GROUP BY property_type, status
            ) l
        ),
        'serviceListings', (
            SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT('key', s.category || ':' || CASE WHEN s.active THEN 'active' ELSE 'inactive' END, 'count', s.total) ORDER BY s.category, s.active), '[]'::JSONB)
            FROM (
                SELECT category, COALESCE(is_active, FALSE) AS active, COUNT(*) AS total
                FROM public.service_listings
                WHERE created_at >= range_start AND created_at < range_end
                GROUP BY category, COALESCE(is_active, FALSE)
            ) s
        ),
        'communityPosts', (
            SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT('key', p.kind || ':' || p.status, 'count', p.total) ORDER BY p.kind, p.status), '[]'::JSONB)
            FROM (
                SELECT kind, status, COUNT(*) AS total
                FROM public.community_posts
                WHERE created_at >= range_start AND created_at < range_end
                GROUP BY kind, status
            ) p
        ),
        'serviceRequests', (
            SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT('key', r.service_slug || ':' || r.status, 'count', r.total) ORDER BY r.service_slug, r.status), '[]'::JSONB)
            FROM (
                SELECT service_slug, status, COUNT(*) AS total
                FROM public.service_requests
                WHERE created_at >= range_start AND created_at < range_end
                GROUP BY service_slug, status
            ) r
        ),
        'toletRequests', (
            SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT('key', r.status, 'count', r.total) ORDER BY r.status), '[]'::JSONB)
            FROM (
                SELECT status, COUNT(*) AS total FROM public.tolet_requests
                WHERE created_at >= range_start AND created_at < range_end
                GROUP BY status
            ) r
        ),
        'vehicleRequests', (
            SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT('key', r.status, 'count', r.total) ORDER BY r.status), '[]'::JSONB)
            FROM (
                SELECT status, COUNT(*) AS total FROM public.vehicle_requests
                WHERE created_at >= range_start AND created_at < range_end
                GROUP BY status
            ) r
        ),
        'bloodRequests', (
            SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT('key', r.status, 'count', r.total) ORDER BY r.status), '[]'::JSONB)
            FROM (
                SELECT status, COUNT(*) AS total FROM public.blood_requests
                WHERE created_at >= range_start AND created_at < range_end
                GROUP BY status
            ) r
        ),
        'bloodDonors', (
            SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT(
                'key', d.status, 'count', d.total, 'secondaryCount', d.available
            ) ORDER BY d.status), '[]'::JSONB)
            FROM (
                SELECT status, COUNT(*) AS total,
                       COUNT(*) FILTER (WHERE is_available IS TRUE AND status = 'approved') AS available
                FROM public.blood_donor_profiles
                GROUP BY status
            ) d
        ),
        'reports', (
            SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT('key', r.category || ':' || r.status, 'count', r.total) ORDER BY r.category, r.status), '[]'::JSONB)
            FROM (
                SELECT category, status, COUNT(*) AS total
                FROM (
                    SELECT 'tolet'::TEXT AS category, status, created_at FROM public.listing_reports
                    UNION ALL SELECT 'tutor', status, created_at FROM public.tutor_reports
                    UNION ALL SELECT 'blood_donor', status, created_at FROM public.blood_donor_reports
                    UNION ALL SELECT 'staff', status, created_at FROM public.staff_profile_reports
                    UNION ALL SELECT 'community_post', status, created_at FROM public.community_post_reports
                ) report_rows
                WHERE created_at >= range_start AND created_at < range_end
                GROUP BY category, status
            ) r
        ),
        'toletEvents', (
            SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT('key', e.event_type, 'count', e.total) ORDER BY e.event_type), '[]'::JSONB)
            FROM (
                SELECT event_type, COUNT(*) AS total FROM public.tolet_listing_events
                WHERE created_at >= range_start AND created_at < range_end
                GROUP BY event_type
            ) e
        ),
        'supportMessages', (
            SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT('key', m.status, 'count', m.total) ORDER BY m.status), '[]'::JSONB)
            FROM (
                SELECT status, COUNT(*) AS total FROM public.contact_messages
                WHERE created_at >= range_start AND created_at < range_end
                GROUP BY status
            ) m
        ),
        'adminNotifications', (
            SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT('key', n.read_state, 'count', n.total) ORDER BY n.read_state), '[]'::JSONB)
            FROM (
                SELECT CASE WHEN is_read THEN 'read' ELSE 'unread' END AS read_state, COUNT(*) AS total
                FROM public.notifications
                WHERE target_role = 'admin'
                  AND created_at >= range_start AND created_at < range_end
                GROUP BY is_read
            ) n
        ),
        'auditActions', (
            SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT('key', a.entity_table || ':' || a.operation, 'count', a.total) ORDER BY a.entity_table, a.operation), '[]'::JSONB)
            FROM (
                SELECT entity_table, operation, COUNT(*) AS total FROM public.admin_audit_log
                WHERE created_at >= range_start AND created_at < range_end
                GROUP BY entity_table, operation
            ) a
        )
    ) INTO result;

    RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_analytics(DATE, DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_analytics(DATE, DATE) TO authenticated;

-- Preserve staff assignment identifiers in the existing allowlisted audit
-- state. Do not capture admin_notes or support reply bodies.
CREATE OR REPLACE FUNCTION public.capture_admin_audit_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    old_row JSONB;
    new_row JSONB;
    row_data JSONB;
    record_key TEXT;
    old_state JSONB;
    new_state JSONB;
BEGIN
    IF NOT public.is_admin() THEN
        IF TG_OP = 'DELETE' THEN
            RETURN OLD;
        END IF;
        RETURN NEW;
    END IF;

    IF TG_OP IN ('UPDATE', 'DELETE') THEN
        old_row := TO_JSONB(OLD);
    END IF;
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        new_row := TO_JSONB(NEW);
    END IF;

    IF TG_OP = 'UPDATE' AND old_row = new_row THEN
        RETURN NEW;
    END IF;

    row_data := COALESCE(new_row, old_row);
    record_key := COALESCE(
        row_data ->> 'id',
        row_data ->> 'user_id',
        row_data ->> 'key'
    );

    old_state := JSONB_STRIP_NULLS(JSONB_BUILD_OBJECT(
        'status', old_row ->> 'status',
        'role', old_row ->> 'role',
        'is_active', old_row ->> 'is_active',
        'is_enabled', old_row ->> 'is_enabled',
        'is_featured', old_row ->> 'is_featured',
        'profile_id', old_row ->> 'profile_id'
    ));
    new_state := JSONB_STRIP_NULLS(JSONB_BUILD_OBJECT(
        'status', new_row ->> 'status',
        'role', new_row ->> 'role',
        'is_active', new_row ->> 'is_active',
        'is_enabled', new_row ->> 'is_enabled',
        'is_featured', new_row ->> 'is_featured',
        'profile_id', new_row ->> 'profile_id'
    ));

    INSERT INTO public.admin_audit_log (
        actor_id, entity_table, record_id, operation, before_state, after_state
    )
    VALUES (
        AUTH.UID(),
        TG_TABLE_NAME,
        record_key,
        LOWER(TG_OP),
        COALESCE(old_state, '{}'::JSONB),
        COALESCE(new_state, '{}'::JSONB)
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.capture_admin_audit_event() FROM PUBLIC;

-- Support replies are customer-visible events, but their body is private
-- conversation content and must not be copied into the audit trail.
DROP TRIGGER IF EXISTS admin_audit_event ON public.contact_message_replies;
CREATE TRIGGER admin_audit_event
AFTER INSERT OR UPDATE OR DELETE ON public.contact_message_replies
FOR EACH ROW EXECUTE FUNCTION public.capture_admin_audit_event();
