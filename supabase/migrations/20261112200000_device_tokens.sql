CREATE TABLE IF NOT EXISTS public.device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL CHECK (platform IN ('android', 'ios')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS device_tokens_user_id_idx
  ON public.device_tokens (user_id);

ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own device tokens" ON public.device_tokens;
CREATE POLICY "Users can read their own device tokens"
  ON public.device_tokens FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add their own device tokens" ON public.device_tokens;
CREATE POLICY "Users can add their own device tokens"
  ON public.device_tokens FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own device tokens" ON public.device_tokens;
CREATE POLICY "Users can update their own device tokens"
  ON public.device_tokens FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their own device tokens" ON public.device_tokens;
CREATE POLICY "Users can remove their own device tokens"
  ON public.device_tokens FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.device_tokens TO authenticated;
GRANT ALL ON public.device_tokens TO service_role;
