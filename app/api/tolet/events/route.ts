import { createServerSideClient } from '@/lib/supabase/server';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EVENT_TYPES = new Set(['view', 'call_click', 'whatsapp_click', 'favorite', 'share']);
const EVENT_SOURCES = new Set(['detail_page', 'sticky_bar', 'card']);

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: 'Invalid event payload.' }, { status: 400 });
  }

  if (!payload || typeof payload !== 'object') {
    return Response.json({ error: 'Invalid event payload.' }, { status: 400 });
  }
  const body = payload as Record<string, unknown>;
  if (
    typeof body.eventId !== 'string' ||
    !UUID_PATTERN.test(body.eventId) ||
    typeof body.listingId !== 'string' ||
    !UUID_PATTERN.test(body.listingId) ||
    typeof body.eventType !== 'string' ||
    !EVENT_TYPES.has(body.eventType) ||
    typeof body.source !== 'string' ||
    !EVENT_SOURCES.has(body.source) ||
    typeof body.visitorId !== 'string' ||
    !/^[A-Za-z0-9_-]{6,80}$/.test(body.visitorId)
  ) {
    return Response.json({ error: 'Invalid event fields.' }, { status: 400 });
  }

  const client = await createServerSideClient();
  if (!client) return Response.json({ error: 'Supabase is not configured.' }, { status: 503 });

  const { error } = await client.rpc('fn_record_tolet_listing_event', {
    p_event_id: body.eventId,
    p_listing_id: body.listingId,
    p_event_type: body.eventType,
    p_event_source: body.source,
    p_visitor_id: body.visitorId,
  });
  if (error) {
    console.error('To-Let event write failed.', error.message);
    return Response.json({ error: 'To-Let event could not be recorded.' }, { status: 500 });
  }

  return new Response(null, { status: 204 });
}
