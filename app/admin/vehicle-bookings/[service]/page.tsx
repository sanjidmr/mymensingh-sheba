import { notFound } from 'next/navigation';
import { CalendarClock, MapPin, Phone } from 'lucide-react';
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable';
import { AdminEmpty, AdminError } from '@/components/admin/States';
import { PageHeader } from '@/components/admin/PageHeader';
import { TablePager } from '@/components/admin/TablePager';
import { AdminSearch, ClearFilters } from '@/components/admin/AdminSearch';
import { FilterNav } from '@/components/admin/FilterNav';
import VehicleBookingStatus from '@/components/admin/VehicleBookingStatus';
import { fetchVehicleBookings, parseListParams, type AdminVehicleBookingRow } from '@/lib/admin/queries';
import { formatDateTime } from '@/lib/admin/format';

export const dynamic = 'force-dynamic';

const SERVICE_LABELS = {
  auto: { title: 'অটো বুকিং অনুরোধ', short: 'অটো' },
  cng: { title: 'CNG বুকিং অনুরোধ', short: 'CNG' },
} as const;

const STATUS_FILTERS = [
  { value: 'pending', label: 'অপেক্ষমাণ' },
  { value: 'confirmed', label: 'নিশ্চিত' },
  { value: 'completed', label: 'সম্পন্ন' },
  { value: 'cancelled', label: 'বাতিল' },
];

export default async function VehicleBookingsAdminPage({
  params: routeParams,
  searchParams,
}: {
  params: Promise<{ service: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { service } = await routeParams;
  if (service !== 'auto' && service !== 'cng') notFound();
  const config = SERVICE_LABELS[service];
  const resolvedSearchParams = await searchParams;
  const params = parseListParams(resolvedSearchParams, { pageSize: 20 });
  const result = await fetchVehicleBookings(service, params);

  const columns: AdminColumn<AdminVehicleBookingRow>[] = [
    {
      key: 'customer',
      header: 'যাত্রী ও যোগাযোগ',
      mobilePrimary: true,
      render: (row) => (
        <span className="block">
          <span className="block font-semibold">{row.passenger_name}</span>
          <a href={`tel:${row.mobile_number}`} className="mt-1 inline-flex min-h-8 items-center gap-1.5 text-xs font-semibold text-brand-700 hover:underline">
            <Phone className="h-3.5 w-3.5" aria-hidden="true" /> {row.mobile_number}
          </a>
          <span className="block text-xs text-admin-muted">{row.current_address}</span>
        </span>
      ),
    },
    {
      key: 'route',
      header: 'যাত্রাপথ',
      render: (row) => (
        <span className="block min-w-36 text-xs leading-5 text-admin-text">
          <span className="inline-flex items-start gap-1.5"><MapPin className="mt-1 h-3.5 w-3.5 shrink-0 text-admin-muted" />{row.pickup_location}</span>
          <span className="block px-5 text-admin-muted">↓</span>
          <span className="inline-flex items-start gap-1.5"><MapPin className="mt-1 h-3.5 w-3.5 shrink-0 text-admin-muted" />{row.destination}</span>
        </span>
      ),
    },
    {
      key: 'requested',
      header: 'যাত্রার সময়',
      render: (row) => <span className="inline-flex items-start gap-1.5 text-xs"><CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-admin-muted" />{formatDateTime(row.requested_at)}</span>,
    },
    {
      key: 'notes',
      header: 'অতিরিক্ত তথ্য',
      render: (row) => <span className="block max-w-56 whitespace-pre-line text-xs text-admin-muted">{row.additional_info || '—'}</span>,
    },
    {
      key: 'submitted',
      header: 'জমা দেওয়ার সময়',
      render: (row) => <span className="text-xs text-admin-muted">{formatDateTime(row.created_at)}</span>,
    },
    {
      key: 'status',
      header: 'অবস্থা',
      render: (row) => <VehicleBookingStatus booking={row} />,
    },
  ];

  return (
    <>
      <PageHeader
        title={config.title}
        description={`${config.short} ভাড়ার অনুরোধ, যাত্রাপথ ও যোগাযোগের তথ্য দেখুন।`}
        count={`এই পাতায় ${result.total.toLocaleString('bn-BD')} টি অনুরোধ`}
      />
      {result.unavailable ? (
        <AdminError title="বুকিং অনুরোধ লোড করা যায়নি" message={result.error} />
      ) : (
        <>
          <div className="mb-4 grid grid-cols-1 gap-2 rounded-admin-card border border-admin-border bg-white p-3 sm:grid-cols-3">
            <AdminSearch placeholder="নাম, নম্বর বা এলাকা খুঁজুন…" />
            <FilterNav
              id={`${service}-booking-status`}
              label="বুকিংয়ের অবস্থা"
              value={params.status ?? ''}
              placeholder="সব অবস্থা"
              options={STATUS_FILTERS}
              param="status"
              searchParams={resolvedSearchParams}
            />
            <div className="flex items-center"><ClearFilters searchParams={resolvedSearchParams} /></div>
          </div>
          <AdminTable
            columns={columns}
            rows={result.rows}
            getKey={(row) => row.id}
            caption={`${config.title} তালিকা`}
            empty={<AdminEmpty title={`কোনো ${config.short} বুকিং অনুরোধ নেই`} description="নতুন অনুরোধ এলে এখানে দেখা যাবে।" />}
          />
          <TablePager page={result.page} pageSize={result.pageSize} total={result.total} searchParams={resolvedSearchParams} />
        </>
      )}
    </>
  );
}
