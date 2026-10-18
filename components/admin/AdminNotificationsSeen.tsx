'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { markAllAdminNotificationsRead } from '@/app/admin/actions/notifications';

/**
 * Clears the header bell badge once the admin actually opens the notifications
 * page.
 *
 * The badge in the admin header is rendered by the server layout, so a client
 * page cannot mutate it directly. This tiny client component closes the loop:
 * on mount it flags every unread admin notification as read, then refreshes the
 * server tree so the layout re-renders with the new badge count.
 *
 * `hasUnread` comes from the server render, so a page that already has nothing
 * unread skips the write and the refresh entirely.
 */
export default function AdminNotificationsSeen({ hasUnread }: { hasUnread: boolean }) {
  const router = useRouter();
  const done = useRef(false);

  useEffect(() => {
    if (!hasUnread || done.current) return;
    done.current = true;
    void (async () => {
      const result = await markAllAdminNotificationsRead();
      if (result.ok) router.refresh();
    })();
  }, [hasUnread, router]);

  return null;
}
