import Link from 'next/link';
import { NEWS_CATEGORIES } from '@/lib/catalog-types';
import { formatDateTime, lookupStatus } from '@/lib/admin/format';

export type NewsArticlePreviewData = {
  title_bn: string;
  summary_bn: string | null;
  body_bn: string | null;
  cover_image_url: string | null;
  category: string | null;
  author_name: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
};

export default function NewsArticlePreview({
  article,
  backHref,
  editHref,
}: {
  article: NewsArticlePreviewData;
  backHref: string;
  editHref: string;
}) {
  const status = lookupStatus(article.status);
  const category = NEWS_CATEGORIES.find((item) => item.id === article.category)?.labelBn ?? article.category ?? 'বিভাগহীন';

  return (
    <article className="mx-auto max-w-3xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href={backHref} className="text-sm font-semibold text-admin-navy hover:underline">← তালিকায় ফিরুন</Link>
        <Link href={editHref} className="inline-flex min-h-10 items-center justify-center rounded-md bg-admin-navy px-4 text-sm font-bold text-white hover:bg-admin-navy/90">সংবাদ সম্পাদনা</Link>
      </div>
      <div className="border border-admin-border bg-white p-5 sm:p-8">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold uppercase tracking-wide text-admin-gold">{category}</span>
          <span className="rounded-full border border-admin-border px-2.5 py-1 text-admin-muted">{status.label}</span>
        </div>
        <h1 className="mt-4 font-[family-name:var(--font-news-serif)] text-2xl font-black leading-snug text-admin-text sm:text-4xl">{article.title_bn}</h1>
        <p className="mt-3 text-xs text-admin-muted">
          {article.author_name || 'লেখক উল্লেখ নেই'} · {formatDateTime(article.published_at ?? article.created_at)}
        </p>
        {article.cover_image_url && (
          <a href={article.cover_image_url} target="_blank" rel="noreferrer" className="mt-5 inline-flex text-xs font-semibold text-admin-navy underline">
            কভার ছবির URL খুলুন ↗
          </a>
        )}
        {article.summary_bn && <p className="mt-6 border-l-2 border-admin-gold pl-4 text-base font-semibold leading-relaxed text-admin-text">{article.summary_bn}</p>}
        <div className="mt-6 whitespace-pre-wrap break-words text-sm leading-8 text-admin-text">
          {article.body_bn || 'এই খসড়ায় এখনো কোনো মূল লেখা যোগ করা হয়নি।'}
        </div>
      </div>
    </article>
  );
}
