import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable';
import { AdminSearch, ClearFilters } from '@/components/admin/AdminSearch';
import { FilterNav } from '@/components/admin/FilterNav';
import { AdminEmpty, AdminError } from '@/components/admin/States';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard, StatusPill } from '@/components/admin/StatCard';
import { TablePager } from '@/components/admin/TablePager';
import ServiceListingActions from '@/components/admin/ServiceListingActions';
import { fetchServiceListings, parseListParams, type AdminServiceListingRow } from '@/lib/admin/queries';
import { COACHING_CATEGORIES, COACHING_CLASSES, COACHING_SUBJECTS, VEHICLE_KINDS } from '@/lib/catalog-types';
import { getAllMCCAreas } from '@/lib/locations';

export const dynamic = 'force-dynamic';

const LABELS = {
  vehicle: 'যানবাহন',
  bus: 'বাস টিকিট তথ্য',
  wifi: 'WiFi প্রদানকারী',
  coaching: 'কোচিং সেন্টার',
} as const;

const PUBLIC_PATH = {
  vehicle: '/gari-auto-cng',
  bus: '/bus-ticket',
  wifi: '/wifi',
  coaching: '/coaching',
} as const;

function categoryColumns(category: keyof typeof LABELS): AdminColumn<AdminServiceListingRow>[] {
  const columns: AdminColumn<AdminServiceListingRow>[] = [
    {
      key: 'title',
      header: 'নাম / শিরোনাম',
      mobilePrimary: true,
      render: (row) => (
        <span className="block min-w-0">
          <span className="block break-words font-semibold">{row.title_bn}</span>
        <span className="block font-mono text-[10px] font-bold text-brand-700">আইডি: {row.public_id}</span>
        <span className="block break-all font-mono text-[10px] text-admin-muted">{row.slug}</span>
        </span>
      ),
    },
  ];
  if (category === 'vehicle') {
    columns.push({
      key: 'vehicle',
      header: 'গাড়ির তথ্য',
      render: (row) => (
        <span className="block min-w-0">
          <span className="block">{row.model_name_bn || 'মডেল উল্লেখ নেই'} · {row.seat_count ?? '—'} আসন</span>
          {row.driver_name_bn && <span className="block text-xs text-admin-muted">চালক: {row.driver_name_bn}</span>}
        </span>
      ),
    });
    columns.push({
      key: 'price',
      header: 'ভাড়া (তথ্যসূত্র)',
      render: (row) => row.rate_per_km != null
        ? `৳${row.rate_per_km.toLocaleString('bn-BD', { maximumFractionDigits: 2 })}/কিমি${row.minimum_fare != null ? ` · সর্বনিম্ন ৳${row.minimum_fare.toLocaleString('bn-BD')}` : ''}${row.additional_fee ? ` · অতিরিক্ত ৳${row.additional_fee.toLocaleString('bn-BD')}` : ''}`
        : row.price_min != null
        ? `৳${row.price_min}${row.price_max != null ? `–${row.price_max}` : '+'}${row.price_note_bn ? ` · ${row.price_note_bn}` : ''}`
        : 'উল্লেখ নেই',
    });
  } else if (category === 'bus') {
    columns.push({ key: 'route', header: 'রুট', render: (row) => `${row.origin_bn || '—'} → ${row.destination_bn || '—'}` });
    columns.push({
      key: 'fare',
      header: 'ভাড়া (তথ্যসূত্র)',
      render: (row) => row.fare_min != null ? `৳${row.fare_min}${row.fare_max != null ? `–${row.fare_max}` : '+'}` : 'উল্লেখ নেই',
    });
  } else if (category === 'wifi') {
    columns.push({ key: 'speed', header: 'স্পিড', render: (row) => row.speed_mbps != null ? `${row.speed_mbps} Mbps` : 'উল্লেখ নেই' });
    columns.push({
      key: 'price',
      header: 'মাসিক মূল্য (তথ্যসূত্র)',
      render: (row) => row.price_min != null ? `৳${row.price_min}${row.price_max != null ? `–${row.price_max}` : '+'}` : 'উল্লেখ নেই',
    });
  } else {
    columns.push({
      key: 'fees',
      header: 'মাসিক ফি (তথ্যসূত্র)',
      render: (row) => row.monthly_fee_min != null ? `৳${row.monthly_fee_min}${row.monthly_fee_max != null ? `–${row.monthly_fee_max}` : '+'}` : 'উল্লেখ নেই',
    });
    columns.push({ key: 'programs', header: 'বিষয়/ক্লাস', render: (row) => row.tags.slice(0, 4).join(', ') || 'উল্লেখ নেই' });
    columns.push({
      key: 'coaching_category',
      header: 'কোচিং ক্যাটাগরি',
      render: (row) => COACHING_CATEGORIES.find((item) => item.id === row.coaching_category)?.labelBn || 'উল্লেখ নেই',
    });
  }
  columns.push({
    key: 'review',
    header: 'অনুমোদন',
    render: (row) => row.owner_id
      ? <StatusPill label={{
          draft: 'জমা দেওয়া হয়নি',
          pending: 'অনুমোদন অপেক্ষমাণ',
          approved: 'অনুমোদিত',
          rejected: 'প্রত্যাখ্যাত',
        }[row.status]} tone={row.status === 'approved' ? 'success' : row.status === 'rejected' ? 'danger' : 'neutral'} />
      : <StatusPill label="অ্যাডমিন-তৈরি" tone="neutral" />,
  });
  columns.push({
    key: 'active',
    header: 'প্রকাশনা',
    render: (row) => {
      const published = row.is_active && row.status === 'approved';
      return <StatusPill label={published ? 'প্রকাশিত' : row.owner_id && row.status === 'pending' ? 'অনুমোদন অপেক্ষমাণ' : 'অপ্রকাশিত'} tone={published ? 'success' : 'neutral'} />;
    },
  });
  columns.push({
    key: 'actions',
    header: 'অ্যাকশন',
    render: (row) => <ServiceListingActions row={row} />,
  });
  return columns;
}

export default async function AdminServiceListingsByCategoryPage({
  params: routeParams,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { category: rawCategory } = await routeParams;
  if (!Object.hasOwn(LABELS, rawCategory)) notFound();
  const category = rawCategory as keyof typeof LABELS;
  const resolvedSearchParams = await searchParams;
  const params = parseListParams(resolvedSearchParams, { pageSize: 20 });
  const result = await fetchServiceListings(params, category);
  if (result.unavailable) {
    return (
      <>
        <PageHeader title={LABELS[category]} breadcrumb={{ href: '/admin', label: 'অ্যাডমিন' }} />
        <AdminError title="তালিকা লোড করা যায়নি" message={result.error} />
      </>
    );
  }
  const taxonomies = category === 'coaching'
    ? [...COACHING_CLASSES, ...COACHING_SUBJECTS, ...COACHING_CATEGORIES]
    : category === 'bus'
      ? [
          { id: 'ac', labelBn: 'এসি' },
          { id: 'non-ac', labelBn: 'নন-এসি' },
          { id: 'sleeper', labelBn: 'স্লিপার' },
          { id: 'sitting', labelBn: 'সিটিং' },
        ]
      : category === 'vehicle'
        ? VEHICLE_KINDS.map((id) => ({ id, labelBn: id }))
        : [];
  const areaOptions = getAllMCCAreas({ activeOnly: true }).map(({ id, nameBn }) => ({ value: id, label: nameBn }));

  return (
    <>
      <PageHeader
        title={LABELS[category]}
        description={category === 'bus'
          ? 'এটি অপারেটরের তথ্য ডিরেক্টরি—টিকিট বুকিং, আসন, পেমেন্ট বা রিজার্ভেশন এই মডিউল পরিচালনা করে না।'
          : 'প্রকৃত সরবরাহকৃত তথ্য পরিচালনা করুন। সক্রিয় অবস্থা প্রকাশনা বোঝায়; আলাদা যাচাইকরণ ক্ষেত্র এই স্কিমায় নেই।'}
        breadcrumb={{ href: '/admin', label: 'অ্যাডমিন' }}
        count={`ফিল্টার করা ${result.total} টি তালিকা`}
        actions={
          <>
            {category === 'vehicle' && <Link href="/admin/vehicle-requests" className="inline-flex min-h-11 items-center rounded-md border border-admin-border px-3 text-sm font-semibold">যানবাহন রিকোয়েস্ট</Link>}
            <Link href={`/admin/directories/${category}/new`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-admin-navy px-4 text-sm font-semibold text-white">
              <Plus className="h-4 w-4" aria-hidden="true" />নতুন তালিকা
            </Link>
          </>
        }
      />
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="মোট তালিকা" value={result.counts.total} />
        <StatCard label="প্রকাশিত" value={result.counts.active} tone="good" />
        <StatCard label="অপ্রকাশিত" value={result.counts.inactive} />
      </div>
      <div className="mb-4 grid grid-cols-1 gap-2 rounded-admin-card border border-admin-border bg-white p-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminSearch placeholder="নাম, বিবরণ বা রুট খুঁজুন…" />
        <FilterNav id={`${category}-status`} label="অবস্থা" value={typeof params.status === 'string' ? params.status : ''} placeholder="সব অবস্থা" options={[
          { value: 'pending', label: 'অনুমোদন অপেক্ষমাণ' },
          { value: 'approved', label: 'অনুমোদিত' },
          { value: 'rejected', label: 'প্রত্যাখ্যাত' },
          { value: 'draft', label: 'জমা দেওয়া হয়নি' },
          { value: 'active', label: 'প্রকাশিত' },
          { value: 'inactive', label: 'অপ্রকাশিত' },
        ]} param="status" searchParams={resolvedSearchParams} />
        <FilterNav id={`${category}-area`} label="এলাকা" value={typeof params.area === 'string' ? params.area : ''} placeholder="সব এলাকা" options={areaOptions} param="area" searchParams={resolvedSearchParams} />
        {taxonomies.length > 0 && <FilterNav id={`${category}-type`} label={category === 'bus' ? 'বাসের ধরন' : 'ক্লাস/বিষয়'} value={typeof params.kind === 'string' ? params.kind : ''} placeholder="সব ধরন" options={taxonomies.map(({ id, labelBn }) => ({ value: id, label: labelBn }))} param="kind" searchParams={resolvedSearchParams} />}
        <div className="sm:col-span-2 lg:col-span-4"><ClearFilters searchParams={resolvedSearchParams} /></div>
      </div>
      <AdminTable
        columns={categoryColumns(category)}
        rows={result.rows}
        getKey={(row) => row.id}
        caption={`${LABELS[category]} তালিকা`}
        empty={<AdminEmpty title="কোনো তালিকা পাওয়া যায়নি" description="সার্চ বা ফিল্টার পরিবর্তন করুন, অথবা নতুন তালিকা যোগ করুন।" />}
      />
      <TablePager page={result.page} pageSize={result.pageSize} total={result.total} searchParams={resolvedSearchParams} />
      <p className="mt-3 text-xs text-admin-muted">
        <Link href={`${PUBLIC_PATH[category]}`} target="_blank" className="font-semibold text-admin-navy underline">পাবলিক ডিরেক্টরি দেখুন</Link>
      </p>
    </>
  );
}
