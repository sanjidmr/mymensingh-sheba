import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/admin/guard';
import AdminShell from '@/components/admin/AdminShell';
import { ToastProvider } from '@/components/admin/ToastProvider';
import { fetchAdminBadgeCounts } from '@/lib/admin/queries';

export const metadata: Metadata = {
  title: 'অ্যাডমিন কন্ট্রোল',
  robots: { index: false, follow: false },
};

/**
 * The admin console's server-side gate.
 *
 * This replaces the old client-side redirect, which ran only after the page
 * bundle had already been downloaded and derived `isAdmin` from the browser's
 * copy of the session. Now the role is resolved here, before any admin markup
 * or admin data is rendered or serialised.
 *
 * `requireAdmin()` redirects to `/login` when there is no session and to `/`
 * when there is a session that is not an admin. It throws, so the `session`
 * below is non-nullable for every child route.
 *
 * `dynamic` matters: without it Next may cache this layout's render and serve
 * a stale authorisation decision.
 */
export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();
  const badges = await fetchAdminBadgeCounts();

  return (
    <ToastProvider>
      <AdminShell adminName={session.fullName} badges={badges}>
        {children}
      </AdminShell>
    </ToastProvider>
  );
}