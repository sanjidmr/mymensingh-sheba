import { notFound } from 'next/navigation';
import NewsArticlePreview from '@/components/news/NewsArticlePreview';
import { getActiveNewsEditor } from '@/lib/news/news-authorization.server';

export const dynamic = 'force-dynamic';

export default async function NewsEditorPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
  const editor = await getActiveNewsEditor();
  if (!editor) {
    return <p role="alert" className="rounded-xl border border-rose-200 bg-white p-4 text-sm text-rose-800">সক্রিয় নিউজ এডিটর অনুমতি পাওয়া যায়নি।</p>;
  }
  const { data: article, error } = await editor.client
    .from('community_posts')
    .select('title_bn, summary_bn, body_bn, cover_image_url, category, author_name, status, published_at, created_at')
    .eq('id', id)
    .eq('kind', 'news')
    .maybeSingle();
  if (error) {
    return <p role="alert" className="rounded-xl border border-rose-200 bg-white p-4 text-sm text-rose-800">সংবাদ প্রিভিউ লোড হয়নি: {error.message}</p>;
  }
  if (!article) notFound();

  return <NewsArticlePreview article={article} backHref="/news/editor" editHref={`/news/editor/${id}/edit`} />;
}
