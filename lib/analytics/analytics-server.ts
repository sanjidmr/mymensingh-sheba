import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createServerSideClient } from '@/lib/supabase/server';
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
  const sessionClient = await createServerSideClient();
  if (!sessionClient || !url || !serviceRoleKey) {
    return { error: 'Analytics storage is not configured.', status: 503 };
  }

  const { data: { user }, error: authError } = await sessionClient.auth.getUser();
  if (authError) {
    return { error: 'The analytics session could not be verified.', status: 401 };
  }

  let userId: string | null = null;
  let role: string | null = null;
  if (user) {
    const { data: profile, error: profileError } = await sessionClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    if (profileError) {
      return { error: 'The analytics account role could not be verified.', status: 503 };
    }
    if (profile) {
      userId = user.id;
      role = profile.role;
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
  });
  return {
    client,
    userId,
    trafficClass,
    visitorId: visitorCookie ?? claimedVisitorId,
    setVisitorCookie: !visitorCookie && trafficClass !== 'bot' && trafficClass !== 'internal',
  };
}

export function visitorCookieHeader(request: Request, visitorId: string): string {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `mms_vid=${encodeURIComponent(visitorId)}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax${secure}`;
}

export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
