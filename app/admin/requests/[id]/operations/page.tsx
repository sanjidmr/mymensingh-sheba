import { notFound } from 'next/navigation';
import { AdminError } from '@/components/admin/States';
import { DetailField, PageHeader, Panel } from '@/components/admin/PageHeader';
import { StatusPill } from '@/components/admin/StatCard';
import HomeServiceRequestEditor from '@/components/admin/HomeServiceRequestEditor';
import { ServiceRequestMetadata } from '@/components/admin/ServiceRequestMetadata';
import {
  fetchAssignableStaff,
  fetchServiceRequestAttachmentUrls,
  fetchServiceRequestById,
  type AdminStaffListRow,
} from '@/lib/admin/queries';
import { formatDateTime, lookupStatus } from '@/lib/admin/format';
import { getAreaById } from '@/lib/locations';
import { STAFF_SERVICE_KEYS, type StaffServiceKey } from '@/lib/staff-types';

export const dynamic = 'force-dynamic';

const SERVICE_LABEL: Record<string, string> = {
  'kajer-bua': 'কাজের বুয়া',
  electrician: 'ইলেকট্রিশিয়ান',
  plumber: 'প্লাম্বার',
  'basha-paltano': 'বাসা বদলানো',
  'home-moving': 'বাসা বদলানো (পুরোনো রেকর্ড)',
  'ac-fridge': 'AC ও ফ্রিজ মেরামত',
  'home-tutor': 'গৃহশিক্ষক',
};

function valueOrDash(value: string | null | undefined) {
  return value?.trim() || 'উল্লেখ নেই';
}

export default async function AdminHomeServiceRequestOperationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let request;
  try {
    request = await fetchServiceRequestById(id);
  } catch (error) {
    return (
      <>
        <PageHeader title="রিকোয়েস্টের বিস্তারিত" breadcrumb={{ href: '/admin/requests', label: 'রিকোয়েস্ট তালিকা' }} />
        <AdminError title="রিকোয়েস্ট লোড করা যায়নি" message={error instanceof Error ? error.message : undefined} />
      </>
    );
  }
  if (!request) notFound();

  const supportedAssignment = STAFF_SERVICE_KEYS.includes(request.service_slug as StaffServiceKey);
  let workers: AdminStaffListRow[] = [];
  let workerError = '';
  if (supportedAssignment) {
    try {
      workers = await fetchAssignableStaff(request.service_slug);
    } catch (error) {
      workerError = error instanceof Error ? error.message : 'কর্মী তালিকা লোড করা যায়নি।';
    }
  }
  const status = lookupStatus(request.status);
  const movingItems = request.moving_items?.map((item) => {
    const label = item.labelBn ?? item.id ?? 'আইটেম';
    return `${label}${item.quantity && item.quantity > 1 ? ` × ${item.quantity}` : ''}`;
  });
  let attachmentUrls: string[] = [];
  let attachmentError = '';
  const attachmentPaths = [request.attachment_url, ...(request.photo_urls ?? [])]
    .filter((path): path is string => Boolean(path));
  if (attachmentPaths.length) {
    try {
      const result = await fetchServiceRequestAttachmentUrls(attachmentPaths);
      attachmentUrls = result.urls;
      attachmentError = result.error ?? '';
    } catch (error) {
      attachmentError = error instanceof Error ? error.message : 'সংযুক্ত ফাইল লোড করা যায়নি।';
    }
  }

  return (
    <>
      <PageHeader
        title="হোম সার্ভিস রিকোয়েস্ট"
        description={SERVICE_LABEL[request.service_slug] ?? request.service_slug}
        breadcrumb={{ href: '/admin/requests', label: 'রিকোয়েস্ট তালিকা' }}
        count={`ID: ${request.id}`}
        actions={<StatusPill label={status.label} tone={status.tone} />}
      />

      <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.85fr)]">
        <Panel title="গ্রাহক ও রিকোয়েস্ট" description={`জমা: ${formatDateTime(request.created_at)} · সর্বশেষ আপডেট: ${formatDateTime(request.updated_at)}`}>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailField label="গ্রাহকের নাম">{request.contact_name || request.customer_full_name || 'নাম উল্লেখ নেই'}</DetailField>
            <DetailField label="গ্রাহকের ফোন">{valueOrDash(request.contact_phone)}</DetailField>
            <DetailField label="গ্রাহক অ্যাকাউন্ট ID">{request.customer_id}</DetailField>
            <DetailField label="সেবার ধরন">{valueOrDash(request.service_type)}</DetailField>
            <DetailField label="এলাকা">{getAreaById(request.area_id)?.nameBn ?? valueOrDash(request.area_id)}</DetailField>
            <DetailField label="ঠিকানা">{valueOrDash(request.address_line)}</DetailField>
            <DetailField label="পছন্দের তারিখ">{valueOrDash(request.preferred_date)}</DetailField>
            <DetailField label="পছন্দের সময়">{valueOrDash(request.preferred_time)}</DetailField>
            <DetailField label="নির্ধারিত কর্মী">{request.assigned_worker_name || request.profile_title || 'নির্ধারিত নয়'}</DetailField>
            <DetailField label="কর্মী রেকর্ড ID">{valueOrDash(request.profile_id)}</DetailField>
            <DetailField label="বর্ণনা" wide>{valueOrDash(request.details)}</DetailField>
            {request.quotation && <DetailField label="কোটেশন">{request.quotation}</DetailField>}
          </dl>
        </Panel>

        <Panel title="সেবা অগ্রগতি" description="স্ট্যাটাস ও নির্ধারণ পরিবর্তন ডেটাবেজে যাচাইসহ সংরক্ষণ হয়।">
          {workerError && <AdminError title="কর্মী তালিকা লোড করা যায়নি" message={workerError} className="mb-3" />}
          <HomeServiceRequestEditor request={request} workers={workers} />
        </Panel>
      </div>

      {(request.service_slug === 'home-moving' || request.service_slug === 'basha-paltano') && (
        <Panel title="বাসা বদলের বিবরণ" className="mb-4">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <DetailField label="পিকআপ এলাকা">{getAreaById(request.pickup_area_id ?? '')?.nameBn ?? valueOrDash(request.pickup_area_id)}</DetailField>
            <DetailField label="গন্তব্য এলাকা">{getAreaById(request.destination_area_id ?? '')?.nameBn ?? valueOrDash(request.destination_area_id)}</DetailField>
            <DetailField label="পিকআপ ঠিকানা">{valueOrDash(request.pickup_address)}</DetailField>
            <DetailField label="গন্তব্য ঠিকানা">{valueOrDash(request.destination_address)}</DetailField>
            <DetailField label="পিকআপ ফ্লোর">{valueOrDash(request.pickup_floor)}</DetailField>
            <DetailField label="গন্তব্য ফ্লোর">{valueOrDash(request.destination_floor)}</DetailField>
            <DetailField label="লিফট">{request.has_lift === null ? 'উল্লেখ নেই' : request.has_lift ? 'আছে' : 'নেই'}</DetailField>
            <DetailField label="পার্কিং">{valueOrDash(request.parking_info)}</DetailField>
            <DetailField label="মালামাল" wide>{movingItems?.join(' · ') || 'উল্লেখ নেই'}</DetailField>
          </dl>
        </Panel>
      )}

      <ServiceRequestMetadata serviceMeta={request.service_meta} serviceSlug={request.service_slug} />

      {(attachmentUrls.length > 0 || attachmentError) && (
        <Panel title="সংযুক্ত ফাইল" className="mb-4">
          {attachmentError && <AdminError title="কিছু ফাইল লোড করা যায়নি" message={attachmentError} className="mb-3" />}
          <ul className="space-y-2 text-sm">
            {attachmentUrls.map((url, index) => (
              <li key={`${url}-${index}`}>
                <a href={url} target="_blank" rel="noreferrer" className="font-semibold text-admin-navy underline">সংযুক্ত ফাইল {index + 1} খুলুন</a>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  );
}
