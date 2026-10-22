-- Keep profile-status notifications consistent with the public "গৃহ শিক্ষক"
-- wording without changing the status lifecycle or notification permissions.
CREATE OR REPLACE FUNCTION public.notif_customer_profile_status_changed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    profile_label TEXT;
    related_kind TEXT;
    status_title TEXT;
    status_body TEXT;
    status_type TEXT;
BEGIN
    IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
        RETURN NEW;
    END IF;

    IF TG_TABLE_NAME = 'home_tutor_profiles' THEN
        profile_label := 'গৃহ শিক্ষক প্রোফাইল';
        related_kind := 'tutor_profile';
    ELSE
        profile_label := 'রক্তদাতা প্রোফাইল';
        related_kind := 'blood_donor_profile';
    END IF;

    IF NEW.status = 'approved' THEN
        status_title := profile_label || ' অনুমোদিত হয়েছে';
        status_body := 'আপনার ' || profile_label || ' এখন প্রকাশিত হয়েছে।';
        status_type := 'success';
    ELSIF NEW.status = 'rejected' THEN
        status_title := profile_label || ' সংশোধন প্রয়োজন';
        status_body := CASE
            WHEN NULLIF(BTRIM(NEW.rejection_reason), '') IS NOT NULL
                THEN 'আপনার ' || profile_label || ' সংশোধন করুন। কারণ: ' || BTRIM(NEW.rejection_reason)
            ELSE 'আপনার ' || profile_label || ' সংশোধন করে আবার জমা দিন।'
        END;
        status_type := 'warning';
    ELSIF NEW.status = 'suspended' THEN
        status_title := profile_label || ' সাময়িকভাবে স্থগিত';
        status_body := 'আপনার ' || profile_label || ' সাময়িকভাবে স্থগিত রাখা হয়েছে। বিস্তারিত জানতে সাপোর্টে যোগাযোগ করুন।';
        status_type := 'warning';
    ELSE
        RETURN NEW;
    END IF;

    INSERT INTO public.notifications (user_id, target_role, title, body, type, related_type, related_id)
    VALUES (NEW.user_id, 'customer', status_title, status_body, status_type, related_kind, NEW.id::text);

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notif_customer_profile_status_changed() FROM PUBLIC, anon, authenticated;
