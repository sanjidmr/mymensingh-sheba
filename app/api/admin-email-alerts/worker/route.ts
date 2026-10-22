import { timingSafeEqual } from 'node:crypto';
import { processAdminEmailQueue } from '@/lib/admin-email-alerts.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAuthorized(request: Request): boolean {
  const expected = process.env.ADMIN_EMAIL_WORKER_SECRET;
  const provided = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!expected || !provided) return false;
  const expectedBytes = Buffer.from(expected);
  const providedBytes = Buffer.from(provided);
  return expectedBytes.length === providedBytes.length && timingSafeEqual(expectedBytes, providedBytes);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  try {
    const result = await processAdminEmailQueue(3);
    return Response.json(result, { status: 200 });
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'worker_failed';
    console.error('Admin email worker run failed.', { reason });
    return Response.json({ error: 'Admin email worker failed.' }, { status: 503 });
  }
}
