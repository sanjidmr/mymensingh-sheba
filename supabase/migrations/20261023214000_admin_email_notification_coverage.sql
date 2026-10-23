CREATE OR REPLACE FUNCTION public.notify_admin_provider_profile_submitted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    profile_name TEXT;
    profile_kind TEXT;
    related_kind TEXT;
BEGIN
    IF NEW.status <> 'pending_approval' THEN
        RETURN NEW;
    END IF;
    IF TG_OP = 'UPDATE' AND OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    IF TG_TABLE_NAME = 'tolet_profiles' THEN
        profile_name := NEW.owner_name;
        profile_kind := 'বাসাভাড়া মালিক';
        related_kind := 'tolet_profile';
    ELSIF TG_TABLE_NAME = 'home_tutor_profiles' THEN
        profile_name := NEW.full_name;
        profile_kind := 'গৃহশিক্ষক';
        related_kind := 'tutor_profile';
    ELSIF TG_TABLE_NAME = 'blood_donor_profiles' THEN
        profile_name := NEW.full_name;
        profile_kind := 'রক্তদাতা';
        related_kind := 'donor_profile';
    ELSE
        RAISE EXCEPTION 'Unsupported provider profile table: %', TG_TABLE_NAME;
    END IF;

    INSERT INTO public.notifications (user_id, target_role, title, body, type, related_type, related_id)
    VALUES (
        NULL,
        'admin',
        'নতুন ' || profile_kind || ' অনুমোদনের অপেক্ষায়',
        profile_name || ' এর প্রোফাইল পর্যালোচনা করুন।',
        'info',
        related_kind,
        NEW.id::text
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_admin_tolet_profile_submitted ON public.tolet_profiles;
CREATE TRIGGER trg_admin_tolet_profile_submitted
AFTER INSERT OR UPDATE OF status ON public.tolet_profiles
FOR EACH ROW EXECUTE FUNCTION public.notify_admin_provider_profile_submitted();

DROP TRIGGER IF EXISTS trg_admin_tutor_profile_submitted ON public.home_tutor_profiles;
CREATE TRIGGER trg_admin_tutor_profile_submitted
AFTER INSERT OR UPDATE OF status ON public.home_tutor_profiles
FOR EACH ROW EXECUTE FUNCTION public.notify_admin_provider_profile_submitted();

DROP TRIGGER IF EXISTS trg_admin_donor_profile_submitted ON public.blood_donor_profiles;
CREATE TRIGGER trg_admin_donor_profile_submitted
AFTER INSERT OR UPDATE OF status ON public.blood_donor_profiles
FOR EACH ROW EXECUTE FUNCTION public.notify_admin_provider_profile_submitted();

CREATE OR REPLACE FUNCTION public.enqueue_uncovered_admin_notification_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    event_type TEXT;
    target_id UUID;
    has_target_id BOOLEAN;
    admin_path TEXT;
    safe_title TEXT;
    safe_summary TEXT;
BEGIN
    IF NEW.target_role <> 'admin' THEN
        RETURN NEW;
    END IF;

    -- These event sources already have source-table outbox triggers.
    IF COALESCE(NEW.related_type, '') IN (
        'service_request',
        'tolet_listing',
        'blood_donor_reports',
        'listing_reports',
        'tutor_reports',
        'staff_profile_reports',
        'community_post_reports',
        'contact_message'
    ) THEN
        RETURN NEW;
    END IF;

    event_type := COALESCE(NULLIF(NEW.related_type, ''), 'admin_notification');
    IF event_type IN ('tutor_profile', 'donor_profile')
       AND NEW.title NOT LIKE 'নতুন % অনুমোদনের অপেক্ষায়' THEN
        RETURN NEW;
    END IF;

    has_target_id := COALESCE(
        NEW.related_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
        FALSE
    );
    target_id := CASE WHEN has_target_id THEN NEW.related_id::UUID ELSE NEW.id END;
    admin_path := CASE event_type
        WHEN 'community_post' THEN
            CASE WHEN NOT has_target_id THEN '/admin/posts' ELSE '/admin/posts/' || target_id::text END
        WHEN 'vehicle_request' THEN
            CASE WHEN NOT has_target_id THEN '/admin/vehicle-requests' ELSE '/admin/vehicle-requests/' || target_id::text END
        WHEN 'service_listing' THEN '/admin/approvals'
        WHEN 'tolet_profile' THEN '/admin/approvals'
        WHEN 'tutor_profile' THEN
            CASE WHEN NOT has_target_id THEN '/admin/verifications' ELSE '/admin/verifications/' || target_id::text END
        WHEN 'donor_profile' THEN
            CASE WHEN NOT has_target_id THEN '/admin/blood/donors' ELSE '/admin/blood/donors/' || target_id::text END
        WHEN 'blood_request' THEN '/admin/notifications'
        ELSE '/admin/notifications'
    END;
    safe_title := LEFT(BTRIM(COALESCE(NEW.title, 'নতুন অ্যাডমিন নোটিফিকেশন')), 200);
    safe_summary := LEFT(BTRIM(COALESCE(NEW.body, 'অ্যাডমিন প্যানেলে নতুন ঘটনা এসেছে।')), 1200);

    INSERT INTO public.admin_email_outbox (
        idempotency_key,
        related_type,
        related_id,
        payload,
        created_at
    )
    VALUES (
        'admin_notification:' || NEW.id::text,
        event_type,
        target_id,
        jsonb_build_object(
            'notification_id', NEW.id,
            'occurred_at', NEW.created_at,
            'title', safe_title,
            'summary', safe_summary,
            'admin_path', admin_path
        ),
        NEW.created_at
    )
    ON CONFLICT (idempotency_key) DO NOTHING;
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_admin_provider_profile_submitted() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enqueue_uncovered_admin_notification_email() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_admin_notification_email_outbox ON public.notifications;
CREATE TRIGGER trg_admin_notification_email_outbox
AFTER INSERT ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.enqueue_uncovered_admin_notification_email();
