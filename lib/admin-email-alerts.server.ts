import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { AdminEmailAlertType } from './admin-email-alerts';

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';
const EVENT_WINDOW_MS = 10 * 60 * 1000;
const MAX_ALERTS_PER_WINDOW = 10;

type EmailAlert = {
  type: AdminEmailAlertType;
  id: string;
  eventKey: string;
  severity: 'high' | 'critical';
  title: string;
  summary: string;
  adminPath: string;
  occurredAt: string;
};

type LookupResult =
  | { eligible: true; alert: EmailAlert }
  | { eligible: false; reason: 'not_found' | 'not_recent' | 'not_important' };

class BrevoDeliveryError extends Error {
  constructor(
    readonly attempts: number,
    readonly retryable: boolean,
    readonly code: string
  ) {
    super(code);
  }
}

const REPORTS: Record<
  Extract<AdminEmailAlertType, `${string}_reports`>,
  { severity: 'high'; title: string }
> = {
  blood_donor_reports: { severity: 'high', title: 'নতুন রক্তদাতা রিপোর্ট' },
  listing_reports: { severity: 'high', title: 'নতুন বাসাভাড়া বিজ্ঞাপন রিপোর্ট' },
  tutor_reports: { severity: 'high', title: 'নতুন গৃহশিক্ষক রিপোর্ট' },
  staff_profile_reports: { severity: 'high', title: 'নতুন কর্মী প্রোফাইল রিপোর্ট' },
  community_post_reports: { severity: 'high', title: 'নতুন কমিউনিটি পোস্ট রিপোর্ট' },
};

function getServerClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function isRecent(value: string | null): boolean {
  if (!value) return false;
  const age = Date.now() - new Date(value).getTime();
  return Number.isFinite(age) && age >= 0 && age <= EVENT_WINDOW_MS;
}

async function findEligibleAlert(
  client: SupabaseClient,
  type: AdminEmailAlertType,
  id: string
): Promise<LookupResult> {
  if (type === 'service_request') {
    const { data, error } = await client
      .from('service_requests')
      .select('id, service_slug, created_at, status')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error('event_lookup_failed');
    if (!data) return { eligible: false, reason: 'not_found' };
    if (data.status !== 'new') return { eligible: false, reason: 'not_important' };
    if (!isRecent(data.created_at)) return { eligible: false, reason: 'not_recent' };
    return {
      eligible: true,
      alert: {
        type,
        id,
        eventKey: `${type}:${id}`,
        severity: 'high',
        title: 'নতুন সার্ভিস রিকোয়েস্ট',
        summary: `নতুন ${String(data.service_slug).slice(0, 60)} সার্ভিস রিকোয়েস্ট পর্যালোচনার অপেক্ষায় আছে।`,
        adminPath: `/admin/requests/${id}`,
        occurredAt: data.created_at,
      },
    };
  }

  if (type === 'tolet_listing') {
    const { data, error } = await client
      .from('tolet_listings')
      .select('id, status, created_at, updated_at')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error('event_lookup_failed');
    if (!data) return { eligible: false, reason: 'not_found' };
    if (data.status !== 'pending_review') return { eligible: false, reason: 'not_important' };
    const occurredAt = data.updated_at || data.created_at;
    if (!isRecent(occurredAt)) return { eligible: false, reason: 'not_recent' };
    return {
      eligible: true,
      alert: {
        type,
        id,
        eventKey: `${type}:${id}:${occurredAt}`,
        severity: 'high',
        title: 'নতুন বাসাভাড়ার বিজ্ঞাপন পর্যালোচনা',
        summary: 'একটি বাসাভাড়ার বিজ্ঞাপন অ্যাডমিন পর্যালোচনার অপেক্ষায় আছে।',
        adminPath: `/admin/tolet/${id}`,
        occurredAt,
      },
    };
  }

  if (type in REPORTS) {
    const report = REPORTS[type as keyof typeof REPORTS];
    const { data, error } = await client
      .from(type)
      .select('id, created_at')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error('event_lookup_failed');
    if (!data) return { eligible: false, reason: 'not_found' };
    if (!isRecent(data.created_at)) return { eligible: false, reason: 'not_recent' };
    return {
      eligible: true,
      alert: {
        type,
        id,
        eventKey: `${type}:${id}`,
        severity: report.severity,
        title: report.title,
        summary: 'একটি নতুন রিপোর্ট মডারেশন পর্যালোচনার অপেক্ষায় আছে।',
        adminPath: '/admin/reports',
        occurredAt: data.created_at,
      },
    };
  }

  if (type === 'contact_message') {
    const { data, error } = await client
      .from('contact_messages')
      .select('id, subject, complaint_category, created_at')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error('event_lookup_failed');
    if (!data) return { eligible: false, reason: 'not_found' };
    if (
      data.subject !== 'complaint' ||
      !['safety', 'payment'].includes(data.complaint_category || '')
    ) {
      return { eligible: false, reason: 'not_important' };
    }
    if (!isRecent(data.created_at)) return { eligible: false, reason: 'not_recent' };
    const category = data.complaint_category === 'safety' ? 'নিরাপত্তা' : 'পেমেন্ট';
    return {
      eligible: true,
      alert: {
        type,
        id,
        eventKey: `${type}:${id}`,
        severity: 'critical',
        title: `${category} বিষয়ে নতুন অভিযোগ`,
        summary: `একটি ${category} সংক্রান্ত অভিযোগ সাপোর্ট ইনবক্সে এসেছে।`,
        adminPath: `/admin/messages/${id}`,
        occurredAt: data.created_at,
      },
    };
  }

  return { eligible: false, reason: 'not_important' };
}

async function hasAdminNotification(
  client: SupabaseClient,
  type: AdminEmailAlertType,
  id: string
): Promise<boolean> {
  if (type === 'tolet_listing') return true;
  const relatedType = type === 'contact_message' ? 'contact_message' : type;
  const { data, error } = await client
    .from('notifications')
    .select('id')
    .eq('target_role', 'admin')
    .eq('related_type', relatedType)
    .eq('related_id', id)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error('notification_lookup_failed');
  return Boolean(data);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character];
  });
}

function emailConfiguration():
  | { ok: true; apiKey: string; recipient: string; sender: string; baseUrl: string }
  | { ok: false; missing: string[] } {
  const required = [
    'BREVO_API_KEY',
    'ADMIN_NOTIFICATION_EMAIL',
    'EMAIL_FROM',
    'APP_BASE_URL',
  ] as const;
  const missing = required.filter((name) => !process.env[name]?.trim());
  if (missing.length > 0) return { ok: false, missing };

  const apiKey = process.env.BREVO_API_KEY!.trim();
  const recipient = process.env.ADMIN_NOTIFICATION_EMAIL!.trim();
  const sender = process.env.EMAIL_FROM!.trim();
  const baseUrl = process.env.APP_BASE_URL!.trim().replace(/\/+$/, '');
  const emailPattern = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
  let parsedBase: URL;
  try {
    parsedBase = new URL(baseUrl);
  } catch {
    return { ok: false, missing: ['APP_BASE_URL (must be a valid URL)'] };
  }
  if (
    !emailPattern.test(recipient) ||
    !emailPattern.test(sender) ||
    !['https:', ...(process.env.NODE_ENV === 'development' ? ['http:'] : [])].includes(parsedBase.protocol)
  ) {
    return { ok: false, missing: ['email address or APP_BASE_URL format'] };
  }
  return { ok: true, apiKey, recipient, sender, baseUrl };
}

async function reserveDelivery(
  client: SupabaseClient,
  alert: EmailAlert
): Promise<
  | { status: 'reserved'; attemptCount: number }
  | { status: 'sent' | 'in_progress' | 'rate_limited' }
> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - EVENT_WINDOW_MS).toISOString();
  const { count, error: countError } = await client
    .from('admin_email_deliveries')
    .select('event_key', { count: 'exact', head: true })
    .gte('created_at', windowStart);
  if (countError) throw new Error('delivery_rate_check_failed');
  if ((count || 0) >= MAX_ALERTS_PER_WINDOW) return { status: 'rate_limited' };

  const { error: insertError } = await client.from('admin_email_deliveries').insert({
    event_key: alert.eventKey,
    related_type: alert.type,
    related_id: alert.id,
    status: 'sending',
    attempt_count: 1,
    last_attempt_at: now.toISOString(),
  });
  if (!insertError) return { status: 'reserved', attemptCount: 1 };
  if (insertError.code !== '23505') throw new Error('delivery_reservation_failed');

  const { data: existing, error: readError } = await client
    .from('admin_email_deliveries')
    .select('status, attempt_count, last_attempt_at, next_attempt_at')
    .eq('event_key', alert.eventKey)
    .maybeSingle();
  if (readError || !existing) throw new Error('delivery_state_read_failed');
  if (existing.status === 'sent') return { status: 'sent' };

  const retryDue =
    existing.status === 'failed' &&
    Boolean(existing.next_attempt_at) &&
    new Date(existing.next_attempt_at).getTime() <= now.getTime();
  if (!retryDue) return { status: 'in_progress' };

  const { data: claimed, error: claimError } = await client
    .from('admin_email_deliveries')
    .update({
      status: 'sending',
      attempt_count: existing.attempt_count + 1,
      last_attempt_at: now.toISOString(),
      next_attempt_at: null,
      last_error: null,
    })
    .eq('event_key', alert.eventKey)
    .eq('status', existing.status)
    .eq('attempt_count', existing.attempt_count)
    .select('event_key')
    .maybeSingle();
  if (claimError) throw new Error('delivery_claim_failed');
  return claimed
    ? { status: 'reserved', attemptCount: existing.attempt_count + 1 }
    : { status: 'in_progress' };
}

async function updateDelivery(
  client: SupabaseClient,
  eventKey: string,
  values: Record<string, unknown>
): Promise<void> {
  const { error } = await client
    .from('admin_email_deliveries')
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq('event_key', eventKey);
  if (error) throw new Error('delivery_state_update_failed');
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function deliverWithBrevo(
  alert: EmailAlert,
  configuration: Extract<ReturnType<typeof emailConfiguration>, { ok: true }>
): Promise<{ messageId: string | null; attempts: number }> {
  const subject = `[Mymensingh Sheba] ${alert.title}`;
  const safeTitle = escapeHtml(alert.title);
  const safeSeverity = escapeHtml(alert.severity === 'critical' ? 'জরুরি' : 'গুরুত্বপূর্ণ');
  const safeSummary = escapeHtml(alert.summary);
  const occurredAt = new Date(alert.occurredAt).toLocaleString('bn-BD', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Dhaka',
  });
  const safeOccurredAt = escapeHtml(occurredAt);
  const adminUrl = new URL(alert.adminPath, `${configuration.baseUrl}/`).toString();
  const htmlContent = `<!doctype html><html lang="bn"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f1f5f9;font-family:Arial,'Noto Sans Bengali',sans-serif;color:#0f172a"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:28px 12px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden"><tr><td style="padding:22px 28px;background:#047857;color:#fff;font-size:20px;font-weight:bold">Mymensingh Sheba</td></tr><tr><td style="padding:28px"><p style="margin:0 0 8px;color:#b45309;font-size:13px;font-weight:bold">${safeSeverity}</p><h1 style="margin:0 0 18px;font-size:22px">${safeTitle}</h1><p style="margin:0 0 18px;line-height:1.7">${safeSummary}</p><p style="margin:0 0 24px;color:#475569;font-size:14px">সময়: ${safeOccurredAt} (বাংলাদেশ সময়)</p><a href="${escapeHtml(adminUrl)}" style="display:inline-block;padding:12px 18px;border-radius:8px;background:#047857;color:#fff;text-decoration:none;font-weight:bold">অ্যাডমিন প্যানেলে দেখুন</a></td></tr><tr><td style="padding:16px 28px;background:#f8fafc;color:#64748b;font-size:12px">এটি একটি স্বয়ংক্রিয় গুরুত্বপূর্ণ কার্যক্রমের সতর্কতা।</td></tr></table></td></tr></table></body></html>`;
  const textContent = [
    'Mymensingh Sheba',
    `${alert.severity === 'critical' ? 'জরুরি' : 'গুরুত্বপূর্ণ'}: ${alert.title}`,
    alert.summary,
    `সময়: ${occurredAt} (বাংলাদেশ সময়)`,
    `অ্যাডমিন প্যানেল: ${adminUrl}`,
  ].join('\n\n');

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    let response: Response;
    try {
      response = await fetch(BREVO_ENDPOINT, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'api-key': configuration.apiKey,
        },
        body: JSON.stringify({
          sender: { email: configuration.sender, name: 'Mymensingh Sheba' },
          to: [{ email: configuration.recipient }],
          subject,
          htmlContent,
          textContent,
        }),
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      throw new BrevoDeliveryError(attempt, false, 'provider_unavailable');
    }

    if (response.ok) {
      const body: unknown = await response.json().catch(() => null);
      const messageId =
        body && typeof body === 'object' && 'messageId' in body &&
        typeof body.messageId === 'string'
          ? body.messageId.slice(0, 200)
          : null;
      return { messageId, attempts: attempt };
    }

    if (response.status === 429 && attempt < 3) {
      await delay(attempt * 300);
      continue;
    }
    throw new BrevoDeliveryError(
      attempt,
      response.status === 429,
      `provider_http_${response.status}`
    );
  }
  throw new BrevoDeliveryError(3, true, 'provider_http_429');
}

export async function sendAdminEmailAlert(
  type: AdminEmailAlertType,
  id: string
): Promise<{
  status: 'sent' | 'ignored' | 'in_progress' | 'rate_limited' | 'unconfigured' | 'failed';
}> {
  const client = getServerClient();
  if (!client) {
    console.error('Admin email alert unavailable: Supabase server configuration is missing.');
    return { status: 'unconfigured' };
  }

  const lookup = await findEligibleAlert(client, type, id);
  if (!lookup.eligible) return { status: 'ignored' };
  if (!(await hasAdminNotification(client, type, id))) return { status: 'ignored' };

  const configuration = emailConfiguration();
  if (!configuration.ok) {
    console.error('Admin email alert configuration is incomplete.', {
      missing: configuration.missing,
      type,
    });
    return { status: 'unconfigured' };
  }

  const reservation = await reserveDelivery(client, lookup.alert);
  if (reservation.status === 'sent') return { status: 'sent' };
  if (reservation.status === 'in_progress') return { status: 'in_progress' };
  if (reservation.status === 'rate_limited') return { status: 'rate_limited' };
  if (reservation.status !== 'reserved') return { status: 'in_progress' };

  let result: { messageId: string | null; attempts: number };
  try {
    result = await deliverWithBrevo(lookup.alert, configuration);
  } catch (error) {
    const message = error instanceof BrevoDeliveryError ? error.code : 'delivery_failed';
    const attempts = error instanceof BrevoDeliveryError ? error.attempts : 1;
    const retryable = error instanceof BrevoDeliveryError && error.retryable;
    try {
      await updateDelivery(client, lookup.alert.eventKey, {
        status: 'failed',
        attempt_count: reservation.attemptCount + attempts - 1,
        last_error: message.slice(0, 80),
        next_attempt_at: retryable ? new Date(Date.now() + 60_000).toISOString() : null,
      });
    } catch {
      console.error('Admin email alert state could not be updated.', { type, eventId: id });
    }
    console.error('Admin email alert delivery failed.', {
      type,
      eventId: id,
      reason: message.slice(0, 80),
      retryable,
    });
    return { status: 'failed' };
  }

  try {
    await updateDelivery(client, lookup.alert.eventKey, {
      status: 'sent',
      provider_message_id: result.messageId,
      attempt_count: reservation.attemptCount + result.attempts - 1,
      last_error: null,
      next_attempt_at: null,
    });
    console.info('Admin email alert delivered.', {
      type,
      eventId: id,
      attempts: reservation.attemptCount + result.attempts - 1,
    });
    return { status: 'sent' };
  } catch {
    console.error('Admin email alert was accepted but delivery state could not be saved.', {
      type,
      eventId: id,
    });
    return { status: 'in_progress' };
  }
}
