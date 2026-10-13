import { notFound } from 'next/navigation';
import { AdminPostForm } from '@/components/admin/AdminPostForm';
import { AdminError } from '@/components/admin/States';
import { PageHeader } from '@/components/admin/PageHeader';
import { fetchAdminPostById, getAdminDataClient } from '@/lib/admin/queries';

export const dynamic = 'force-dynamic';

export default async function EditAdminPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [result, admin] = await Promise.all([
    fetchAdminPostById(id),
    getAdminDataClient(),
  ]);

  if (result.unavailable) {
    return <AdminError title="পোস্ট লোড করা যায়নি" message={result.error} />;
  }
  if (!result.post) notFound();
  if (!admin) {
    return <AdminError title="অ্যাডমিন সেশন যাচাই করা যায়নি" message="আবার লগইন করে চেষ্টা করুন।" />;
  }

  return (
    <>
      <PageHeader
        title="পোস্ট সম্পাদনা"
        description="পোস্টের বিষয়বস্তু ও সংশ্লিষ্ট তথ্য হালনাগাদ করুন। মালিকানা ও মডারেশন স্ট্যাটাস অপরিবর্তিত থাকবে।"
        breadcrumb={{ href: `/admin/posts/${id}`, label: 'পোস্টের বিস্তারিত' }}
      />
      <AdminPostForm adminId={admin.userId} post={result.post} />
    </>
  );
}
