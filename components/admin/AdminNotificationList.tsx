'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Check, ExternalLink } from 'lucide-react';
import type { AdminNotificationRow } from '@/lib/admin/queries';
import { markAdminNotificationRead, markAllAdminNotificationsRead } from '@/app/admin/actions/notifications';
import { useToast } from '@/components/admin/ToastProvider';
import { formatDateTime } from '@/lib/admin/format';

export default function AdminNotificationList({
  rows,
  unreadCount,
}: {
  rows: AdminNotificationRow[];
  unreadCount: number;
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyAll, setBusyAll] = useState(false);

  const markRead = async (id: string) => {
    setBusyId(id);
    try {
      const result = await markAdminNotificationRead(id);
      if (!result.ok) {
        notify('error', 'নোটিফিকেশন আপডেট হয়নি', result.error);
        return false;
      }
      notify('success', 'পঠিত হিসেবে চিহ্নিত হয়েছে');
      router.refresh();
      return true;
    } catch (error) {
      notify('error', 'নোটিফিকেশন আপডেট হয়নি', error instanceof Error ? error.message : undefined);
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const markAll = async () => {
    setBusyAll(true);
    try {
      const result = await markAllAdminNotificationsRead();
      if (!result.ok) {
        notify('error', 'নোটিফিকেশন আপডেট হয়নি', result.error);
        return;
      }
      notify('success', result.message ?? 'সব পঠিত হয়েছে');
      router.refresh();
    } catch (error) {
      notify('error', 'নোটিফিকেশন আপডেট হয়নি', error instanceof Error ? error.message : undefined);
    } finally {
      setBusyAll(false);
    }
  };

  return (
    <section className="space-y-3">
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void markAll()}
            disabled={busyAll}
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-admin-border bg-white px-3 text-xs font-semibold text-admin-navy hover:bg-admin-page disabled:opacity-50"
          >
            <Check className="h-4 w-4" /> {busyAll ? 'আপডেট হচ্ছে…' : 'সব পঠিত করুন'}
          </button>
        </div>
      )}
      <ul className="divide-y divide-admin-border overflow-hidden rounded-admin-card border border-admin-border bg-white">
        {rows.map((row) => (
          <li key={row.id} className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-start ${row.is_read ? '' : 'bg-admin-page/60'}`}>
            <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${row.is_read ? 'bg-admin-border' : 'bg-rose-500'}`} aria-label={row.is_read ? 'পঠিত' : 'অপঠিত'} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-bold text-admin-text">{row.title}</h2>
                <span className="rounded bg-admin-page px-2 py-0.5 text-[10px] font-semibold text-admin-muted">
                  {row.related_type === 'tolet_listing_deleted'
                    ? 'বাসাভাড়ার পোস্ট ডিলিট'
                    : row.related_type ?? row.type}
                </span>
              </div>
              <p className="mt-1 break-words text-sm leading-relaxed text-admin-muted">{row.body}</p>
              <time className="mt-2 block text-xs text-admin-muted" dateTime={row.created_at}>{formatDateTime(row.created_at)}</time>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
              {!row.is_read && (
                <button
                  type="button"
                  disabled={busyId === row.id}
                  onClick={() => void markRead(row.id)}
                  className="min-h-10 rounded-md border border-admin-border px-3 text-xs font-semibold text-admin-navy hover:bg-admin-page disabled:opacity-50"
                >
                  {busyId === row.id ? 'আপডেট হচ্ছে…' : 'পঠিত করুন'}
                </button>
              )}
              <a
                href={row.link_href}
                onClick={(event) => {
                  if (row.is_read) return;
                  event.preventDefault();
                  void markAdminNotificationRead(row.id).then((result) => {
                    if (!result.ok) {
                      notify('error', 'নোটিফিকেশন খোলা যায়নি', result.error);
                      return;
                    }
                    router.push(row.link_href);
                  }).catch((error: unknown) => {
                    notify('error', 'নোটিফিকেশন খোলা যায়নি', error instanceof Error ? error.message : undefined);
                  });
                }}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-md bg-admin-navy px-3 text-xs font-semibold text-white hover:bg-admin-navy-soft"
              >
                রেকর্ড খুলুন <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="p-8 text-center text-sm text-admin-muted">এই ফিল্টারে কোনো নোটিফিকেশন নেই।</li>
        )}
      </ul>
    </section>
  );
}
