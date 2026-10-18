'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Re-runs the admin layout's server render once after mount.
 *
 * The layout fetches sidebar badge counts in parallel with the page, so an
 * admin page that clears badge-counted rows during render (e.g. the message
 * inbox marking new messages as reviewed) can finish *after* the badge query
 * already resolved — leaving a stale number on screen. A single post-mount
 * refresh re-fetches the badges so the count disappears without a manual reload.
 */
export default function AdminBadgeRefresh() {
  const router = useRouter();

  useEffect(() => {
    router.refresh();
  }, [router]);

  return null;
}
