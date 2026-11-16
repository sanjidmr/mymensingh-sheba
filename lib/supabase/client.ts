import { createBrowserClient } from '@supabase/ssr';
import { supabaseCookieOptions } from './cookie-options';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== '' &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== ''
);

export function createClient() {
  if (!isSupabaseConfigured) {
    return null;
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      cookieOptions: supabaseCookieOptions,
      global: { fetch: fetchWithTimeout },
    }
  );
}
