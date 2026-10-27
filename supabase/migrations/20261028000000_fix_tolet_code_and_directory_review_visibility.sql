CREATE OR REPLACE FUNCTION public.assign_profile_service_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    code_prefix TEXT;
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.service_code IS NOT NULL THEN
        NEW.service_code := OLD.service_code;
        RETURN NEW;
    END IF;

    IF TG_TABLE_NAME = 'staff_profiles' THEN
        code_prefix := CASE NEW.service_slug
            WHEN 'kajer-bua' THEN 'KBU'
            WHEN 'electrician' THEN 'ELC'
            WHEN 'plumber' THEN 'PLB'
            WHEN 'ac-fridge' THEN 'ACR'
            ELSE 'STF'
        END;
    ELSE
        code_prefix := CASE TG_TABLE_NAME
            WHEN 'home_tutor_profiles' THEN 'HT'
            WHEN 'blood_donor_profiles' THEN 'BLD'
            WHEN 'tolet_listings' THEN 'TOL'
            ELSE 'SRV'
        END;
    END IF;

    NEW.service_code := public.allocate_service_entity_code(
        code_prefix,
        TG_TABLE_NAME,
        NEW.id
    );
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.service_listings_guard_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF auth.uid() IS NULL OR public.is_admin() THEN
        RETURN NEW;
    END IF;

    -- Rating refreshes run from a nested review trigger and must not send a
    -- published listing back through owner moderation.
    IF TG_OP = 'UPDATE'
       AND pg_trigger_depth() > 1
       AND (to_jsonb(NEW) - 'rating_avg' - 'rating_count' - 'updated_at')
           IS NOT DISTINCT FROM
           (to_jsonb(OLD) - 'rating_avg' - 'rating_count' - 'updated_at') THEN
        RETURN NEW;
    END IF;

    IF NEW.category NOT IN ('coaching', 'wifi') THEN
        RAISE EXCEPTION 'customers may only create coaching or wifi listings';
    END IF;

    IF TG_OP = 'INSERT' THEN
        NEW.owner_id := auth.uid();
        NEW.status := CASE WHEN NEW.status = 'draft' THEN 'draft' ELSE 'pending' END;
        NEW.is_active := TRUE;
    ELSE
        NEW.owner_id := OLD.owner_id;
        NEW.status := CASE WHEN NEW.status = 'draft' THEN 'draft' ELSE 'pending' END;
        NEW.is_active := OLD.is_active;
        NEW.rating_avg := OLD.rating_avg;
        NEW.rating_count := OLD.rating_count;
    END IF;

    NEW.rejection_reason := NULL;
    NEW.published_at := NULL;
    NEW.is_featured := FALSE;
    NEW.contact_phone_private := NULL;
    RETURN NEW;
END;
$$;

NOTIFY pgrst, 'reload schema';
