import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Session refresh only — authorisation lives in `app/admin/layout.tsx`.
 *
 * Why this file exists at all: `@supabase/ssr` stores the session in cookies,
 * and a cookie is only refreshed when the browser sends it along and the
 * response is allowed to write back a new one. Without a middleware that calls
 * `getUser()`, the access token in the cookie silently expires and every
 * server-side `createServerSideClient()` call afterwards sees "no user" even
 * though the person is still signed in on the client.
 *
 * Deliberately NOT doing the admin check here. Supabase recommends keeping
 * middleware cheap, and role lookup would mean a database round trip on every
 * navigation. The authoritative admin gate is the server component in
 * `app/admin/layout.tsx`, which reads the role through RLS-protected
 * `profiles`, and RLS itself is the final boundary.
 */
export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  // Unconfigured project: nothing to refresh, and nothing to protect either.
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Mirror the refreshed cookies onto the request so this same render
        // already sees the new session…
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        // …and onto the response so the browser keeps it.
        response = NextResponse.next({
          request: { headers: request.headers },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Do not inspect the return value. A refresh failure must NOT block the
  // request — an expired token here is a normal signed-out state, and the
  // admin layout guard will handle it correctly on its own.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * Everything except Next's own build output and static files. Static
     * assets cannot influence authorisation, and skipping them keeps this off
     * the hot path for images and fonts.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff|woff2)$).*)',
  ],
};