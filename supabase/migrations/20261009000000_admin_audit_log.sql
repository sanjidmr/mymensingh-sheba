-- Durable, admin-only audit trail for changes made through the control panel.
-- Store record identifiers and a small allowlist of state fields only; never
-- copy customer contact details or free-form form data into the audit log.

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    entity_table TEXT NOT NULL,
    record_id TEXT,
    operation TEXT NOT NULL CHECK (operation IN ('insert', 'update', 'delete')),
    before_state JSONB NOT NULL DEFAULT '{}'::JSONB,
    after_state JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created
    ON public.admin_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_entity
    ON public.admin_audit_log (entity_table, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_actor
    ON public.admin_audit_log (actor_id, created_at DESC);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read audit log" ON public.admin_audit_log;
CREATE POLICY "Admins read audit log"
    ON public.admin_audit_log FOR SELECT
    TO authenticated
    USING (public.is_admin());

REVOKE ALL ON public.admin_audit_log FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.admin_audit_log TO authenticated;

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
        'is_featured', old_row ->> 'is_featured'
    ));
    new_state := JSONB_STRIP_NULLS(JSONB_BUILD_OBJECT(
        'status', new_row ->> 'status',
        'role', new_row ->> 'role',
        'is_active', new_row ->> 'is_active',
        'is_enabled', new_row ->> 'is_enabled',
        'is_featured', new_row ->> 'is_featured'
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

DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY ARRAY[
        'profiles',
        'tolet_profiles',
        'home_tutor_profiles',
        'blood_donor_profiles',
        'staff_profiles',
        'service_requests',
        'tolet_requests',
        'vehicle_requests',
        'blood_requests',
        'tutor_reviews',
        'tolet_listings',
        'community_posts',
        'service_listings',
        'emergency_contacts',
        'hero_slides',
        'platform_settings',
        'contact_messages',
        'listing_reports',
        'staff_profile_reports',
        'tutor_reports',
        'blood_donor_reports',
        'community_post_reports'
    ]
    LOOP
        EXECUTE FORMAT(
            'DROP TRIGGER IF EXISTS admin_audit_event ON public.%I',
            table_name
        );
        EXECUTE FORMAT(
            'CREATE TRIGGER admin_audit_event
             AFTER INSERT OR UPDATE OR DELETE ON public.%I
             FOR EACH ROW EXECUTE FUNCTION public.capture_admin_audit_event()',
            table_name
        );
    END LOOP;
END
$$;
