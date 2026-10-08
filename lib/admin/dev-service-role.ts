import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { DEV_AUTH_BYPASS, DEV_ADMIN_SESSION } from '@/lib/dev-auth-bypass';

/**
 * ⚠️ DEVELOPMENT-ONLY. Server-only service-role helper for the auth bypass.
 *
 * Server-side admin queries normally run through the RLS-protected
 * `createServerSideClient()`. When `DEV_AUTH_BYPASS` is on and there is no
 * signed-in admin, the admin data layer falls back to this service-role client
 * so the panel can be exercised locally without logging in.
 *
 * This module must NEVER be imported from a Client Component or from any code
 * that ships to the browser: it reads `SUPABASE_SERVICE_ROLE_KEY`, which must
 * never reach the client. It is imported only by `lib/admin/guard.ts` and
 * `lib/admin/queries.ts`, both server-only.
 *
 * Removing the bypass: delete this file and the two import sites.
 */

/**
 * A service-role Supabase client, or null when not configured / not in dev.
 * Never call this in the browser.
 */
export function createDevServiceRoleClient() {
  if (typeof window !== 'undefined') {
    // Guard against an accidental client import — the key must stay on the server.
    return null;
  }
  if (!DEV_AUTH_BYPASS) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || key.trim() === '') return null;

  return createSupabaseClient(url, key, {
    // The service-role client is not a user session — never persist its token.
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export interface DevAdminIdentity {
  userId: string;
  email: string | null;
  fullName: string;
}

/**
 * The identity the bypassed admin routes run as.
 *
 * Prefers a real admin row so any audit column the server actions write
 * (`reviewed_by`, etc.) still receives a valid uuid; falls back to a fixed
 * placeholder when the project has no admin user (or no service-role key).
 */
export async function resolveDevAdminIdentity(): Promise<DevAdminIdentity> {
  const client = createDevServiceRoleClient();
  if (client) {
    const { data } = await client
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'admin')
      .limit(1)
      .maybeSingle();

    if (data?.id) {
      return {
        userId: data.id,
        email: data.email ?? null,
        fullName: data.full_name || 'ডেভ অ্যাডমিন',
      };
    }
  }

  return { ...DEV_ADMIN_SESSION };
}