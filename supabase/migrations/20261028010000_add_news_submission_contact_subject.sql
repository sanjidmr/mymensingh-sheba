ALTER TABLE public.contact_messages
    DROP CONSTRAINT IF EXISTS contact_messages_subject_check;

ALTER TABLE public.contact_messages
    ADD CONSTRAINT contact_messages_subject_check
    CHECK (
        subject IN (
            'general',
            'news_submission',
            'service_info',
            'post_service',
            'correction',
            'complaint',
            'partnership',
            'other'
        )
    );
