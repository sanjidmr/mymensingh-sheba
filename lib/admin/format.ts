/**
 * Shared formatting and status vocabulary for the admin console.
 *
 * Server-safe: no React, no browser globals. Every date the panel shows is
 * rendered with an explicit timezone so an admin reading a submission time
 * sees Mymensingh local time (UTC+6) regardless of where their machine is.
 */

/** Asia/Dhaka is UTC+6 with no daylight saving, so a fixed offset is exact. */
const ADMIN_TIMEZONE = 'Asia/Dhaka';

const dateTimeFormatter = new Intl.DateTimeFormat('bn-BD', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: ADMIN_TIMEZONE,
});

const dateFormatter = new Intl.DateTimeFormat('bn-BD', {
  dateStyle: 'medium',
  timeZone: ADMIN_TIMEZONE,
});

/** "১২ মে ২০২৫, ৩:৪৫ পূর্বাহ্ণ" */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return dateTimeFormatter.format(date);
}

/** "১২ মে ২০২৫" */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return dateFormatter.format(date);
}

/** "৩ মিনিট আগে" / "২ দিন আগে" — for activity feeds and queues. */
export function formatRelative(
  value: string | Date | null | undefined,
  now: Date = new Date()
): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';

  const diffMs = now.getTime() - date.getTime();
  const future = diffMs < 0;
  const seconds = Math.abs(Math.round(diffMs / 1000));

  const say = (n: number, unit: string) => {
    const bn = String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]);
    return future ? `${bn} ${unit} পরে` : `${bn} ${unit} আগে`;
  };

  if (seconds < 60) return future ? 'এইমাত্র' : 'এইমাত্র';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return say(minutes, 'মিনিট');
  const hours = Math.round(minutes / 60);
  if (hours < 24) return say(hours, 'ঘণ্টা');
  const days = Math.round(hours / 24);
  if (days < 30) return say(days, 'দিন');
  const months = Math.round(days / 30);
  if (months < 12) return say(months, 'মাস');
  return say(Math.round(months / 12), 'বছর');
}

/** "—" for an absent phone/email rather than the string "null". */
export function formatContact(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : '—';
}

export type StatusTone =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'accent';

export interface StatusOption {
  value: string;
  label: string;
  tone: StatusTone;
}

/**
 * One status vocabulary for the whole console, keyed per table.
 *
 * Every `value` listed here exists as a CHECK constraint on its table, so the
 * dropdowns can never offer a status the database would reject. When adding
 * one, add it to the migration too — an admin clicking a status that throws a
 * constraint violation is the worst possible experience.
 */
export const STATUS_OPTIONS: Record<string, StatusOption[]> = {
  community_posts: [
    { value: 'pending', label: 'অপেক্ষমাণ', tone: 'warning' },
    { value: 'approved', label: 'অনুমোদিত', tone: 'success' },
    { value: 'rejected', label: 'প্রত্যাখ্যাত', tone: 'danger' },
  ],
  tolet_listings: [
    { value: 'pending_review', label: 'অপেক্ষমাণ', tone: 'warning' },
    { value: 'approved', label: 'অনুমোদিত', tone: 'success' },
    { value: 'rejected', label: 'প্রত্যাখ্যাত', tone: 'danger' },
    { value: 'unavailable', label: 'অনুপলব্ধ', tone: 'neutral' },
    { value: 'archived', label: 'আর্কাইভ', tone: 'neutral' },
  ],
  service_requests: [
    { value: 'new', label: 'নতুন', tone: 'warning' },
    { value: 'submitted', label: 'জমা হয়েছে', tone: 'warning' },
    { value: 'reviewing', label: 'পর্যালোচনায়', tone: 'info' },
    { value: 'assigned', label: 'দায়িত্ব দেওয়া', tone: 'info' },
    { value: 'contacted', label: 'যোগাযোগ হয়েছে', tone: 'info' },
    { value: 'in_progress', label: 'চলমান', tone: 'info' },
    { value: 'completed', label: 'সম্পন্ন', tone: 'success' },
    { value: 'cancelled', label: 'বাতিল', tone: 'neutral' },
    { value: 'rejected', label: 'প্রত্যাখ্যাত', tone: 'danger' },
  ],
  tolet_requests: [
    { value: 'submitted', label: 'জমা হয়েছে', tone: 'warning' },
    { value: 'contacted', label: 'যোগাযোগ হয়েছে', tone: 'info' },
    { value: 'completed', label: 'সম্পন্ন', tone: 'success' },
    { value: 'cancelled', label: 'বাতিল', tone: 'neutral' },
  ],
  blood_requests: [
    { value: 'pending_review', label: 'অপেক্ষমাণ', tone: 'warning' },
    { value: 'approved', label: 'অনুমোদিত', tone: 'success' },
    { value: 'donor_contacted', label: 'দাতার সাথে যোগাযোগ', tone: 'info' },
    { value: 'in_progress', label: 'চলমান', tone: 'info' },
    { value: 'completed', label: 'সম্পন্ন', tone: 'success' },
    { value: 'rejected', label: 'প্রত্যাখ্যাত', tone: 'danger' },
    { value: 'cancelled', label: 'বাতিল', tone: 'neutral' },
  ],
  vehicle_requests: [
    { value: 'new', label: 'নতুন', tone: 'warning' },
    { value: 'contacted', label: 'যোগাযোগ হয়েছে', tone: 'info' },
    { value: 'closed', label: 'বন্ধ', tone: 'neutral' },
  ],
  contact_messages: [
    { value: 'new', label: 'নতুন', tone: 'warning' },
    { value: 'reviewing', label: 'পর্যালোচনায়', tone: 'info' },
    { value: 'replied', label: 'উত্তর দেওয়া হয়েছে', tone: 'success' },
    { value: 'closed', label: 'বন্ধ', tone: 'neutral' },
  ],
  reports: [
    { value: 'open', label: 'খোলা', tone: 'warning' },
    { value: 'resolved', label: 'সমাধান হয়েছে', tone: 'success' },
    { value: 'dismissed', label: 'বাতিল', tone: 'neutral' },
  ],
  verification: [
    { value: 'pending_approval', label: 'অপেক্ষমাণ', tone: 'warning' },
    { value: 'approved', label: 'অনুমোদিত', tone: 'success' },
    { value: 'rejected', label: 'প্রত্যাখ্যাত', tone: 'danger' },
    { value: 'suspended', label: 'স্থগিত', tone: 'danger' },
    { value: 'paused', label: 'বিরতি', tone: 'neutral' },
    { value: 'draft', label: 'খসড়া', tone: 'neutral' },
  ],
  users: [
    { value: 'active', label: 'সক্রিয়', tone: 'success' },
    { value: 'suspended', label: 'স্থগিত', tone: 'warning' },
    { value: 'blocked', label: 'বন্ধ', tone: 'danger' },
  ],
};

const TONE_BY_FALLBACK: Record<StatusTone, 'green' | 'amber' | 'rose' | 'sky' | 'slate' | 'accent'> = {
  success: 'green',
  warning: 'amber',
  danger: 'rose',
  info: 'sky',
  neutral: 'slate',
  accent: 'accent',
};

/** Look a status up across every vocabulary, then fall back to the raw value. */
export function lookupStatus(status: string | null | undefined): StatusOption {
  const key = (status ?? '').trim();
  for (const options of Object.values(STATUS_OPTIONS)) {
    const hit = options.find((o) => o.value === key);
    if (hit) return hit;
  }
  return { value: key, label: key || '—', tone: 'neutral' };
}

export { TONE_BY_FALLBACK };

/**
 * Clamp a caller-supplied page size so a hand-edited `?pageSize=100000` cannot
 * pull the whole table into one response.
 */
export function clampPageSize(value: unknown, fallback = 25, max = 100): number {
  const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}

/** 1-based page number, minimum 1. */
export function clampPage(value: unknown): number {
  const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.floor(parsed);
}

/** Truncate without cutting mid-word where avoidable. */
export function truncate(value: string | null | undefined, max = 120): string {
  const text = (value ?? '').trim();
  if (!text) return '—';
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}