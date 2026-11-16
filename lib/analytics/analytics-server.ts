import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSiteOrigin } from '@/lib/site-url';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';
import {
  classifyAnalyticsTraffic,
  type AnalyticsTrafficClass,
} from './traffic-classification';

export type AnalyticsRequestContext =
  | {
      client: SupabaseClient;
      userId: string | null;
      trafficClass: AnalyticsTrafficClass;
        visitorId: string;
        setVisitorCookie: boolean;
    }
    | { error: string; status: number };

const OPAQUE_ID_PATTERN = /^[A-Za-z0-9_-]{6,80}$/;

function readVisitorCookie(request: Request): string | null {
    const cookies = request.headers.get('cookie') ?? '';
    const match = /(?:^|;\s*)mms_vid=([^;]+)/.exec(cookies);
    if (!match) return null;
    try {
      const visitorId = decodeURIComponent(match[1]);
      return OPAQUE_ID_PATTERN.test(visitorId) ? visitorId : null;
    } catch {
      return null;
    }
}

export async function getAnalyticsRequestContext(
    request: Request,
    claimedVisitorId: string,
    identityPersistent: boolean
): Promise<AnalyticsRequestContext> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    const { createServerSideClient } = await import('@/lib/supabase/server');
    const sessionClient = await createServerSideClient();
    if (!sessionClient || !url || !serviceRoleKey) {
      return { error: 'Analytics storage is not configured.', status: 204 };
    }

    let authData;
    let authError;
    try {
      ({ data: authData, error: authError } = await sessionClient.auth.getUser());
    } catch {
      return { error: 'Analytics auth check timed out.', status: 204 };
    }
    if (authError && authError.status !== 401) {
      return { error: 'The analytics session could not be verified.', status: 204 };
    }
    const user = authError ? null : authData.user;

    let userId: string | null = null;
    let role: string | null = null;
    if (user) {
      try {
        const { data: profile, error: profileError } = await sessionClient
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();
        if (profileError) {
          return { error: 'The analytics account role could not be verified.', status: 204 };
        }
        if (profile) {
          userId = user.id;
          role = profile.role;
        }
      } catch {
        return { error: 'Analytics profile lookup failed.', status: 204 };
      }
    }

    const visitorCookie = readVisitorCookie(request);
    const trafficClass = classifyAnalyticsTraffic({
      role,
      userId,
      userAgent: request.headers.get('user-agent') ?? '',
      stableVisitorId: Boolean(visitorCookie) || identityPersistent,
    });

    const client = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: fetchWithTimeout },
    });
    return {
      client,
      userId,
      trafficClass,
      visitorId: visitorCookie ?? claimedVisitorId,
      setVisitorCookie: !visitorCookie && trafficClass !== 'bot' && trafficClass !== 'internal',
    };
  } catch {
    return { error: 'Analytics storage is temporarily unavailable.', status: 204 };
  }
}

export function visitorCookieHeader(request: Request, visitorId: string): string {
  const secure = new URL(getSiteOrigin(request)).protocol === 'https:' ? '; Secure' : '';
  return `mms_vid=${encodeURIComponent(visitorId)}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax${secure}`;
}

export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).origin === getSiteOrigin(request);
  } catch {
    return false;
  }
}
