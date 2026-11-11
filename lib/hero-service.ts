import { createClient } from '@supabase/supabase-js';
import { cache } from 'react';

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
  title?: string;
  subtitle?: string;
  description?: string;
}

export const fetchPublicHeroSlides = cache(async (): Promise<PublicHeroSlide[] | null> => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  const client = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const { data, error } = await client
    .from('hero_slides')
    .select('image_url, caption_bn, title_bn, subtitle_bn, description_bn')
    .eq('is_enabled', true)
    .order('sort_order', { ascending: true })
    .limit(20);

  if (error) {
    console.error('Public hero slides could not be loaded; using built-in slides.', error.message);
    return null;
  }
  if (!Array.isArray(data) || data.length === 0) return null;

  return data.map((row) => ({
    image: row.image_url,
    caption: row.title_bn ?? row.caption_bn ?? '',
    title: row.title_bn ?? row.caption_bn ?? '',
    subtitle: row.subtitle_bn ?? '',
    description: row.description_bn ?? '',
  }));
});