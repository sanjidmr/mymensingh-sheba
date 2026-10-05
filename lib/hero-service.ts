import { createServerSideClient } from '@/lib/supabase/server';

/**
 * Public read of the hero carousel.
 *
 * The homepage hero used to be a hardcoded array of four images. It is now
 * backed by the `hero_slides` table so the admin panel can reorder, replace and
 * disable slides — but the hardcoded array remains as the fallback, because a
 * homepage that shows a broken image when the database is unreachable is worse
 * than a homepage that ignores the admin's changes.
 *
 * Returns `null` when the table is empty or Supabase is unconfigured. The
 * caller treats that as "use the built-in slides", which is the correct
 * behaviour for a fresh install and for a preview without a database.
 */
export interface PublicHeroSlide {
  image: string;
  caption: string;
}

export async function fetchPublicHeroSlides(): Promise<PublicHeroSlide[] | null> {
  const client = await createServerSideClient();
  if (!client) return null;

  const { data, error } = await client
    .from('hero_slides')
    .select('image_url, caption_bn')
    .eq('is_enabled', true)
    .order('sort_order', { ascending: true })
    .limit(20);

  if (error || !Array.isArray(data) || data.length === 0) return null;

  return data.map((row) => ({
    image: row.image_url,
    caption: row.caption_bn,
  }));
}