CREATE OR REPLACE FUNCTION public.enqueue_public_event_admin_telegram()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    row_data JSONB := TO_JSONB(NEW);
    old_data JSONB;
    event_type TEXT;
    event_title TEXT;
    event_key TEXT;
    admin_path TEXT;
    event_status TEXT;
    post_kind TEXT;
    category_label TEXT;
    record_title TEXT;
    owner_name TEXT;
    owner_phone TEXT;
    owner_location TEXT;
    details TEXT;
    user_id UUID;
    profile_name TEXT;
    profile_phone TEXT;
    profile_location TEXT;
    parent_message_id UUID;
    parent_name TEXT;
    parent_phone TEXT;
    parent_email TEXT;
    parent_subject TEXT;
    parent_body TEXT;
    occurred_at TIMESTAMPTZ;
    event_id UUID;
    summary TEXT;
BEGIN
    event_status := row_data ->> 'status';
    occurred_at := COALESCE(NULLIF(row_data ->> 'created_at', '')::TIMESTAMPTZ, NOW());
    event_id := NULLIF(row_data ->> 'id', '')::UUID;
    post_kind := row_data ->> 'kind';
    record_title := COALESCE(
        NULLIF(row_data ->> 'title_bn', ''),
        NULLIF(row_data ->> 'title', ''),
        NULLIF(row_data ->> 'complaint_subject', ''),
        NULLIF(row_data ->> 'subject', ''),
        NULLIF(row_data ->> 'name_bn', ''),
        NULLIF(row_data ->> 'full_name', ''),
        NULLIF(row_data ->> 'owner_name', ''),
        NULLIF(row_data ->> 'name', ''),
        'নতুন জমা'
    );
    owner_name := COALESCE(
        NULLIF(row_data ->> 'author_name', ''),
        NULLIF(row_data ->> 'owner_name', ''),
        NULLIF(row_data ->> 'full_name', ''),
        NULLIF(row_data ->> 'name_bn', ''),
        NULLIF(row_data ->> 'name', '')
    );
    owner_phone := COALESCE(
        NULLIF(row_data ->> 'author_phone', ''),
        NULLIF(row_data ->> 'contact_phone', ''),
        NULLIF(row_data ->> 'owner_phone', ''),
        NULLIF(row_data ->> 'private_phone', ''),
        NULLIF(row_data ->> 'phone_private', ''),
        NULLIF(row_data ->> 'contact_phone_private', ''),
        NULLIF(row_data ->> 'phone', '')
    );
    owner_location := COALESCE(
        NULLIF(row_data ->> 'area_id', ''),
        NULLIF(row_data ->> 'primary_area_id', ''),
        NULLIF(row_data ->> 'area_ids', ''),
        NULLIF(row_data ->> 'preferred_areas', ''),
        NULLIF(row_data ->> 'areas', ''),
        NULLIF(row_data ->> 'address_line', '')
    );

    IF TG_TABLE_NAME IN ('community_posts', 'tolet_listings', 'service_listings')
       OR TG_TABLE_NAME IN ('tolet_profiles', 'home_tutor_profiles', 'blood_donor_profiles') THEN
        user_id := COALESCE(
            NULLIF(row_data ->> 'author_id', ''),
            NULLIF(row_data ->> 'owner_id', ''),
            NULLIF(row_data ->> 'user_id', '')
        )::UUID;
        IF user_id IS NOT NULL THEN
            SELECT profile.full_name, profile.phone, profile.primary_area_id
              INTO profile_name, profile_phone, profile_location
              FROM public.profiles AS profile
             WHERE profile.id = user_id;
            owner_name := COALESCE(owner_name, profile_name);
            owner_phone := COALESCE(owner_phone, profile_phone);
            owner_location := COALESCE(owner_location, profile_location);
        END IF;
    END IF;

    CASE TG_TABLE_NAME
        WHEN 'community_posts' THEN
            IF event_status IS DISTINCT FROM 'pending' THEN
                RETURN NEW;
            END IF;
            IF TG_OP = 'UPDATE' THEN
                old_data := TO_JSONB(OLD);
                IF old_data ->> 'status' = event_status THEN RETURN NEW; END IF;
                occurred_at := COALESCE(NULLIF(row_data ->> 'updated_at', '')::TIMESTAMPTZ, NOW());
            END IF;
            event_type := 'community_post';
            event_title := 'নতুন পোস্ট জমা';
            admin_path := '/admin/posts';
            category_label := CASE post_kind
                WHEN 'buy_sell' THEN 'কেনাবেচা'
                WHEN 'job' THEN 'চাকরি'
                WHEN 'news' THEN 'ময়মনসিংহের খবর'
                ELSE 'অন্যান্য পোস্ট'
            END;
            details := CONCAT_WS(E'\n',
                NULLIF(row_data ->> 'summary_bn', ''),
                NULLIF(row_data ->> 'body_bn', ''),
                CASE WHEN row_data ->> 'organization_bn' IS NOT NULL
                    THEN CONCAT('প্রতিষ্ঠান: ', row_data ->> 'organization_bn') END,
                CASE WHEN row_data ->> 'job_type' IS NOT NULL
                    THEN CONCAT('চাকরির ধরন: ', row_data ->> 'job_type') END,
                CASE WHEN row_data ->> 'salary_min' IS NOT NULL OR row_data ->> 'salary_max' IS NOT NULL
                    THEN 'বেতন: ' || COALESCE(row_data ->> 'salary_min', '—') || '–' || COALESCE(row_data ->> 'salary_max', '—') END,
                CASE WHEN row_data ->> 'price' IS NOT NULL
                    THEN CONCAT('দাম: ৳', row_data ->> 'price') END,
                CASE WHEN row_data ->> 'tags' IS NOT NULL
                    THEN CONCAT('বিষয়/ট্যাগ: ', row_data ->> 'tags') END
            );
        WHEN 'tolet_listings' THEN
            IF event_status IS DISTINCT FROM 'pending_review' THEN
                RETURN NEW;
            END IF;
            IF TG_OP = 'UPDATE' THEN
                old_data := TO_JSONB(OLD);
                IF old_data ->> 'status' = event_status THEN RETURN NEW; END IF;
                occurred_at := COALESCE(NULLIF(row_data ->> 'updated_at', '')::TIMESTAMPTZ, NOW());
            END IF;
            event_type := 'tolet_listing';
            event_title := 'নতুন বাসা ভাড়ার বিজ্ঞাপন';
            category_label := 'বাসা ভাড়া';
            admin_path := '/admin/tolet';
            details := CONCAT_WS(E'\n',
                CASE WHEN row_data ->> 'property_type' IS NOT NULL
                    THEN CONCAT('বাসার ধরন: ', row_data ->> 'property_type') END,
                CASE WHEN row_data ->> 'rent_price' IS NOT NULL
                    THEN CONCAT('মাসিক ভাড়া: ৳', row_data ->> 'rent_price') END,
                CASE WHEN row_data ->> 'specific_address' IS NOT NULL
                    THEN CONCAT('ঠিকানা: ', row_data ->> 'specific_address') END,
                CASE WHEN row_data ->> 'bedrooms' IS NOT NULL
                    THEN CONCAT('কক্ষ: ', row_data ->> 'bedrooms') END,
                NULLIF(row_data ->> 'description', '')
            );
        WHEN 'service_listings' THEN
            IF row_data ->> 'owner_id' IS NULL OR event_status IS DISTINCT FROM 'pending' THEN
                RETURN NEW;
            END IF;
            IF TG_OP = 'UPDATE' THEN
                old_data := TO_JSONB(OLD);
                IF old_data ->> 'status' = event_status THEN RETURN NEW; END IF;
                occurred_at := COALESCE(NULLIF(row_data ->> 'updated_at', '')::TIMESTAMPTZ, NOW());
            END IF;
            event_type := 'service_listing';
            event_title := 'নতুন সেবা প্রোফাইল জমা';
            admin_path := '/admin/approvals';
            category_label := CASE row_data ->> 'category'
                WHEN 'coaching' THEN 'কোচিং'
                WHEN 'wifi' THEN 'WiFi'
                WHEN 'vehicle' THEN 'গাড়ি ভাড়া'
                WHEN 'bus' THEN 'বাস সার্ভিস'
                ELSE COALESCE(row_data ->> 'category', 'অন্যান্য সেবা')
            END;
            details := CONCAT_WS(E'\n',
                NULLIF(row_data ->> 'subtitle_bn', ''),
                NULLIF(row_data ->> 'summary_bn', ''),
                NULLIF(row_data ->> 'description_bn', ''),
                CASE WHEN row_data ->> 'area_ids' IS NOT NULL
                    THEN CONCAT('এলাকা: ', row_data ->> 'area_ids') END
            );
        WHEN 'tolet_profiles' THEN
            IF event_status IS DISTINCT FROM 'pending_approval' THEN RETURN NEW; END IF;
            IF TG_OP = 'UPDATE' THEN
                old_data := TO_JSONB(OLD);
                IF old_data ->> 'status' = event_status THEN RETURN NEW; END IF;
                occurred_at := COALESCE(NULLIF(row_data ->> 'updated_at', '')::TIMESTAMPTZ, NOW());
            END IF;
            event_type := 'tolet_profile';
            event_title := 'নতুন বাসা মালিকের প্রোফাইল';
            category_label := 'বাসা ভাড়া';
            admin_path := '/admin/approvals';
            details := CONCAT_WS(E'\n',
                CASE WHEN row_data ->> 'total_listings_count' IS NOT NULL
                    THEN CONCAT('বিজ্ঞাপনের সংখ্যা: ', row_data ->> 'total_listings_count') END,
                NULLIF(row_data ->> 'address_line', '')
            );
        WHEN 'home_tutor_profiles' THEN
            IF event_status IS DISTINCT FROM 'pending_approval' THEN RETURN NEW; END IF;
            IF TG_OP = 'UPDATE' THEN
                old_data := TO_JSONB(OLD);
                IF old_data ->> 'status' = event_status THEN RETURN NEW; END IF;
                occurred_at := COALESCE(NULLIF(row_data ->> 'updated_at', '')::TIMESTAMPTZ, NOW());
            END IF;
            event_type := 'tutor_profile';
            event_title := 'নতুন গৃহশিক্ষক প্রোফাইল';
            category_label := 'গৃহশিক্ষক';
            admin_path := '/admin/verifications';
            details := CONCAT_WS(E'\n',
                NULLIF(row_data ->> 'institution', ''),
                NULLIF(row_data ->> 'department', ''),
                CASE WHEN row_data ->> 'preferred_classes' IS NOT NULL
                    THEN CONCAT('শ্রেণি: ', row_data ->> 'preferred_classes') END,
                CASE WHEN row_data ->> 'preferred_subjects' IS NOT NULL
                    THEN CONCAT('বিষয়: ', row_data ->> 'preferred_subjects') END,
                CASE WHEN row_data ->> 'preferred_areas' IS NOT NULL
                    THEN CONCAT('এলাকা: ', row_data ->> 'preferred_areas') END
            );
        WHEN 'blood_donor_profiles' THEN
            IF event_status IS DISTINCT FROM 'pending_approval' THEN RETURN NEW; END IF;
            IF TG_OP = 'UPDATE' THEN
                old_data := TO_JSONB(OLD);
                IF old_data ->> 'status' = event_status THEN RETURN NEW; END IF;
                occurred_at := COALESCE(NULLIF(row_data ->> 'updated_at', '')::TIMESTAMPTZ, NOW());
            END IF;
            event_type := 'donor_profile';
            event_title := 'নতুন রক্তদাতা প্রোফাইল';
            category_label := 'রক্তদাতা';
            admin_path := '/admin/blood/donors';
            details := CONCAT_WS(E'\n',
                CASE WHEN row_data ->> 'blood_group' IS NOT NULL
                    THEN CONCAT('রক্তের গ্রুপ: ', row_data ->> 'blood_group') END,
                CASE WHEN row_data ->> 'is_available' IS NOT NULL
                    THEN 'রক্তদানে প্রস্তুত: ' || CASE WHEN row_data ->> 'is_available' = 'true' THEN 'হ্যাঁ' ELSE 'না' END END,
                NULLIF(row_data ->> 'intro', '')
            );
        WHEN 'contact_messages' THEN
            event_type := 'contact_message';
            category_label := CASE
                WHEN row_data ->> 'subject' = 'complaint' THEN 'অভিযোগ'
                ELSE 'যোগাযোগের বার্তা'
            END;
            event_title := CASE
                WHEN row_data ->> 'subject' = 'complaint' THEN 'নতুন অভিযোগ জমা'
                ELSE 'নতুন যোগাযোগের বার্তা'
            END;
            admin_path := '/admin/messages';
            details := CONCAT_WS(E'\n',
                CASE WHEN row_data ->> 'complaint_category' IS NOT NULL
                    THEN CONCAT('অভিযোগের বিভাগ: ', row_data ->> 'complaint_category') END,
                CASE WHEN row_data ->> 'complaint_subject' IS NOT NULL
                    THEN CONCAT('অভিযোগের বিষয়: ', row_data ->> 'complaint_subject') END,
                CASE WHEN row_data ->> 'subject' IS NOT NULL
                    THEN CONCAT(
                        'বার্তার ধরন: ',
                        CASE row_data ->> 'subject'
                            WHEN 'general' THEN 'সাধারণ যোগাযোগ'
                            WHEN 'service_info' THEN 'সেবা-সংক্রান্ত জিজ্ঞাসা'
                            WHEN 'post_service' THEN 'পোস্ট-সংক্রান্ত জিজ্ঞাসা'
                            WHEN 'correction' THEN 'সংশোধনের অনুরোধ'
                            WHEN 'complaint' THEN 'অভিযোগ'
                            WHEN 'partnership' THEN 'অংশীদারত্ব'
                            ELSE 'অন্যান্য'
                        END
                    ) END,
                CASE WHEN row_data ->> 'email' IS NOT NULL
                    THEN CONCAT('ইমেইল: ', row_data ->> 'email') END,
                NULLIF(row_data ->> 'message', ''),
                CASE WHEN row_data ->> 'attachment_path' IS NOT NULL
                    THEN 'সংযুক্তি: ফাইল জমা আছে' END
            );
        WHEN 'contact_message_replies' THEN
            IF row_data ->> 'sender_role' IS DISTINCT FROM 'customer' THEN
                RETURN NEW;
            END IF;
            parent_message_id := NULLIF(row_data ->> 'message_id', '')::UUID;
            SELECT message.name, message.phone, message.email, message.subject, message.message
              INTO parent_name, parent_phone, parent_email, parent_subject, parent_body
              FROM public.contact_messages AS message
             WHERE message.id = parent_message_id;
            event_type := 'contact_message_reply';
            event_title := 'সাপোর্ট কথোপকথনে নতুন বার্তা';
            category_label := 'বার্তা';
            admin_path := '/admin/messages';
            owner_name := COALESCE(owner_name, parent_name);
            owner_phone := COALESCE(owner_phone, parent_phone);
            details := CONCAT_WS(E'\n',
                CASE WHEN parent_subject IS NOT NULL THEN CONCAT(
                    'যোগাযোগের বিষয়: ',
                    CASE parent_subject
                        WHEN 'general' THEN 'সাধারণ যোগাযোগ'
                        WHEN 'service_info' THEN 'সেবা-সংক্রান্ত জিজ্ঞাসা'
                        WHEN 'post_service' THEN 'পোস্ট-সংক্রান্ত জিজ্ঞাসা'
                        WHEN 'correction' THEN 'সংশোধনের অনুরোধ'
                        WHEN 'complaint' THEN 'অভিযোগ'
                        WHEN 'partnership' THEN 'অংশীদারত্ব'
                        ELSE 'অন্যান্য'
                    END
                ) END,
                CASE WHEN parent_message_id IS NOT NULL
                    THEN CONCAT('কথোপকথন আইডি: ', parent_message_id::TEXT) END,
                CASE WHEN parent_email IS NOT NULL
                    THEN CONCAT('ইমেইল: ', parent_email) END,
                CASE WHEN parent_body IS NOT NULL
                    THEN CONCAT('প্রথম বার্তা: ', parent_body) END,
                CASE WHEN row_data ->> 'body' IS NOT NULL
                    THEN CONCAT('নতুন বার্তা: ', row_data ->> 'body') END
            );
        ELSE
            RETURN NEW;
    END CASE;

    event_key := event_type || ':' || event_id::TEXT;
    IF TG_TABLE_NAME <> 'contact_messages' THEN
        event_key := event_key || ':' || occurred_at::TEXT;
    END IF;
    summary := LEFT(CONCAT_WS(E'\n',
        'আইডি: ' || event_id::TEXT,
        'বিভাগ: ' || category_label,
        CASE WHEN NULLIF(owner_name, '') IS NOT NULL THEN 'নাম: ' || owner_name END,
        CASE WHEN NULLIF(owner_phone, '') IS NOT NULL THEN 'যোগাযোগ: ' || owner_phone END,
        CASE WHEN NULLIF(owner_location, '') IS NOT NULL THEN 'এলাকা/ঠিকানা: ' || owner_location END,
        CASE WHEN TG_TABLE_NAME IN ('community_posts', 'tolet_listings', 'service_listings')
            THEN 'শিরোনাম: ' || record_title END,
        NULLIF(details, '')
    ), 3000);

    INSERT INTO public.admin_telegram_outbox (
        idempotency_key,
        related_type,
        related_id,
        payload,
        created_at
    )
    VALUES (
        event_key,
        event_type,
        event_id,
        JSONB_BUILD_OBJECT(
            'occurred_at', occurred_at,
            'title', event_title,
            'summary', summary,
            'admin_path', admin_path
        ),
        occurred_at
    )
    ON CONFLICT (idempotency_key) DO NOTHING;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_public_event_admin_telegram()
    FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_contact_messages_admin_email_outbox ON public.contact_messages;
DROP TRIGGER IF EXISTS trg_contact_messages_admin_telegram_outbox ON public.contact_messages;
CREATE TRIGGER trg_contact_messages_admin_telegram_outbox
AFTER INSERT ON public.contact_messages
FOR EACH ROW EXECUTE FUNCTION public.enqueue_public_event_admin_telegram();

DROP TRIGGER IF EXISTS trg_contact_message_replies_admin_telegram_outbox ON public.contact_message_replies;
CREATE TRIGGER trg_contact_message_replies_admin_telegram_outbox
AFTER INSERT ON public.contact_message_replies
FOR EACH ROW EXECUTE FUNCTION public.enqueue_public_event_admin_telegram();

DROP TRIGGER IF EXISTS trg_community_posts_admin_telegram_outbox ON public.community_posts;
CREATE TRIGGER trg_community_posts_admin_telegram_outbox
AFTER INSERT OR UPDATE OF status ON public.community_posts
FOR EACH ROW EXECUTE FUNCTION public.enqueue_public_event_admin_telegram();

DROP TRIGGER IF EXISTS trg_tolet_listings_admin_telegram_outbox ON public.tolet_listings;
CREATE TRIGGER trg_tolet_listings_admin_telegram_outbox
AFTER INSERT OR UPDATE OF status ON public.tolet_listings
FOR EACH ROW EXECUTE FUNCTION public.enqueue_public_event_admin_telegram();

DROP TRIGGER IF EXISTS trg_service_listings_admin_telegram_outbox ON public.service_listings;
CREATE TRIGGER trg_service_listings_admin_telegram_outbox
AFTER INSERT OR UPDATE OF status ON public.service_listings
FOR EACH ROW EXECUTE FUNCTION public.enqueue_public_event_admin_telegram();

DROP TRIGGER IF EXISTS trg_tolet_profiles_admin_telegram_outbox ON public.tolet_profiles;
CREATE TRIGGER trg_tolet_profiles_admin_telegram_outbox
AFTER INSERT OR UPDATE OF status ON public.tolet_profiles
FOR EACH ROW EXECUTE FUNCTION public.enqueue_public_event_admin_telegram();

DROP TRIGGER IF EXISTS trg_home_tutor_profiles_admin_telegram_outbox ON public.home_tutor_profiles;
CREATE TRIGGER trg_home_tutor_profiles_admin_telegram_outbox
AFTER INSERT OR UPDATE OF status ON public.home_tutor_profiles
FOR EACH ROW EXECUTE FUNCTION public.enqueue_public_event_admin_telegram();

DROP TRIGGER IF EXISTS trg_blood_donor_profiles_admin_telegram_outbox ON public.blood_donor_profiles;
CREATE TRIGGER trg_blood_donor_profiles_admin_telegram_outbox
AFTER INSERT OR UPDATE OF status ON public.blood_donor_profiles
FOR EACH ROW EXECUTE FUNCTION public.enqueue_public_event_admin_telegram();

CREATE OR REPLACE FUNCTION public.enqueue_uncovered_admin_notification_telegram()
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

    IF COALESCE(NEW.related_type, '') IN (
        'service_request',
        'tolet_listing',
        'blood_donor_reports',
        'listing_reports',
        'tutor_reports',
        'staff_profile_reports',
        'community_post_reports',
        'contact_message',
        'community_post',
        'service_listing',
        'tolet_profile',
        'tutor_profile',
        'donor_profile'
    ) THEN
        RETURN NEW;
    END IF;

    event_type := COALESCE(NULLIF(NEW.related_type, ''), 'admin_notification');
    has_target_id := COALESCE(
        NEW.related_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
        FALSE
    );
    target_id := CASE WHEN has_target_id THEN NEW.related_id::UUID ELSE NEW.id END;
    admin_path := CASE event_type
        WHEN 'community_post' THEN
            CASE WHEN NOT has_target_id THEN '/admin/posts' ELSE '/admin/posts/' || target_id::TEXT END
        WHEN 'vehicle_request' THEN
            CASE WHEN NOT has_target_id THEN '/admin/vehicle-requests' ELSE '/admin/vehicle-requests/' || target_id::TEXT END
        WHEN 'service_listing' THEN '/admin/approvals'
        WHEN 'tolet_profile' THEN '/admin/approvals'
        WHEN 'tutor_profile' THEN
            CASE WHEN NOT has_target_id THEN '/admin/verifications' ELSE '/admin/verifications/' || target_id::TEXT END
        WHEN 'donor_profile' THEN
            CASE WHEN NOT has_target_id THEN '/admin/blood/donors' ELSE '/admin/blood/donors/' || target_id::TEXT END
        WHEN 'blood_request' THEN '/admin/notifications'
        ELSE '/admin/notifications'
    END;
    safe_title := LEFT(BTRIM(COALESCE(NEW.title, 'নতুন অ্যাডমিন নোটিফিকেশন')), 200);
    safe_summary := LEFT(BTRIM(COALESCE(NEW.body, 'অ্যাডমিন প্যানেলে নতুন ঘটনা এসেছে।')), 1200);

    INSERT INTO public.admin_telegram_outbox (
        idempotency_key,
        related_type,
        related_id,
        payload,
        created_at
    )
    VALUES (
        'admin_notification:' || NEW.id::TEXT,
        event_type,
        target_id,
        JSONB_BUILD_OBJECT(
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

CREATE OR REPLACE FUNCTION public.fn_public_donor_directory(
    p_blood_group TEXT DEFAULT NULL,
    p_area_id TEXT DEFAULT NULL,
    p_available_only BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    id UUID,
    public_id TEXT,
    service_code TEXT,
    user_id UUID,
    status TEXT,
    full_name TEXT,
    blood_group TEXT,
    area_id TEXT,
    gender TEXT,
    birth_year INTEGER,
    weight_kg INTEGER,
    is_available BOOLEAN,
    last_donation_date DATE,
    donation_count INTEGER,
    is_verified BOOLEAN,
    intro TEXT,
    profile_photo_url TEXT,
    show_readiness BOOLEAN,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    contact_phone TEXT
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
    SELECT
        donor.id,
        donor.public_id,
        donor.service_code,
        donor.user_id,
        donor.status,
        donor.full_name,
        donor.blood_group,
        donor.area_id,
        donor.gender,
        donor.birth_year,
        donor.weight_kg,
        donor.is_available,
        donor.last_donation_date,
        donor.donation_count,
        donor.is_verified,
        donor.intro,
        donor.profile_photo_url,
        donor.show_readiness,
        donor.published_at,
        donor.created_at,
        donor.updated_at,
        CASE
            WHEN auth.uid() IS NOT NULL THEN donor.private_phone
            ELSE NULL
        END
    FROM public.blood_donor_profiles AS donor
    WHERE donor.status = 'approved'
      AND donor.is_available IS TRUE
      AND (p_available_only IS FALSE OR donor.is_available IS TRUE)
      AND (p_blood_group IS NULL OR p_blood_group = '' OR p_blood_group = 'all' OR donor.blood_group = p_blood_group)
      AND (p_area_id IS NULL OR p_area_id = '' OR donor.area_id = p_area_id)
    ORDER BY donor.published_at DESC NULLS LAST, donor.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.fn_public_donor_directory(TEXT, TEXT, BOOLEAN)
    TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
