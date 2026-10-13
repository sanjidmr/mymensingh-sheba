import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, GraduationCap } from 'lucide-react';
import { AdminError, AdminEmpty } from '@/components/admin/States';
import { PageHeader } from '@/components/admin/PageHeader';
import { fetchAdminTutorProfileById } from '@/lib/admin/queries';
import TutorProfileAdminDetail from './TutorProfileAdminDetail';

export const dynamic = 'force-dynamic';

export default async function AdminTutorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
  const result = await fetchAdminTutorProfileById(id);
  if (result.error) {
    return (
      <>
        <PageHeader title="টিউটর প্রোফাইল" breadcrumb={{ href: '/admin/verifications', label: 'টিউটর তালিকায় ফিরুন' }} />
        <AdminError title="ব্যক্তিগত প্রোফাইল লোড করা যায়নি" message={result.error} />
      </>
    );
  }
  if (!result.row) {
    return (
      <>
        <PageHeader title="টিউটর প্রোফাইল" breadcrumb={{ href: '/admin/verifications', label: 'টিউটর তালিকায় ফিরুন' }} />
        <AdminEmpty title="প্রোফাইল পাওয়া যায়নি" description="রেকর্ডটি মুছে ফেলা হয়েছে অথবা এই আইডি সঠিক নয়।" icon={<GraduationCap className="h-5 w-5" />} />
      </>
    );
  }
  return (
    <>
      <Link href="/admin/verifications" className="mb-3 inline-flex min-h-9 items-center gap-1.5 text-xs font-semibold text-admin-muted hover:text-admin-navy">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />গৃহশিক্ষক তালিকায় ফিরুন
      </Link>
      <TutorProfileAdminDetail row={result.row} />
    </>
  );
}
