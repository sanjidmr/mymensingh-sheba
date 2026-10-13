-- Owners may save an unpublished tutor or donor profile as a draft and later
-- submit it for review. Approval and rejection transitions remain admin-only
-- through prevent_self_approval().

DROP POLICY IF EXISTS "Users can update their tutor profile"
  ON public.home_tutor_profiles;
CREATE POLICY "Users can update their tutor profile"
  ON public.home_tutor_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND status IN ('draft', 'pending_approval', 'approved')
  );

DROP POLICY IF EXISTS "Users can update their donor profile"
  ON public.blood_donor_profiles;
CREATE POLICY "Users can update their donor profile"
  ON public.blood_donor_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND status IN ('draft', 'pending_approval', 'approved')
  );
