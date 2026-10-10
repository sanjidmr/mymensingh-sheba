-- Customers may cancel a new/submitted request, but cannot rewrite request
-- details or manipulate statuses after staff have started processing it.
DROP POLICY IF EXISTS "Users can cancel own service request"
    ON public.service_requests;
CREATE POLICY "Users can cancel own service request"
    ON public.service_requests FOR UPDATE
    TO authenticated
    USING (
        public.is_admin()
        OR (
            auth.uid() = customer_id
            AND status IN ('new', 'submitted')
        )
    )
    WITH CHECK (
        public.is_admin()
        OR (
            auth.uid() = customer_id
            AND status = 'cancelled'
        )
    );

CREATE OR REPLACE FUNCTION public.guard_customer_service_request_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF COALESCE(CURRENT_SETTING('request.jwt.claim.role', TRUE), '') = 'service_role'
       OR public.is_admin() THEN
        RETURN NEW;
    END IF;

    IF auth.uid() IS NULL
       OR OLD.customer_id <> auth.uid()
       OR NEW.customer_id <> OLD.customer_id
       OR OLD.status NOT IN ('new', 'submitted')
       OR NEW.status <> 'cancelled'
       OR (TO_JSONB(NEW) - ARRAY['status', 'updated_at'])
          IS DISTINCT FROM (TO_JSONB(OLD) - ARRAY['status', 'updated_at']) THEN
        RAISE EXCEPTION 'Customers may only cancel their own new or submitted requests';
    END IF;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_customer_service_request_update() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_guard_customer_service_request_update
    ON public.service_requests;
CREATE TRIGGER trg_guard_customer_service_request_update
    BEFORE UPDATE ON public.service_requests
    FOR EACH ROW EXECUTE FUNCTION public.guard_customer_service_request_update();
