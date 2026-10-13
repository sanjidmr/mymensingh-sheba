import Image from 'next/image';
import Link from 'next/link';
import { ClipboardList } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable';
import { TablePager } from '@/components/admin/TablePager';
import { AdminSearch, ClearFilters } from '@/components/admin/AdminSearch';
import { FilterNav } from '@/components/admin/FilterNav';
import { DateRangeFilter } from '@/components/admin/DateRangeFilter';
import { AdminEmpty, AdminError } from '@/components/admin/States';
import { StatusPill } from '@/components/admin/StatCard';
import { formatDateTime, lookupStatus, STATUS_OPTIONS } from '@/lib/admin/format';
import { fetchTutorRequests, parseListParams, type AdminTutorRequestListRow } from '@/lib/admin/queries';

export const dynamic = 'force-dynamic';

function isTutorId(value: string | null): value is string {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value));
}

const columns: AdminColumn<AdminTutorRequestListRow>[] = [
  {
    key: 'request',
    header: 'অনুরোধ',
    mobilePrimary: true,
    render: (row) => (
      <span className="block min-w-0">
        <span className="block break-words font-semibold">{row.service_type || row.profile_title || 'গৃহশিক্ষক অনুরোধ'}</span>
        <span className="mt-0.5 block break-all font-mono text-[10px] text-admin-muted">{row.id}</span>
        <span className="mt-0.5 block text-xs text-admin-muted">{row.details || 'বিস্তারিত বার্তা নেই'}</span>
      </span>
    ),
  },
  {
    key: 'tutor',
    header: 'নির্দিষ্ট টিউটর',
    render: (row) => isTutorId(row.profile_id) ? (
      <Link href={`/admin/verifications/${row.profile_id}`} className="flex min-w-0 items-center gap-2 text-admin-navy hover:underline">
        <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-admin-page">
          {row.tutor_photo_url && <Image src={row.tutor_photo_url} alt="" fill sizes="36px" unoptimized className="object-cover" />}
        </span>
        <span className="min-w-0">
          <span className="block break-words text-xs font-semibold">{row.tutor_name || row.profile_title || 'টিউটর প্রোফাইল'}</span>
          <span className="block break-all font-mono text-[10px] text-admin-muted">{row.profile_id}</span>
        </span>
      </Link>
    ) : <span className="text-xs text-admin-muted">{row.profile_title || 'প্রোফাইল আইডি নেই'}</span>,
  },
  {
    key: 'requester',
    header: 'আবেদনকারী',
    render: (row) => <span className="block text-xs"><span className="block font-semibold">{row.contact_name || '—'}</span><span className="block text-admin-muted">{row.contact_phone || '—'}</span></span>,
  },
  { key: 'area', header: 'এলাকা', hideOnMobile: true, render: (row) => row.area_id || '—' },
  {
    key: 'status',
    header: 'অবস্থা',
    render: (row) => {
      const status = lookupStatus(row.status);
      return <StatusPill label={status.label} tone={status.tone} />;
    },
  },
  { key: 'date', header: 'জমার সময়', hideOnMobile: true, render: (row) => <span className="text-xs text-admin-muted">{formatDateTime(row.created_at)}</span> },
];

export default async function AdminTutorRequestsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await searchParams;
  const params = parseListParams(resolved, { pageSize: 20 });
  const result = await fetchTutorRequests(params);

  return (
    <>
      <PageHeader
        title="টিউটর অনুরোধ ও আবেদন"
        description="গৃহশিক্ষক প্রোফাইলের বিস্তারিত পৃষ্ঠা থেকে জমা হওয়া প্রকৃত service_requests পর্যালোচনা করুন। অবস্থা পরিবর্তন যোগাযোগ সম্পন্ন হয়েছে এমন দাবি করে না।"
        count={`মোট ${result.total.toLocaleString('bn-BD')} টি অনুরোধ`}
        actions={<Link href="/admin/verifications" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-admin-border bg-white px-3 text-xs font-semibold text-admin-text"><ClipboardList className="h-4 w-4" />টিউটর প্রোফাইল</Link>}
      />
      {result.unavailable ? (
        <AdminError title="টিউটর অনুরোধ লোড করা যায়নি" message={result.error} />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
            <AdminSearch placeholder="আবেদনকারী, ফোন, টিউটর বা বার্তা খুঁজুন…" className="sm:max-w-md" />
            <FilterNav
              id="tutor-request-status"
              label="অনুরোধের অবস্থা"
              value={String(params.status ?? '')}
              placeholder="সব অবস্থা"
              options={STATUS_OPTIONS.service_requests}
              param="status"
              searchParams={resolved}
            />
            <DateRangeFilter />
            <ClearFilters searchParams={resolved} />
          </div>
          <AdminTable
            columns={columns}
            rows={result.rows}
            getKey={(row) => row.id}
            getHref={(row) => `/admin/tutor-requests/${row.id}`}
            caption="গৃহশিক্ষক অনুরোধের তালিকা"
            empty={<AdminEmpty title="কোনো টিউটর অনুরোধ নেই" description="এই ֆիլ্টারে কোনো বাস্তব রেকর্ড মেলেনি।" icon={<ClipboardList className="h-5 w-5" />} />}
          />
          <TablePager page={result.page} pageSize={result.pageSize} total={result.total} searchParams={resolved} />
        </>
      )}
    </>
  );
}
