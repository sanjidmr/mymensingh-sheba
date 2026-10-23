import {
  sendAdminEmailAlert,
  sendAdminTestEmail,
} from '@/lib/admin-email-alerts.server';
import type { AdminEmailAlertType } from '@/lib/admin-email-alerts';
import { getAdminDataClient } from '@/lib/admin/queries';

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
  'blood_request',
  'vehicle_request',
  'community_post',
  'service_listing',
  'tolet_profile',
  'tutor_profile',
  'donor_profile',
]);

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin || !host) {
    return Response.json({ error: 'Same-origin request required.' }, { status: 403 });
  }
  try {
    const parsedOrigin = new URL(origin);
    if (
      parsedOrigin.host !== host ||
      !['https:', ...(process.env.NODE_ENV === 'development' ? ['http:'] : [])].includes(
        parsedOrigin.protocol
      )
    ) {
      return Response.json({ error: 'Same-origin request required.' }, { status: 403 });
    }
  } catch {
    return Response.json({ error: 'Same-origin request required.' }, { status: 403 });
  }

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
  if (type === 'test') {
    let admin;
    try {
      admin = await getAdminDataClient();
    } catch {
      console.error('Admin email test authorization could not be checked.');
      return Response.json({ error: 'Email test could not be authorized.' }, { status: 503 });
    }
    if (!admin) {
      return Response.json({ error: 'Admin authorization required.' }, { status: 403 });
    }
    try {
      const result = await sendAdminTestEmail(admin.userId);
      if (result.status === 'unconfigured') {
        return Response.json({ error: 'Email alert queue is not configured.' }, { status: 503 });
      }
      if (result.status === 'failed') {
        return Response.json({ error: 'Email alert could not be queued.' }, { status: 503 });
      }
      return Response.json({ status: result.status }, { status: 202 });
    } catch {
      console.error('Admin email test could not be processed.');
      return Response.json({ error: 'Email test could not be processed.' }, { status: 503 });
    }
  }

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
      return Response.json({ error: 'Email alert queue is not configured.' }, { status: 503 });
    }
    if (result.status === 'failed') {
      return Response.json({ error: 'Email alert queue could not be checked.' }, { status: 503 });
    }
    return Response.json(
      {
        status: result.status,
        message:
          result.status === 'queued'
            ? 'The durable email job is stored; provider acceptance and delivery are tracked separately.'
            : 'No durable email job exists for this event.',
      },
      { status: result.status === 'queued' ? 202 : 200 }
    );
  } catch {
    console.error('Admin email alert processing failed.', { type });
    return Response.json({ error: 'Email alert could not be processed.' }, { status: 503 });
  }
}
