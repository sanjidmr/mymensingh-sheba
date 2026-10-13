import Link from 'next/link';
import StaffProfileForm from '@/components/admin/StaffProfileForm';
import { AdminError } from '@/components/admin/States';
import { fetchAdminStaffProfile } from '@/lib/admin/queries';

export const dynamic = 'force-dynamic';

export default async function AdminEditStaffProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await fetchAdminStaffProfile(id);
  if (result.error) {
    return (
      <>
        <AdminError title="কর্মী প্রোফাইল লোড করা যায়নি" message={result.error} />
        <Link href="/admin/services" className="mt-4 inline-flex text-sm font-semibold text-admin-navy hover:underline">
          কর্মী তালিকায় ফিরুন
        </Link>
      </>
    );
  }
  if (!result.profile) {
    return (
      <>
        <AdminError title="প্রোফাইল পাওয়া যায়নি" message="এই কর্মী প্রোফাইলটি সরানো হয়েছে অথবা আইডিটি সঠিক নয়।" />
        <Link href="/admin/services" className="mt-4 inline-flex text-sm font-semibold text-admin-navy hover:underline">
          কর্মী তালিকায় ফিরুন
        </Link>
      </>
    );
  }
  return <StaffProfileForm mode="edit" initialProfile={result.profile} />;
}
