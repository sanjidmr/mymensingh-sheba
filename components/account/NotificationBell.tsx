'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, CheckCircle2, Info, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { bnRelativeTime } from '@/lib/catalog-types';

const RECENT_LIMIT = 5;

function typeIcon(type: string) {
  if (type === 'success') return <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />;
  if (type === 'warning') return <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700" />;
  if (type === 'danger') return <ShieldAlert className="h-4 w-4 shrink-0 text-rose-700" />;
  return <Info className="h-4 w-4 shrink-0 text-sky-700" />;
}

/**
 * Notification icon with a recent-activity popover.
 *
 * Reads the shared notification list from the auth context (real database
 * rows, no mock data) and shows the newest few. "আরও দেখুন" always links to
 * the full notification history page. Clicking a row marks it read and follows
 * its target link when one exists.
 */
export default function NotificationBell() {
  const { notifications, notificationsError, markNotificationRead } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;
  const unreadLabel = unreadCount > 9 ? '9+' : String(unreadCount);
  const recent = notifications.slice(0, RECENT_LIMIT);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={
          unreadCount > 0 ? `নোটিফিকেশন, ${unreadCount}টি অপঠিত` : 'নোটিফিকেশন'
        }
        className="relative flex h-10 w-10 items-center justify-center border border-brand-100 bg-white text-ink-700 hover:bg-brand-50"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-black text-white">
            {unreadLabel}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="সাম্প্রতিক নোটিফিকেশন"
          className="absolute right-0 z-50 mt-2 w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-lg shadow-brand-900/5"
        >
          <div className="flex items-center justify-between gap-2 border-b border-brand-100 px-4 py-3">
            <span className="text-[13px] font-extrabold text-ink-900">নোটিফিকেশন</span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10.5px] font-bold text-brand-800">
                {unreadCount}টি অপঠিত
              </span>
            )}
          </div>

          {notificationsError ? (
            <div className="px-4 py-6 text-center">
              <p role="alert" className="text-[12px] leading-relaxed text-rose-700">{notificationsError}</p>
            </div>
          ) : recent.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell className="mx-auto h-8 w-8 text-brand-200" />
              <p className="mt-2 text-[12.5px] font-bold text-ink-900">কোনো নোটিফিকেশন নেই</p>
              <p className="mt-1 text-[11.5px] text-ink-500">নতুন আপডেট এখানে দেখা যাবে।</p>
            </div>
          ) : (
            <ul className="max-h-[60vh] divide-y divide-brand-100/70 overflow-y-auto">
              {recent.map((notification) => {
                const body = (
                  <>
                    <span className="mt-0.5">{typeIcon(notification.type)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[12.5px] font-bold text-ink-900">
                          {notification.title}
                        </span>
                        {!notification.isRead && (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" aria-hidden="true" />
                        )}
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-[11.5px] leading-relaxed text-ink-500">
                        {notification.body}
                      </span>
                      <span className="mt-0.5 block text-[10.5px] text-ink-400">
                        {bnRelativeTime(notification.createdAt) ?? ''}
                      </span>
                    </span>
                  </>
                );
                const className = `flex w-full items-start gap-2.5 px-4 py-3 text-left hover:bg-mist-50 ${
                  notification.isRead ? 'bg-white' : 'bg-brand-50/50'
                }`;
                const handleClick = () => {
                  setOpen(false);
                  if (!notification.isRead) void markNotificationRead(notification.id);
                };
                return (
                  <li key={notification.id}>
                    {notification.linkHref ? (
                      <Link href={notification.linkHref} onClick={handleClick} className={className}>
                        {body}
                      </Link>
                    ) : (
                      <button type="button" onClick={handleClick} className={className}>
                        {body}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <div className="border-t border-brand-100">
            <Link
              href="/dashboard/notifications"
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center justify-center gap-1.5 px-4 text-[12px] font-bold text-brand-700 hover:bg-brand-50"
            >
              আরও দেখুন
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
