import { AdminPostForm } from '@/components/admin/AdminPostForm';
import { AdminError } from '@/components/admin/States';
import { PageHeader } from '@/components/admin/PageHeader';
import { getAdminDataClient } from '@/lib/admin/queries';
import type { PostKind } from '@/lib/catalog-types';

export const dynamic = 'force-dynamic';

const LABEL: Record<PostKind, string> = {
  news: 'সংবাদ',
  job: 'চাকরি',
  buy_sell: 'কেনাবেচা',
};

export default async function NewAdminPostPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await searchParams;
  const rawKind = Array.isArray(resolved.kind) ? resolved.kind[0] : resolved.kind;
  const kind: PostKind | undefined = rawKind === 'news' || rawKind === 'job' || rawKind === 'buy_sell'
    ? rawKind
    : undefined;
  const admin = await getAdminDataClient();
  if (!admin) {
    return <AdminError title="অ্যাডমিন সেশন যাচাই করা যায়নি" message="আবার লগইন করে চেষ্টা করুন।" />;
  }

  return (
    <>
      <PageHeader
        title={kind ? `নতুন ${LABEL[kind]} পোস্ট` : 'নতুন কমিউনিটি পোস্ট'}
        description="অ্যাডমিন পোস্ট আপনার অ্যাডমিন অ্যাকাউন্টের নামে তৈরি হবে; এটি কোনো গ্রাহকের জমা বলে দেখানো হবে না। নতুন পোস্ট অপেক্ষমাণ থাকবে এবং প্রকাশের আগে আলাদাভাবে অনুমোদন করতে হবে।"
        breadcrumb={{ href: '/admin/posts', label: 'পোস্ট ও লিস্টিং' }}
      />
      <AdminPostForm adminId={admin.userId} initialKind={kind} lockKind={Boolean(kind)} />
    </>
  );
}
