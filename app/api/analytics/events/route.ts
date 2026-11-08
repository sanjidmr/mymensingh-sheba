import {
  getAnalyticsRequestContext,
  isSameOriginRequest,
  visitorCookieHeader,
} from '@/lib/analytics/analytics-server';

const EVENT_TYPES = new Set(['page_view', 'session_start', 'cta_click', 'form_submit']);
const ROUTE_KINDS = new Set(['home', 'service', 'tolet', 'post', 'directory', 'auth', 'other']);
const CTA_TYPES = new Set([
  'get_service',
  'call',
  'whatsapp',
  'contact_request',
  'tutor_contact',
  'apply',
  'other',
  'service_request',
  'vehicle_request',
  'tutor_request',
  'buy_sell_request',
  'home_moving_request',
  'staff_request',
  'contact_message',
]);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const OPAQUE_ID_PATTERN = /^[A-Za-z0-9_-]{6,80}$/;

function isOptionalString(value: unknown, maximum: number): value is string | null {
  return value === null || (typeof value === 'string' && value.length <= maximum);
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: 'Cross-origin analytics writes are not allowed.' }, { status: 403 });
  }
  if (Number(request.headers.get('content-length') ?? 0) > 8192) {
    return Response.json({ error: 'Analytics event is too large.' }, { status: 413 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: 'Invalid analytics event.' }, { status: 400 });
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return Response.json({ error: 'Invalid analytics event.' }, { status: 400 });
  }
  const body = payload as Record<string, unknown>;
  if (
    typeof body.eventId !== 'string' ||
    !UUID_PATTERN.test(body.eventId) ||
    typeof body.eventType !== 'string' ||
    !EVENT_TYPES.has(body.eventType) ||
    typeof body.path !== 'string' ||
    !body.path.startsWith('/') ||
    body.path.includes('?') ||
    body.path.includes('#') ||
    body.path.length > 300 ||
    (body.routeKind !== undefined &&
      (typeof body.routeKind !== 'string' || !ROUTE_KINDS.has(body.routeKind))) ||
    !isOptionalString(body.contentId ?? null, 120) ||
    !isOptionalString(body.category ?? null, 80) ||
    !isOptionalString(body.ctaType ?? null, 40) ||
    (body.ctaType !== null && body.ctaType !== undefined &&
      (typeof body.ctaType !== 'string' || !CTA_TYPES.has(body.ctaType))) ||
    (body.deviceType !== 'mobile' && body.deviceType !== 'tablet' && body.deviceType !== 'desktop') ||
    !isOptionalString(body.referrerHost ?? null, 200) ||
    (typeof body.referrerHost === 'string' && /[/?#]/.test(body.referrerHost)) ||
    typeof body.visitorId !== 'string' ||
    !OPAQUE_ID_PATTERN.test(body.visitorId) ||
    typeof body.identityPersistent !== 'boolean' ||
    typeof body.sessionId !== 'string' ||
    !OPAQUE_ID_PATTERN.test(body.sessionId)
  ) {
    return Response.json({ error: 'Invalid analytics event fields.' }, { status: 400 });
  }

  const context = await getAnalyticsRequestContext(
    request,
    body.visitorId,
    body.identityPersistent
  );
  if ('error' in context) {
    return Response.json({ error: context.error }, { status: context.status });
  }

  const { error } = await context.client
    .from('site_events')
    .upsert({
      event_id: body.eventId,
      event_type: body.eventType,
      path: body.path,
      route_kind: body.routeKind ?? null,
      content_id: body.contentId ?? null,
      category: body.category ?? null,
      cta_type: body.ctaType ?? null,
      device_type: body.deviceType,
      referrer_host: body.referrerHost ?? null,
      visitor_id: context.visitorId,
      session_id: body.sessionId,
      user_id: context.userId,
      traffic_class: context.trafficClass,
    }, { onConflict: 'event_id', ignoreDuplicates: true });

  if (error) {
    console.error('Website analytics event insert failed.', { code: error.code });
    return Response.json({ error: 'Analytics event could not be recorded.' }, { status: 503 });
  }
  const headers = new Headers();
  if (context.setVisitorCookie) headers.set('Set-Cookie', visitorCookieHeader(request, context.visitorId));
  return new Response(null, { status: 204, headers });
}
