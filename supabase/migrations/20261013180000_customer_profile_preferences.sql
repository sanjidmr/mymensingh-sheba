ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS notification_preferences JSONB NOT NULL DEFAULT
      '{"post_updates":true,"request_updates":true,"support_replies":true}'::jsonb;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'profiles_notification_preferences_object_check'
          AND conrelid = 'public.profiles'::regclass
    ) THEN
        ALTER TABLE public.profiles
            ADD CONSTRAINT profiles_notification_preferences_object_check
            CHECK (jsonb_typeof(notification_preferences) = 'object') NOT VALID;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_customer_notification_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    preferences JSONB;
    preference_key TEXT;
BEGIN
    IF NEW.target_role <> 'customer' OR NEW.user_id IS NULL THEN
        RETURN NEW;
    END IF;

    preference_key := CASE
        WHEN NEW.related_type IN ('community_post', 'tolet_listing', 'tutor_profile', 'blood_donor_profile')
            THEN 'post_updates'
        WHEN NEW.related_type IN ('service_request', 'tolet_request', 'blood_request')
            THEN 'request_updates'
        WHEN NEW.related_type = 'contact_message'
            THEN 'support_replies'
        ELSE NULL
    END;
    IF preference_key IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT p.notification_preferences INTO preferences
    FROM public.profiles AS p
    WHERE p.id = NEW.user_id;

    IF preferences ->> preference_key = 'false' THEN
        RETURN NULL;
    END IF;
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_customer_notification_preferences() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_apply_customer_notification_preferences ON public.notifications;
CREATE TRIGGER trg_apply_customer_notification_preferences
BEFORE INSERT ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.apply_customer_notification_preferences();
