import {
  isValidBrevoWebhookSecret,
  processBrevoWebhook,
} from '@/lib/admin-email-alerts.server';
import { readBoundedRequestBody } from '@/lib/bounded-request-body';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!isValidBrevoWebhookSecret(request)) {
    return Response.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  let payload: unknown;
  try {
    const body = await readBoundedRequestBody(request, 32_000);
    if (body.tooLarge) return Response.json({ error: 'Webhook payload too large.' }, { status: 413 });
    payload = JSON.parse(body.text);
  } catch {
    return Response.json({ error: 'Invalid webhook payload.' }, { status: 400 });
  }
  try {
    const result = await processBrevoWebhook(payload);
    return Response.json({ status: result }, { status: 200 });
  } catch {
    console.error('Brevo delivery webhook could not be recorded.');
    return Response.json({ error: 'Webhook processing failed.' }, { status: 503 });
  }
}
