CREATE TABLE IF NOT EXISTS public.admin_email_outbox (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key TEXT NOT NULL UNIQUE,
    related_type TEXT NOT NULL,
    related_id UUID,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'accepted_by_provider', 'delivered', 'retry_scheduled', 'failed')),
    attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
    next_retry_at TIMESTAMPTZ,
    lease_token UUID,
    lease_until TIMESTAMPTZ,
    last_error TEXT,
    provider_message_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_admin_email_outbox_ready
    ON public.admin_email_outbox (next_retry_at, created_at)
    WHERE status IN ('pending', 'retry_scheduled', 'processing');
CREATE INDEX IF NOT EXISTS idx_admin_email_outbox_provider_message
    ON public.admin_email_outbox (provider_message_id)
    WHERE provider_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_admin_email_outbox_created
    ON public.admin_email_outbox (created_at DESC);

ALTER TABLE public.admin_email_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_email_outbox FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.admin_email_outbox TO service_role;

CREATE TABLE IF NOT EXISTS public.admin_email_webhook_events (
    event_key TEXT PRIMARY KEY,
    provider_message_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE public.admin_email_webhook_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_email_webhook_events FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.admin_email_webhook_events TO service_role;

CREATE TABLE IF NOT EXISTS public.admin_email_worker_lock (
    lock_name TEXT PRIMARY KEY,
    lease_token UUID,
    lease_until TIMESTAMPTZ
);
INSERT INTO public.admin_email_worker_lock (lock_name)
VALUES ('default')
ON CONFLICT (lock_name) DO NOTHING;

ALTER TABLE public.admin_email_worker_lock ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_email_worker_lock FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.admin_email_worker_lock TO service_role;

CREATE OR REPLACE FUNCTION public.enqueue_admin_email_outbox_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_type TEXT;
    v_event_key TEXT;
    v_occurred_at TIMESTAMPTZ;
    v_title TEXT;
    v_summary TEXT;
    v_admin_path TEXT;
BEGIN
    v_occurred_at := COALESCE(NEW.created_at, TIMEZONE('utc'::text, NOW()));

    CASE TG_TABLE_NAME
        WHEN 'service_requests' THEN
            IF NEW.status <> 'new' THEN RETURN NEW; END IF;
            v_type := 'service_request';
            v_event_key := v_type || ':' || NEW.id::text;
        WHEN 'tolet_listings' THEN
            IF NEW.status <> 'pending_review' THEN
                RETURN NEW;
            END IF;
            IF TG_OP = 'UPDATE' THEN
                IF OLD.status = NEW.status THEN RETURN NEW; END IF;
            END IF;
            v_type := 'tolet_listing';
            v_occurred_at := COALESCE(NEW.updated_at, NEW.created_at, TIMEZONE('utc'::text, NOW()));
            v_event_key := v_type || ':' || NEW.id::text || ':' || v_occurred_at::text;
        WHEN 'blood_donor_reports' THEN
            v_type := 'blood_donor_reports';
            v_event_key := v_type || ':' || NEW.id::text;
        WHEN 'listing_reports' THEN
            v_type := 'listing_reports';
            v_event_key := v_type || ':' || NEW.id::text;
        WHEN 'tutor_reports' THEN
            v_type := 'tutor_reports';
            v_event_key := v_type || ':' || NEW.id::text;
        WHEN 'staff_profile_reports' THEN
            v_type := 'staff_profile_reports';
            v_event_key := v_type || ':' || NEW.id::text;
        WHEN 'community_post_reports' THEN
            v_type := 'community_post_reports';
            v_event_key := v_type || ':' || NEW.id::text;
        WHEN 'contact_messages' THEN
            IF NEW.subject <> 'complaint'
               OR COALESCE(NEW.complaint_category, '') NOT IN ('safety', 'payment') THEN
                RETURN NEW;
            END IF;
            v_type := 'contact_message';
            v_event_key := v_type || ':' || NEW.id::text;
        ELSE
            RETURN NEW;
    END CASE;

    CASE v_type
        WHEN 'service_request' THEN
            v_title := 'নতুন সার্ভিস রিকোয়েস্ট';
            v_summary := 'নতুন ' || LEFT(NEW.service_slug, 60) || ' সার্ভিস রিকোয়েস্ট পর্যালোচনার অপেক্ষায় আছে।';
            v_admin_path := '/admin/requests';
        WHEN 'tolet_listing' THEN
            v_title := 'নতুন বাসাভাড়ার বিজ্ঞাপন পর্যালোচনা';
            v_summary := 'একটি বাসাভাড়ার বিজ্ঞাপন অ্যাডমিন পর্যালোচনার অপেক্ষায় আছে।';
            v_admin_path := '/admin/tolet';
        WHEN 'contact_message' THEN
            IF NEW.complaint_category = 'safety' THEN
                v_title := 'নিরাপত্তা বিষয়ে নতুন অভিযোগ';
                v_summary := 'একটি নিরাপত্তা সংক্রান্ত অভিযোগ সাপোর্ট ইনবক্সে এসেছে।';
            ELSE
                v_title := 'পেমেন্ট বিষয়ে নতুন অভিযোগ';
                v_summary := 'একটি পেমেন্ট সংক্রান্ত অভিযোগ সাপোর্ট ইনবক্সে এসেছে।';
            END IF;
            v_admin_path := '/admin/messages';
        ELSE
            v_title := CASE v_type
                WHEN 'blood_donor_reports' THEN 'নতুন রক্তদাতা রিপোর্ট'
                WHEN 'listing_reports' THEN 'নতুন বাসাভাড়া বিজ্ঞাপন রিপোর্ট'
                WHEN 'tutor_reports' THEN 'নতুন গৃহশিক্ষক রিপোর্ট'
                WHEN 'staff_profile_reports' THEN 'নতুন কর্মী প্রোফাইল রিপোর্ট'
                ELSE 'নতুন কমিউনিটি পোস্ট রিপোর্ট'
            END;
            v_summary := 'একটি নতুন রিপোর্ট মডারেশন পর্যালোচনার অপেক্ষায় আছে।';
            v_admin_path := '/admin/reports';
    END CASE;

    INSERT INTO public.admin_email_outbox (idempotency_key, related_type, related_id, payload, created_at)
    VALUES (
        v_event_key,
        v_type,
        NEW.id,
        jsonb_build_object(
            'occurred_at', v_occurred_at,
            'title', v_title,
            'summary', v_summary,
            'admin_path', v_admin_path
        ),
        v_occurred_at
    )
    ON CONFLICT (idempotency_key) DO NOTHING;
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_admin_email_outbox_event() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_service_requests_admin_email_outbox ON public.service_requests;
CREATE TRIGGER trg_service_requests_admin_email_outbox
AFTER INSERT ON public.service_requests
FOR EACH ROW EXECUTE FUNCTION public.enqueue_admin_email_outbox_event();

DROP TRIGGER IF EXISTS trg_tolet_listings_admin_email_outbox ON public.tolet_listings;
CREATE TRIGGER trg_tolet_listings_admin_email_outbox
AFTER INSERT OR UPDATE ON public.tolet_listings
FOR EACH ROW EXECUTE FUNCTION public.enqueue_admin_email_outbox_event();

DROP TRIGGER IF EXISTS trg_blood_donor_reports_admin_email_outbox ON public.blood_donor_reports;
CREATE TRIGGER trg_blood_donor_reports_admin_email_outbox
AFTER INSERT ON public.blood_donor_reports
FOR EACH ROW EXECUTE FUNCTION public.enqueue_admin_email_outbox_event();

DROP TRIGGER IF EXISTS trg_listing_reports_admin_email_outbox ON public.listing_reports;
CREATE TRIGGER trg_listing_reports_admin_email_outbox
AFTER INSERT ON public.listing_reports
FOR EACH ROW EXECUTE FUNCTION public.enqueue_admin_email_outbox_event();

DROP TRIGGER IF EXISTS trg_tutor_reports_admin_email_outbox ON public.tutor_reports;
CREATE TRIGGER trg_tutor_reports_admin_email_outbox
AFTER INSERT ON public.tutor_reports
FOR EACH ROW EXECUTE FUNCTION public.enqueue_admin_email_outbox_event();

DROP TRIGGER IF EXISTS trg_staff_profile_reports_admin_email_outbox ON public.staff_profile_reports;
CREATE TRIGGER trg_staff_profile_reports_admin_email_outbox
AFTER INSERT ON public.staff_profile_reports
FOR EACH ROW EXECUTE FUNCTION public.enqueue_admin_email_outbox_event();

DROP TRIGGER IF EXISTS trg_community_post_reports_admin_email_outbox ON public.community_post_reports;
CREATE TRIGGER trg_community_post_reports_admin_email_outbox
AFTER INSERT ON public.community_post_reports
FOR EACH ROW EXECUTE FUNCTION public.enqueue_admin_email_outbox_event();

DROP TRIGGER IF EXISTS trg_contact_messages_admin_email_outbox ON public.contact_messages;
CREATE TRIGGER trg_contact_messages_admin_email_outbox
AFTER INSERT ON public.contact_messages
FOR EACH ROW EXECUTE FUNCTION public.enqueue_admin_email_outbox_event();

CREATE OR REPLACE FUNCTION public.claim_admin_email_outbox_job(
    p_lease_seconds INTEGER DEFAULT 180,
    p_max_attempts INTEGER DEFAULT 5
)
RETURNS SETOF public.admin_email_outbox
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    UPDATE public.admin_email_outbox
    SET status = 'failed',
        last_error = 'retry_limit_reached',
        lease_token = NULL,
        lease_until = NULL,
        next_retry_at = NULL
    WHERE attempt_count >= p_max_attempts
      AND (
          status IN ('pending', 'retry_scheduled')
          AND (next_retry_at IS NULL OR next_retry_at <= NOW())
          OR status = 'processing' AND lease_until <= NOW()
      );

    RETURN QUERY
    WITH candidate AS (
        SELECT event_id
        FROM public.admin_email_outbox
        WHERE attempt_count < p_max_attempts
          AND (
              (status IN ('pending', 'retry_scheduled')
               AND (next_retry_at IS NULL OR next_retry_at <= NOW()))
              OR (status = 'processing' AND lease_until <= NOW())
          )
        ORDER BY created_at, event_id
        FOR UPDATE SKIP LOCKED
        LIMIT 1
    )
    UPDATE public.admin_email_outbox AS job
    SET status = 'processing',
        attempt_count = job.attempt_count + 1,
        next_retry_at = NULL,
        lease_token = gen_random_uuid(),
        lease_until = NOW() + make_interval(secs => GREATEST(30, LEAST(p_lease_seconds, 600))),
        last_error = NULL
    FROM candidate
    WHERE job.event_id = candidate.event_id
    RETURNING job.*;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_admin_email_outbox_job(INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_admin_email_outbox_job(INTEGER, INTEGER) TO service_role;

CREATE OR REPLACE FUNCTION public.acquire_admin_email_worker_lock(p_lease_seconds INTEGER DEFAULT 600)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_token UUID := gen_random_uuid();
BEGIN
    UPDATE public.admin_email_worker_lock
    SET lease_token = v_token,
        lease_until = NOW() + make_interval(secs => GREATEST(60, LEAST(p_lease_seconds, 1800)))
    WHERE lock_name = 'default'
      AND (lease_until IS NULL OR lease_until <= NOW());
    IF NOT FOUND THEN RETURN NULL; END IF;
    RETURN v_token;
END;
$$;

REVOKE ALL ON FUNCTION public.acquire_admin_email_worker_lock(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.acquire_admin_email_worker_lock(INTEGER) TO service_role;

CREATE OR REPLACE FUNCTION public.release_admin_email_worker_lock(p_lease_token UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    UPDATE public.admin_email_worker_lock
    SET lease_token = NULL, lease_until = NULL
    WHERE lock_name = 'default' AND lease_token = p_lease_token;
    RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.release_admin_email_worker_lock(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_admin_email_worker_lock(UUID) TO service_role;
