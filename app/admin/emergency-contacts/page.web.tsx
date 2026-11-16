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
import EmergencyContactRowActions from '@/components/admin/EmergencyContactRowActions';

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
    header: 'সেবার নাম',
    mobilePrimary: true,
    render: (row) => (
      <span className="block">
        <span className="block font-semibold">{SERVICE_LABEL[row.service] ?? row.service}</span>
        {row.name_bn && row.name_bn !== SERVICE_LABEL[row.service] && (
          <span className="mt-0.5 block text-xs font-normal text-ink-500">{row.name_bn}</span>
        )}
      </span>
    ),
  },
  { key: 'phone', header: 'ফোন নম্বর', render: (row) => <a href={`tel:${row.phone}`} className="whitespace-nowrap font-medium text-admin-navy hover:underline">{row.phone}</a> },
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
      <div className="flex flex-nowrap items-center justify-end gap-1">
        <EmergencyContactEditor contact={row} />
        <EmergencyContactRowActions contact={row} />
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
        <PageHeader title="জরুরি সেবা ডিরেক্টরি" description="পুলিশ ও অ্যাম্বুলেন্স যোগাযোগের তথ্য পরিচালনা।" />
        <AdminError title="জরুরি যোগাযোগ লোড করা যায়নি" message={contacts.error ?? 'অ্যাডমিন অনুমতি বা Supabase সংযোগ যাচাই করুন।'} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="জরুরি সেবা ডিরেক্টরি"
        description="সেবার ধরন ও ফোন নম্বর যোগ বা পরিবর্তন করলেই তথ্য পাবলিক ডিরেক্টরিতে প্রকাশিত হবে।"
        actions={<Link href="/admin" className="inline-flex min-h-10 items-center rounded-lg border border-admin-border bg-white px-3 text-sm font-semibold text-ink-700">অ্যাডমিনে ফিরুন</Link>}
      />

      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <AdminSearch placeholder="সেবার নাম বা ফোন খুঁজুন…" />
          <FilterNav id="contact-service" label="সেবা" value={String(params.service ?? '')} placeholder="সব সেবা"
            options={[
              { value: 'police', label: 'পুলিশ' },
              { value: 'ambulance', label: 'অ্যাম্বুলেন্স' },
            ]} param="service" searchParams={resolved} />
          <FilterNav id="contact-status" label="প্রকাশনা" value={String(params.status ?? '')} placeholder="সব"
            options={[{ value: 'active', label: 'চালু' }, { value: 'inactive', label: 'বন্ধ' }]}
            param="status" searchParams={resolved} />
          <ClearFilters searchParams={resolved} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-admin-muted">সংরক্ষণের সঙ্গে সঙ্গে নম্বরটি প্রকাশিত হবে; আলাদা করে চালু করার দরকার নেই।</p>
          <EmergencyContactEditor />
        </div>
      </div>

      <AdminTable
        columns={columns}
        rows={contacts.rows}
        getKey={(row) => row.id}
        compact
        caption="জরুরি সেবা ডিরেক্টরি"
        empty={<AdminEmpty title="কোনো যোগাযোগের তথ্য নেই" description="পুলিশ বা অ্যাম্বুলেন্সের সেবার ধরন ও ফোন নম্বর যোগ করুন।" />}
      />
      <TablePager page={contacts.page} pageSize={contacts.pageSize} total={contacts.total} searchParams={resolved} />

      <aside className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">
        পুরোনো রেকর্ডে থাকা অতিরিক্ত ঠিকানা ও তথ্যসূত্র সংরক্ষিত থাকবে; এই ফর্মে সেগুলো পরিবর্তন করা হয় না।
      </aside>
    </>
  );
}
