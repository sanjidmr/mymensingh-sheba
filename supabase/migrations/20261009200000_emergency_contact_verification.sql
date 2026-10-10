-- A public emergency contact must be explicitly activated by an admin and
-- include a documented verification source. Keep inactive/incomplete records
-- visible only to administrators through the separate admin policy.
DROP POLICY IF EXISTS "Active emergency contacts are public"
    ON public.emergency_contacts;

CREATE POLICY "Active emergency contacts are public"
    ON public.emergency_contacts FOR SELECT
    TO anon, authenticated
    USING (
        is_active = TRUE
        AND NULLIF(BTRIM(source_note), '') IS NOT NULL
    );
