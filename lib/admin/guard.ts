import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';
// ⚠️ DEV AUTH BYPASS — remove together with lib/dev-auth-bypass.ts.
import { DEV_AUTH_BYPASS } from '@/lib/dev-auth-bypass';
import { resolveDevAdminIdentity } from '@/lib/admin/dev-service-role';
import { isConfirmedInvalidSessionError } from '@/lib/admin/auth-guard-errors';

function logGuardFailure(operation: string, error: unknown): void {
  const candidate =
    error && typeof error === 'object'
      ? (error as { code?: unknown; message?: unknown; status?: unknown })
      : null;
  console.error(JSON.stringify({
    event: 'auth.guard_verification_failed',
    operation,
    status: typeof candidate?.status === 'number' ? candidate.status : undefined,
    code: typeof candidate?.code === 'string' ? candidate.code : undefined,
    message: typeof candidate?.message === 'string' ? candidate.message : String(error),
  }));
}

/**
 * Server-side admin gate for every `/admin/*` route.
 *
 * This is the authoritative check. The client-side redirect that used to live
 * in `app/admin/layout.tsx` was advisory: it ran after the page bundle had
 * already been downloaded, and `isAdmin` was derived from the browser's copy
 * of the session. Typing `/admin/users` into the address bar as a normal
 * customer fetched the route, and only then bounced you home.
 *
 * Now the layout is a Server Component that resolves the role before any admin
 * markup — or any admin data — is rendered or serialised. RLS remains the
 * backstop: even a forged cookie cannot widen what these queries return,
 * because every admin policy is `USING (public.is_admin())` and `is_admin()`
 * itself is `SECURITY DEFINER` reading `profiles.role` server-side.
 *
 * Authorization fails closed. A confirmed missing/invalid session is handled
 * as signed out; infrastructure and database errors are logged and propagated
 * so a temporary outage is never presented as a logout.
 */

export interface AdminSession {
  userId: string;
  email: string | null;
  fullName: string;
}

async function hasSupabaseSessionCookie(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore
    .getAll()
    .some(({ name }) => /^sb-.+-auth-token(?:\.\d+)?$/.test(name));
}

/** The signed-in user id, or null when no valid session exists. */
export async function getAuthenticatedUserId(): Promise<string | null> {
  if (!(await hasSupabaseSessionCookie())) return null;
  const { createServerSideClient } = await import('@/lib/supabase/server');
  const supabase = await createServerSideClient();
  if (!supabase) return null;

  let result: Awaited<ReturnType<typeof supabase.auth.getUser>>;
  try {
    result = await supabase.auth.getUser();
  } catch (error) {
    logGuardFailure('get_authenticated_user', error);
    throw new Error('Could not verify the authenticated user with Supabase.', { cause: error });
  }
  const { data, error } = result;
  if (error) {
    if (isConfirmedInvalidSessionError(error)) return null;
    logGuardFailure('get_authenticated_user', error);
    throw new Error('Could not verify the authenticated user with Supabase.', { cause: error });
  }
  if (!data?.user) return null;
  return data.user.id;
}

/**
 * The signed-in user id, or a redirect to the login page.
 * `next` is preserved so a legitimate admin lands back where they aimed.
 */
export async function requireUserId(nextPath?: string): Promise<string> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    const next = nextPath ? `?next=${encodeURIComponent(nextPath)}` : '';
    redirect(`/login${next}`);
  }
  return userId;
}

/**
 * Resolve the session for an admin route, or null when the caller is not an
 * admin. Use this when you want to branch rather than redirect.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  // DEV AUTH BYPASS — never active in a production build. Opening `/admin`
  // without a session returns a stand-in admin identity instead of null, so
  // `requireAdmin()` neither redirects nor renders an auth error.
  if (DEV_AUTH_BYPASS) {
    return resolveDevAdminIdentity();
  }

  if (!(await hasSupabaseSessionCookie())) return null;
  const { createServerSideClient } = await import('@/lib/supabase/server');
  const supabase = await createServerSideClient();
  if (!supabase) return null;

  let authResult: Awaited<ReturnType<typeof supabase.auth.getUser>>;
  try {
    authResult = await supabase.auth.getUser();
  } catch (error) {
    logGuardFailure('get_admin_session', error);
    throw new Error('Could not verify the admin session with Supabase.', { cause: error });
  }
  const {
    data: { user },
    error: authError,
  } = authResult;
  if (authError) {
    if (isConfirmedInvalidSessionError(authError)) return null;
    logGuardFailure('get_admin_session', authError);
    throw new Error('Could not verify the admin session with Supabase.', { cause: authError });
  }
  if (!user) return null;

  // RLS restricts this SELECT to the caller's own row, so this can only ever
  // return the signed-in user's profile — never someone else's.
  let profile: {
    full_name: string | null;
    role: string;
    status: string | null;
  } | null;
  let profileError: { message: string } | null;
  try {
    const result = await supabase
      .from('profiles')
      .select('full_name, role, status')
      .eq('id', user.id)
      .maybeSingle();
    profile = result.data;
    profileError = result.error;
  } catch (error) {
    logGuardFailure('get_admin_profile', error);
    throw new Error('Could not verify the admin profile with Supabase.', { cause: error });
  }

  if (profileError) {
    logGuardFailure('get_admin_profile', profileError);
    throw new Error('Could not verify the admin profile with Supabase.', { cause: profileError });
  }
  if (!profile) return null;
  if (profile.role !== 'admin') return null;

  // A suspended admin keeps a valid Supabase session, so the role check alone
  // is not enough — the panel must also honour the account status the rest of
  // the app already respects.
  if (profile.status && profile.status !== 'active') return null;

  return {
    userId: user.id,
    email: user.email ?? null,
    fullName: profile.full_name || user.email || 'অ্যাডমিন',
  };
}

/**
 * Server Component / Server Action guard.
 *
 * Redirects to the login page when there is no session, and to the home page
 * when there is a session but it is not an admin. `redirect()` throws, so the
 * `never` return type is honest and callers get a non-nullable session.
 */
export async function requireAdmin(nextPath?: string): Promise<AdminSession> {
  const session = await getAdminSession();
  if (session) return session;

  // Distinguish "not signed in" (send them to log in) from "signed in but not
  // an admin" (send them home). Only the first case mentions `next`, so a
  // customer can never be handed a post-login bounce into the admin area.
  const isSignedIn = Boolean(await getAuthenticatedUserId());
  if (!isSignedIn) {
    const next = nextPath ? `?next=${encodeURIComponent(nextPath)}` : '';
    redirect(`/login${next}`);
  }

  redirect('/');
}

/**
 * A Supabase client for an admin route, guaranteed to be an admin's session.
 *
 * Server Actions use this so every write is authorised server-side rather than
 * relying on the browser having been careful. Returns null if the caller is not
 * an admin — the caller decides whether that is a redirect or an error message.
 */
export async function getAdminClient(): Promise<SupabaseClient | null> {
  const session = await getAdminSession();
  if (!session) return null;
  const { createServerSideClient } = await import('@/lib/supabase/server');
  return createServerSideClient();
}