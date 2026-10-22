ALTER TABLE public.home_tutor_profiles
  ADD COLUMN IF NOT EXISTS expected_salary INTEGER;

UPDATE public.home_tutor_profiles
SET expected_salary = CASE
    WHEN expected_salary_min IS NOT NULL AND expected_salary_max IS NOT NULL
      THEN GREATEST(0, ROUND((expected_salary_min::NUMERIC + expected_salary_max::NUMERIC) / 2)::INTEGER)
    ELSE GREATEST(0, COALESCE(expected_salary_max, expected_salary_min, 0))
END
WHERE expected_salary IS NULL;

ALTER TABLE public.home_tutor_profiles
  ALTER COLUMN expected_salary SET DEFAULT 3000,
  ALTER COLUMN expected_salary SET NOT NULL;

NOTIFY pgrst, 'reload schema';
