import { sendAdminEmailAlert } from '@/lib/admin-email-alerts.server';
import type { AdminEmailAlertType } from '@/lib/admin-email-alerts';

export const runtime = 'nodejs';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_TYPES = new Set<AdminEmailAlertType>([
  'service_request',
  'tolet_listing',
  'blood_donor_reports',
  'listing_reports',
  'tutor_reports',
  'staff_profile_reports',
  'community_post_reports',
  'contact_message',
]);

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: 'Invalid alert event.' }, { status: 400 });
  }

  if (!payload || typeof payload !== 'object') {
    return Response.json({ error: 'Invalid alert event.' }, { status: 400 });
  }
  const { type, eventId } = payload as Record<string, unknown>;
  if (
    typeof type !== 'string' ||
    !ALLOWED_TYPES.has(type as AdminEmailAlertType) ||
    typeof eventId !== 'string' ||
    !UUID_PATTERN.test(eventId)
  ) {
    return Response.json({ error: 'Invalid alert event.' }, { status: 400 });
  }

  try {
    const result = await sendAdminEmailAlert(type as AdminEmailAlertType, eventId);
    if (result.status === 'unconfigured') {
      return Response.json({ error: 'Email alert service is not configured.' }, { status: 503 });
    }
    if (result.status === 'rate_limited') {
      return Response.json({ error: 'Email alert rate limit reached.' }, { status: 429 });
    }
    if (result.status === 'failed') {
      return Response.json({ error: 'Email alert delivery failed.' }, { status: 503 });
    }
    return Response.json({ status: result.status }, { status: 200 });
  } catch {
    console.error('Admin email alert processing failed.', { type });
    return Response.json({ error: 'Email alert could not be processed.' }, { status: 503 });
  }
}
