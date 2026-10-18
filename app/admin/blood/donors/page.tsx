import Link from 'next/link';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable';
import { TablePager } from '@/components/admin/TablePager';
import { AdminSearch, ClearFilters } from '@/components/admin/AdminSearch';
import { FilterNav } from '@/components/admin/FilterNav';
import { AdminError, AdminEmpty } from '@/components/admin/States';
import { StatusPill } from '@/components/admin/StatCard';
import { formatDateTime } from '@/lib/admin/format';
import { fetchAdminBloodDonors, parseListParams, type AdminBloodDonorRow } from '@/lib/admin/queries';
import { getAllMCCAreas, getAreaById } from '@/lib/locations';

export const dynamic = 'force-dynamic';

const STATUS_LABELS: Record<string, string> = {
  draft: 'জমা দেওয়া হয়নি',
  pending_approval: 'পর্যালোচনায়',
  approved: 'অনুমোদিত',
  rejected: 'প্রত্যাখ্যাত',
  paused: 'বিরতিতে',
  suspended: 'স্থগিত',
};

function getStatusTone(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
  if (status === 'approved') return 'success';
  if (status === 'pending_approval') return 'warning';
  if (status === 'rejected' || status === 'suspended') return 'danger';
  return 'neutral';
}

const columns: AdminColumn<AdminBloodDonorRow>[] = [
  {
    key: 'name',
    header: 'রক্তদাতা',
    mobilePrimary: true,
    render: (row) => (
      <span className="block min-w-0">
        <span className="block truncate">{row.full_name}</span>
        <span className="mt-0.5 block text-xs font-normal text-ink-500">{row.id}</span>
      </span>
    ),
  },
  {
    key: 'phone',
    header: 'ফোন নম্বর',
    render: (row) => row.private_phone
      ? <a href={`tel:${row.private_phone}`} className="font-medium text-admin-navy hover:underline">{row.private_phone}</a>
      : 'নম্বর দেওয়া হয়নি',
  },
  { key: 'blood', header: 'রক্তের গ্রুপ', render: (row) => row.blood_group || 'উল্লেখ নেই' },
  {
    key: 'area',
    header: 'এলাকা',
    render: (row) => getAreaById(row.area_id)?.nameBn ?? row.area_id ?? 'উল্লেখ নেই',
  },
  {
    key: 'availability',
    header: 'উপলভ্যতা',
    render: (row) => row.is_available
      ? <StatusPill label="উপলভ্য" tone="success" />
      : <StatusPill label="উপলভ্য নন" tone="neutral" />,
  },
  {
    key: 'status',
    header: 'মডারেশন',
    render: (row) => <StatusPill label={STATUS_LABELS[row.status] ?? row.status} tone={getStatusTone(row.status)} />,
  },
  {
    key: 'created',
    header: 'জমার তারিখ',
    hideOnMobile: true,
    render: (row) => <span className="text-xs text-ink-500">{formatDateTime(row.created_at)}</span>,
  },
];

function DateRangeFilter({
  params,
  resolved,
}: {
  params: ReturnType<typeof parseListParams>;
  resolved: Record<string, string | string[] | undefined>;
}) {
  const preserved = Object.entries(resolved)
    .filter(([key]) => !['page', 'from', 'to'].includes(key));
  return (
    <form method="get" className="flex flex-wrap items-end gap-2">
      {preserved.flatMap(([key, value]) => {
        const values = Array.isArray(value) ? value : value === undefined ? [] : [value];
        return values.map((entry, index) => <input key={`${key}-${index}`} type="hidden" name={key} value={entry} />);
      })}
      <label className="grid gap-1 text-[11px] font-semibold text-admin-muted">
        জমার তারিখ থেকে
        <input className="min-h-10 rounded-lg border border-admin-border bg-white px-2 text-xs" type="date" name="from" defaultValue={String(params.from ?? '')} />
      </label>
      <label className="grid gap-1 text-[11px] font-semibold text-admin-muted">
        জমার তারিখ পর্যন্ত
        <input className="min-h-10 rounded-lg border border-admin-border bg-white px-2 text-xs" type="date" name="to" defaultValue={String(params.to ?? '')} />
      </label>
      <button className="min-h-10 rounded-lg bg-admin-navy px-3 text-xs font-semibold text-white" type="submit">তারিখ দেখুন</button>
    </form>
  );
}

export default async function AdminBloodDonorsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await searchParams;
  const params = parseListParams(resolved, { pageSize: 20 });
  const result = await fetchAdminBloodDonors(params);

  if (result.unavailable) {
    return (
      <>
        <PageHeader title="রক্তদাতা ব্যবস্থাপনা" description="রক্তদাতা প্রোফাইল ও উপলভ্যতা পর্যালোচনা করুন।" />
        <AdminError title="রক্তদাতা লোড করা যায়নি" message={result.error ?? 'অ্যাডমিন অনুমতি বা Supabase সংযোগ যাচাই করুন।'} />
      </>
    );
  }

  const cards = [
    { label: 'মোট রক্তদাতা', value: result.counts.total, href: '/admin/blood/donors', tone: 'text-admin-navy' },
    { label: 'পর্যালোচনায়', value: result.counts.pending, href: '/admin/blood/donors?status=pending_approval', tone: 'text-amber-700' },
    { label: 'অনুমোদিত', value: result.counts.approved, href: '/admin/blood/donors?status=approved', tone: 'text-emerald-700' },
    { label: 'প্রত্যাখ্যাত', value: result.counts.rejected, href: '/admin/blood/donors?status=rejected', tone: 'text-rose-700' },
    { label: 'উপলভ্য নন / বিরতিতে', value: result.counts.inactive, href: '/admin/blood/donors?status=inactive', tone: 'text-ink-600' },
  ];

  return (
    <>
      <PageHeader
        title="রক্তদাতা ব্যবস্থাপনা"
        description="অনুমোদিত তথ্য, মডারেশন, উপলভ্যতা ও ব্যক্তিগত ফোন নম্বর। ফোন নম্বর শুধু অনুমোদিত অ্যাডমিনরা দেখতে পান।"
      />

      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="rounded-admin-card border border-admin-border bg-white p-3 transition-colors hover:border-brand-300 sm:p-4">
            <span className="block text-xs font-medium text-admin-muted">{card.label}</span>
            <span className={`mt-1 block text-xl font-bold tabular-nums ${card.tone}`}>{card.value}</span>
          </Link>
        ))}
      </div>

      <div className="mb-4 grid gap-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <AdminSearch placeholder="নাম, আইডি, রক্তের গ্রুপ বা এলাকা খুঁজুন…" />
          <FilterNav id="donor-blood-group" label="রক্তের গ্রুপ" value={String(params.category ?? '')} placeholder="সব গ্রুপ"
            options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((group) => ({ value: group, label: group }))}
            param="category" searchParams={resolved} />
          <FilterNav id="donor-status" label="স্ট্যাটাস" value={String(params.status ?? '')} placeholder="সব স্ট্যাটাস"
            options={[
              { value: 'draft', label: 'জমা দেওয়া হয়নি' }, { value: 'pending_approval', label: 'পর্যালোচনায়' },
              { value: 'approved', label: 'অনুমোদিত' }, { value: 'rejected', label: 'প্রত্যাখ্যাত' },
              { value: 'paused', label: 'বিরতিতে' }, { value: 'suspended', label: 'স্থগিত' },
              { value: 'inactive', label: 'উপলভ্য নন / বিরতিতে' },
            ]} param="status" searchParams={resolved} />
          <FilterNav id="donor-availability" label="উপলভ্যতা" value={String(params.availability ?? '')} placeholder="সব"
            options={[{ value: 'available', label: 'উপলভ্য' }, { value: 'unavailable', label: 'উপলভ্য নন' }]}
            param="availability" searchParams={resolved} />
          <FilterNav id="donor-area" label="এলাকা" value={String(params.area ?? '')} placeholder="সব এলাকা"
            options={getAllMCCAreas({ activeOnly: false }).map((area) => ({ value: area.id, label: area.nameBn }))}
            param="area" searchParams={resolved} />
          <ClearFilters searchParams={resolved} />
        </div>
        <DateRangeFilter params={params} resolved={resolved} />
      </div>

      <AdminTable
        columns={columns}
        rows={result.rows}
        getKey={(row) => row.id}
        getHref={(row) => `/admin/blood/donors/${row.id}`}
        caption="রক্তদাতা প্রোফাইল"
        empty={<AdminEmpty title="কোনো রক্তদাতা পাওয়া যায়নি" description="সার্চ বা ফিল্টার পরিবর্তন করুন, অথবা নতুন সাবমিশন এলে এখানে দেখা যাবে।" />}
      />
      <TablePager page={result.page} pageSize={result.pageSize} total={result.total} searchParams={resolved} />
    </>
  );
}
