'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import NewsHome from '@/components/news/NewsHome';
import { isSupabaseConfigured, createClient } from '@/lib/supabase/client';
import { formatLongBnDate } from '@/lib/news/news-utils';
import type { NewsStory } from '@/lib/news/news-utils';

const NEWS_COLUMNS =
  'id, slug, author_name, title_bn, summary_bn, body_bn, cover_image_url, category, area_id, tags, is_featured, published_at, created_at';

function mapStory(row: Record<string, unknown>): NewsStory | null {
  const title = typeof row.title_bn === 'string' ? row.title_bn.trim() : '';
  const slug = typeof row.slug === 'string' ? row.slug.trim() : '';
  if (!title || !slug) return null;

  const createdAt = typeof row.created_at === 'string' ? row.created_at : '';
  return {
    id: typeof row.id === 'string' ? row.id : '',
    slug,
    titleBn: title,
    summaryBn: typeof row.summary_bn === 'string' ? row.summary_bn : undefined,
    bodyBn: typeof row.body_bn === 'string' ? row.body_bn : undefined,
    coverImageUrl: typeof row.cover_image_url === 'string' ? row.cover_image_url : undefined,
    category: typeof row.category === 'string' ? row.category : undefined,
    authorName: typeof row.author_name === 'string' ? row.author_name : undefined,
    areaId: typeof row.area_id === 'string' ? row.area_id : undefined,
    tags: Array.isArray(row.tags)
      ? row.tags.filter((tag): tag is string => typeof tag === 'string' && tag.length > 0)
      : [],
    isFeatured: row.is_featured === true,
    publishedAt: typeof row.published_at === 'string' ? row.published_at : createdAt,
    createdAt,
  };
}

export default function NewsPageClient() {
  const searchParams = useSearchParams();
  const [now] = useState(() => Date.now());
  const [stories, setStories] = useState<NewsStory[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const client = createClient();
    if (!client) return;
    let active = true;

    void (async () => {
      try {
        const { data, error } = await client
          .from('community_posts')
          .select(NEWS_COLUMNS)
          .eq('kind', 'news')
          .eq('status', 'approved')
          .order('published_at', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false })
          .limit(80);
        if (!active) return;
        if (error) {
          console.error('[news] approved stories could not be loaded:', error.message);
          setFailed(true);
          return;
        }
        setStories((data ?? [])
          .map((row: Record<string, unknown>) => mapStory(row))
          .filter((story: NewsStory | null): story is NewsStory => story !== null));
      } catch (error) {
        if (!active) return;
        console.error('[news] approved stories could not be loaded:', error);
        setFailed(true);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return (
    <NewsHome
      stories={stories}
      failed={failed}
      now={now}
      todayLabel={formatLongBnDate(new Date(now))}
      selectedCategory={searchParams.get('category') || undefined}
      query={searchParams.get('q') || undefined}
    />
  );
}
