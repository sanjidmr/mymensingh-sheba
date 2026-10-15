-- Extend existing admin-curated vehicle rows and guest booking requests.
-- Existing listings and requests remain intact; old requests keep their
-- original status and have NULL estimate snapshots.
ALTER TABLE public.service_listings
    ADD COLUMN IF NOT EXISTS rate_per_km NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS minimum_fare NUMERIC(12, 2),
    ADD COLUMN IF NOT EXISTS additional_fee NUMERIC(12, 2),
    ADD COLUMN IF NOT EXISTS additional_fee_note_bn TEXT,
    ADD COLUMN IF NOT EXISTS available_facilities TEXT[] NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS unavailable_facilities TEXT[] NOT NULL DEFAULT '{}';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'service_listings_vehicle_pricing_check'
          AND conrelid = 'public.service_listings'::regclass
    ) THEN
        ALTER TABLE public.service_listings
            ADD CONSTRAINT service_listings_vehicle_pricing_check
            CHECK (
                category <> 'vehicle'
                OR (
                    (rate_per_km IS NULL OR rate_per_km > 0)
                    AND (minimum_fare IS NULL OR minimum_fare >= 0)
                    AND (rate_per_km IS NOT NULL OR minimum_fare IS NULL)
                    AND (additional_fee IS NULL OR additional_fee >= 0)
                    AND (additional_fee IS NULL OR additional_fee = 0 OR NULLIF(BTRIM(additional_fee_note_bn), '') IS NOT NULL)
                )
            ) NOT VALID;
    END IF;
END;
$$;

ALTER TABLE public.vehicle_requests
    ADD COLUMN IF NOT EXISTS estimated_distance_km NUMERIC(8, 2),
    ADD COLUMN IF NOT EXISTS distance_source TEXT,
    ADD COLUMN IF NOT EXISTS rate_per_km NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS minimum_fare NUMERIC(12, 2),
    ADD COLUMN IF NOT EXISTS estimated_fare NUMERIC(12, 2),
    ADD COLUMN IF NOT EXISTS additional_fee NUMERIC(12, 2),
    ADD COLUMN IF NOT EXISTS additional_fee_note_bn TEXT,
    ADD COLUMN IF NOT EXISTS assigned_vehicle_listing_id UUID
        REFERENCES public.service_listings(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS assigned_driver_name TEXT,
    ADD COLUMN IF NOT EXISTS assigned_driver_phone TEXT,
    ADD COLUMN IF NOT EXISTS admin_notes TEXT;

ALTER TABLE public.vehicle_requests
    DROP CONSTRAINT IF EXISTS vehicle_requests_status_check;
ALTER TABLE public.vehicle_requests
    ADD CONSTRAINT vehicle_requests_status_check
    CHECK (status IN ('new', 'reviewing', 'contacted', 'approved', 'rejected', 'closed')) NOT VALID;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'vehicle_requests_estimate_source_check'
          AND conrelid = 'public.vehicle_requests'::regclass
    ) THEN
        ALTER TABLE public.vehicle_requests
            ADD CONSTRAINT vehicle_requests_estimate_source_check
            CHECK (
                (estimated_distance_km IS NULL AND distance_source IS NULL)
                OR (
                    estimated_distance_km > 0
                    AND distance_source IN ('road_route', 'manual_estimate')
                    AND (
                        (rate_per_km IS NULL AND estimated_fare IS NULL)
                        OR (rate_per_km IS NOT NULL AND estimated_fare IS NOT NULL)
                    )
                )
            ) NOT VALID;
    END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_vehicle_requests_status_created
    ON public.vehicle_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_requests_assigned_vehicle
    ON public.vehicle_requests (assigned_vehicle_listing_id)
    WHERE assigned_vehicle_listing_id IS NOT NULL;

-- Direct inserts could forge a road distance or a price snapshot. Accept
-- submissions only through the server-side function below, which gets pricing
-- from the selected active listing and computes the fare in the database.
DROP POLICY IF EXISTS "Anyone can submit vehicle requests" ON public.vehicle_requests;
REVOKE INSERT ON public.vehicle_requests FROM PUBLIC, anon, authenticated;

DROP FUNCTION IF EXISTS public.fn_submit_vehicle_request(
    UUID, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TEXT, INTEGER, TEXT, INTEGER, TEXT, NUMERIC, TEXT
);

CREATE OR REPLACE FUNCTION public.fn_submit_vehicle_request(
    p_vehicle_listing_id UUID,
    p_vehicle_kind TEXT,
    p_contact_name TEXT,
    p_contact_phone TEXT,
    p_pickup TEXT,
    p_destination TEXT,
    p_travel_date DATE,
    p_travel_time TEXT,
    p_passenger_count INTEGER,
    p_trip_duration TEXT,
    p_budget INTEGER,
    p_notes TEXT,
    p_distance_km NUMERIC,
    p_distance_source TEXT,
    p_customer_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    vehicle public.service_listings%ROWTYPE;
    request_id UUID;
    fare NUMERIC(12, 2);
BEGIN
    IF p_vehicle_listing_id IS NULL
       OR p_vehicle_kind IS NULL
       OR p_vehicle_kind NOT IN ('গাড়ি', 'অটো', 'CNG')
       OR NULLIF(BTRIM(p_contact_name), '') IS NULL
       OR LENGTH(BTRIM(p_contact_name)) > 80
       OR p_contact_phone IS NULL
       OR p_contact_phone !~ '^\+?8801[3-9][0-9]{8}$'
       OR NULLIF(BTRIM(p_pickup), '') IS NULL
       OR LENGTH(BTRIM(p_pickup)) > 160
       OR NULLIF(BTRIM(p_destination), '') IS NULL
       OR LENGTH(BTRIM(p_destination)) > 160
       OR p_travel_date IS NULL
       OR p_travel_time IS NULL
       OR BTRIM(p_travel_time) !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
       OR (p_travel_time IS NOT NULL AND LENGTH(BTRIM(p_travel_time)) > 60)
       OR (p_trip_duration IS NOT NULL AND LENGTH(BTRIM(p_trip_duration)) > 80)
       OR (p_notes IS NOT NULL AND LENGTH(BTRIM(p_notes)) > 1000)
       OR (p_passenger_count IS NOT NULL AND p_passenger_count NOT BETWEEN 1 AND 100) THEN
        RAISE EXCEPTION 'যানবাহনের অনুরোধের তথ্য সঠিক নয়';
    END IF;
    IF p_budget IS NOT NULL AND p_budget NOT BETWEEN 1 AND 100000000 THEN
        RAISE EXCEPTION 'বাজেটের পরিমাণ সঠিক নয়';
    END IF;
    IF p_distance_source IS NULL
       OR p_distance_source NOT IN ('road_route', 'manual_estimate')
       OR p_distance_km IS NULL
       OR p_distance_km NOT BETWEEN 0.1 AND 3000 THEN
        RAISE EXCEPTION 'নির্ভরযোগ্য দূরত্ব বা স্পষ্টভাবে দেওয়া ম্যানুয়াল দূরত্ব প্রয়োজন';
    END IF;
    IF p_customer_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = p_customer_id AND status = 'active'
    ) THEN
        RAISE EXCEPTION 'এই অ্যাকাউন্ট থেকে অনুরোধ পাঠানো যাচ্ছে না';
    END IF;

    SELECT * INTO vehicle
    FROM public.service_listings
    WHERE id = p_vehicle_listing_id
      AND category = 'vehicle'
      AND is_active = TRUE
    FOR SHARE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'নির্বাচিত যানবাহনটি এখন বুকিং অনুরোধের জন্য উপলভ্য নয়';
    END IF;

    IF vehicle.rate_per_km IS NOT NULL THEN
        fare := GREATEST(
            ROUND(p_distance_km * vehicle.rate_per_km, 2),
            COALESCE(vehicle.minimum_fare, 0)
        ) + COALESCE(vehicle.additional_fee, 0);
    END IF;

    INSERT INTO public.vehicle_requests (
        vehicle_listing_id, vehicle_kind, vehicle_name, customer_id,
        contact_name, contact_phone, pickup_area_id, destination_area_id,
        travel_date, travel_time, passenger_count, trip_duration, budget, notes,
        estimated_distance_km, distance_source, rate_per_km, minimum_fare,
        estimated_fare, additional_fee, additional_fee_note_bn, status
    )
    VALUES (
        vehicle.id, p_vehicle_kind, vehicle.title_bn, p_customer_id,
        BTRIM(p_contact_name), p_contact_phone, BTRIM(p_pickup), BTRIM(p_destination),
        p_travel_date, NULLIF(BTRIM(p_travel_time), ''), p_passenger_count,
        NULLIF(BTRIM(p_trip_duration), ''), p_budget, NULLIF(BTRIM(p_notes), ''),
        p_distance_km, p_distance_source, vehicle.rate_per_km,
        vehicle.minimum_fare, fare, vehicle.additional_fee,
        vehicle.additional_fee_note_bn, 'new'
    )
    RETURNING id INTO request_id;

    RETURN request_id;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_submit_vehicle_request(
    UUID, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TEXT, INTEGER, TEXT, INTEGER, TEXT, NUMERIC, TEXT, UUID
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_submit_vehicle_request(
    UUID, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TEXT, INTEGER, TEXT, INTEGER, TEXT, NUMERIC, TEXT, UUID
) TO service_role;

COMMENT ON COLUMN public.vehicle_requests.distance_source IS
    'road_route means server-calculated road routing distance; manual_estimate is customer-entered and explicitly labeled.';
COMMENT ON COLUMN public.vehicle_requests.estimated_fare IS
    'Database-calculated distance × listing rate, with the minimum fare and configured additional fee applied; not a confirmed quote.';
COMMENT ON COLUMN public.vehicle_requests.additional_fee IS
    'Snapshot of the admin-configured listing charge included in the estimated fare.';
