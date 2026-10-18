'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Bell, LoaderCircle } from 'lucide-react';
import { getRecentAdminNotifications, markAdminNotificationRead } from '@/app/admin/actions/notifications';
import type { AdminNotificationRow } from '@/lib/admin/queries';
import { useToast } from '@/components/admin/ToastProvider';
import { formatDateTime } from '@/lib/admin/format';
import { cn } from '@/lib/utils';

export default function AdminNotificationMenu({
  unreadCount,
  unavailable,
}: {
  unreadCount: number;
  unavailable?: boolean;
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [rows, setRows] = useState<AdminNotificationRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const loadRecent = async () => {
    // Refetch on every open so the menu always reflects the latest unread
    // state (e.g. after the notifications page clears them).
    if (loading || unavailable) return;
    setLoading(true);
    try {
      const result = await getRecentAdminNotifications();
      if (result.unavailable) {
        notify('error', 'নোটিফিকেশন লোড করা যায়নি', result.error);
        return;
      }
      setRows(result.rows);
      setLoaded(true);
    } catch (error) {
      notify('error', 'নোটিফিকেশন লোড করা যায়নি', error instanceof Error ? error.message : undefined);
    } finally {
      setLoading(false);
    }
  };

  const openNotification = async (row: AdminNotificationRow) => {
    if (row.is_read) {
      router.push(row.link_href);
      return;
    }
    setPendingId(row.id);
    try {
      const result = await markAdminNotificationRead(row.id);
      if (!result.ok) {
        notify('error', 'নোটিফিকেশন খোলা যায়নি', result.error);
        return;
      }
      setRows((current) => current.map((item) =>
        item.id === row.id ? { ...item, is_read: true } : item
      ));
      router.refresh();
      router.push(row.link_href);
    } catch (error) {
      notify('error', 'নোটিফিকেশন খোলা যায়নি', error instanceof Error ? error.message : undefined);
    } finally {
      setPendingId(null);
    }
  };

  return (
    <details className="admin-menu relative" data-admin-menu onToggle={(event) => {
      if ((event.currentTarget as HTMLDetailsElement).open) void loadRecent();
    }}>
      <summary
        className="relative flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-md text-admin-muted hover:bg-admin-page hover:text-admin-navy [&::-webkit-details-marker]:hidden"
        aria-label={unreadCount > 0 ? `নোটিফিকেশন, ${unreadCount}টি অপঠিত` : 'নোটিফিকেশন'}
      >
        <Bell className="h-[18px] w-[18px]" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[9px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </summary>
      <div className="absolute right-0 top-12 z-50 w-[min(23rem,calc(100vw-1.5rem))] overflow-hidden rounded-admin-card border border-admin-border bg-white text-left shadow-admin-popover">
        <div className="flex items-center justify-between border-b border-admin-border px-4 py-3">
          <div>
            <p className="text-sm font-bold text-admin-text">নোটিফিকেশন</p>
            <p className="mt-0.5 text-xs text-admin-muted">
              {unavailable ? 'নোটিফিকেশন সেবা এখন অনুপলব্ধ।' : `${unreadCount}টি অপঠিত`}
            </p>
          </div>
          <Bell className="h-4 w-4 text-admin-muted" aria-hidden="true" />
        </div>
        {loading ? (
          <div className="flex min-h-20 items-center justify-center gap-2 text-xs text-admin-muted">
            <LoaderCircle className="h-4 w-4 animate-spin" /> লোড হচ্ছে…
          </div>
        ) : rows.length ? (
          <ul className="max-h-80 divide-y divide-admin-border overflow-y-auto">
            {rows.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  disabled={pendingId === row.id}
                  onClick={() => void openNotification(row)}
                  className={cn(
                    'block w-full px-4 py-3 text-left hover:bg-admin-page disabled:opacity-60',
                    !row.is_read && 'bg-admin-page/60'
                  )}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-semibold text-admin-text">{row.title}</span>
                      <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-admin-muted">{row.body}</span>
                    </span>
                    <span className={cn('mt-1 h-2 w-2 shrink-0 rounded-full', row.is_read ? 'bg-admin-border' : 'bg-rose-500')} />
                  </span>
                  <time className="mt-2 block text-[10px] text-admin-muted" dateTime={row.created_at}>{formatDateTime(row.created_at)}</time>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-6 text-center text-xs text-admin-muted">
            {unavailable ? 'তথ্য পাওয়া যাচ্ছে না।' : loaded ? 'এখনো কোনো নোটিফিকেশন নেই।' : 'খুললে সাম্প্রতিক নোটিফিকেশন দেখা যাবে।'}
          </p>
        )}
        <Link
          href="/admin/notifications"
          className="flex min-h-11 items-center justify-center border-t border-admin-border px-3 text-xs font-semibold text-admin-navy hover:bg-admin-page"
        >
          সব নোটিফিকেশন দেখুন
        </Link>
      </div>
    </details>
  );
}
