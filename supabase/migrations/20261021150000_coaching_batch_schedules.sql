-- Structured recurring schedules for coaching batches.
-- The original free-text start_time is intentionally retained for existing
-- announcements; new owner schedules use these typed columns.

ALTER TABLE public.coaching_batches
    ADD COLUMN IF NOT EXISTS weekdays TEXT[] NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS start_time_local TIME,
    ADD COLUMN IF NOT EXISTS end_time_local TIME;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.coaching_batches'::regclass
          AND conname = 'coaching_batches_weekdays_valid'
    ) THEN
        ALTER TABLE public.coaching_batches
            ADD CONSTRAINT coaching_batches_weekdays_valid
            CHECK (weekdays <@ ARRAY[
                'saturday', 'sunday', 'monday', 'tuesday',
                'wednesday', 'thursday', 'friday'
            ]::TEXT[]) NOT VALID;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.coaching_batches'::regclass
          AND conname = 'coaching_batches_schedule_complete'
    ) THEN
        ALTER TABLE public.coaching_batches
            ADD CONSTRAINT coaching_batches_schedule_complete
            CHECK (
                (
                    start_time_local IS NULL
                    AND end_time_local IS NULL
                    AND cardinality(weekdays) = 0
                )
                OR
                (
                    start_date IS NOT NULL
                    AND cardinality(weekdays) > 0
                    AND start_time_local IS NOT NULL
                    AND end_time_local IS NOT NULL
                    AND end_time_local > start_time_local
                )
            ) NOT VALID;
    END IF;
END
$$;

NOTIFY pgrst, 'reload schema';
