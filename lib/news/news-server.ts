/**
 * Server-side read for the public news homepage.
 *
 * This is deliberately a *read adapter* over the existing `community_posts`
 * table, not a second news system: same table, same `status = 'approved'`
 * gate, same published ordering as `fetchApprovedPosts('news')`. Doing the read
 * on the server lets the masthead, lead story and latest list arrive in the
 * first HTML response (important for a news homepage) instead of flashing an
 * empty shell while a browser request runs.
 */
import { createServerSideClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import type { NewsStory } from './news-utils';

const NEWS_COLUMNS =
  'id, slug, author_name, title_bn, summary_bn, body_bn, cover_image_url, category, area_id, tags, is_featured, published_at, created_at';

type NewsRow = Record<string, unknown>;

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function optionalText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function mapStory(row: NewsRow): NewsStory | null {
  const title = text(row.title_bn).trim();
  const slug = text(row.slug).trim();
  if (!title || !slug) return null;

  const createdAt = text(row.created_at);
  const publishedAt = text(row.published_at) || createdAt;

  return {
    id: text(row.id),
    slug,
    titleBn: title,
    summaryBn: optionalText(row.summary_bn),
    bodyBn: optionalText(row.body_bn),
    coverImageUrl: optionalText(row.cover_image_url),
    category: optionalText(row.category),
    authorName: optionalText(row.author_name),
    areaId: optionalText(row.area_id),
    tags: Array.isArray(row.tags)
      ? row.tags.filter((tag): tag is string => typeof tag === 'string' && tag.length > 0)
      : [],
    isFeatured: row.is_featured === true,
    publishedAt,
    createdAt,
  };
}

export type NewsLoadResult = {
  stories: NewsStory[];
  /** True when the database could not be reached; the page shows its own notice. */
  failed: boolean;
  /** Injected clock so every relative timestamp on one render agrees. */
  now: number;
};

export async function loadPublishedNews(): Promise<NewsLoadResult> {
  const now = Date.now();
  if (!isSupabaseConfigured) return { stories: [], failed: false, now };

  try {
    const client = await createServerSideClient();
    if (!client) return { stories: [], failed: true, now };

    const { data, error } = await client
      .from('community_posts')
      .select(NEWS_COLUMNS)
      .eq('kind', 'news')
      .eq('status', 'approved')
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(80);

    if (error) {
      console.error('[news] approved stories could not be loaded:', error.message);
      return { stories: [], failed: true, now };
    }

    const stories = (data ?? [])
      .map((row) => mapStory(row as NewsRow))
      .filter((story): story is NewsStory => story !== null);

    return { stories, failed: false, now };
  } catch (cause) {
    console.error('[news] approved stories could not be loaded:', cause);
    return { stories: [], failed: true, now };
  }
}
