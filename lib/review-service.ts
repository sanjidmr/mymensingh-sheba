/**
 * Mymensingh Sheba — homepage service reviews.
 *
 * Same shape as the other service modules (`contact-service.ts` etc.): Supabase
 * when configured, otherwise the caller is told honestly that nothing was
 * stored. The homepage "আপনার রিভিউ দিন" modal used to keep reviews only in the
 * visitor's browser; these functions move the store to the `site_reviews`
 * table so every review actually reaches the platform.
 */
import { isSupabaseConfigured, createClient } from './supabase/client';

export interface SiteReview {
  id: string;
  name: string;
  service: string;
  rating: number;
  body: string;
  createdAt: string;
}

export interface ReviewSubmitInput {
  name: string;
  service: string;
  rating: number;
  body: string;
  userId?: string;
}

export interface ReviewSubmitResult {
  ok: boolean;
  /** True only when the review was actually stored. */
  persisted: boolean;
  /** Bengali message for the UI. Empty when `ok` is true. */
  errorBn: string;
}

const UNAVAILABLE: ReviewSubmitResult = {
  ok: false,
  persisted: false,
  errorBn:
    'এই মুহূর্তে রিভিউ গ্রহণের সেবা চালু নেই। একটু পরে আবার চেষ্টা করুন।',
};

interface RawReviewRow {
  id?: string;
  name?: string | null;
  service?: string | null;
  rating?: number | null;
  body?: string | null;
  created_at?: string | null;
}

function mapRow(row: RawReviewRow): SiteReview {
  return {
    id: String(row.id ?? ''),
    name: (row.name ?? '').trim(),
    service: (row.service ?? '').trim(),
    rating: Number(row.rating ?? 0),
    body: (row.body ?? '').trim(),
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

/** Newest published reviews, for the modal's "আপনাদের মতামত" list. */
export async function fetchPublishedSiteReviews(limit = 24): Promise<SiteReview[]> {
  if (!isSupabaseConfigured) return [];
  const client = createClient();
  if (!client) return [];

  const { data, error } = await client
    .from('site_reviews')
    .select('id, name, service, rating, body, created_at')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !Array.isArray(data)) return [];
  return (data as RawReviewRow[]).map(mapRow);
}

/** Store one review. Validation is assumed to have run on the client. */
export async function submitSiteReview(
  input: ReviewSubmitInput
): Promise<ReviewSubmitResult> {
  if (!isSupabaseConfigured) return UNAVAILABLE;

  const client = createClient();
  if (!client) return UNAVAILABLE;

  const { error } = await client.from('site_reviews').insert({
    name: input.name.trim(),
    service: input.service.trim(),
    rating: input.rating,
    body: input.body.trim(),
    user_id: input.userId || null,
  });

  if (error) {
    return {
      ok: false,
      persisted: false,
      errorBn: 'রিভিউটি জমা দেওয়া যায়নি। একটু পরে আবার চেষ্টা করুন।',
    };
  }

  return { ok: true, persisted: true, errorBn: '' };
}
