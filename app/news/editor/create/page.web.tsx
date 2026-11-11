import Link from 'next/link';
import NewsEditorPostForm from '@/components/news/editor/NewsEditorPostForm';
import { getActiveNewsEditor } from '@/lib/news/news-authorization.server';

export const dynamic = 'force-dynamic';

export default async function CreateNewsEditorPostPage() {
  const editor = await getActiveNewsEditor();
  if (!editor) {
    return <p role="alert" className="rounded-xl border border-rose-200 bg-white p-4 text-sm text-rose-800">সক্রিয় নিউজ এডিটর অনুমতি পাওয়া যায়নি।</p>;
  }

  return (
    <section className="mx-auto max-w-3xl">
      <Link href="/news/editor" className="text-sm font-semibold text-[#0c3b2e] hover:underline">← নিউজ ডেস্কে ফিরুন</Link>
      <h1 className="mt-4 font-[family-name:var(--font-news-serif)] text-2xl font-black">নতুন সংবাদ</h1>
      <p className="mt-1 text-sm text-[#6d685f]">খসড়া সংরক্ষণ করুন অথবা অনুমতি অনুযায়ী প্রকাশ/অনুমোদনের জন্য পাঠান।</p>
      <NewsEditorPostForm canPublish={editor.canPublish} />
    </section>
  );
}
