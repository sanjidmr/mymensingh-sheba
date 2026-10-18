-- Unified admin approval queue and persistent financial ledger.

ALTER TABLE public.tolet_profiles
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
    DROP CONSTRAINT IF EXISTS tolet_profiles_status_check;

ALTER TABLE public.tolet_profiles
    ADD CONSTRAINT tolet_profiles_status_check
    CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'paused', 'suspended'));

CREATE OR REPLACE FUNCTION public.guard_tolet_profile_rejection_reason()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF COALESCE(CURRENT_SETTING('request.jwt.claim.role', TRUE), '') = 'service_role'
       OR public.is_admin() THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
        IF NEW.rejection_reason IS NOT NULL THEN
            RAISE EXCEPTION 'Only an admin may set a To-Let profile rejection reason'
                USING ERRCODE = '42501';
        END IF;
    ELSIF NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason THEN
        RAISE EXCEPTION 'Only an admin may change a To-Let profile rejection reason'
            USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tolet_profile_rejection_reason_guard ON public.tolet_profiles;
CREATE TRIGGER trg_tolet_profile_rejection_reason_guard
BEFORE INSERT OR UPDATE ON public.tolet_profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_tolet_profile_rejection_reason();

CREATE OR REPLACE FUNCTION public.prevent_self_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    caller_role TEXT;
BEGIN
    IF COALESCE(CURRENT_SETTING('request.jwt.claim.role', TRUE), '') = 'service_role' THEN
        RETURN NEW;
    END IF;

    IF NEW.status IN ('approved', 'suspended', 'rejected') THEN
        IF TG_OP = 'UPDATE' AND OLD.status = NEW.status THEN
            RETURN NEW;
        END IF;
        SELECT p.role INTO caller_role
        FROM public.profiles p
        WHERE p.id = auth.uid();
        IF COALESCE(caller_role, '') <> 'admin' THEN
            RAISE EXCEPTION 'Status change to % requires admin approval', NEW.status;
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
        SELECT p.id AS id, 'post'::TEXT AS approval_kind, p.kind::TEXT AS service_key,
               p.title_bn::TEXT AS title, p.summary_bn::TEXT AS summary,
               p.author_id AS owner_id, p.author_name::TEXT AS owner_name,
               u.phone::TEXT AS owner_phone, p.created_at AS created_at
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

CREATE TABLE IF NOT EXISTS public.admin_financial_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_key TEXT NOT NULL
        CHECK (service_key IN ('tolet', 'tutor', 'blood_donor', 'wifi', 'coaching', 'vehicle', 'staff', 'other')),
    income_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (income_amount >= 0),
    due_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (due_amount >= 0),
    record_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT NOT NULL DEFAULT '' CHECK (char_length(notes) <= 2000),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT admin_financial_records_amount_check
        CHECK (income_amount > 0 OR due_amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_admin_financial_records_date
    ON public.admin_financial_records (record_date DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_financial_records_service_date
    ON public.admin_financial_records (service_key, record_date DESC);

ALTER TABLE public.admin_financial_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage financial records" ON public.admin_financial_records;
CREATE POLICY "Admins manage financial records"
    ON public.admin_financial_records
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_financial_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_financial_records TO service_role;

CREATE OR REPLACE FUNCTION public.fn_admin_financial_summary()
RETURNS TABLE (
    service_key TEXT,
    income_total NUMERIC,
    due_total NUMERIC,
    record_count BIGINT
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
    SELECT r.service_key, SUM(r.income_amount), SUM(r.due_amount), COUNT(*)
    FROM public.admin_financial_records r
    GROUP BY r.service_key
    ORDER BY r.service_key;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_admin_financial_summary() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_admin_financial_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_admin_financial_summary() TO service_role;

NOTIFY pgrst, 'reload schema';
