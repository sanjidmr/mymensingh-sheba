import 'server-only';

import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import { createServerSideClient } from '@/lib/supabase/server';

export type NewsAdminActor = {
  client: NonNullable<Awaited<ReturnType<typeof createServerSideClient>>>;
  userId: string;
};

export type NewsEditorActor = NewsAdminActor & {
  fullName: string;
  canPublish: boolean;
};

export async function getNewsRouteRole(): Promise<'admin' | 'news_editor' | 'other' | null> {
  const client = await createServerSideClient();
  if (!client) return null;
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) return null;
  const { data: profile, error } = await client
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .maybeSingle();
  if (error || !profile || profile.status !== 'active') return 'other';
  if (profile.role === 'admin' || profile.role === 'news_editor') return profile.role;
  return 'other';
}

export async function getVerifiedNewsAdmin(): Promise<NewsAdminActor | null> {
  const client = await createServerSideClient();
  if (!client) return null;
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) return null;

  const { data: profile, error } = await client
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .maybeSingle();

  if (error || profile?.role !== 'admin' || profile.status !== 'active') return null;
  return { client, userId: user.id };
}

export async function getActiveNewsEditor(): Promise<NewsEditorActor | null> {
  const client = await createServerSideClient();
  if (!client) return null;
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) return null;

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('role, status, full_name')
    .eq('id', user.id)
    .maybeSingle();
  if (profileError || profile?.role !== 'news_editor' || profile.status !== 'active') return null;

  const { data: settings, error: settingsError } = await client
    .from('news_editor_settings')
    .select('can_publish')
    .eq('editor_id', user.id)
    .maybeSingle();
  if (settingsError) return null;

  return {
    client,
    userId: user.id,
    fullName: profile.full_name || 'নিউজ এডিটর',
    canPublish: settings?.can_publish === true,
  };
}

export function createAuthAdminClient(): SupabaseClient | null {
  if (typeof window !== 'undefined') return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function createRecoveryMailClient(): SupabaseClient | null {
  if (typeof window !== 'undefined') return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function newsEditorRedirectUrl(nextPath = '/news/editor'): string {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://mymensinghsheba.com';
  return new URL(`/auth/callback?next=${encodeURIComponent(nextPath)}`, origin).toString();
}
