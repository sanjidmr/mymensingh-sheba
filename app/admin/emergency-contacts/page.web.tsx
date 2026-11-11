import Link from 'next/link';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable';
import { TablePager } from '@/components/admin/TablePager';
import { AdminSearch, ClearFilters } from '@/components/admin/AdminSearch';
import { FilterNav } from '@/components/admin/FilterNav';
import { AdminError, AdminEmpty } from '@/components/admin/States';
import { StatusPill } from '@/components/admin/StatCard';
import { formatDateTime } from '@/lib/admin/format';
import { fetchEmergencyContacts, parseListParams, type AdminEmergencyContactRow } from '@/lib/admin/queries';
import EmergencyContactEditor from '@/components/admin/EmergencyContactEditor';
import CatalogActions from '@/components/admin/CatalogActions';

export const dynamic = 'force-dynamic';

const SERVICE_LABEL: Record<string, string> = {
  doctor: 'চিকিৎসক',
  police: 'পুলিশ',
  ambulance: 'অ্যাম্বুলেন্স',
  fire_service: 'ফায়ার সার্ভিস',
};

const columns: AdminColumn<AdminEmergencyContactRow>[] = [
  {
    key: 'service',
    header: 'সেবা / নাম',
    mobilePrimary: true,
    render: (row) => (
      <span className="block">
        <span className="block">{row.name_bn}</span>
        <span className="mt-0.5 block text-xs font-normal text-ink-500">{SERVICE_LABEL[row.service] ?? row.service}</span>
      </span>
    ),
  },
  { key: 'organization', header: 'প্রতিষ্ঠান', render: (row) => row.organization_bn || 'উল্লেখ নেই' },
  { key: 'area', header: 'এলাকা / ঠিকানা', render: (row) => row.address_bn || row.area_id || 'উল্লেখ নেই' },
  { key: 'phone', header: 'ফোন নম্বর', render: (row) => row.phone },
  {
    key: 'source',
    header: 'তথ্যসূত্র',
    hideOnMobile: true,
    render: (row) => row.source_note
      ? <span className="text-xs text-ink-600">{row.source_note}</span>
      : <span className="text-xs font-medium text-amber-700">উৎস উল্লেখ নেই</span>,
  },
  {
    key: 'status',
    header: 'প্রকাশনা',
    render: (row) => <StatusPill label={row.is_active ? 'চালু' : 'বন্ধ'} tone={row.is_active ? 'success' : 'neutral'} />,
  },
  {
    key: 'date',
    header: 'যোগের তারিখ',
    hideOnMobile: true,
    render: (row) => <span className="text-xs text-ink-500">{formatDateTime(row.created_at)}</span>,
  },
  {
    key: 'actions',
    header: '',
    headerClassName: 'w-1',
    render: (row) => (
      <div className="flex flex-wrap items-center gap-1">
        <EmergencyContactEditor contact={row} />
        <CatalogActions row={row} />
      </div>
    ),
  },
];

export default async function AdminEmergencyContactsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await searchParams;
  const params = parseListParams(resolved, { pageSize: 20 });
  const contacts = await fetchEmergencyContacts(params);

  if (contacts.unavailable) {
    return (
      <>
        <PageHeader title="জরুরি সেবা ডিরেক্টরি" description="সমর্থিত জরুরি সেবা যোগাযোগের তথ্য পরিচালনা।" />
        <AdminError title="জরুরি যোগাযোগ লোড করা যায়নি" message={contacts.error ?? 'অ্যাডমিন অনুমতি বা Supabase সংযোগ যাচাই করুন।'} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="জরুরি সেবা ডিরেক্টরি"
        description="ডাক্তার, পুলিশ, অ্যাম্বুলেন্স ও ফায়ার সার্ভিসের বিদ্যমান যোগাযোগ এন্ট্রি। নতুন এন্ট্রি প্রথমে বন্ধ থাকে; নম্বর ও উৎস পর্যালোচনা করে চালু করুন।"
        actions={<Link href="/admin" className="inline-flex min-h-10 items-center rounded-lg border border-admin-border bg-white px-3 text-sm font-semibold text-ink-700">অ্যাডমিনে ফিরুন</Link>}
      />

      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <AdminSearch placeholder="নাম, প্রতিষ্ঠান বা ফোন খুঁজুন…" />
          <FilterNav id="contact-service" label="সেবা" value={String(params.service ?? '')} placeholder="সব সেবা"
            options={[
              { value: 'doctor', label: 'চিকিৎসক' }, { value: 'police', label: 'পুলিশ' },
              { value: 'ambulance', label: 'অ্যাম্বুলেন্স' }, { value: 'fire_service', label: 'ফায়ার সার্ভিস' },
            ]} param="service" searchParams={resolved} />
          <FilterNav id="contact-status" label="প্রকাশনা" value={String(params.status ?? '')} placeholder="সব"
            options={[{ value: 'active', label: 'চালু' }, { value: 'inactive', label: 'বন্ধ' }]}
            param="status" searchParams={resolved} />
          <ClearFilters searchParams={resolved} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-admin-muted">এখানে “চালু” বলতে পাবলিক ডিরেক্টরিতে প্রদর্শিত; এটি আলাদা করে ২৪/৭ উপলভ্যতা বা সর্বশেষ যাচাইয়ের তারিখ বোঝায় না।</p>
          <EmergencyContactEditor />
        </div>
      </div>

      <AdminTable
        columns={columns}
        rows={contacts.rows}
        getKey={(row) => row.id}
        caption="জরুরি সেবা ডিরেক্টরি"
        empty={<AdminEmpty title="কোনো যোগাযোগের তথ্য নেই" description="সমর্থিত জরুরি সেবার নম্বর যাচাই করে যোগ করুন।" />}
      />
      <TablePager page={contacts.page} pageSize={contacts.pageSize} total={contacts.total} searchParams={resolved} />

      <aside className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">
        অফিসিয়াল জরুরি হেল্পলাইন ক্যাটাগরি, বিবরণ, কার্যসময়, ছবি/লোগো এবং সর্বশেষ যাচাইয়ের তারিখ বর্তমান ডেটাবেসে নেই। এই স্ক্রিনে সেগুলো যোগ বা দাবি করা হয় না।
      </aside>
    </>
  );
}
