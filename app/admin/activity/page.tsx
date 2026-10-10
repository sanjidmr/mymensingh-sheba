import { Activity } from 'lucide-react';
import { AdminSearch, ClearFilters } from '@/components/admin/AdminSearch';
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable';
import { AdminError, AdminEmpty } from '@/components/admin/States';
import { PageHeader } from '@/components/admin/PageHeader';
import { FilterNav } from '@/components/admin/FilterNav';
import { TablePager } from '@/components/admin/TablePager';
import {
  fetchAdminAuditEvents,
  parseListParams,
  type AdminAuditEvent,
} from '@/lib/admin/queries';
import { formatDateTime } from '@/lib/admin/format';

export const dynamic = 'force-dynamic';

const ENTITY_LABELS: Record<string, { label: string; href: string }> = {
  profiles: { label: 'ইউজার', href: '/admin/users' },
  tolet_profiles: { label: 'বাসা মালিক', href: '/admin/verifications' },
  home_tutor_profiles: { label: 'গৃহশিক্ষক', href: '/admin/verifications' },
  blood_donor_profiles: { label: 'রক্তদাতা', href: '/admin/blood' },
  staff_profiles: { label: 'সেবা প্রোফাইল', href: '/admin/services' },
  service_requests: { label: 'সেবা রিকোয়েস্ট', href: '/admin/requests' },
  tolet_requests: { label: 'বাসা ভাড়া অনুসন্ধান', href: '/admin/tolet-requests' },
  vehicle_requests: { label: 'গাড়ি রিকোয়েস্ট', href: '/admin/vehicle-requests' },
  blood_requests: { label: 'রক্ত রিকোয়েস্ট', href: '/admin/blood' },
  tolet_listings: { label: 'বাসা ভাড়া পোস্ট', href: '/admin/tolet' },
  community_posts: { label: 'কমিউনিটি পোস্ট', href: '/admin/posts' },
  service_listings: { label: 'সেবা তালিকা', href: '/admin/catalog' },
  emergency_contacts: { label: 'জরুরি নম্বর', href: '/admin/catalog' },
  hero_slides: { label: 'হোমপেজ ব্যানার', href: '/admin/hero' },
  platform_settings: { label: 'সাইট সেটিংস', href: '/admin/settings' },
  contact_messages: { label: 'যোগাযোগ বার্তা', href: '/admin/messages' },
  listing_reports: { label: 'লিস্টিং রিপোর্ট', href: '/admin/reports' },
  staff_profile_reports: { label: 'সেবা রিপোর্ট', href: '/admin/reports' },
  tutor_reports: { label: 'শিক্ষক রিপোর্ট', href: '/admin/reports' },
  blood_donor_reports: { label: 'রক্তদাতা রিপোর্ট', href: '/admin/reports' },
  community_post_reports: { label: 'পোস্ট রিপোর্ট', href: '/admin/reports' },
};

const OPERATION_LABELS: Record<AdminAuditEvent['operation'], string> = {
  insert: 'তৈরি',
  update: 'পরিবর্তন',
  delete: 'মুছে ফেলা',
};

function changeSummary(event: AdminAuditEvent): string {
  const fields = ['status', 'role', 'is_active', 'is_enabled', 'is_featured'];
  for (const field of fields) {
    const before = event.before_state[field];
    const after = event.after_state[field];
    if (before !== undefined || after !== undefined) {
      const labels: Record<string, string> = {
        status: 'স্ট্যাটাস',
        role: 'ভূমিকা',
        is_active: 'সক্রিয়',
        is_enabled: 'চালু',
        is_featured: 'ফিচার্ড',
      };
      return `${labels[field]}: ${before ?? '—'} → ${after ?? '—'}`;
    }
  }
  return event.operation === 'delete' ? 'রেকর্ড সরানো হয়েছে' : 'রেকর্ড আপডেট হয়েছে';
}

const columns: AdminColumn<AdminAuditEvent>[] = [
  {
    key: 'entity',
    header: 'রেকর্ড',
    mobilePrimary: true,
    render: (event) => (
      <span>
        {ENTITY_LABELS[event.entity_table]?.label ?? event.entity_table}
        <span className="mt-0.5 block text-xs font-normal text-ink-400">
          {event.record_id ?? 'রেকর্ড আইডি নেই'}
        </span>
      </span>
    ),
  },
  {
    key: 'operation',
    header: 'কাজ',
    render: (event) => OPERATION_LABELS[event.operation],
  },
  {
    key: 'change',
    header: 'পরিবর্তন',
    render: changeSummary,
  },
  {
    key: 'actor',
    header: 'অ্যাডমিন',
    render: (event) => event.actor_name ?? 'অজানা অ্যাডমিন',
  },
  {
    key: 'date',
    header: 'সময়',
    hideOnMobile: true,
    render: (event) => formatDateTime(event.created_at),
  },
];

export default async function AdminActivityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const params = parseListParams(resolvedSearchParams, { pageSize: 25 });
  const result = await fetchAdminAuditEvents(params);

  if (result.unavailable) {
    return (
      <>
        <PageHeader
          title="অ্যাডমিন অডিট লগ"
          description="কে, কখন, কোন রেকর্ডে কী পরিবর্তন করেছেন — ব্যক্তিগত ফর্মের তথ্য ছাড়াই।"
        />
        <AdminError
          title="অডিট লগ লোড করা যায়নি"
          message={
            result.error
              ? `${result.error} — প্রয়োজন হলে supabase/migrations/20261009000000_admin_audit_log.sql মাইগ্রেশনটি চালান।`
              : 'supabase/migrations/20261009000000_admin_audit_log.sql মাইগ্রেশনটি চালিয়ে আবার চেষ্টা করুন।'
          }
        />
      </>
    );
  }

  const clearParams = new URLSearchParams();
  if (params.search) clearParams.set('q', params.search);
  if (params.status) clearParams.set('status', params.status);
  if (params.category) clearParams.set('category', params.category);

  return (
    <>
      <PageHeader
        title="অ্যাডমিন অডিট লগ"
        description="প্রশাসনিক পরিবর্তনের সময়, রেকর্ড ও দায়িত্বপ্রাপ্ত অ্যাডমিনের ইতিহাস।"
        count={`মোট ${result.total}টি পরিবর্তন`}
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <AdminSearch placeholder="রেকর্ডের নাম বা আইডি খুঁজুন…" />
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <FilterNav
            id="audit-operation"
            label="কাজ"
            value={params.status ?? ''}
            placeholder="সব কাজ"
            options={Object.entries(OPERATION_LABELS).map(([value, label]) => ({ value, label }))}
            param="status"
            searchParams={resolvedSearchParams}
          />
          <FilterNav
            id="audit-entity"
            label="রেকর্ডের ধরন"
            value={params.category ?? ''}
            placeholder="সব রেকর্ড"
            options={Object.entries(ENTITY_LABELS).map(([value, item]) => ({
              value,
              label: item.label,
            }))}
            param="category"
            searchParams={resolvedSearchParams}
          />
          <ClearFilters searchParams={clearParams} />
        </div>
      </div>

      <AdminTable
        columns={columns}
        rows={result.rows}
        getKey={(event) => event.id}
        getHref={(event) => ENTITY_LABELS[event.entity_table]?.href}
        caption="অ্যাডমিন অডিট ইভেন্ট"
        empty={
          <AdminEmpty
            title="এখনো কোনো অডিট রেকর্ড নেই"
            description="অ্যাডমিনের তৈরি বা পরিবর্তিত রেকর্ড এখানে দেখা যাবে।"
            icon={<Activity className="h-5 w-5" aria-hidden="true" />}
          />
        }
      />
      <TablePager
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        searchParams={resolvedSearchParams}
      />
    </>
  );
}
