import 'server-only';

import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { AdminEmailAlertType } from './admin-email-alerts';
import {
  getProviderRetryAfter,
  getRetryDelayMs,
  isRetryableProviderStatus,
} from './admin-email-queue-policy';

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';
const MAX_DELIVERY_ATTEMPTS = 5;
const MAX_WORKER_JOBS = 3;

type QueueType = AdminEmailAlertType | 'critical_error' | 'admin_test';
type QueueJob = {
  event_id: string;
  idempotency_key: string;
  related_type: QueueType;
  related_id: string | null;
  payload: Record<string, unknown>;
  status: string;
  attempt_count: number;
  lease_token: string;
  provider_message_id: string | null;
  created_at: string;
};
type Alert = {
  type: QueueType;
  id: string;
  title: string;
  summary: string;
  adminPath: string;
  occurredAt: string;
};
type EmailConfiguration = { apiKey: string; recipient: string; sender: string; baseUrl: string };

const EMAIL_PATHS: Record<AdminEmailAlertType, string> = {
  service_request: '/admin/requests',
  tolet_listing: '/admin/tolet',
  blood_donor_reports: '/admin/reports',
  listing_reports: '/admin/reports',
  tutor_reports: '/admin/reports',
  staff_profile_reports: '/admin/reports',
  community_post_reports: '/admin/reports',
  contact_message: '/admin/messages',
};

function getServerClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function getEmailConfiguration(): EmailConfiguration | null {
  const { BREVO_API_KEY, ADMIN_NOTIFICATION_EMAIL, EMAIL_FROM, APP_BASE_URL } = process.env;
  if (!BREVO_API_KEY || !ADMIN_NOTIFICATION_EMAIL || !EMAIL_FROM || !APP_BASE_URL) return null;
  const emailPattern = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
  let baseUrl: URL;
  try {
    baseUrl = new URL(APP_BASE_URL);
  } catch {
    return null;
  }
  if (
    !emailPattern.test(ADMIN_NOTIFICATION_EMAIL) ||
    !emailPattern.test(EMAIL_FROM) ||
    baseUrl.protocol !== 'https:' && process.env.NODE_ENV !== 'development'
  ) {
    return null;
  }
  return {
    apiKey: BREVO_API_KEY,
    recipient: ADMIN_NOTIFICATION_EMAIL,
    sender: EMAIL_FROM,
    baseUrl: APP_BASE_URL.replace(/\/+$/, ''),
  };
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

function getAlertForJob(job: QueueJob): Alert | null {
  const occurredAt =
    typeof job.payload?.occurred_at === 'string' ? job.payload.occurred_at : job.created_at;
  const title = typeof job.payload?.title === 'string' ? job.payload.title : null;
  const summary = typeof job.payload?.summary === 'string' ? job.payload.summary : null;
  const type = job.related_type;
  if (!title || !summary) return null;
  return {
    type,
    id: job.related_id || job.event_id,
    title,
    summary,
    adminPath:
      typeof job.payload?.admin_path === 'string'
        ? job.payload.admin_path
        : type in EMAIL_PATHS
          ? EMAIL_PATHS[type as AdminEmailAlertType]
          : '/admin',
    occurredAt,
  };
}

async function updateClaimedJob(
  client: SupabaseClient,
  job: QueueJob,
  values: Record<string, unknown>
): Promise<void> {
  const { data, error } = await client
    .from('admin_email_outbox')
    .update(values)
    .eq('event_id', job.event_id)
    .eq('status', 'processing')
    .eq('lease_token', job.lease_token)
    .select('event_id')
    .maybeSingle();
  if (error) throw new Error('queue_state_update_failed');
  if (!data) {
    const { data: current, error: readError } = await client
      .from('admin_email_outbox')
      .select('status')
      .eq('event_id', job.event_id)
      .maybeSingle();
    if (readError) throw new Error('queue_state_read_failed');
    if (current?.status !== 'delivered') throw new Error('queue_lease_lost');
  }
}

async function applyStoredWebhook(
  client: SupabaseClient,
  job: QueueJob,
  providerMessageId: string
): Promise<void> {
  const { data, error } = await client
    .from('admin_email_webhook_events')
    .select('event_type')
    .eq('provider_message_id', providerMessageId)
    .order('received_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error('webhook_event_lookup_failed');
  if (!data) return;
  await applyProviderStatus(client, providerMessageId, data.event_type);
}

async function applyProviderStatus(
  client: SupabaseClient,
  providerMessageId: string,
  eventType: string
): Promise<boolean> {
  const normalized = eventType.toLowerCase();
  const delivered = normalized === 'delivered';
  const transient = normalized === 'deferred' || normalized === 'softbounce';
  const permanent = ['blocked', 'hardbounce', 'error'].includes(normalized);
  if (!delivered && !transient && !permanent) return false;

  const { data: job, error: lookupError } = await client
    .from('admin_email_outbox')
    .select('event_id, attempt_count')
    .eq('provider_message_id', providerMessageId)
    .maybeSingle();
  if (lookupError) throw new Error('provider_message_lookup_failed');
  if (!job) return false;

  const retryAt =
    transient && job.attempt_count < MAX_DELIVERY_ATTEMPTS
      ? new Date(Date.now() + getRetryDelayMs(job.attempt_count, null)).toISOString()
      : null;
  const status = delivered
    ? 'delivered'
    : transient && retryAt
      ? 'retry_scheduled'
      : 'failed';
  const currentStatuses = delivered || permanent
    ? ['accepted_by_provider', 'retry_scheduled', 'processing']
    : ['accepted_by_provider', 'retry_scheduled'];
  const { error } = await client
    .from('admin_email_outbox')
    .update({
      status,
      delivered_at: delivered ? new Date().toISOString() : null,
      next_retry_at: retryAt,
      last_error: delivered ? null : `brevo_${normalized}`,
      lease_token: null,
      lease_until: null,
    })
    .eq('event_id', job.event_id)
    .in('status', currentStatuses);
  if (error) throw new Error('webhook_status_update_failed');
  return true;
}

async function sendOneJob(
  client: SupabaseClient,
  job: QueueJob,
  configuration: EmailConfiguration
): Promise<'accepted' | 'retry' | 'failed'> {
  const alert = getAlertForJob(job);
  if (!alert) {
    await updateClaimedJob(client, job, {
      status: 'failed',
      last_error: 'source_event_missing_or_not_eligible',
      next_retry_at: null,
      lease_token: null,
      lease_until: null,
    });
    console.error('Admin email outbox source event is unavailable.', { eventId: job.event_id });
    return 'failed';
  }

  const occurredAt = new Date(alert.occurredAt).toLocaleString('bn-BD', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Dhaka',
  });
  const adminUrl = new URL(alert.adminPath, `${configuration.baseUrl}/`).toString();
  const subject = `[Mymensingh Sheba] ${alert.title}`;
  const htmlContent = `<div style="font-family:Arial,sans-serif;color:#0f172a"><h2>${escapeHtml(alert.title)}</h2><p>${escapeHtml(alert.summary)}</p><p>সময়: ${escapeHtml(occurredAt)} (বাংলাদেশ সময়)</p><p><a href="${escapeHtml(adminUrl)}">অ্যাডমিন প্যানেলে দেখুন</a></p></div>`;
  const textContent = `Mymensingh Sheba\n\n${alert.title}\n${alert.summary}\nসময়: ${occurredAt} (বাংলাদেশ সময়)\nঅ্যাডমিন প্যানেল: ${adminUrl}`;

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
        tags: ['admin-alert'],
        headers: { 'X-Mymensingh-Event-Id': job.event_id },
      }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    const retryable = job.attempt_count < MAX_DELIVERY_ATTEMPTS;
    await updateClaimedJob(client, job, {
      status: retryable ? 'retry_scheduled' : 'failed',
      last_error: 'provider_network_timeout_or_unavailable',
      next_retry_at: retryable
        ? new Date(Date.now() + getRetryDelayMs(job.attempt_count, null)).toISOString()
        : null,
      lease_token: null,
      lease_until: null,
    });
    console.error('Brevo admin email request failed before receiving a response.', {
      eventId: job.event_id,
      attempt: job.attempt_count,
      retryable,
    });
    return retryable ? 'retry' : 'failed';
  }

  if (!response.ok) {
    const retryable = isRetryableProviderStatus(response.status) && job.attempt_count < MAX_DELIVERY_ATTEMPTS;
    const retryAfter = getProviderRetryAfter(response.headers);
    await updateClaimedJob(client, job, {
      status: retryable ? 'retry_scheduled' : 'failed',
      last_error: `provider_http_${response.status}`,
      next_retry_at: retryable
        ? new Date(Date.now() + getRetryDelayMs(job.attempt_count, retryAfter)).toISOString()
        : null,
      lease_token: null,
      lease_until: null,
    });
    console.error('Brevo rejected an admin email request.', {
      eventId: job.event_id,
      status: response.status,
      attempt: job.attempt_count,
      retryable,
      retryAfter: retryAfter?.slice(0, 40),
    });
    return retryable ? 'retry' : 'failed';
  }

  const body: unknown = await response.json().catch(() => null);
  const messageId =
    body && typeof body === 'object' && 'messageId' in body && typeof body.messageId === 'string'
      ? body.messageId.slice(0, 200)
      : null;
  await updateClaimedJob(client, job, {
    status: 'accepted_by_provider',
    provider_message_id: messageId,
    sent_at: new Date().toISOString(),
    last_error: messageId ? null : 'provider_message_id_missing',
    lease_token: null,
    lease_until: null,
  });
  if (messageId) await applyStoredWebhook(client, job, messageId);
  console.info('Brevo accepted an admin email.', {
    eventId: job.event_id,
    providerMessageId: messageId,
    attempt: job.attempt_count,
  });
  return 'accepted';
}

export type AlertDeliveryResult = {
  status: 'queued' | 'ignored' | 'unconfigured' | 'failed';
};

export async function sendAdminEmailAlert(
  type: AdminEmailAlertType,
  id: string
): Promise<AlertDeliveryResult> {
  const client = getServerClient();
  if (!client) return { status: 'unconfigured' };
  const { data, error } = await client
    .from('admin_email_outbox')
    .select('status')
    .eq('related_type', type)
    .eq('related_id', id)
    .in('status', ['pending', 'processing', 'accepted_by_provider', 'delivered', 'retry_scheduled', 'failed'])
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error('Admin email outbox check failed.', { type, eventId: id });
    return { status: 'failed' };
  }
  if (!data) return { status: 'ignored' };
  return data.status === 'failed' ? { status: 'failed' } : { status: 'queued' };
}

export async function sendAdminTestEmail(adminId: string): Promise<AlertDeliveryResult> {
  const client = getServerClient();
  if (!client) return { status: 'unconfigured' };
  const day = new Date().toISOString().slice(0, 10);
  const { error } = await client.from('admin_email_outbox').upsert(
    {
      idempotency_key: `admin_test:${adminId}:${day}`,
      related_type: 'admin_test',
      related_id: adminId,
      payload: {
        title: 'Brevo ইমেইল সংযোগ পরীক্ষা',
        summary: 'Mymensingh Sheba অ্যাডমিন ইমেইল সতর্কতার জন্য একটি পরীক্ষামূলক বার্তা পাঠিয়েছে।',
        occurred_at: new Date().toISOString(),
      },
    },
    { onConflict: 'idempotency_key', ignoreDuplicates: true }
  );
  if (error) {
    console.error('Admin email test could not be queued.');
    return { status: 'failed' };
  }
  return { status: 'queued' };
}

export async function sendAdminCriticalError(error: unknown): Promise<AlertDeliveryResult> {
  const candidateCode =
    error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
      ? error.code
      : '';
  const expectedCodes = new Set(['23505', '23503', '23514', '42501', 'PGRST116', 'storage/object_not_found']);
  if (expectedCodes.has(candidateCode)) return { status: 'ignored' };

  const safeCode = /^[A-Za-z0-9_/-]{1,40}$/.test(candidateCode)
    ? candidateCode
    : 'unexpected_admin_action_error';
  const now = new Date();
  const incidentId = randomUUID();
  const client = getServerClient();
  if (!client) return { status: 'unconfigured' };
  const { error: insertError } = await client.from('admin_email_outbox').upsert(
    {
      idempotency_key: `critical_error:${incidentId}`,
      related_type: 'critical_error',
      related_id: incidentId,
      payload: {
        title: 'অ্যাডমিন কার্যক্রমে গুরুতর ত্রুটি',
        summary: `একটি অ্যাডমিন কার্যক্রম অপ্রত্যাশিতভাবে ব্যর্থ হয়েছে (কোড: ${safeCode})। বিস্তারিত দেখতে সার্ভার লগ পরীক্ষা করুন।`,
        occurred_at: now.toISOString(),
      },
    },
    { onConflict: 'idempotency_key', ignoreDuplicates: true }
  );
  if (insertError) {
    console.error('Admin critical error could not be queued.');
    return { status: 'failed' };
  }
  return { status: 'queued' };
}

export async function processAdminEmailQueue(
  requestedBatchSize = 10
): Promise<{ claimed: number; accepted: number; retryScheduled: number; failed: number; busy: boolean }> {
  const client = getServerClient();
  if (!client) throw new Error('supabase_server_configuration_missing');
  const configuration = getEmailConfiguration();
  if (!configuration) throw new Error('brevo_email_configuration_missing');

  const { data: lockToken, error: lockError } = await client.rpc(
    'acquire_admin_email_worker_lock',
    { p_lease_seconds: 600 }
  );
  if (lockError) throw new Error('admin_email_worker_lock_failed');
  if (!lockToken) return { claimed: 0, accepted: 0, retryScheduled: 0, failed: 0, busy: true };

  const result = { claimed: 0, accepted: 0, retryScheduled: 0, failed: 0, busy: false };
  try {
    const batchSize = Math.max(1, Math.min(MAX_WORKER_JOBS, Math.floor(requestedBatchSize)));
    for (let index = 0; index < batchSize; index += 1) {
      const { data, error } = await client.rpc('claim_admin_email_outbox_job', {
        p_lease_seconds: 180,
        p_max_attempts: MAX_DELIVERY_ATTEMPTS,
      });
      if (error) throw new Error('admin_email_job_claim_failed');
      const job = (data as QueueJob[] | null)?.[0];
      if (!job) break;
      result.claimed += 1;
      const outcome = await sendOneJob(client, job, configuration);
      if (outcome === 'accepted') result.accepted += 1;
      if (outcome === 'retry') result.retryScheduled += 1;
      if (outcome === 'failed') result.failed += 1;
      if (index + 1 < batchSize) {
        const configuredInterval = Number(process.env.BREVO_MIN_INTERVAL_MS);
        const intervalMs = Number.isFinite(configuredInterval)
          ? Math.max(1000, Math.min(60_000, configuredInterval))
          : 12_000;
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }
    }
    return result;
  } finally {
    const { error } = await client.rpc('release_admin_email_worker_lock', {
      p_lease_token: lockToken,
    });
    if (error) console.error('Admin email worker lock release failed.');
  }
}

export async function processBrevoWebhook(
  payload: unknown
): Promise<'recorded' | 'duplicate' | 'ignored'> {
  const client = getServerClient();
  if (!client) throw new Error('supabase_server_configuration_missing');
  if (!payload || typeof payload !== 'object') return 'ignored';
  const record = payload as Record<string, unknown>;
  const event = typeof record.event === 'string' ? record.event.slice(0, 40) : '';
  const messageIdValue = record['message-id'] ?? record.messageId;
  const messageId = typeof messageIdValue === 'string' ? messageIdValue.slice(0, 200) : '';
  const eventDate = typeof record.date === 'string' ? record.date.slice(0, 80) : '';
  const normalized = event.toLowerCase();
  if (
    !messageId ||
    !event ||
    !['delivered', 'deferred', 'blocked', 'softbounce', 'hardbounce', 'error'].includes(normalized)
  ) {
    return 'ignored';
  }

  const providerEventId = record['event-id'] ?? record.event_id ?? record.id;
  const eventIdentity =
    typeof providerEventId === 'string' && providerEventId
      ? providerEventId
      : JSON.stringify({
          messageId,
          normalized,
          eventDate,
          timestamp: record.ts,
          reason: record.reason,
          tag: record.tag,
        });
  const eventKey = createHash('sha256').update(eventIdentity).digest('hex');
  const { data, error } = await client
    .from('admin_email_webhook_events')
    .upsert(
      { event_key: eventKey, provider_message_id: messageId, event_type: event },
      { onConflict: 'event_key', ignoreDuplicates: true }
    )
    .select('event_key');
  if (error) throw new Error('brevo_webhook_event_write_failed');
  if (!data?.length) {
    await applyProviderStatus(client, messageId, event);
    return 'duplicate';
  }

  const updated = await applyProviderStatus(client, messageId, event);
  return updated ? 'recorded' : 'ignored';
}

export function isValidBrevoWebhookSecret(request: Request): boolean {
  const expected = process.env.BREVO_WEBHOOK_SECRET;
  const provided = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!expected || !provided) return false;
  const expectedBytes = Buffer.from(expected);
  const providedBytes = Buffer.from(provided);
  return expectedBytes.length === providedBytes.length && timingSafeEqual(expectedBytes, providedBytes);
}

export type AdminEmailJobSummary = {
  event_id: string;
  related_type: string;
  related_id: string | null;
  status: string;
  attempt_count: number;
  next_retry_at: string | null;
  last_error: string | null;
  provider_message_id: string | null;
  created_at: string;
  sent_at: string | null;
  delivered_at: string | null;
};

export async function listAdminEmailJobs(): Promise<AdminEmailJobSummary[]> {
  const client = getServerClient();
  if (!client) throw new Error('supabase_server_configuration_missing');
  const { data, error } = await client
    .from('admin_email_outbox')
    .select('event_id, related_type, related_id, status, attempt_count, next_retry_at, last_error, provider_message_id, created_at, sent_at, delivered_at')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw new Error('admin_email_jobs_read_failed');
  return (data ?? []) as AdminEmailJobSummary[];
}
