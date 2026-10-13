import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import { AdminEmpty, AdminError } from '@/components/admin/States';
import { PageHeader, Panel, DetailField } from '@/components/admin/PageHeader';
import { fetchTutorPublicSummaryById, fetchTutorRequestById } from '@/lib/admin/queries';
import { formatDateTime } from '@/lib/admin/format';
import TutorRequestAdminDetail from './TutorRequestAdminDetail';

export const dynamic = 'force-dynamic';

export default async function AdminTutorRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
  const result = await fetchTutorRequestById(id);
  if (result.error) return <AdminError title="টিউটর রিকোয়েস্ট লোড করা যায়নি" message={result.error} />;
  if (!result.row) return <AdminEmpty title="রিকোয়েস্ট পাওয়া যায়নি" description="এই আইডির কোনো home-tutor service request নেই।" icon={<ClipboardList className="h-5 w-5" />} />;

  const row = result.row;
  const profileId = typeof row.profile_id === 'string' ? row.profile_id : '';
  const validProfileId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profileId);
  const tutorResult = validProfileId ? await fetchTutorPublicSummaryById(profileId) : { row: null };

  return (
    <>
      <Link href="/admin/tutor-requests" className="mb-3 inline-flex min-h-9 items-center gap-1.5 text-xs font-semibold text-admin-muted hover:text-admin-navy">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />টিউটর অনুরোধে ফিরুন
      </Link>
      <PageHeader title="টিউটর আবেদন / অনুরোধ" description="আবেদনকারীর যোগাযোগের তথ্য প্রশাসনিক অনুমতির পরেই দেখানো হচ্ছে।" count={`রিকোয়েস্ট ID: ${String(row.id)}`} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="নির্দিষ্ট গৃহশিক্ষক">
          {profileId ? (
            <div className="flex items-start gap-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-admin-page">
                {tutorResult.row?.profile_photo_url && <Image src={tutorResult.row.profile_photo_url} alt="" fill sizes="56px" unoptimized className="object-cover" />}
              </div>
              <div className="min-w-0">
                <p className="break-words text-sm font-bold text-admin-text">{tutorResult.row?.full_name || (typeof row.profile_title === 'string' ? row.profile_title : 'সংরক্ষিত প্রোফাইলের নাম')}</p>
                <p className="break-all font-mono text-[10px] text-admin-muted">{profileId}</p>
                {validProfileId && <Link href={`/admin/verifications/${profileId}`} className="mt-2 inline-flex min-h-9 items-center text-xs font-semibold text-admin-navy hover:underline">সঠিক টিউটর প্রোফাইল খুলুন →</Link>}
                {!validProfileId && <p className="mt-2 text-xs text-status-warning">profile_id UUID নয়; নিরাপদভাবে কোনো প্রোফাইল অনুমান করে লিংক করা হয়নি।</p>}
              </div>
            </div>
          ) : (
            <p className="text-sm text-admin-muted">এই অনুরোধে profile_id সংরক্ষিত নেই; কোনো টিউটর অনুমান করে যুক্ত করা হয়নি।</p>
          )}
        </Panel>
        <Panel title="আবেদনকারীর তথ্য">
          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailField label="নাম">{String(row.contact_name || '—')}</DetailField>
            <DetailField label="ফোন">{String(row.contact_phone || '—')}</DetailField>
            <DetailField label="এলাকা">{String(row.area_id || '—')}</DetailField>
            <DetailField label="ঠিকানা">{String(row.address_line || '—')}</DetailField>
            <DetailField label="আবেদনকারী ID">{String(row.customer_id || '—')}</DetailField>
            <DetailField label="জমার সময়">{formatDateTime(typeof row.created_at === 'string' ? row.created_at : '')}</DetailField>
            <DetailField label="পছন্দের সময়">{String(row.preferred_time || '—')}</DetailField>
            <DetailField label="বিষয় / শ্রেণি">{String(row.service_type || '—')}</DetailField>
            <DetailField label="বার্তা" wide>{String(row.details || '—')}</DetailField>
          </dl>
        </Panel>
      </div>
      <div className="mt-4">
        <TutorRequestAdminDetail
          id={String(row.id)}
          status={String(row.status)}
          adminNotes={typeof row.admin_notes === 'string' ? row.admin_notes : ''}
        />
      </div>
    </>
  );
}
