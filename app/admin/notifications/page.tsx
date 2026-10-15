import { fetchAdminNotifications, fetchAdminUnreadNotificationCount, parseListParams } from '@/lib/admin/queries';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminError, AdminEmpty } from '@/components/admin/States';
import { AdminSearch, ClearFilters } from '@/components/admin/AdminSearch';
import { FilterNav } from '@/components/admin/FilterNav';
import { TablePager } from '@/components/admin/TablePager';
import AdminNotificationList from '@/components/admin/AdminNotificationList';

export const dynamic = 'force-dynamic';

const CATEGORIES = [
  { value: 'service_request', label: 'সেবা অনুরোধ' },
  { value: 'vehicle_request', label: 'যানবাহন অনুরোধ' },
  { value: 'contact_message', label: 'গ্রাহক সহায়তা' },
  { value: 'community_post', label: 'কমিউনিটি পোস্ট' },
  { value: 'community_post_report', label: 'পোস্ট রিপোর্ট' },
  { value: 'listing_reports', label: 'লিস্টিং রিপোর্ট' },
  { value: 'staff_profile_reports', label: 'কর্মী রিপোর্ট' },
  { value: 'tutor_reports', label: 'টিউটর রিপোর্ট' },
  { value: 'blood_donor_reports', label: 'রক্তদাতা রিপোর্ট' },
];

export default async function AdminNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await searchParams;
  const params = parseListParams(resolved, { pageSize: 20 });
  const result = await fetchAdminNotifications(params);
  let unreadCount: number | null = null;
  let unreadError: string | undefined;
  try {
    unreadCount = await fetchAdminUnreadNotificationCount();
  } catch (error) {
    unreadError = error instanceof Error ? error.message : 'অপঠিত নোটিফিকেশন গণনা করা যায়নি।';
  }

  return (
    <>
      <PageHeader
        title="অ্যাডমিন নোটিফিকেশন"
        description="ডাটাবেজে সংরক্ষিত প্রকৃত জমা, সাপোর্ট বার্তা ও মডারেশন আপডেট।"
        count={result.unavailable ? undefined : `${result.total}টি নোটিফিকেশন · ${unreadCount ?? '—'}টি অপঠিত`}
      />

      {result.unavailable ? (
        <AdminError
          title="নোটিফিকেশন লোড করা যায়নি"
          message={result.error ?? 'অ্যাডমিন অনুমতি বা ডেটাবেজ সংযোগ যাচাই করুন।'}
        />
      ) : (
        <>
          {unreadError && (
            <AdminError title="অপঠিত সংখ্যা লোড করা যায়নি" message={unreadError} className="mb-4" />
          )}
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <AdminSearch placeholder="শিরোনাম বা বার্তা খুঁজুন…" />
            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
              <FilterNav
                id="notification-read"
                label="পড়ার অবস্থা"
                value={String(params.status ?? '')}
                placeholder="সব"
                options={[
                  { value: 'unread', label: 'অপঠিত' },
                  { value: 'read', label: 'পঠিত' },
                ]}
                param="status"
                searchParams={resolved}
              />
              <FilterNav
                id="notification-category"
                label="ধরন"
                value={String(params.category ?? '')}
                placeholder="সব ধরন"
                options={CATEGORIES}
                param="category"
                searchParams={resolved}
              />
              <ClearFilters searchParams={resolved} />
            </div>
          </div>

          {result.total === 0 ? (
            <AdminEmpty
              title="কোনো নোটিফিকেশন নেই"
              description="নতুন বাস্তব জমা, সাপোর্ট বার্তা বা মডারেশন ঘটনা হলে এখানে দেখা যাবে।"
            />
          ) : (
            <>
              <AdminNotificationList rows={result.rows} unreadCount={unreadCount ?? 0} />
              <TablePager
                page={result.page}
                pageSize={result.pageSize}
                total={result.total}
                searchParams={resolved}
              />
            </>
          )}
        </>
      )}
    </>
  );
}
