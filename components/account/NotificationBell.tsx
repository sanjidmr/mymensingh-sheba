'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
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
  const { notifications, notificationsError, markNotificationRead, markNotificationsReadAll } =
    useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  const updatePosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(320, window.innerWidth - 24);
    setPosition({
      top: rect.bottom + 8,
      left: Math.max(12, Math.min(rect.right - width, window.innerWidth - width - 12)),
    });
  };

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;
  const unreadLabel = unreadCount > 9 ? '9+' : String(unreadCount);
  const recent = notifications.slice(0, RECENT_LIMIT);

  // Opening the bell counts as "seen": clear the unread badge so it does not
  // keep showing after the owner has looked at the list.
  const toggleOpen = () => {
    const next = !open;
    if (next) updatePosition();
    setOpen(next);
    if (next && unreadCount > 0) void markNotificationsReadAll();
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (!containerRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const reposition = () => updatePosition();
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleOpen}
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

      {open && position && typeof document !== 'undefined' && createPortal(
        <div
          ref={panelRef}
          role="dialog"
          aria-label="সাম্প্রতিক নোটিফিকেশন"
          style={{ position: 'fixed', top: position.top, left: position.left, width: 'min(20rem, calc(100vw - 1.5rem))', maxHeight: `calc(100dvh - ${position.top + 12}px)` }}
          className="z-[1000] overflow-y-auto overscroll-contain rounded-2xl border border-brand-100 bg-white shadow-lg shadow-brand-900/5"
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
        </div>,
        document.body
      )}
    </div>
  );
}
