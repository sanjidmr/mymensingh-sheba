import {
  isValidBrevoWebhookSecret,
  processBrevoWebhook,
} from '@/lib/admin-email-alerts.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!isValidBrevoWebhookSecret(request)) {
    return Response.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 32_000) {
    return Response.json({ error: 'Webhook payload too large.' }, { status: 413 });
  }
  let payload: unknown;
  try {
    const text = await request.text();
    if (text.length > 32_000) return Response.json({ error: 'Webhook payload too large.' }, { status: 413 });
    payload = JSON.parse(text);
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
