import 'server-only';

import { randomUUID } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { AdminTelegramAlertType } from './admin-telegram-alerts';
import { sendTelegram, TelegramApiError } from './telegram';

const MAX_DELIVERY_ATTEMPTS = 5;
const MAX_WORKER_JOBS = 3;
const MAX_WORKER_RUNTIME_MS = 45_000;

type QueueType = AdminTelegramAlertType | 'critical_error' | 'admin_test';
type QueueJob = {
  event_id: string;
  idempotency_key: string;
  related_type: QueueType;
  related_id: string | null;
  payload: Record<string, unknown>;
  status: string;
  attempt_count: number;
  lease_token: string;
  created_at: string;
};
type Alert = {
  title: string;
  summary: string;
  adminPath: string;
  occurredAt: string;
};

function getServerClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function getAlertForJob(job: QueueJob): Alert | null {
  const title = typeof job.payload?.title === 'string' ? job.payload.title : null;
  const summary = typeof job.payload?.summary === 'string' ? job.payload.summary : null;
  if (!title || !summary) return null;
  return {
    title,
    summary,
    adminPath:
      typeof job.payload?.admin_path === 'string' ? job.payload.admin_path : '/admin',
    occurredAt:
      typeof job.payload?.occurred_at === 'string' ? job.payload.occurred_at : job.created_at,
  };
}

async function updateClaimedJob(
  client: SupabaseClient,
  job: QueueJob,
  values: Record<string, unknown>
): Promise<void> {
  const { data, error } = await client
    .from('admin_telegram_outbox')
    .update(values)
    .eq('event_id', job.event_id)
    .eq('status', 'processing')
    .eq('lease_token', job.lease_token)
    .select('event_id')
    .maybeSingle();
  if (error) throw new Error('telegram_queue_state_update_failed');
  if (!data) {
    const { data: current, error: readError } = await client
      .from('admin_telegram_outbox')
      .select('status')
      .eq('event_id', job.event_id)
      .maybeSingle();
    if (readError) throw new Error('telegram_queue_state_read_failed');
    if (current?.status !== 'delivered') throw new Error('telegram_queue_lease_lost');
  }
}

function isRetryable(error: unknown): boolean {
  if (!(error instanceof TelegramApiError)) return true;
  return error.status === 408 || error.status === 429 || error.status >= 500;
}

function retryAt(attempt: number): string {
  const delayMs = Math.min(60 * 60_000, 30_000 * 2 ** Math.max(0, attempt - 1));
  return new Date(Date.now() + delayMs).toISOString();
}

async function sendOneJob(client: SupabaseClient, job: QueueJob): Promise<'sent' | 'retry' | 'failed'> {
  const alert = getAlertForJob(job);
  if (!alert) {
    await updateClaimedJob(client, job, {
      status: 'failed',
      last_error: 'source_event_missing_or_not_eligible',
      next_retry_at: null,
      lease_token: null,
      lease_until: null,
    });
    console.error('Admin Telegram outbox source event is unavailable.', { eventId: job.event_id });
    return 'failed';
  }

  const occurredAt = new Date(alert.occurredAt).toLocaleString('bn-BD', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Dhaka',
  });
  const message = [
    '🔔 Mymensingh Sheba Admin Alert',
    '',
    `📌 ${alert.title}`,
    `📝 ${alert.summary}`,
    `🕐 সময়: ${occurredAt} (Asia/Dhaka)`,
    `📂 অ্যাডমিন প্যানেল: ${alert.adminPath}`,
    `🆔 Event ID: ${job.event_id}`,
  ].join('\n');

  try {
    await sendTelegram(message);
  } catch (error) {
    const retryable = isRetryable(error) && job.attempt_count < MAX_DELIVERY_ATTEMPTS;
    await updateClaimedJob(client, job, {
      status: retryable ? 'retry_scheduled' : 'failed',
      last_error: error instanceof Error ? error.message.slice(0, 200) : 'telegram_send_failed',
      next_retry_at: retryable ? retryAt(job.attempt_count) : null,
      lease_token: null,
      lease_until: null,
    });
    console.error('Admin Telegram alert could not be delivered.', {
      eventId: job.event_id,
      attempt: job.attempt_count,
      retryable,
    });
    return retryable ? 'retry' : 'failed';
  }

  await updateClaimedJob(client, job, {
    status: 'delivered',
    sent_at: new Date().toISOString(),
    last_error: null,
    next_retry_at: null,
    lease_token: null,
    lease_until: null,
  });
  console.info('Admin Telegram alert delivered.', { eventId: job.event_id });
  return 'sent';
}

export type AlertDeliveryResult = {
  status: 'queued' | 'ignored' | 'unconfigured' | 'failed';
};

export async function sendAdminTelegramAlert(
  type: AdminTelegramAlertType,
  id: string
): Promise<AlertDeliveryResult> {
  const client = getServerClient();
  if (!client) return { status: 'unconfigured' };
  const { data, error } = await client
    .from('admin_telegram_outbox')
    .select('status')
    .eq('related_type', type)
    .eq('related_id', id)
    .in('status', ['pending', 'processing', 'delivered', 'retry_scheduled', 'failed'])
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error('Admin Telegram outbox check failed.', { type, eventId: id });
    return { status: 'failed' };
  }
  if (!data) return { status: 'ignored' };
  return data.status === 'failed' ? { status: 'failed' } : { status: 'queued' };
}

export async function sendAdminTestTelegram(adminId: string): Promise<AlertDeliveryResult> {
  const client = getServerClient();
  if (!client) return { status: 'unconfigured' };
  const day = new Date().toISOString().slice(0, 10);
  const { error } = await client.from('admin_telegram_outbox').upsert(
    {
      idempotency_key: `admin_test:${adminId}:${day}`,
      related_type: 'admin_test',
      related_id: adminId,
      payload: {
        title: 'Telegram notification test',
        summary: 'Mymensingh Sheba admin Telegram alert test.',
        occurred_at: new Date().toISOString(),
        admin_path: '/admin',
      },
    },
    { onConflict: 'idempotency_key', ignoreDuplicates: true }
  );
  if (error) {
    console.error('Admin Telegram test could not be queued.');
    return { status: 'failed' };
  }
  return { status: 'queued' };
}

export async function sendAdminCriticalTelegramAlert(error: unknown): Promise<AlertDeliveryResult> {
  const candidateCode =
    error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
      ? error.code
      : '';
  const expectedCodes = new Set([
    '23505',
    '23503',
    '23514',
    '42501',
    'PGRST116',
    'storage/object_not_found',
  ]);
  if (expectedCodes.has(candidateCode)) return { status: 'ignored' };

  const safeCode = /^[A-Za-z0-9_/-]{1,40}$/.test(candidateCode)
    ? candidateCode
    : 'unexpected_admin_action_error';
  const incidentId = randomUUID();
  const client = getServerClient();
  if (!client) return { status: 'unconfigured' };
  const { error: insertError } = await client.from('admin_telegram_outbox').upsert(
    {
      idempotency_key: `critical_error:${incidentId}`,
      related_type: 'critical_error',
      related_id: incidentId,
      payload: {
        title: 'অ্যাডমিন কার্যক্রমে গুরুতর ত্রুটি',
        summary: `একটি অ্যাডমিন কার্যক্রম অপ্রত্যাশিতভাবে ব্যর্থ হয়েছে (কোড: ${safeCode})। বিস্তারিত দেখতে সার্ভার লগ পরীক্ষা করুন।`,
        occurred_at: new Date().toISOString(),
        admin_path: '/admin',
      },
    },
    { onConflict: 'idempotency_key', ignoreDuplicates: true }
  );
  if (insertError) {
    console.error('Admin critical Telegram alert could not be queued.');
    return { status: 'failed' };
  }
  return { status: 'queued' };
}

export async function processAdminTelegramQueue(
  requestedBatchSize = MAX_WORKER_JOBS
): Promise<{ claimed: number; sent: number; retryScheduled: number; failed: number; busy: boolean }> {
  const client = getServerClient();
  if (!client) throw new Error('supabase_server_configuration_missing');
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    throw new Error('telegram_server_configuration_missing');
  }

  const { data: lockToken, error: lockError } = await client.rpc(
    'acquire_admin_telegram_worker_lock',
    { p_lease_seconds: 120 }
  );
  if (lockError) throw new Error('telegram_worker_lock_failed');
  if (!lockToken) return { claimed: 0, sent: 0, retryScheduled: 0, failed: 0, busy: true };

  const result = { claimed: 0, sent: 0, retryScheduled: 0, failed: 0, busy: false };
  const startedAt = Date.now();
  try {
    const batchSize = Math.max(1, Math.min(MAX_WORKER_JOBS, Math.floor(requestedBatchSize)));
    for (let index = 0; index < batchSize; index += 1) {
      const { data, error } = await client.rpc('claim_admin_telegram_outbox_job', {
        p_lease_seconds: 180,
        p_max_attempts: MAX_DELIVERY_ATTEMPTS,
      });
      if (error) throw new Error('telegram_job_claim_failed');
      const job = (data as QueueJob[] | null)?.[0];
      if (!job) break;
      result.claimed += 1;
      const outcome = await sendOneJob(client, job);
      if (outcome === 'sent') result.sent += 1;
      if (outcome === 'retry') result.retryScheduled += 1;
      if (outcome === 'failed') result.failed += 1;
      if (Date.now() - startedAt >= MAX_WORKER_RUNTIME_MS) break;
    }
    return result;
  } finally {
    const { error } = await client.rpc('release_admin_telegram_worker_lock', {
      p_lease_token: lockToken,
    });
    if (error) console.error('Admin Telegram worker lock release failed.');
  }
}
