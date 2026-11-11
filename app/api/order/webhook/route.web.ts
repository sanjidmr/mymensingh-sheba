import { timingSafeEqual } from 'node:crypto';
import { notifyOrder } from '@/lib/notify-order.server';
import { readBoundedRequestBody } from '@/lib/bounded-request-body';

export const runtime = 'nodejs';

type WebhookPayload = {
  type?: unknown;
  table?: unknown;
  record?: unknown;
  old_record?: unknown;
};

function isAuthorized(request: Request): boolean {
  const expected = process.env.ORDER_TELEGRAM_WEBHOOK_SECRET;
  const provided = request.headers.get('x-webhook-secret');
  if (!expected || !provided) return false;
  const expectedBytes = Buffer.from(expected);
  const providedBytes = Buffer.from(provided);
  return expectedBytes.length === providedBytes.length &&
    timingSafeEqual(expectedBytes, providedBytes);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  let payload: WebhookPayload;
  try {
    const body = await readBoundedRequestBody(request, 64_000);
    if (body.tooLarge) return Response.json({ error: 'Webhook payload too large.' }, { status: 413 });
    payload = JSON.parse(body.text) as WebhookPayload;
  } catch {
    return Response.json({ error: 'Invalid webhook payload.' }, { status: 400 });
  }

  if (
    !payload ||
    (payload.type !== 'INSERT' && payload.type !== 'UPDATE') ||
    !isRecord(payload.record)
  ) {
    return Response.json({ status: 'ignored' }, { status: 202 });
  }

  const record = payload.record;
  if (payload.table === 'service_requests' && payload.type === 'INSERT' && typeof record.service_slug === 'string') {
    await notifyOrder(record, record.service_slug, '/admin/requests', 'webhook');
  } else if (payload.table === 'vehicle_requests' && payload.type === 'INSERT') {
    await notifyOrder(record, 'vehicle_request', `/admin/vehicle-requests/${record.id}`, 'webhook');
  } else if (
    payload.table === 'vehicle_bookings' &&
    payload.type === 'INSERT' &&
    (record.service_type === 'auto' || record.service_type === 'cng')
  ) {
    await notifyOrder(
      record,
      record.service_type,
      `/admin/vehicle-bookings/${record.service_type}`,
      'webhook'
    );
  } else if (
    payload.table === 'tolet_listings' &&
    record.status === 'pending_review' &&
    (
      payload.type === 'INSERT' ||
      (
        payload.type === 'UPDATE' &&
        isRecord(payload.old_record) &&
        payload.old_record.status !== 'pending_review'
      )
    )
  ) {
    await notifyOrder(
      payload.type === 'UPDATE' ? { ...record, created_at: record.updated_at } : record,
      'tolet_listing',
      '/admin/tolet',
      'webhook'
    );
  } else {
    return Response.json({ status: 'ignored' }, { status: 202 });
  }

  return Response.json({ status: 'accepted' }, { status: 202 });
}
