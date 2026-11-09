CREATE TABLE IF NOT EXISTS public.vehicle_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key UUID NOT NULL UNIQUE,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('auto', 'cng')),
  passenger_name TEXT NOT NULL CHECK (char_length(btrim(passenger_name)) BETWEEN 3 AND 80),
  mobile_number TEXT NOT NULL CHECK (mobile_number ~ '^\+8801[3-9][0-9]{8}$'),
  current_address TEXT NOT NULL CHECK (char_length(btrim(current_address)) BETWEEN 3 AND 240),
  pickup_location TEXT NOT NULL CHECK (char_length(btrim(pickup_location)) BETWEEN 2 AND 160),
  destination TEXT NOT NULL CHECK (char_length(btrim(destination)) BETWEEN 2 AND 160),
  requested_at TIMESTAMPTZ NOT NULL,
  additional_info TEXT CHECK (additional_info IS NULL OR char_length(additional_info) <= 1000),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_vehicle_bookings_service_status_created
  ON public.vehicle_bookings (service_type, status, created_at DESC);

DROP POLICY IF EXISTS "Active service listings are public" ON public.service_listings;
CREATE POLICY "Active service listings are public"
  ON public.service_listings FOR SELECT
  TO anon, authenticated
  USING (
    is_active = TRUE
    AND (category <> 'vehicle' OR tags @> ARRAY['গাড়ি']::TEXT[])
  );

ALTER TABLE public.vehicle_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage vehicle bookings" ON public.vehicle_bookings;
CREATE POLICY "Admins manage vehicle bookings"
  ON public.vehicle_bookings FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS trg_vehicle_bookings_updated ON public.vehicle_bookings;
CREATE TRIGGER trg_vehicle_bookings_updated
  BEFORE UPDATE ON public.vehicle_bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

REVOKE ALL ON public.vehicle_bookings FROM anon, authenticated;
GRANT SELECT, UPDATE ON public.vehicle_bookings TO authenticated;
GRANT ALL ON public.vehicle_bookings TO service_role;
