import {
  fetchServiceListings,
  fetchEmergencyContacts,
  parseListParams,
} from '@/lib/admin/queries';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable';
import { TablePager } from '@/components/admin/TablePager';
import { AdminSearch, ClearFilters } from '@/components/admin/AdminSearch';
import { FilterSelect } from '@/components/admin/PageSizeSelect';
import { AdminError, AdminEmpty } from '@/components/admin/States';
import { StatusPill } from '@/components/admin/StatCard';
import { formatDateTime, lookupStatus } from '@/lib/admin/format';
import type { AdminServiceListingRow, AdminEmergencyContactRow } from '@/lib/admin/queries';
import CatalogActions from '@/components/admin/CatalogActions';

export const dynamic = 'force-dynamic';

const CATEGORY_LABEL: Record<string, string> = {
  coaching: 'কোচিং',
  wifi: 'WiFi',
  bus: 'বাস',
  vehicle: 'গাড়ি',
};

const SERVICE_LABEL: Record<string, string> = {
  doctor: 'ডাক্তার',
  police: 'পুলিশ',
  ambulance: 'অ্যাম্বুলেন্স',
  fire_service: 'ফায়ার সার্ভিস',
};

const listingColumns: AdminColumn<AdminServiceListingRow>[] = [
  {
    key: 'title',
    header: 'শিরোনাম',
    mobilePrimary: true,
    render: (row) => (
      <span className="block">
        <span className="block">{row.title_bn}</span>
        <span className="mt-0.5 block text-xs text-ink-400">
          {CATEGORY_LABEL[row.category] ?? row.category}
        </span>
      </span>
    ),
  },
  {
    key: 'area',
    header: 'এলাকা',
    render: (row) => row.area_id || '—',
  },
  {
    key: 'phone',
    header: 'নম্বর',
    hideOnMobile: true,
    render: (row) => row.contact_phone || '—',
  },
  {
    key: 'status',
    header: 'স্ট্যাটাস',
    render: (row) => (
      <StatusPill
        label={row.is_active ? 'চালু' : 'বন্ধ'}
        tone={row.is_active ? 'success' : 'neutral'}
      />
    ),
  },
  {
    key: 'date',
    header: 'তারিখ',
    hideOnMobile: true,
    render: (row) => (
      <span className="text-xs text-ink-500">{formatDateTime(row.created_at)}</span>
    ),
  },
  {
    key: 'actions',
    header: '',
    headerClassName: 'w-1',
    render: (row) => <CatalogActions row={row} />,
  },
];

const contactColumns: AdminColumn<AdminEmergencyContactRow>[] = [
  {
    key: 'name',
    header: 'নাম',
    mobilePrimary: true,
    render: (row) => (
      <span className="block">
        <span className="block">{row.name_bn}</span>
        <span className="mt-0.5 block text-xs text-ink-400">
          {SERVICE_LABEL[row.service] ?? row.service}
        </span>
      </span>
    ),
  },
  {
    key: 'organization',
    header: 'প্রতিষ্ঠান',
    render: (row) => row.organization_bn || '—',
  },
  {
    key: 'phone',
    header: 'নম্বর',
    render: (row) => row.phone,
  },
  {
    key: 'order',
    header: 'ক্রম',
    hideOnMobile: true,
    render: (row) => <span className="tabular-nums">{row.sort_order}</span>,
  },
  {
    key: 'status',
    header: 'স্ট্যাটাস',
    render: (row) => (
      <StatusPill
        label={row.is_active ? 'চালু' : 'বন্ধ'}
        tone={row.is_active ? 'success' : 'neutral'}
      />
    ),
  },
  {
    key: 'actions',
    header: '',
    headerClassName: 'w-1',
    render: (row) => <CatalogActions row={row} />,
  },
];

export default async function AdminCatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const params = parseListParams(resolvedSearchParams, { pageSize: 20 });
  const [listings, contacts] = await Promise.all([
    fetchServiceListings(params),
    fetchEmergencyContacts(params),
  ]);

  if (listings.unavailable || contacts.unavailable) {
    return (
      <>
        <PageHeader
          title="ক্যাটালগ ও ইমার্জেন্সি"
          description="কোচিং, WiFi, বাস ও জরুরি নম্বরের তালিকা।"
        />
        <AdminError title="ডেটাবেজ সংযুক্ত নেই" />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="ক্যাটালগ ও ইমার্জেন্সি"
        description="কোচিং, WiFi, বাস ও জরুরি সেবার তালিকা। চালু/বন্ধ করলে সাথে সাথে ওয়েবসাইটে প্রভাব পড়ে।"
      />

      {/* ---------- Service listings ---------- */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-bold text-ink-900">ক্যাটালগ তালিকা</h2>

        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <AdminSearch placeholder="শিরোনাম বা এলাকা খুঁজুন…" />
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <FilterSelect
              id="listing-category"
              label="ক্যাটাগরি"
              value={String(params.category ?? '')}
              placeholder="সব ক্যাটাগরি"
              options={[
                { value: 'coaching', label: 'কোচিং' },
                { value: 'wifi', label: 'WiFi' },
                { value: 'bus', label: 'বাস' },
                { value: 'vehicle', label: 'গাড়ি' },
              ]}
              onChange={() => {}}
            />
            <FilterSelect
              id="listing-status"
              label="স্ট্যাটাস"
              value={String(params.status ?? '')}
              placeholder="সব স্ট্যাটাস"
              options={[
                { value: 'active', label: 'চালু' },
                { value: 'inactive', label: 'বন্ধ' },
              ]}
              onChange={() => {}}
            />
            <ClearFilters searchParams={new URLSearchParams()} />
          </div>
        </div>

        <AdminTable
          columns={listingColumns}
          rows={listings.rows}
          getKey={(row) => String(row.id)}
          caption="ক্যাটালগ তালিকা"
          empty={
            <AdminEmpty
              title="কোনো তালিকা পাওয়া যায়নি"
              description="ক্যাটালগে নতুন তালিকা যোগ করলে এখানে দেখা যাবে।"
            />
          }
        />

        <TablePager
          page={listings.page}
          pageSize={listings.pageSize}
          total={listings.total}
          searchParams={resolvedSearchParams}
        />
      </section>

      {/* ---------- Emergency contacts ---------- */}
      <section>
        <h2 className="mb-3 text-sm font-bold text-ink-900">ইমার্জেন্সি নম্বর</h2>

        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <AdminSearch placeholder="নাম বা নম্বর খুঁজুন…" />
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <FilterSelect
              id="contact-service"
              label="সেবা"
              value={String(params.service ?? '')}
              placeholder="সব সেবা"
              options={[
                { value: 'doctor', label: 'ডাক্তার' },
                { value: 'police', label: 'পুলিশ' },
                { value: 'ambulance', label: 'অ্যাম্বুলেন্স' },
                { value: 'fire_service', label: 'ফায়ার সার্ভিস' },
              ]}
              onChange={() => {}}
            />
            <FilterSelect
              id="contact-status"
              label="স্ট্যাটাস"
              value={String(params.status ?? '')}
              placeholder="সব স্ট্যাটাস"
              options={[
                { value: 'active', label: 'চালু' },
                { value: 'inactive', label: 'বন্ধ' },
              ]}
              onChange={() => {}}
            />
            <ClearFilters searchParams={new URLSearchParams()} />
          </div>
        </div>

        <AdminTable
          columns={contactColumns}
          rows={contacts.rows}
          getKey={(row) => String(row.id)}
          caption="ইমার্জেন্সি নম্বরের তালিকা"
          empty={
            <AdminEmpty
              title="কোনো নম্বর পাওয়া যায়নি"
              description="ইমার্জেন্সি নম্বর যোগ করলে এখানে দেখা যাবে।"
            />
          }
        />

        <TablePager
          page={contacts.page}
          pageSize={contacts.pageSize}
          total={contacts.total}
          searchParams={resolvedSearchParams}
        />
      </section>
    </>
  );
}