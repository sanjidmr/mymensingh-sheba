-- Customer coaching fees and atomic WiFi speed/price package editing.
--
-- Existing rows remain valid: admission_fee is optional, and the package RPC
-- only changes rows explicitly submitted by the listing owner.

ALTER TABLE public.service_listings
    ADD COLUMN IF NOT EXISTS admission_fee INTEGER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.service_listings'::regclass
          AND conname = 'service_listings_admission_fee_check'
    ) THEN
        ALTER TABLE public.service_listings
            ADD CONSTRAINT service_listings_admission_fee_check
            CHECK (admission_fee IS NULL OR admission_fee >= 0);
    END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.reapprove_service_listing_child_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    listing_key UUID;
    listing_owner UUID;
BEGIN
    IF auth.uid() IS NULL OR public.is_admin() THEN
        IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
        RETURN NEW;
    END IF;

    listing_key := CASE WHEN TG_OP = 'DELETE' THEN OLD.listing_id ELSE NEW.listing_id END;
    SELECT service_listings.owner_id
      INTO listing_owner
      FROM public.service_listings
     WHERE service_listings.id = listing_key;

    IF listing_owner = auth.uid() THEN
        UPDATE public.service_listings
           SET status = CASE WHEN service_listings.status = 'draft' THEN 'draft' ELSE 'pending' END,
               rejection_reason = NULL,
               published_at = NULL
         WHERE service_listings.id = listing_key;
    END IF;

    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_save_my_wifi_pricing_packages(
    p_listing_id UUID,
    p_packages JSONB
)
RETURNS SETOF public.wifi_packages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    package_row JSONB;
    package_id UUID;
    package_speed INTEGER;
    package_price INTEGER;
    keep_ids UUID[] := ARRAY[]::UUID[];
    listing_owner UUID;
    row_count INTEGER := 0;
    affected_rows INTEGER;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'login required';
    END IF;
    IF jsonb_typeof(p_packages) IS DISTINCT FROM 'array' THEN
        RAISE EXCEPTION 'WiFi packages must be an array';
    END IF;
    IF jsonb_array_length(p_packages) > 30 THEN
        RAISE EXCEPTION 'WiFi packages must be an array with at most 30 entries';
    END IF;

    SELECT service_listings.owner_id
      INTO listing_owner
      FROM public.service_listings
     WHERE service_listings.id = p_listing_id
       AND service_listings.category = 'wifi'
     FOR UPDATE;
    IF listing_owner IS DISTINCT FROM auth.uid() THEN
        RAISE EXCEPTION 'WiFi listing not found or not owned by current user';
    END IF;

    FOR package_row IN
        SELECT value
          FROM jsonb_array_elements(p_packages) AS packages(value)
    LOOP
        row_count := row_count + 1;
        IF jsonb_typeof(package_row) IS DISTINCT FROM 'object'
           OR COALESCE(package_row->>'speedMbps', '') !~ '^[1-9][0-9]*$'
           OR COALESCE(package_row->>'price', '') !~ '^(0|[1-9][0-9]*)$' THEN
            RAISE EXCEPTION 'Each WiFi package needs a valid integer speed and monthly price';
        END IF;

        package_speed := (package_row->>'speedMbps')::INTEGER;
        package_price := (package_row->>'price')::INTEGER;
        IF package_speed > 100000 OR package_price > 100000000 THEN
            RAISE EXCEPTION 'WiFi package speed or price is outside the allowed range';
        END IF;

        package_id := NULL;
        IF NULLIF(package_row->>'id', '') IS NOT NULL THEN
            BEGIN
                package_id := (package_row->>'id')::UUID;
            EXCEPTION WHEN invalid_text_representation THEN
                RAISE EXCEPTION 'WiFi package id is invalid';
            END;
            IF package_id = ANY(keep_ids) THEN
                RAISE EXCEPTION 'WiFi package id occurs more than once';
            END IF;

            UPDATE public.wifi_packages
               SET speed_mbps = package_speed,
                   price = package_price,
                   sort_order = row_count - 1
             WHERE wifi_packages.id = package_id
               AND wifi_packages.listing_id = p_listing_id;
            GET DIAGNOSTICS affected_rows = ROW_COUNT;
            IF affected_rows <> 1 THEN
                RAISE EXCEPTION 'WiFi package does not belong to this listing';
            END IF;
        ELSE
            INSERT INTO public.wifi_packages (
                listing_id,
                name_bn,
                speed_mbps,
                price,
                is_active,
                sort_order
            )
            VALUES (
                p_listing_id,
                package_speed::TEXT || ' Mbps',
                package_speed,
                package_price,
                TRUE,
                row_count - 1
            )
            RETURNING wifi_packages.id INTO package_id;
        END IF;
        keep_ids := array_append(keep_ids, package_id);
    END LOOP;

    DELETE FROM public.wifi_packages
     WHERE wifi_packages.listing_id = p_listing_id
       AND NOT (wifi_packages.id = ANY(keep_ids));

    RETURN QUERY
        SELECT wifi_packages.*
          FROM public.wifi_packages
         WHERE wifi_packages.listing_id = p_listing_id
         ORDER BY wifi_packages.sort_order, wifi_packages.created_at;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_save_my_wifi_pricing_packages(UUID, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_save_my_wifi_pricing_packages(UUID, JSONB) TO authenticated;

NOTIFY pgrst, 'reload schema';
