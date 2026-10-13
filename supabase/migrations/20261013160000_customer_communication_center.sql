-- Reuse the existing private contact inbox for tracked customer complaints.
-- Attachments live in a private bucket and use the owner's auth id as folder 1.
ALTER TABLE public.contact_messages
    ADD COLUMN IF NOT EXISTS complaint_category TEXT,
    ADD COLUMN IF NOT EXISTS complaint_subject TEXT,
    ADD COLUMN IF NOT EXISTS attachment_path TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'contact_messages_complaint_category_check'
          AND conrelid = 'public.contact_messages'::regclass
    ) THEN
        ALTER TABLE public.contact_messages
            ADD CONSTRAINT contact_messages_complaint_category_check
            CHECK (
                complaint_category IS NULL
                OR complaint_category IN (
                    'account', 'posts', 'service', 'safety', 'payment', 'other'
                )
            ) NOT VALID;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'contact_messages_complaint_subject_check'
          AND conrelid = 'public.contact_messages'::regclass
    ) THEN
        ALTER TABLE public.contact_messages
            ADD CONSTRAINT contact_messages_complaint_subject_check
            CHECK (complaint_subject IS NULL OR length(trim(complaint_subject)) BETWEEN 3 AND 120)
            NOT VALID;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'contact_messages_attachment_path_check'
          AND conrelid = 'public.contact_messages'::regclass
    ) THEN
        ALTER TABLE public.contact_messages
            ADD CONSTRAINT contact_messages_attachment_path_check
            CHECK (attachment_path IS NULL OR (user_id IS NOT NULL AND length(attachment_path) <= 500))
            NOT VALID;
    END IF;
END;
$$;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'support-attachments',
    'support-attachments',
    FALSE,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public = FALSE,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

DROP POLICY IF EXISTS "Support attachment owner and admins read" ON storage.objects;
CREATE POLICY "Support attachment owner and admins read"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'support-attachments'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
);

DROP POLICY IF EXISTS "Customers upload own support attachments" ON storage.objects;
CREATE POLICY "Customers upload own support attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'support-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Customers delete own support attachments" ON storage.objects;
CREATE POLICY "Customers delete own support attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'support-attachments'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
);

-- Keep the existing public contact form working while requiring structured
-- fields for logged-in complaints and owner-scoped paths for private files.
DROP POLICY IF EXISTS "Guests can send contact messages" ON public.contact_messages;
CREATE POLICY "Guests can send contact messages"
ON public.contact_messages FOR INSERT
TO anon, authenticated
WITH CHECK (
    name IS NOT NULL AND length(trim(name)) >= 3
    AND phone IS NOT NULL AND length(trim(phone)) >= 10
    AND message IS NOT NULL AND length(trim(message)) BETWEEN 12 AND 1500
    AND (
        (auth.uid() IS NULL AND user_id IS NULL AND attachment_path IS NULL)
        OR (
            auth.uid() IS NOT NULL
            AND (user_id IS NULL OR user_id = auth.uid())
            AND (
                user_id IS NULL
                OR subject <> 'complaint'
                OR (
                    complaint_category IN ('account', 'posts', 'service', 'safety', 'payment', 'other')
                    AND complaint_subject IS NOT NULL
                    AND length(trim(complaint_subject)) BETWEEN 3 AND 120
                )
            )
            AND (
                attachment_path IS NULL
                OR (
                    user_id = auth.uid()
                    AND subject = 'complaint'
                    AND attachment_path LIKE auth.uid()::text || '/%'
                )
            )
        )
    )
);

-- Customer-safe conversation projection; do not expose admin_notes.
DROP FUNCTION IF EXISTS public.fn_my_contact_conversations();
CREATE FUNCTION public.fn_my_contact_conversations()
RETURNS TABLE (
    id UUID,
    subject TEXT,
    message TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    complaint_category TEXT,
    complaint_subject TEXT,
    attachment_path TEXT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT
        message.id,
        message.subject,
        message.message,
        message.status,
        message.created_at,
        message.complaint_category,
        message.complaint_subject,
        message.attachment_path
    FROM public.contact_messages AS message
    WHERE message.user_id = auth.uid()
    ORDER BY message.created_at DESC
$$;

REVOKE ALL ON FUNCTION public.fn_my_contact_conversations() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_my_contact_conversations() TO authenticated;

-- To-Let admin moderation updates should generate the same persisted,
-- owner-scoped notification experience as community post decisions.
CREATE OR REPLACE FUNCTION public.notif_tolet_listing_status_changed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
        RETURN NEW;
    END IF;

    IF NEW.status = 'approved' THEN
        INSERT INTO public.notifications (user_id, target_role, title, body, type, related_type, related_id)
        VALUES (
            NEW.owner_id, 'customer', 'আপনার বাসাভাড়ার পোস্ট অনুমোদিত হয়েছে',
            '“' || NEW.title || '” এখন সবার জন্য দেখা যাচ্ছে।',
            'success', 'tolet_listing', NEW.id::text
        );
    ELSIF NEW.status = 'rejected' THEN
        INSERT INTO public.notifications (user_id, target_role, title, body, type, related_type, related_id)
        VALUES (
            NEW.owner_id, 'customer', 'বাসাভাড়ার পোস্টে সংশোধন প্রয়োজন',
            CASE
                WHEN NULLIF(BTRIM(NEW.rejection_reason), '') IS NOT NULL
                    THEN '“' || NEW.title || '” পোস্টে সংশোধন প্রয়োজন। কারণ: '
                         || BTRIM(NEW.rejection_reason)
                ELSE '“' || NEW.title || '” পোস্টে সংশোধন করে আবার জমা দিন।'
            END,
            'warning', 'tolet_listing', NEW.id::text
        );
    ELSIF NEW.status = 'suspended' THEN
        INSERT INTO public.notifications (user_id, target_role, title, body, type, related_type, related_id)
        VALUES (
            NEW.owner_id, 'customer', 'বাসাভাড়ার পোস্টের অবস্থা পরিবর্তিত হয়েছে',
            '“' || NEW.title || '” আপাতত স্থগিত রাখা হয়েছে। বিস্তারিত জানতে সাপোর্টে যোগাযোগ করুন।',
            'warning', 'tolet_listing', NEW.id::text
        );
    END IF;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notif_tolet_listing_status_changed() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_notif_tolet_listing_status ON public.tolet_listings;
CREATE TRIGGER trg_notif_tolet_listing_status
AFTER UPDATE OF status ON public.tolet_listings
FOR EACH ROW EXECUTE FUNCTION public.notif_tolet_listing_status_changed();

CREATE OR REPLACE FUNCTION public.notif_contact_conversation_status_changed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NEW.status IS NOT DISTINCT FROM OLD.status OR NEW.user_id IS NULL THEN
        RETURN NEW;
    END IF;

    IF NEW.status = 'closed' THEN
        INSERT INTO public.notifications (user_id, target_role, title, body, type, related_type, related_id)
        VALUES (
            NEW.user_id, 'customer',
            CASE WHEN NEW.subject = 'complaint' THEN 'আপনার অভিযোগের আপডেট' ELSE 'সাপোর্ট বার্তার আপডেট' END,
            CASE
                WHEN NEW.subject = 'complaint'
                    THEN '“' || COALESCE(NEW.complaint_subject, 'আপনার অভিযোগ') || '” সমাধান করে বন্ধ করা হয়েছে।'
                ELSE 'আপনার সাপোর্ট কথোপকথন বন্ধ করা হয়েছে।'
            END,
            'info', 'contact_message', NEW.id::text
        );
    END IF;
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notif_contact_conversation_status_changed() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_notif_contact_conversation_status ON public.contact_messages;
CREATE TRIGGER trg_notif_contact_conversation_status
AFTER UPDATE OF status ON public.contact_messages
FOR EACH ROW EXECUTE FUNCTION public.notif_contact_conversation_status_changed();

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
        profile_label := 'গৃহশিক্ষক প্রোফাইল';
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

DROP TRIGGER IF EXISTS trg_notif_tutor_profile_status ON public.home_tutor_profiles;
CREATE TRIGGER trg_notif_tutor_profile_status
AFTER UPDATE OF status ON public.home_tutor_profiles
FOR EACH ROW EXECUTE FUNCTION public.notif_customer_profile_status_changed();

DROP TRIGGER IF EXISTS trg_notif_blood_donor_profile_status ON public.blood_donor_profiles;
CREATE TRIGGER trg_notif_blood_donor_profile_status
AFTER UPDATE OF status ON public.blood_donor_profiles
FOR EACH ROW EXECUTE FUNCTION public.notif_customer_profile_status_changed();
