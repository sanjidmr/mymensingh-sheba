ALTER TABLE public.admin_email_outbox RENAME TO admin_telegram_outbox;
ALTER TABLE public.admin_email_worker_lock RENAME TO admin_telegram_worker_lock;

ALTER TABLE public.admin_telegram_outbox
    RENAME CONSTRAINT admin_email_outbox_pkey TO admin_telegram_outbox_pkey;
ALTER TABLE public.admin_telegram_outbox
    RENAME CONSTRAINT admin_email_outbox_idempotency_key_key TO admin_telegram_outbox_idempotency_key_key;
ALTER TABLE public.admin_telegram_outbox
    RENAME CONSTRAINT admin_email_outbox_attempt_count_check TO admin_telegram_outbox_attempt_count_check;
ALTER TABLE public.admin_telegram_worker_lock
    RENAME CONSTRAINT admin_email_worker_lock_pkey TO admin_telegram_worker_lock_pkey;

UPDATE public.admin_telegram_outbox
SET status = 'failed',
    last_error = COALESCE(last_error, 'legacy_email_delivery_not_migrated_to_telegram')
WHERE status IN ('accepted_by_provider', 'delivered');

UPDATE public.admin_telegram_outbox
SET status = 'failed',
    last_error = 'vehicle_booking_notifications_are_sent_directly'
WHERE related_type = 'vehicle_booking'
  AND status IN ('pending', 'processing', 'retry_scheduled');

ALTER TABLE public.admin_telegram_outbox
    DROP CONSTRAINT IF EXISTS admin_email_outbox_status_check;
ALTER TABLE public.admin_telegram_outbox
    ADD CONSTRAINT admin_telegram_outbox_status_check
    CHECK (status IN ('pending', 'processing', 'delivered', 'retry_scheduled', 'failed'));
ALTER TABLE public.admin_telegram_outbox
    DROP COLUMN IF EXISTS provider_http_status,
    DROP COLUMN IF EXISTS provider_message_id,
    DROP COLUMN IF EXISTS delivered_at;

DROP TABLE IF EXISTS public.admin_email_webhook_events;

ALTER FUNCTION public.enqueue_admin_email_outbox_event()
    RENAME TO enqueue_admin_telegram_outbox_event;
ALTER FUNCTION public.enqueue_uncovered_admin_notification_email()
    RENAME TO enqueue_uncovered_admin_notification_telegram;
ALTER FUNCTION public.claim_admin_email_outbox_job(INTEGER, INTEGER)
    RENAME TO claim_admin_telegram_outbox_job;
ALTER FUNCTION public.acquire_admin_email_worker_lock(INTEGER)
    RENAME TO acquire_admin_telegram_worker_lock;
ALTER FUNCTION public.release_admin_email_worker_lock(UUID)
    RENAME TO release_admin_telegram_worker_lock;

DROP TRIGGER IF EXISTS trg_vehicle_bookings_admin_email_outbox ON public.vehicle_bookings;
DROP FUNCTION IF EXISTS public.enqueue_vehicle_booking_admin_email();

DO $$
DECLARE
    function_row RECORD;
    trigger_row RECORD;
    index_row RECORD;
    definition TEXT;
    renamed_trigger TEXT;
    renamed_index TEXT;
BEGIN
    FOR function_row IN
        SELECT p.oid
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname IN (
              'enqueue_admin_telegram_outbox_event',
              'enqueue_uncovered_admin_notification_telegram',
              'claim_admin_telegram_outbox_job',
              'acquire_admin_telegram_worker_lock',
              'release_admin_telegram_worker_lock'
          )
    LOOP
        definition := pg_get_functiondef(function_row.oid);
        definition := REPLACE(definition, 'admin_email_outbox', 'admin_telegram_outbox');
        definition := REPLACE(definition, 'admin_email_worker_lock', 'admin_telegram_worker_lock');
        EXECUTE definition;
    END LOOP;

    FOR trigger_row IN
        SELECT
            trig.tgname,
            schema_name.nspname AS schema_name,
            table_name.relname AS table_name
        FROM pg_trigger trig
        JOIN pg_class table_name ON table_name.oid = trig.tgrelid
        JOIN pg_namespace schema_name ON schema_name.oid = table_name.relnamespace
        WHERE NOT trig.tgisinternal
          AND schema_name.nspname = 'public'
          AND (
              trig.tgname LIKE '%admin_email_outbox%'
              OR trig.tgname = 'trg_admin_notification_email_outbox'
          )
    LOOP
        renamed_trigger := REPLACE(trigger_row.tgname, 'email', 'telegram');
        EXECUTE FORMAT(
            'ALTER TRIGGER %I ON %I.%I RENAME TO %I',
            trigger_row.tgname,
            trigger_row.schema_name,
            trigger_row.table_name,
            renamed_trigger
        );
    END LOOP;

    FOR index_row IN
        SELECT index_class.relname AS index_name
        FROM pg_class index_class
        JOIN pg_namespace schema_name ON schema_name.oid = index_class.relnamespace
        WHERE schema_name.nspname = 'public'
          AND index_class.relkind = 'i'
          AND index_class.relname LIKE 'idx_admin_email_outbox_%'
    LOOP
        renamed_index := REPLACE(index_row.index_name, 'admin_email_outbox', 'admin_telegram_outbox');
        EXECUTE FORMAT('ALTER INDEX public.%I RENAME TO %I', index_row.index_name, renamed_index);
    END LOOP;
END;
$$;
