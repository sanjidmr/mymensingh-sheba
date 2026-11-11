import {
  getAnalyticsRequestContext,
  isSameOriginRequest,
  visitorCookieHeader,
} from '@/lib/analytics/analytics-server';

const OPAQUE_ID_PATTERN = /^[A-Za-z0-9_-]{6,80}$/;

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: 'Cross-origin analytics writes are not allowed.' }, { status: 403 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: 'Invalid visitor heartbeat.' }, { status: 400 });
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return Response.json({ error: 'Invalid visitor heartbeat.' }, { status: 400 });
  }

  const body = payload as Record<string, unknown>;
  if (
    typeof body.visitorId !== 'string' ||
    !OPAQUE_ID_PATTERN.test(body.visitorId) ||
    typeof body.identityPersistent !== 'boolean'
  ) {
    return Response.json({ error: 'Invalid visitor heartbeat.' }, { status: 400 });
  }
  const context = await getAnalyticsRequestContext(
    request,
    body.visitorId,
    body.identityPersistent
  );
  if ('error' in context) {
    return Response.json({ error: context.error }, { status: context.status });
  }
  if (context.trafficClass === 'bot' || context.trafficClass === 'internal') {
    return new Response(null, { status: 204 });
  }

  const { error } = await context.client
    .from('site_active_visitors')
    .upsert({
      visitor_id: context.visitorId,
      traffic_class: context.trafficClass,
      last_seen_at: new Date().toISOString(),
    }, { onConflict: 'visitor_id' });
  if (error) {
    console.error('Active visitor heartbeat insert failed.', { code: error.code });
    return Response.json({ error: 'Active visitor heartbeat could not be recorded.' }, { status: 503 });
  }
  const headers = new Headers();
  if (context.setVisitorCookie) headers.set('Set-Cookie', visitorCookieHeader(request, context.visitorId));
  return new Response(null, { status: 204, headers });
}
