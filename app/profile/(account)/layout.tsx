'use client';

import AccountShell from '@/components/account/AccountShell';

/**
 * Account route group layout.
 *
 * Wraps the standalone account pages that live under `/profile` (saved posts
 * and service requests) in the same shell as the `/dashboard` routes so the
 * sidebar and mobile navigation never disappear when moving between them.
 * Authentication is still enforced by the parent `app/profile/layout.tsx`.
 */
export default function ProfileAccountLayout({ children }: { children: React.ReactNode }) {
  return <AccountShell>{children}</AccountShell>;
}
