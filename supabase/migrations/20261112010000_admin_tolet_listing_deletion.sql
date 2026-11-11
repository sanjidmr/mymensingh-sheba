-- Admins can remove the engagement events of a To-Let listing when they
-- permanently delete that listing. Public insertion and admin read policies
-- remain unchanged.
DROP POLICY IF EXISTS "Admins can delete To-Let listing events"
ON public.tolet_listing_events;

CREATE POLICY "Admins can delete To-Let listing events"
ON public.tolet_listing_events
FOR DELETE
TO authenticated
USING (public.is_admin());
