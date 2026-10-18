import { fetchVehicleRequests, parseListParams } from '@/lib/admin/queries';
import { getAllMCCAreas } from '@/lib/locations';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable';
import { TablePager } from '@/components/admin/TablePager';
import { AdminSearch, ClearFilters } from '@/components/admin/AdminSearch';
import { FilterNav } from '@/components/admin/FilterNav';
import { AdminError, AdminEmpty } from '@/components/admin/States';
import { StatusPill } from '@/components/admin/StatCard';
import { StatCard } from '@/components/admin/StatCard';
import { formatDate, lookupStatus, STATUS_OPTIONS } from '@/lib/admin/format';
import type { AdminVehicleRequestRow } from '@/lib/admin/queries';
import { fetchVehicleRequestCounts } from '@/lib/admin/queries';
import VehicleRequestActions from '@/components/admin/VehicleRequestActions';
import Link from 'next/link';
import { DateRangeFilter } from '@/components/admin/DateRangeFilter';

export const dynamic = 'force-dynamic';

const KIND_LABEL: Record<string, string> = {
  'গাড়ি': 'গাড়ি',
  'অটো': 'অটো',
  CNG: 'CNG',
};

const columns: AdminColumn<AdminVehicleRequestRow>[] = [
  {
    key: 'id',
    header: 'রিকোয়েস্ট আইডি',
    hideOnMobile: true,
    render: (row) => <span className="font-mono text-[11px] text-ink-500">{row.id.slice(0, 8)}</span>,
  },
  {
    key: 'vehicle',
    header: 'নির্বাচিত যানবাহন',
    mobilePrimary: true,
    render: (row) => (
      <span className="block">
        {row.vehicle_title && row.vehicle_slug && row.vehicle_is_active ? (
          <Link href={`/gari-auto-cng/${row.vehicle_slug}`} className="block font-semibold text-brand-700 hover:underline" onClick={(event) => event.stopPropagation()}>
            {row.vehicle_title}
          </Link>
        ) : row.vehicle_title && row.vehicle_listing_id ? (
          <Link href={`/admin/directories/vehicle/${row.vehicle_listing_id}/edit`} className="block font-semibold text-admin-text hover:underline" onClick={(event) => event.stopPropagation()}>
            {row.vehicle_title} <span className="text-xs font-normal text-admin-muted">(অপ্রকাশিত)</span>
          </Link>
        ) : (
          <span className="block font-semibold">{row.vehicle_name || KIND_LABEL[row.vehicle_kind] || row.vehicle_kind}</span>
        )}
        <span className="mt-0.5 block text-xs text-ink-400">
          {row.vehicle_title ? `${row.vehicle_listing_kind ?? 'তালিকায় ধরন উল্লেখ নেই'} · ` : 'তালিকা আর উপলভ্য নয় · '}
          {row.pickup_area_id || '—'} → {row.destination_area_id || '—'}
        </span>
      </span>
    ),
  },
  {
    key: 'contact',
    header: 'যোগাযোগ',
    render: (row) => (
      <span className="block">
        <span className="block">{row.customer_full_name || row.contact_name}</span>
        <span className="block text-xs text-ink-400">{row.contact_phone}</span>
      </span>
    ),
  },
  {
    key: 'trip',
    header: 'যাত্রার তথ্য',
    render: (row) => (
      <span className="block text-xs text-ink-600">
        <span className="block">{formatDate(row.travel_date)}{row.travel_time ? ` · ${row.travel_time}` : ''}</span>
        <span className="mt-0.5 block text-[11px] text-ink-400">
          {row.passenger_count ? `${row.passenger_count} জন` : 'যাত্রী উল্লেখ নেই'}
          {row.trip_duration ? ` · ${row.trip_duration}` : ''}
        </span>
      </span>
    ),
  },
  {
    key: 'estimate',
    header: 'দূরত্ব / আনুমানিক ভাড়া',
    render: (row) => (
      <span className="block text-xs text-ink-600">
        <span>{row.estimated_distance_km != null ? `${row.estimated_distance_km.toLocaleString('bn-BD')} কিমি${row.distance_source === 'manual_estimate' ? ' · ম্যানুয়াল' : ''}` : 'দূরত্ব নেই'}</span>
        <span className="block text-ink-400">
          {row.estimated_fare != null ? `৳${row.estimated_fare.toLocaleString('bn-BD')} (আনুমানিক)` : 'ভাড়া কোটেশন লাগবে'}
        </span>
        {row.additional_fee != null && row.additional_fee > 0 && <span className="block text-[10px] text-ink-400">অতিরিক্ত চার্জ ৳{row.additional_fee.toLocaleString('bn-BD')}</span>}
      </span>
    ),
  },
  {
    key: 'budget',
    header: 'বাজেট',
    hideOnMobile: true,
    render: (row) => <span className="text-xs text-ink-500">{row.budget ? `৳${row.budget}` : '—'}</span>,
  },
  {
    key: 'notes',
    header: 'অতিরিক্ত তথ্য',
    hideOnMobile: true,
    render: (row) => (
      <span className="block max-w-xs whitespace-pre-line text-xs text-ink-500">
        {row.notes || '—'}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'স্ট্যাটাস',
    render: (row) => {
      const status = lookupStatus(row.status);
      return <StatusPill label={status.label} tone={status.tone} />;
    },
  },
  {
    key: 'actions',
    header: '',
    headerClassName: 'w-1',
    render: (row) => <VehicleRequestActions request={row} />,
  },
];

export default async function AdminVehicleRequestsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const params = parseListParams(resolvedSearchParams, { pageSize: 20 });
  const [result, summary] = await Promise.all([
    fetchVehicleRequests(params),
    fetchVehicleRequestCounts(),
  ]);

  if (result.unavailable) {
    return (
      <>
        <PageHeader
          title="যানবাহন বুকিং অনুরোধ"
          description="গাড়ি, অটো ও সিএনজি ভাড়ার অনুরোধ। রিকোয়েস্টের অবস্থা বুকিং বা পেমেন্ট নিশ্চিত করে না."
        />
        <AdminError
          title="যানবাহন অনুরোধ লোড করা যায়নি"
          message={result.error ?? 'Supabase ডেটাবেজ কনফিগারেশন ও অনুমতি যাচাই করুন।'}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="যানবাহন বুকিং অনুরোধ"
        description="গাড়ি, অটো ও সিএনজি ভাড়ার অনুরোধ পর্যালোচনা করুন। স্ট্যাটাস পরিবর্তন করলেই বুকিং, পেমেন্ট বা চালক নিশ্চিত হয় না।"
        count={`মোট ${result.total} টি রিকোয়েস্ট`}
        actions={
          <Link
            href="/admin/directories/vehicle"
            className="inline-flex min-h-11 items-center rounded-md border border-admin-border bg-white px-3 text-sm font-semibold"
          >
            যানবাহন ভাড়ার তালিকা
          </Link>
        }
      />

      {summary.error ? (
        <AdminError title="সারাংশ লোড করা যায়নি" message={summary.error} className="mb-4" />
      ) : (
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-7">
          <StatCard label="মোট রিকোয়েস্ট" value={summary.counts.total} />
          <StatCard label="নতুন" value={summary.counts.new} tone="attention" />
          <StatCard label="পর্যালোচনায়" value={summary.counts.reviewing} />
          <StatCard label="যোগাযোগ নথিভুক্ত" value={summary.counts.contacted} tone="good" />
          <StatCard label="অনুমোদিত" value={summary.counts.approved} tone="good" />
          <StatCard label="প্রত্যাখ্যাত" value={summary.counts.rejected} />
          <StatCard label="বন্ধ (বুকিং নয়)" value={summary.counts.closed} />
        </div>
      )}

      <div className="mb-5 grid min-w-0 grid-cols-1 gap-3 rounded-admin-card border border-admin-border bg-white p-3 sm:grid-cols-2 xl:grid-cols-12">
        <div className="min-w-0 sm:col-span-2 xl:col-span-3">
          <AdminSearch placeholder="রিকোয়েস্ট আইডি, নাম, নম্বর বা গাড়ির নাম…" />
        </div>
        <div className="min-w-0 xl:col-span-2">
          <FilterNav
            id="vehicle-request-status"
            label="স্ট্যাটাস"
            value={String(params.status ?? '')}
            placeholder="সব স্ট্যাটাস"
            options={STATUS_OPTIONS.vehicle_requests}
            param="status"
            searchParams={resolvedSearchParams}
          />
        </div>
        <div className="min-w-0 xl:col-span-2">
          <FilterNav
            id="vehicle-request-kind"
            label="যানবাহন"
            value={String(params.kind ?? '')}
            placeholder="সব ধরন"
            options={[
              { value: 'গাড়ি', label: 'গাড়ি' },
              { value: 'অটো', label: 'অটো' },
              { value: 'CNG', label: 'CNG' },
            ]}
            param="kind"
            searchParams={resolvedSearchParams}
          />
        </div>
        <div className="min-w-0 xl:col-span-2">
          <FilterNav
            id="vehicle-request-area"
            label="পিকআপ / গন্তব্য এলাকা"
            value={String(params.area ?? '')}
            placeholder="সব এলাকা"
            options={getAllMCCAreas({ activeOnly: true }).map(({ id, nameBn }) => ({ value: id, label: nameBn }))}
            param="area"
            searchParams={resolvedSearchParams}
          />
        </div>
        <div className="min-w-0 sm:col-span-2 xl:col-span-3">
          <DateRangeFilter />
        </div>
        <div className="flex items-end sm:col-span-2 xl:col-span-12">
          <ClearFilters searchParams={resolvedSearchParams} />
        </div>
      </div>

      {result.rows.length === 0 ? (
        <div className="flex min-h-64 items-center justify-center">
          <AdminEmpty
            title="কোনো রিকোয়েস্ট পাওয়া যায়নি"
            description="নতুন রিকোয়েস্ট এলে এখানে দেখা যাবে।"
            className="w-full"
          />
        </div>
      ) : (
        <AdminTable
          columns={columns}
          rows={result.rows}
          getKey={(row) => row.id}
          getHref={(row) => `/admin/vehicle-requests/${row.id}`}
          caption="গাড়ি রিকোয়েস্টের তালিকা"
        />
      )}

      <TablePager
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        searchParams={resolvedSearchParams}
      />
    </>
  );
}