ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

UPDATE public.profiles
SET onboarding_completed_at = COALESCE(updated_at, NOW())
WHERE onboarding_completed_at IS NULL
  AND NULLIF(BTRIM(full_name), '') IS NOT NULL
  AND regexp_replace(phone, '[^0-9]', '', 'g')
    ~ '^(01[3-9][0-9]{8}|8801[3-9][0-9]{8})$'
  AND NULLIF(BTRIM(primary_area_id), '') IS NOT NULL;
