-- Private replies attached to the existing contact inbox. The parent message
-- remains the conversation's first message and existing admin status workflow.
CREATE TABLE IF NOT EXISTS public.contact_message_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.contact_messages(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender_role TEXT NOT NULL CHECK (sender_role IN ('customer', 'admin')),
    body TEXT NOT NULL CHECK (length(trim(body)) BETWEEN 1 AND 1500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_contact_message_replies_thread
    ON public.contact_message_replies (message_id, created_at);

ALTER TABLE public.contact_message_replies ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.contact_message_replies TO authenticated;

DROP POLICY IF EXISTS "Conversation participants read replies"
    ON public.contact_message_replies;
CREATE POLICY "Conversation participants read replies"
    ON public.contact_message_replies FOR SELECT
    TO authenticated
    USING (
        public.is_admin()
        OR EXISTS (
            SELECT 1
            FROM public.contact_messages AS message
            WHERE message.id = public.contact_message_replies.message_id
              AND message.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Conversation participants add replies"
    ON public.contact_message_replies;
CREATE POLICY "Conversation participants add replies"
    ON public.contact_message_replies FOR INSERT
    TO authenticated
    WITH CHECK (
        sender_id = auth.uid()
        AND (
            (sender_role = 'admin' AND public.is_admin())
            OR (
                sender_role = 'customer'
                AND EXISTS (
                    SELECT 1
                    FROM public.contact_messages AS message
                    WHERE message.id = public.contact_message_replies.message_id
                      AND message.user_id = auth.uid()
                )
            )
        )
    );

-- Authenticated users can only associate a submitted contact form with
-- themselves. Anonymous submissions continue to have a null user_id.
DROP POLICY IF EXISTS "Guests can send contact messages"
    ON public.contact_messages;
CREATE POLICY "Guests can send contact messages"
    ON public.contact_messages FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        name IS NOT NULL AND length(trim(name)) >= 3
        AND phone IS NOT NULL AND length(trim(phone)) >= 10
        AND message IS NOT NULL AND length(trim(message)) >= 12
        AND length(message) <= 1500
        AND (
            (auth.uid() IS NULL AND user_id IS NULL)
            OR (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()))
        )
    );

DROP POLICY IF EXISTS "Customers read own contact conversations"
    ON public.contact_messages;

-- Row-level policies cannot hide individual columns such as the admin-only
-- internal note. Return only customer-safe columns through this scoped RPC.
CREATE OR REPLACE FUNCTION public.fn_my_contact_conversations()
RETURNS TABLE (
    id UUID,
    subject TEXT,
    message TEXT,
    status TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT message.id, message.subject, message.message, message.status, message.created_at
    FROM public.contact_messages AS message
    WHERE message.user_id = auth.uid()
    ORDER BY message.created_at DESC
$$;

REVOKE ALL ON FUNCTION public.fn_my_contact_conversations() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_my_contact_conversations() TO authenticated;

CREATE OR REPLACE FUNCTION public.can_access_contact_conversation(target_message_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT public.is_admin()
        OR EXISTS (
            SELECT 1
            FROM public.contact_messages AS message
            WHERE message.id = target_message_id
              AND message.user_id = auth.uid()
        )
$$;

REVOKE ALL ON FUNCTION public.can_access_contact_conversation(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_contact_conversation(UUID) TO authenticated;

DROP POLICY IF EXISTS "Conversation participants read replies"
    ON public.contact_message_replies;
CREATE POLICY "Conversation participants read replies"
    ON public.contact_message_replies FOR SELECT
    TO authenticated
    USING (public.can_access_contact_conversation(message_id));

DROP POLICY IF EXISTS "Conversation participants add replies"
    ON public.contact_message_replies;
CREATE POLICY "Conversation participants add replies"
    ON public.contact_message_replies FOR INSERT
    TO authenticated
    WITH CHECK (
        sender_id = auth.uid()
        AND (
            (sender_role = 'admin' AND public.is_admin())
            OR (
                sender_role = 'customer'
                AND NOT public.is_admin()
                AND public.can_access_contact_conversation(message_id)
            )
        )
    );

CREATE OR REPLACE FUNCTION public.notify_contact_message_reply()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    message_owner UUID;
    message_subject TEXT;
BEGIN
    SELECT user_id, subject
      INTO message_owner, message_subject
      FROM public.contact_messages
     WHERE id = NEW.message_id;

    IF NEW.sender_role = 'admin' AND message_owner IS NOT NULL THEN
        INSERT INTO public.notifications (
            user_id, target_role, title, body, type, related_type, related_id
        )
        VALUES (
            message_owner, 'customer', 'সাপোর্ট টিমের উত্তর',
            'আপনার "' || message_subject || '" বার্তার উত্তর এসেছে।',
            'info', 'contact_message', NEW.message_id::text
        );
    ELSIF NEW.sender_role = 'customer' THEN
        INSERT INTO public.notifications (
            target_role, title, body, type, related_type, related_id
        )
        VALUES (
            'admin', 'সাপোর্ট বার্তার উত্তর',
            'একজন গ্রাহক কথোপকথনে নতুন উত্তর দিয়েছেন।',
            'info', 'contact_message', NEW.message_id::text
        );
    END IF;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_contact_message_reply() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_notify_contact_message_reply
    ON public.contact_message_replies;
CREATE TRIGGER trg_notify_contact_message_reply
    AFTER INSERT ON public.contact_message_replies
    FOR EACH ROW EXECUTE FUNCTION public.notify_contact_message_reply();
