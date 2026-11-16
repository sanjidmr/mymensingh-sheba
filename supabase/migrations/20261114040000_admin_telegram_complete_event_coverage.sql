CREATE OR REPLACE FUNCTION public.enqueue_admin_telegram_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    row_data JSONB := CASE WHEN TG_OP = 'DELETE' THEN TO_JSONB(OLD) ELSE TO_JSONB(NEW) END;
    old_data JSONB;
    event_type TEXT;
    event_key TEXT;
    event_title TEXT;
    admin_path TEXT;
    occurred_at TIMESTAMPTZ;
    event_id UUID;
    user_id UUID;
    user_name TEXT;
    user_phone TEXT;
    area TEXT;
    item_title TEXT;
    details TEXT;
    profile_name TEXT;
    profile_phone TEXT;
    profile_area TEXT;
    parent_message_id UUID;
    parent_name TEXT;
    parent_phone TEXT;
    parent_subject TEXT;
    parent_body TEXT;
BEGIN
    event_id := NULLIF(row_data ->> 'id', '')::UUID;
    occurred_at := COALESCE(
        NULLIF(row_data ->> 'updated_at', '')::TIMESTAMPTZ,
        NULLIF(row_data ->> 'created_at', '')::TIMESTAMPTZ,
        NOW()
    );
    user_id := COALESCE(
        NULLIF(row_data ->> 'author_id', '')::UUID,
        NULLIF(row_data ->> 'owner_id', '')::UUID,
        NULLIF(row_data ->> 'user_id', '')::UUID,
        NULLIF(row_data ->> 'customer_id', '')::UUID,
        NULLIF(row_data ->> 'passenger_id', '')::UUID
    );
    user_name := COALESCE(
        NULLIF(row_data ->> 'author_name', ''),
        NULLIF(row_data ->> 'contact_name', ''),
        NULLIF(row_data ->> 'passenger_name', ''),
        NULLIF(row_data ->> 'owner_name', ''),
        NULLIF(row_data ->> 'full_name', ''),
        NULLIF(row_data ->> 'name', '')
    );
    user_phone := COALESCE(
        NULLIF(row_data ->> 'contact_phone', ''),
        NULLIF(row_data ->> 'mobile_number', ''),
        NULLIF(row_data ->> 'owner_phone', ''),
        NULLIF(row_data ->> 'private_phone', ''),
        NULLIF(row_data ->> 'phone', '')
    );
    area := COALESCE(
        NULLIF(row_data ->> 'area_id', ''),
        NULLIF(row_data ->> 'primary_area_id', ''),
        NULLIF(row_data ->> 'pickup_area_id', ''),
        NULLIF(row_data ->> 'address_line', '')
    );
    item_title := COALESCE(
        NULLIF(row_data ->> 'title_bn', ''),
        NULLIF(row_data ->> 'title', ''),
        NULLIF(row_data ->> 'complaint_subject', ''),
        NULLIF(row_data ->> 'subject', ''),
        NULLIF(row_data ->> 'name_bn', ''),
        NULLIF(row_data ->> 'name', '')
    );

    IF user_id IS NOT NULL THEN
        SELECT profile.full_name, profile.phone, profile.primary_area_id
          INTO profile_name, profile_phone, profile_area
          FROM public.profiles AS profile
         WHERE profile.id = user_id;
        user_name := COALESCE(user_name, profile_name);
        user_phone := COALESCE(user_phone, profile_phone);
        area := COALESCE(area, profile_area);
    END IF;

    CASE TG_TABLE_NAME
        WHEN 'profiles' THEN
            IF TG_OP = 'INSERT' THEN
                event_type := 'account_created';
                event_title := 'নতুন অ্যাকাউন্ট';
                admin_path := '/admin/users';
            ELSIF TG_OP = 'DELETE' THEN
                event_type := 'account_deleted';
                event_title := 'অ্যাকাউন্ট মুছে ফেলা হয়েছে';
                admin_path := '/admin/users';
            ELSE
                RETURN NEW;
            END IF;
            user_id := event_id;
            event_key := event_type || ':' || event_id::TEXT;
            IF event_type = 'account_created' THEN
                admin_path := admin_path || '/' || event_id::TEXT;
            END IF;
        WHEN 'users' THEN
            IF TG_TABLE_SCHEMA <> 'auth' THEN RETURN NEW; END IF;
            IF TG_OP = 'INSERT' THEN
                event_type := 'account_created';
                event_title := 'নতুন অ্যাকাউন্ট';
                admin_path := '/admin/users';
            ELSIF TG_OP = 'DELETE' THEN
                event_type := 'account_deleted';
                event_title := 'অ্যাকাউন্ট মুছে ফেলা হয়েছে';
                admin_path := '/admin/users';
            ELSE
                RETURN NEW;
            END IF;
            user_id := event_id;
            user_name := COALESCE(
                user_name,
                NULLIF(row_data #>> '{raw_user_meta_data,full_name}', ''),
                NULLIF(row_data #>> '{raw_user_meta_data,name}', ''),
                NULLIF(row_data ->> 'email', '')
            );
            user_phone := COALESCE(
                user_phone,
                NULLIF(row_data #>> '{raw_user_meta_data,phone}', '')
            );
            event_key := event_type || ':' || event_id::TEXT;
            IF event_type = 'account_created' THEN
                admin_path := admin_path || '/' || event_id::TEXT;
            END IF;
        WHEN 'community_posts' THEN
            IF TG_OP <> 'INSERT' THEN RETURN NEW; END IF;
            event_type := 'community_post';
            event_title := CASE row_data ->> 'kind'
                WHEN 'buy_sell' THEN 'নতুন কেনাবেচার পোস্ট'
                WHEN 'job' THEN 'নতুন চাকরির পোস্ট'
                WHEN 'news' THEN 'নতুন খবরের পোস্ট'
                ELSE 'নতুন পোস্ট: ' || COALESCE(NULLIF(row_data ->> 'kind', ''), 'অন্যান্য')
            END;
            admin_path := '/admin/posts/' || event_id::TEXT;
            details := COALESCE(
                NULLIF(row_data ->> 'summary_bn', ''),
                NULLIF(row_data ->> 'body_bn', '')
            );
            event_key := event_type || ':' || event_id::TEXT;
        WHEN 'service_requests' THEN
            IF TG_OP <> 'INSERT' OR row_data ->> 'status' <> 'new' THEN RETURN NEW; END IF;
            event_type := 'service_request';
            event_title := 'নতুন সার্ভিস রিকোয়েস্ট: ' || COALESCE(row_data ->> 'service_slug', 'অন্যান্য');
            admin_path := '/admin/requests/' || event_id::TEXT;
            details := COALESCE(
                NULLIF(row_data ->> 'details', ''),
                NULLIF(row_data ->> 'service_type', '')
            );
            event_key := event_type || ':' || event_id::TEXT;
        WHEN 'vehicle_requests' THEN
            IF TG_OP <> 'INSERT' THEN RETURN NEW; END IF;
            event_type := 'vehicle_request';
            event_title := 'নতুন গাড়ি ভাড়ার রিকোয়েস্ট';
            admin_path := '/admin/vehicle-requests/' || event_id::TEXT;
            details := CONCAT_WS(E'\n',
                CASE WHEN row_data ->> 'pickup_area_id' IS NOT NULL
                    THEN 'পিকআপ: ' || (row_data ->> 'pickup_area_id') END,
                CASE WHEN row_data ->> 'destination_area_id' IS NOT NULL
                    THEN 'গন্তব্য: ' || (row_data ->> 'destination_area_id') END,
                CASE WHEN row_data ->> 'travel_date' IS NOT NULL
                    THEN 'যাত্রার তারিখ: ' || (row_data ->> 'travel_date') END
            );
            event_key := event_type || ':' || event_id::TEXT;
        WHEN 'vehicle_bookings' THEN
            IF TG_OP <> 'INSERT' THEN RETURN NEW; END IF;
            event_type := 'vehicle_booking';
            event_title := 'নতুন যানবাহন বুকিং: ' || COALESCE(row_data ->> 'service_type', 'গাড়ি');
            admin_path := '/admin/vehicle-bookings/' || COALESCE(row_data ->> 'service_type', 'car');
            details := CONCAT_WS(E'\n',
                CASE WHEN row_data ->> 'pickup_location' IS NOT NULL
                    THEN 'পিকআপ: ' || (row_data ->> 'pickup_location') END,
                CASE WHEN row_data ->> 'destination' IS NOT NULL
                    THEN 'গন্তব্য: ' || (row_data ->> 'destination') END,
                CASE WHEN row_data ->> 'requested_at' IS NOT NULL
                    THEN 'যাত্রার সময়: ' || (row_data ->> 'requested_at') END
            );
            event_key := event_type || ':' || event_id::TEXT;
        WHEN 'tolet_listings' THEN
            IF TG_OP = 'DELETE' THEN
                IF user_id IS NULL OR auth.uid() IS DISTINCT FROM user_id THEN RETURN OLD; END IF;
                event_type := 'tolet_listing_deleted';
                event_title := 'বাসা ভাড়ার পোস্ট মুছে ফেলা হয়েছে';
                admin_path := '/admin/tolet';
                event_key := event_type || ':' || event_id::TEXT;
            ELSE
                IF row_data ->> 'status' <> 'pending_review' THEN RETURN NEW; END IF;
                IF TG_OP = 'UPDATE' THEN
                    old_data := TO_JSONB(OLD);
                    IF old_data ->> 'status' = row_data ->> 'status' THEN RETURN NEW; END IF;
                END IF;
                event_type := 'tolet_listing';
                event_title := 'নতুন বাসা ভাড়ার বিজ্ঞাপন';
                admin_path := '/admin/tolet/' || event_id::TEXT;
                details := CONCAT_WS(E'\n',
                    CASE WHEN row_data ->> 'rent_price' IS NOT NULL
                        THEN 'মাসিক ভাড়া: ৳' || (row_data ->> 'rent_price') END,
                    NULLIF(row_data ->> 'specific_address', ''),
                    NULLIF(row_data ->> 'description', '')
                );
                event_key := event_type || ':' || event_id::TEXT || ':' || occurred_at::TEXT;
            END IF;
        WHEN 'service_listings' THEN
            IF row_data ->> 'owner_id' IS NULL OR row_data ->> 'status' <> 'pending' THEN
                IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
            END IF;
            IF TG_OP = 'UPDATE' THEN
                old_data := TO_JSONB(OLD);
                IF old_data ->> 'status' = row_data ->> 'status' THEN RETURN NEW; END IF;
            END IF;
            event_type := 'service_listing';
            event_title := 'নতুন সেবা প্রোফাইল: ' || COALESCE(row_data ->> 'category', 'অন্যান্য');
            admin_path := '/admin/approvals';
            item_title := COALESCE(
                NULLIF(row_data ->> 'title_bn', ''),
                NULLIF(row_data ->> 'title', ''),
                item_title
            );
            details := COALESCE(
                NULLIF(row_data ->> 'summary_bn', ''),
                NULLIF(row_data ->> 'description_bn', '')
            );
            event_key := event_type || ':' || event_id::TEXT || ':' || occurred_at::TEXT;
        WHEN 'tolet_profiles' THEN
            IF row_data ->> 'status' <> 'pending_approval' THEN RETURN NEW; END IF;
            IF TG_OP = 'UPDATE' THEN
                old_data := TO_JSONB(OLD);
                IF old_data ->> 'status' = row_data ->> 'status' THEN RETURN NEW; END IF;
            END IF;
            event_type := 'tolet_profile';
            event_title := 'নতুন বাসা মালিকের প্রোফাইল';
            admin_path := '/admin/approvals';
            event_key := event_type || ':' || event_id::TEXT || ':' || occurred_at::TEXT;
        WHEN 'home_tutor_profiles' THEN
            IF row_data ->> 'status' <> 'pending_approval' THEN RETURN NEW; END IF;
            IF TG_OP = 'UPDATE' THEN
                old_data := TO_JSONB(OLD);
                IF old_data ->> 'status' = row_data ->> 'status' THEN RETURN NEW; END IF;
            END IF;
            event_type := 'tutor_profile';
            event_title := 'নতুন গৃহশিক্ষক প্রোফাইল';
            admin_path := '/admin/verifications/' || event_id::TEXT;
            details := CONCAT_WS(E'\n',
                NULLIF(row_data ->> 'institution', ''),
                NULLIF(row_data ->> 'department', ''),
                NULLIF(row_data ->> 'preferred_subjects', '')
            );
            event_key := event_type || ':' || event_id::TEXT || ':' || occurred_at::TEXT;
        WHEN 'blood_donor_profiles' THEN
            IF row_data ->> 'status' <> 'pending_approval' THEN RETURN NEW; END IF;
            IF TG_OP = 'UPDATE' THEN
                old_data := TO_JSONB(OLD);
                IF old_data ->> 'status' = row_data ->> 'status' THEN RETURN NEW; END IF;
            END IF;
            event_type := 'donor_profile';
            event_title := 'নতুন রক্তদাতা প্রোফাইল';
            admin_path := '/admin/blood/donors';
            details := 'রক্তের গ্রুপ: ' || COALESCE(row_data ->> 'blood_group', 'দেওয়া হয়নি');
            event_key := event_type || ':' || event_id::TEXT || ':' || occurred_at::TEXT;
        WHEN 'contact_messages' THEN
            IF TG_OP <> 'INSERT' THEN RETURN NEW; END IF;
            event_type := CASE WHEN row_data ->> 'subject' = 'complaint'
                THEN 'complaint' ELSE 'contact_message' END;
            event_title := CASE WHEN event_type = 'complaint'
                THEN 'নতুন অভিযোগ জমা' ELSE 'নতুন যোগাযোগের বার্তা' END;
            admin_path := '/admin/messages/' || event_id::TEXT;
            item_title := COALESCE(
                NULLIF(row_data ->> 'complaint_subject', ''),
                NULLIF(row_data ->> 'subject', '')
            );
            details := NULLIF(row_data ->> 'message', '');
            event_key := event_type || ':' || event_id::TEXT;
        WHEN 'contact_message_replies' THEN
            IF TG_OP <> 'INSERT' OR row_data ->> 'sender_role' <> 'customer' THEN RETURN NEW; END IF;
            parent_message_id := NULLIF(row_data ->> 'message_id', '')::UUID;
            SELECT message.name, message.phone, message.subject, message.message
              INTO parent_name, parent_phone, parent_subject, parent_body
              FROM public.contact_messages AS message
             WHERE message.id = parent_message_id;
            event_type := 'contact_message_reply';
            event_title := 'নতুন সাপোর্ট বার্তা';
            admin_path := '/admin/messages/' || COALESCE(parent_message_id, event_id)::TEXT;
            user_name := COALESCE(user_name, parent_name);
            user_phone := COALESCE(user_phone, parent_phone);
            item_title := parent_subject;
            details := row_data ->> 'body';
            event_key := event_type || ':' || event_id::TEXT;
        ELSE
            IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
    END CASE;

    IF event_key IS NULL THEN
        event_key := event_type || ':' || event_id::TEXT;
    END IF;
    IF event_title IS NULL OR admin_path IS NULL THEN
        IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
    END IF;

    BEGIN
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
                'event_type', event_type,
                'occurred_at', occurred_at,
                'title', event_title,
                'summary', LEFT(CONCAT_WS(E'\n',
                    CASE WHEN user_name IS NOT NULL THEN 'নাম: ' || user_name END,
                    CASE WHEN user_phone IS NOT NULL THEN 'ফোন: ' || user_phone END,
                    CASE WHEN area IS NOT NULL THEN 'এলাকা: ' || area END,
                    CASE WHEN item_title IS NOT NULL THEN 'শিরোনাম: ' || item_title END,
                    NULLIF(details, '')
                ), 3000),
                'user_name', user_name,
                'user_phone', user_phone,
                'area', area,
                'item_title', item_title,
                'details', details,
                'admin_path', admin_path
            ),
            occurred_at
        )
        ON CONFLICT (idempotency_key) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Admin Telegram event enqueue failed (type %, id %): %',
            event_type, event_id, SQLERRM;
        IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
    END;

    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_admin_telegram_event()
    FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_community_posts_admin_telegram_outbox ON public.community_posts;
DROP TRIGGER IF EXISTS trg_tolet_listings_admin_telegram_outbox ON public.tolet_listings;
DROP TRIGGER IF EXISTS trg_service_listings_admin_telegram_outbox ON public.service_listings;
DROP TRIGGER IF EXISTS trg_tolet_profiles_admin_telegram_outbox ON public.tolet_profiles;
DROP TRIGGER IF EXISTS trg_home_tutor_profiles_admin_telegram_outbox ON public.home_tutor_profiles;
DROP TRIGGER IF EXISTS trg_blood_donor_profiles_admin_telegram_outbox ON public.blood_donor_profiles;
DROP TRIGGER IF EXISTS trg_contact_messages_admin_telegram_outbox ON public.contact_messages;
DROP TRIGGER IF EXISTS trg_contact_message_replies_admin_telegram_outbox ON public.contact_message_replies;
DROP TRIGGER IF EXISTS trg_service_requests_admin_telegram_outbox ON public.service_requests;
DROP TRIGGER IF EXISTS trg_vehicle_requests_admin_telegram_outbox ON public.vehicle_requests;
DROP TRIGGER IF EXISTS trg_vehicle_bookings_admin_telegram_outbox ON public.vehicle_bookings;
DROP TRIGGER IF EXISTS trg_profiles_admin_telegram_outbox ON public.profiles;
DROP TRIGGER IF EXISTS trg_auth_users_admin_telegram_outbox ON auth.users;

CREATE TRIGGER trg_community_posts_admin_telegram_outbox
AFTER INSERT ON public.community_posts
FOR EACH ROW EXECUTE FUNCTION public.enqueue_admin_telegram_event();

CREATE TRIGGER trg_service_requests_admin_telegram_outbox
AFTER INSERT ON public.service_requests
FOR EACH ROW EXECUTE FUNCTION public.enqueue_admin_telegram_event();

CREATE TRIGGER trg_vehicle_requests_admin_telegram_outbox
AFTER INSERT ON public.vehicle_requests
FOR EACH ROW EXECUTE FUNCTION public.enqueue_admin_telegram_event();

CREATE TRIGGER trg_vehicle_bookings_admin_telegram_outbox
AFTER INSERT ON public.vehicle_bookings
FOR EACH ROW EXECUTE FUNCTION public.enqueue_admin_telegram_event();

CREATE TRIGGER trg_tolet_listings_admin_telegram_outbox
AFTER INSERT OR UPDATE OF status OR DELETE ON public.tolet_listings
FOR EACH ROW EXECUTE FUNCTION public.enqueue_admin_telegram_event();

CREATE TRIGGER trg_service_listings_admin_telegram_outbox
AFTER INSERT OR UPDATE OF status ON public.service_listings
FOR EACH ROW EXECUTE FUNCTION public.enqueue_admin_telegram_event();

CREATE TRIGGER trg_tolet_profiles_admin_telegram_outbox
AFTER INSERT OR UPDATE OF status ON public.tolet_profiles
FOR EACH ROW EXECUTE FUNCTION public.enqueue_admin_telegram_event();

CREATE TRIGGER trg_home_tutor_profiles_admin_telegram_outbox
AFTER INSERT OR UPDATE OF status ON public.home_tutor_profiles
FOR EACH ROW EXECUTE FUNCTION public.enqueue_admin_telegram_event();

CREATE TRIGGER trg_blood_donor_profiles_admin_telegram_outbox
AFTER INSERT OR UPDATE OF status ON public.blood_donor_profiles
FOR EACH ROW EXECUTE FUNCTION public.enqueue_admin_telegram_event();

CREATE TRIGGER trg_contact_messages_admin_telegram_outbox
AFTER INSERT ON public.contact_messages
FOR EACH ROW EXECUTE FUNCTION public.enqueue_admin_telegram_event();

CREATE TRIGGER trg_contact_message_replies_admin_telegram_outbox
AFTER INSERT ON public.contact_message_replies
FOR EACH ROW EXECUTE FUNCTION public.enqueue_admin_telegram_event();

CREATE TRIGGER trg_profiles_admin_telegram_outbox
AFTER INSERT OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.enqueue_admin_telegram_event();

CREATE TRIGGER trg_auth_users_admin_telegram_outbox
AFTER INSERT OR DELETE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.enqueue_admin_telegram_event();

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
        'tolet_listing_deleted',
        'blood_donor_reports',
        'listing_reports',
        'tutor_reports',
        'staff_profile_reports',
        'community_post_reports',
        'contact_message',
        'contact_message_reply',
        'complaint',
        'community_post',
        'service_listing',
        'tolet_profile',
        'tutor_profile',
        'donor_profile',
        'account_created',
        'account_deleted',
        'vehicle_request',
        'vehicle_booking'
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

    BEGIN
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
                'event_type', event_type,
                'occurred_at', NEW.created_at,
                'title', safe_title,
                'summary', safe_summary,
                'admin_path', admin_path
            ),
            NEW.created_at
        )
        ON CONFLICT (idempotency_key) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Admin Telegram notification enqueue failed (id %): %',
            NEW.id, SQLERRM;
    END;
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_uncovered_admin_notification_telegram()
    FROM PUBLIC, anon, authenticated;
