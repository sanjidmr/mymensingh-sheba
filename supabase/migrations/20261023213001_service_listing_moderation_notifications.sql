CREATE OR REPLACE FUNCTION public.notif_service_listing_inserted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    cat_label TEXT;
    notification_body TEXT;
BEGIN
    IF NEW.owner_id IS NULL OR NEW.status <> 'pending' THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'UPDATE' AND OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    cat_label := CASE NEW.category
        WHEN 'coaching' THEN 'কোচিং সেন্টার'
        WHEN 'wifi' THEN 'WiFi প্রদানকারী'
        ELSE 'সেবা তালিকা'
    END;
    notification_body := CASE
        WHEN TG_OP = 'INSERT' THEN NEW.title_bn || ' — অনুমোদনের জন্য অপেক্ষমাণ।'
        ELSE NEW.title_bn || ' — সম্পাদনার পর আবার অনুমোদনের জন্য অপেক্ষমাণ।'
    END;

    INSERT INTO public.notifications (user_id, target_role, title, body, type, related_type, related_id)
    VALUES (
        NULL, 'admin',
        'নতুন ' || cat_label,
        notification_body,
        'info', 'service_listing', NEW.id::text
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notif_service_listing ON public.service_listings;
CREATE TRIGGER trg_notif_service_listing
AFTER INSERT OR UPDATE OF status ON public.service_listings
FOR EACH ROW EXECUTE FUNCTION public.notif_service_listing_inserted();
