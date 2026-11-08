import { notFound } from 'next/navigation';
import NewsArticlePreview from '@/components/news/NewsArticlePreview';
import { getAdminDataClient } from '@/lib/admin/queries';

export const dynamic = 'force-dynamic';

export default async function AdminNewsPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
  const admin = await getAdminDataClient();
  if (!admin) {
    return <p role="alert" className="rounded-md border border-status-danger/30 bg-white p-4 text-sm text-admin-danger">অ্যাডমিন অনুমতি যাচাই করা যায়নি।</p>;
  }
  const { data: article, error } = await admin.client
    .from('community_posts')
    .select('title_bn, summary_bn, body_bn, cover_image_url, category, author_name, status, published_at, created_at')
    .eq('id', id)
    .eq('kind', 'news')
    .maybeSingle();
  if (error) {
    return <p role="alert" className="rounded-md border border-status-danger/30 bg-white p-4 text-sm text-admin-danger">সংবাদ প্রিভিউ লোড হয়নি: {error.message}</p>;
  }
  if (!article) notFound();

  return <NewsArticlePreview article={article} backHref="/admin/news" editHref={`/admin/posts/${id}/edit`} />;
}
