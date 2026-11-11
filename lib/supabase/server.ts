import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import { isSupabaseConfigured } from './client';
import { supabaseCookieOptions } from './cookie-options';

/**
 * Creates a Supabase server client.
 *
 * This function must be called in a Server Component or Server Action context,
 * where `cookies()` from `next/headers` is available.
 */
export async function createServerSideClient() {
  if (!isSupabaseConfigured) {
    return null;
  }

  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const authorization = requestHeaders.get('authorization');

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      ...(authorization ? { global: { headers: { Authorization: authorization } } } : {}),
      cookieOptions: supabaseCookieOptions,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  );

  const bearerToken = authorization?.match(/^Bearer\s+(\S+)$/i)?.[1];
  if (bearerToken) {
    const getUser = client.auth.getUser.bind(client.auth);
    client.auth.getUser = (jwt?: string) => getUser(jwt ?? bearerToken);
  }

  return client;
}