import { createBrowserClient } from '@supabase/ssr';
import { supabaseCookieOptions } from './cookie-options';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== '' &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== ''
);

type BrowserClient = ReturnType<typeof createBrowserClient>;
let browserClient: BrowserClient | null = null;

export function createClient() {
  if (!isSupabaseConfigured) {
    return null;
  }

  if (typeof window !== 'undefined' && browserClient) {
    return browserClient;
  }

  const client = createBrowserClient(
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
  if (typeof window !== 'undefined') {
    browserClient = client;
  }
  return client;
}
