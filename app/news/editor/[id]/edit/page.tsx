import { notFound } from 'next/navigation';
import Link from 'next/link';
import NewsEditorPostForm from '@/components/news/editor/NewsEditorPostForm';
import { getActiveNewsEditor } from '@/lib/news/news-authorization.server';

export const dynamic = 'force-dynamic';

export default async function EditNewsEditorPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const editor = await getActiveNewsEditor();
  if (!editor) {
    return <p role="alert" className="rounded-xl border border-rose-200 bg-white p-4 text-sm text-rose-800">সক্রিয় নিউজ এডিটর অনুমতি পাওয়া যায়নি।</p>;
  }
  const { data: post, error } = await editor.client
    .from('community_posts')
    .select('id, slug, title_bn, category, summary_bn, body_bn, cover_image_url, status')
    .eq('id', id)
    .eq('kind', 'news')
    .maybeSingle();
  if (error) {
    return <p role="alert" className="rounded-xl border border-rose-200 bg-white p-4 text-sm text-rose-800">সংবাদ লোড হয়নি: {error.message}</p>;
  }
  if (!post) notFound();

  return (
    <section className="mx-auto max-w-3xl">
      <Link href="/news/editor" className="text-sm font-semibold text-[#0c3b2e] hover:underline">← নিউজ ডেস্কে ফিরুন</Link>
      <h1 className="mt-4 font-[family-name:var(--font-news-serif)] text-2xl font-black">সংবাদ সম্পাদনা</h1>
      <p className="mt-1 text-sm text-[#6d685f]">পরিবর্তন প্রকাশ করতে আপনার অ্যাকাউন্টের অনুমতি প্রযোজ্য হবে।</p>
      <NewsEditorPostForm
        canPublish={editor.canPublish}
        post={{
          id: post.id,
          slug: post.slug,
          titleBn: post.title_bn,
          category: post.category ?? '',
          summaryBn: post.summary_bn ?? '',
          bodyBn: post.body_bn ?? '',
          coverImageUrl: post.cover_image_url ?? '',
          status: post.status,
        }}
      />
    </section>
  );
}
