import type { Metadata } from 'next';
import NewsHome from '@/components/news/NewsHome';
import { loadPublishedNews } from '@/lib/news/news-server';
import { deskLabel, formatLongBnDate } from '@/lib/news/news-utils';

type NewsSearchParams = Promise<{
  category?: string | string[];
  q?: string | string[];
}>;

function firstParam(value?: string | string[]): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? '';
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: NewsSearchParams;
}): Promise<Metadata> {
  const params = await searchParams;
  const category = firstParam(params.category);
  const query = firstParam(params.q);

  const title = query
    ? `“${query}” — সংবাদ অনুসন্ধান`
    : category
      ? `${deskLabel(category)} — সংবাদ`
      : 'ময়মনসিংহের নিউজ — স্থানীয় সংবাদ ও নাগরিক কণ্ঠ';

  const description = query
    ? `ময়মনসিংহের নিউজে “${query}” সম্পর্কিত প্রকাশিত সংবাদ ও প্রতিবেদন।`
    : category
      ? `${deskLabel(category)} বিভাগের প্রকাশিত সংবাদ — ময়মনসিংহের নিউজ।`
      : 'ময়মনসিংহ ও আশপাশের এলাকার স্থানীয় সংবাদ, নাগরিক কণ্ঠ ও প্রয়োজনীয় তথ্য। প্রকাশিত সংবাদ, ছবি ও প্রতিবেদন এক জায়গায়।';

  return {
    title,
    description,
    alternates: {
      canonical: category ? `/news?category=${encodeURIComponent(category)}` : '/news',
    },
    robots: query ? { index: false, follow: true } : undefined,
    openGraph: {
      title,
      description,
      url: category ? `/news?category=${encodeURIComponent(category)}` : '/news',
      type: 'website',
      locale: 'bn_BD',
    },
  };
}

/**
 * The public news front page.
 *
 * Approved rows are read on the server so the masthead, lead story and latest
 * list are present in the first response. `force-dynamic` matches the publishing
 * workflow: once a moderator approves a story it should appear on the next
 * request, not after a build-time cache expires.
 */
export const dynamic = 'force-dynamic';

export default async function NewsPage({ searchParams }: { searchParams: NewsSearchParams }) {
  const params = await searchParams;
  const { stories, failed, now } = await loadPublishedNews();

  return (
    <NewsHome
      stories={stories}
      failed={failed}
      now={now}
      todayLabel={formatLongBnDate(new Date(now))}
      selectedCategory={firstParam(params.category) || undefined}
      query={firstParam(params.q) || undefined}
    />
  );
}
