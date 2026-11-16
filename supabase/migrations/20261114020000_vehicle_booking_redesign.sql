ALTER TABLE public.vehicle_bookings
    DROP CONSTRAINT IF EXISTS vehicle_bookings_service_type_check;

ALTER TABLE public.vehicle_bookings
    ADD CONSTRAINT vehicle_bookings_service_type_check
    CHECK (service_type IN ('car', 'auto', 'cng'));

ALTER TABLE public.vehicle_bookings
    ADD COLUMN IF NOT EXISTS passenger_count INTEGER NOT NULL DEFAULT 1
        CHECK (passenger_count BETWEEN 1 AND 50),
    ADD COLUMN IF NOT EXISTS vehicle_preference TEXT NOT NULL DEFAULT 'যেকোনো উপযুক্ত যানবাহন'
        CHECK (char_length(btrim(vehicle_preference)) BETWEEN 2 AND 100),
    ADD COLUMN IF NOT EXISTS reference_code TEXT;

ALTER TABLE public.vehicle_bookings
    ALTER COLUMN current_address DROP NOT NULL;

UPDATE public.vehicle_bookings
SET reference_code = 'VH-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))
WHERE reference_code IS NULL;

ALTER TABLE public.vehicle_bookings
    ALTER COLUMN reference_code SET DEFAULT
        ('VH-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))),
    ALTER COLUMN reference_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicle_bookings_reference_code
    ON public.vehicle_bookings (reference_code);

CREATE INDEX IF NOT EXISTS idx_vehicle_bookings_category_created
    ON public.vehicle_bookings (service_type, created_at DESC);
