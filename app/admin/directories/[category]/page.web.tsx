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
import { COACHING_CATEGORIES, COACHING_CLASSES, COACHING_SUBJECTS } from '@/lib/catalog-types';
import { getAllMCCAreas } from '@/lib/locations';
import { fetchAdminEngagementAnalytics } from '@/lib/admin/queries';

export const dynamic = 'force-dynamic';

const LABELS = {
  wifi: 'WiFi প্রদানকারী',
  coaching: 'কোচিং সেন্টার',
} as const;

const PUBLIC_PATH = {
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
        <span className="block font-mono text-[10px] font-bold text-brand-700">আইডি: {row.public_code ?? row.public_id}</span>
        <span className="block break-all font-mono text-[10px] text-admin-muted">{row.slug}</span>
        </span>
      ),
    },
  ];
  if (category === 'wifi') {
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
    key: 'engagement',
    header: 'ভিউ / কল চাপ',
    render: (row) => (
      <span className="whitespace-nowrap text-xs text-admin-muted">
        {row.views == null ? '—' : row.views.toLocaleString('bn-BD')} / {row.call_clicks == null ? '—' : row.call_clicks.toLocaleString('bn-BD')}
      </span>
    ),
  });
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

export function generateStaticParams() {
  return [{ "category": '__app_dynamic__' }];
}

export default async function AdminServiceListingsByCategoryPage({
  params: routeParams,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { category: rawCategory } = await routeParams;
  if (!Object.prototype.hasOwnProperty.call(LABELS, rawCategory)) notFound();
  const category = rawCategory as keyof typeof LABELS;
  const resolvedSearchParams = await searchParams;
  const params = parseListParams(resolvedSearchParams, { pageSize: 20 });
  const [result, analytics] = await Promise.all([
    fetchServiceListings(params, category),
    fetchAdminEngagementAnalytics(category),
  ]);
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
    : [];
  const areaOptions = getAllMCCAreas({ activeOnly: true }).map(({ id, nameBn }) => ({ value: id, label: nameBn }));
  const rows = result.rows.map((row) => ({
    ...row,
    views: analytics.error ? null : analytics.profiles[row.slug]?.views ?? 0,
    call_clicks: analytics.error ? null : analytics.profiles[row.slug]?.callClicks ?? 0,
  }));

  return (
    <>
      <PageHeader
        title={LABELS[category]}
        description="প্রকৃত সরবরাহকৃত তথ্য পরিচালনা করুন। সক্রিয় অবস্থা প্রকাশনা বোঝায়; আলাদা যাচাইকরণ ক্ষেত্র এই স্কিমায় নেই।"
        breadcrumb={{ href: '/admin', label: 'অ্যাডমিন' }}
        count={`ফিল্টার করা ${result.total} টি তালিকা`}
        actions={
          <Link href={`/admin/directories/${category}/new`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-admin-navy px-4 text-sm font-semibold text-white">
            <Plus className="h-4 w-4" aria-hidden="true" />নতুন তালিকা
          </Link>
        }
      />
      {analytics.error && <AdminError title="অ্যানালিটিক্স লোড করা যায়নি" message={analytics.error} className="mb-4" />}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard label="ডিরেক্টরি ভিজিট" value={analytics.error ? '—' : analytics.directoryVisits} />
        <StatCard label="মোট ভিউ" value={analytics.error ? '—' : analytics.profileViews} />
        <StatCard label="কল বাটন চাপা" value={analytics.error ? '—' : analytics.callClicks} tone="good" />
        <StatCard label="মোট তালিকা" value={result.counts.total} />
        <StatCard label="প্রকাশিত" value={result.counts.active} tone="good" />
        <StatCard label="অপ্রকাশিত" value={result.counts.inactive} />
      </div>
      <div className="mb-4 grid grid-cols-1 gap-2 rounded-admin-card border border-admin-border bg-white p-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminSearch placeholder="নাম বা বিবরণ খুঁজুন…" />
        <FilterNav id={`${category}-status`} label="অবস্থা" value={typeof params.status === 'string' ? params.status : ''} placeholder="সব অবস্থা" options={[
          { value: 'pending', label: 'অনুমোদন অপেক্ষমাণ' },
          { value: 'approved', label: 'অনুমোদিত' },
          { value: 'rejected', label: 'প্রত্যাখ্যাত' },
          { value: 'draft', label: 'জমা দেওয়া হয়নি' },
          { value: 'active', label: 'প্রকাশিত' },
          { value: 'inactive', label: 'অপ্রকাশিত' },
        ]} param="status" searchParams={resolvedSearchParams} />
        <FilterNav id={`${category}-area`} label="এলাকা" value={typeof params.area === 'string' ? params.area : ''} placeholder="সব এলাকা" options={areaOptions} param="area" searchParams={resolvedSearchParams} />
        {taxonomies.length > 0 && <FilterNav id={`${category}-type`} label="ক্লাস/বিষয়" value={typeof params.kind === 'string' ? params.kind : ''} placeholder="সব ধরন" options={taxonomies.map(({ id, labelBn }) => ({ value: id, label: labelBn }))} param="kind" searchParams={resolvedSearchParams} />}
        <div className="sm:col-span-2 lg:col-span-4"><ClearFilters searchParams={resolvedSearchParams} /></div>
      </div>
      <AdminTable
        columns={categoryColumns(category)}
        rows={rows}
        getKey={(row) => row.id}
        compact
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
