import { AlertCircle } from 'lucide-react';
import NewsEditorDashboard from '@/components/news/editor/NewsEditorDashboard';
import { getActiveNewsEditor } from '@/lib/news/news-authorization.server';

export const dynamic = 'force-dynamic';

export type NewsEditorArticle = {
  id: string;
  slug: string;
  title_bn: string;
  summary_bn: string | null;
  author_name: string | null;
  category: string | null;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  is_featured: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export default async function NewsEditorDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  const editor = await getActiveNewsEditor();
  if (!editor) {
    return (
      <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-white p-4 text-sm text-rose-800">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <p>সক্রিয় নিউজ এডিটর অনুমতি যাচাই করা যায়নি। আবার লগইন করুন অথবা প্রধান অ্যাডমিনের সঙ্গে যোগাযোগ করুন।</p>
      </div>
    );
  }

  const [postsResult, viewsResult] = await Promise.all([
    editor.client
      .from('community_posts')
      .select('id, slug, title_bn, summary_bn, author_name, category, status, is_featured, published_at, created_at, updated_at')
      .eq('kind', 'news')
      .order('updated_at', { ascending: false })
      .limit(100),
    editor.client.rpc('fn_news_post_views'),
  ]);
  if (postsResult.error) {
    return (
      <div role="alert" className="rounded-xl border border-rose-200 bg-white p-4 text-sm text-rose-800">
        সংবাদ লোড করা যায়নি: {postsResult.error.message}
      </div>
    );
  }

  const viewCounts = new Map<string, number>();
  const viewsError = viewsResult.error?.message ?? '';
  if (Array.isArray(viewsResult.data)) {
    for (const row of viewsResult.data as { post_slug?: unknown; view_count?: unknown }[]) {
      if (typeof row.post_slug === 'string') viewCounts.set(row.post_slug, Number(row.view_count ?? 0));
    }
  }

  return (
    <NewsEditorDashboard
      editorName={editor.fullName}
      canPublish={editor.canPublish}
      posts={(postsResult.data ?? []) as NewsEditorArticle[]}
      viewCounts={Object.fromEntries(viewCounts)}
      viewsError={viewsError}
      saved={saved === '1'}
    />
  );
}
