import { timingSafeEqual } from 'node:crypto';
import { processAdminTelegramQueue } from '@/lib/admin-telegram-alerts.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAuthorized(request: Request): boolean {
  const expected = process.env.ADMIN_TELEGRAM_WORKER_SECRET;
  const provided = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!expected || !provided) return false;
  const expectedBytes = Buffer.from(expected);
  const providedBytes = Buffer.from(provided);
  return expectedBytes.length === providedBytes.length && timingSafeEqual(expectedBytes, providedBytes);
}

async function runWorker(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  try {
    const result = await processAdminTelegramQueue(3);
    return Response.json(result, { status: 200 });
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'worker_failed';
    console.error('Admin Telegram worker run failed.', { reason });
    return Response.json({ error: 'Admin Telegram worker failed.' }, { status: 503 });
  }
}

export async function GET(request: Request) {
  return runWorker(request);
}

export async function POST(request: Request) {
  return runWorker(request);
}
