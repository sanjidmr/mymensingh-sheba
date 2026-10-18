import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CalendarDays, Phone, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminError } from '@/components/admin/States';
import { StatusPill } from '@/components/admin/StatCard';
import DonorProfileActions from '@/components/admin/DonorProfileActions';
import { fetchBloodDonorProfile } from '@/lib/admin/queries';
import { formatDateTime } from '@/lib/admin/format';
import { getAreaById } from '@/lib/locations';

export const dynamic = 'force-dynamic';

const STATUS_LABELS: Record<string, string> = {
  draft: 'জমা দেওয়া হয়নি',
  pending_approval: 'পর্যালোচনায়',
  approved: 'অনুমোদিত',
  rejected: 'প্রত্যাখ্যাত',
  paused: 'বিরতিতে',
  suspended: 'স্থগিত',
};

export default async function AdminBloodDonorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let donor;
  try {
    donor = await fetchBloodDonorProfile(id);
  } catch (error) {
    return (
      <>
        <PageHeader title="রক্তদাতা বিস্তারিত" description="সুরক্ষিত রক্তদাতা প্রোফাইল।" />
        <AdminError title="প্রোফাইল লোড করা যায়নি" message={error instanceof Error ? error.message : 'আবার চেষ্টা করুন।'} />
      </>
    );
  }
  if (!donor) notFound();

  const area = getAreaById(donor.area_id);
  const label = (value: string | null | undefined) => value || 'তথ্য দেওয়া হয়নি';

  return (
    <>
      <PageHeader
        title="রক্তদাতা বিস্তারিত"
        description={`প্রোফাইল আইডি: ${donor.id}`}
        actions={<Link href="/admin/blood/donors" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-admin-border bg-white px-3 text-sm font-semibold text-ink-700"><ArrowLeft className="h-4 w-4" /> তালিকায় ফিরুন</Link>}
      />

      <div className="mb-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="rounded-admin-card border border-admin-border bg-white p-4 sm:p-6">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-50 text-xl font-bold text-brand-800">
              {donor.profile_photo_url
                ? <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={donor.profile_photo_url} alt="" className="h-full w-full object-cover" />
                  </>
                : donor.full_name.slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="break-words text-lg font-bold text-ink-900">{donor.full_name}</h2>
                <StatusPill label={STATUS_LABELS[donor.status] ?? donor.status} tone={donor.status === 'approved' ? 'success' : donor.status === 'pending_approval' ? 'warning' : donor.status === 'rejected' || donor.status === 'suspended' ? 'danger' : 'neutral'} />
              </div>
              <p className="mt-1 text-sm font-semibold text-rose-700">{donor.blood_group || 'রক্তের গ্রুপ উল্লেখ নেই'}</p>
              <p className="mt-1 break-all text-xs text-ink-500">{donor.id}</p>
            </div>
          </div>

          <dl className="mt-6 grid gap-3 border-t border-admin-border pt-5 sm:grid-cols-2">
            <div><dt className="text-xs font-semibold text-admin-muted">এলাকা</dt><dd className="mt-1 text-sm text-ink-800">{area?.nameBn ?? label(donor.area_id)}</dd></div>
            <div><dt className="text-xs font-semibold text-admin-muted">বর্তমান উপলভ্যতা</dt><dd className="mt-1 text-sm text-ink-800">{donor.is_available ? 'উপলভ্য' : 'উপলভ্য নন'}</dd></div>
            <div><dt className="text-xs font-semibold text-admin-muted">লিঙ্গ</dt><dd className="mt-1 text-sm text-ink-800">{donor.gender === 'female' ? 'নারী' : donor.gender === 'male' ? 'পুরুষ' : 'উল্লেখ নেই'}</dd></div>
            <div><dt className="text-xs font-semibold text-admin-muted">জন্মসাল</dt><dd className="mt-1 text-sm text-ink-800">{donor.birth_year ?? 'তথ্য দেওয়া হয়নি'}</dd></div>
            <div><dt className="text-xs font-semibold text-admin-muted">ওজন</dt><dd className="mt-1 text-sm text-ink-800">{donor.weight_kg == null ? 'তথ্য দেওয়া হয়নি' : `${donor.weight_kg} কেজি`}</dd></div>
            <div><dt className="text-xs font-semibold text-admin-muted">সর্বশেষ রক্তদান</dt><dd className="mt-1 text-sm text-ink-800">{donor.last_donation_date || 'তথ্য দেওয়া হয়নি'}</dd></div>
            <div><dt className="text-xs font-semibold text-admin-muted">রক্তদানের সংখ্যা</dt><dd className="mt-1 text-sm text-ink-800">{donor.donation_count}</dd></div>
            <div><dt className="text-xs font-semibold text-admin-muted">তথ্য যাচাই</dt><dd className="mt-1 flex items-center gap-1 text-sm text-ink-800">{donor.is_verified ? <><ShieldCheck className="h-4 w-4 text-emerald-700" /> যাচাইকৃত</> : 'যাচাই করা হয়নি'}</dd></div>
            <div><dt className="text-xs font-semibold text-admin-muted">জমার সময়</dt><dd className="mt-1 flex items-center gap-1 text-sm text-ink-800"><CalendarDays className="h-4 w-4 text-ink-400" />{formatDateTime(donor.created_at)}</dd></div>
            <div><dt className="text-xs font-semibold text-admin-muted">সর্বশেষ আপডেট</dt><dd className="mt-1 text-sm text-ink-800">{formatDateTime(donor.updated_at)}</dd></div>
            <div className="sm:col-span-2"><dt className="text-xs font-semibold text-admin-muted">পরিচিতি</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm text-ink-800">{label(donor.intro)}</dd></div>
            {donor.rejection_reason && <div className="sm:col-span-2"><dt className="text-xs font-semibold text-rose-700">প্রত্যাখ্যানের কারণ</dt><dd className="mt-1 whitespace-pre-wrap text-sm text-rose-800">{donor.rejection_reason}</dd></div>}
            {donor.admin_notes && <div className="sm:col-span-2"><dt className="text-xs font-semibold text-admin-muted">অ্যাডমিন নোট</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm text-ink-800">{donor.admin_notes}</dd></div>}
          </dl>
        </section>

        <aside className="h-fit rounded-admin-card border border-admin-border bg-white p-4 sm:p-5">
          <h2 className="text-sm font-bold text-ink-900">ব্যক্তিগত যোগাযোগ</h2>
          <p className="mt-1 text-xs leading-relaxed text-ink-500">এই নম্বর শুধু অনুমোদিত অ্যাডমিনের সুরক্ষিত বিস্তারিত পাতায় দেখানো হয়।</p>
          {donor.private_phone ? (
            <a href={`tel:${donor.private_phone}`} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-admin-navy px-3 text-sm font-semibold text-white">
              <Phone className="h-4 w-4" /> {donor.private_phone}
            </a>
          ) : (
            <p className="mt-4 rounded-lg bg-mist-50 px-3 py-2 text-sm text-ink-500">ফোন নম্বর দেওয়া হয়নি।</p>
          )}
          <p className="mt-3 break-all text-xs text-ink-500">মালিক অ্যাকাউন্ট আইডি: {donor.user_id}</p>
        </aside>
      </div>

      <DonorProfileActions donor={{
        id: donor.id,
        status: donor.status,
        full_name: donor.full_name,
        blood_group: donor.blood_group,
        area_id: donor.area_id,
        gender: donor.gender,
        birth_year: donor.birth_year,
        weight_kg: donor.weight_kg,
        is_available: donor.is_available,
        last_donation_date: donor.last_donation_date,
        donation_count: donor.donation_count,
        is_verified: donor.is_verified,
        intro: donor.intro,
        profile_photo_url: donor.profile_photo_url,
        rejection_reason: donor.rejection_reason,
        published_at: donor.published_at,
        created_at: donor.created_at,
        updated_at: donor.updated_at,
        admin_notes: donor.admin_notes,
      }} />
    </>
  );
}
