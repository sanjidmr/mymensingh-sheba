/**
 * Mymensingh Sheba — authenticated homepage reviews with admin moderation.
 * Supabase RLS keeps new submissions pending until an admin publishes them.
 */
import { isSupabaseConfigured, createClient } from './supabase/client';

export interface SiteReview {
  id: string;
  name: string;
  service: string;
  rating: number;
  body: string;
  createdAt: string;
  status: 'pending' | 'published' | 'hidden';
}

export interface ReviewSubmitInput {
  name: string;
  service: string;
  rating: number;
  body: string;
  userId: string;
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
  status?: 'pending' | 'published' | 'hidden' | null;
}

function mapRow(row: RawReviewRow): SiteReview {
  return {
    id: String(row.id ?? ''),
    name: (row.name ?? '').trim(),
    service: (row.service ?? '').trim(),
    rating: Number(row.rating ?? 0),
    body: (row.body ?? '').trim(),
    createdAt: row.created_at ?? new Date().toISOString(),
    status: row.status === 'pending' ? 'pending' : row.status === 'hidden' ? 'hidden' : 'published',
  };
}

function submitErrorMessage(code?: string): string {
  if (code === '42P01' || code === 'PGRST205' || code === 'PGRST204') {
    return 'রিভিউ সেবা ডাটাবেজে চালু নেই। অ্যাডমিনকে site_reviews migration প্রয়োগ করতে বলুন।';
  }
  if (code === '42501') {
    return 'রিভিউ জমা দেওয়ার অনুমতি নেই। Supabase-এর site_reviews INSERT policy যাচাই করুন।';
  }
  if (code === '23514' || code === '22001') {
    return 'রিভিউয়ের তথ্য সীমার বাইরে। নাম ও সেবা লিখুন এবং মতামত ১০–১,৫০০ অক্ষরের মধ্যে রাখুন।';
  }
  return 'রিভিউ জমা হয়নি। ইন্টারনেট সংযোগ যাচাই করে আবার চেষ্টা করুন।';
}

/** Newest published reviews, shown in the homepage review section. */
export async function fetchPublishedSiteReviews(limit = 24): Promise<SiteReview[]> {
  if (!isSupabaseConfigured) throw new Error('রিভিউ সেবা এখন চালু নেই।');
  const client = createClient();
  if (!client) throw new Error('রিভিউ সেবা এখন চালু নেই।');

  const { data, error } = await client
    .from('site_reviews')
    .select('id, name, service, rating, body, created_at')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('site_reviews_fetch_failed', { code: error.code ?? 'unknown' });
    throw new Error('রিভিউ লোড করা যায়নি। একটু পরে আবার চেষ্টা করুন।');
  }
  if (!Array.isArray(data)) {
    throw new Error('রিভিউর তথ্য পাওয়া যায়নি।');
  }
  return (data as RawReviewRow[]).map(mapRow);
}

/** Store one review for admin approval. Validation is also enforced by RLS. */
export async function submitSiteReview(
  input: ReviewSubmitInput
): Promise<ReviewSubmitResult> {
  const name = input.name.trim();
  const service = input.service.trim();
  const body = input.body.trim();
  const userId = input.userId.trim();

  if (!userId) {
    return {
      ok: false,
      persisted: false,
      errorBn: 'রিভিউ দিতে আগে লগইন করুন।',
    };
  }

  if (name.length < 2 || service.length < 2 || !Number.isInteger(input.rating) ||
      input.rating < 1 || input.rating > 5 ||
      body.length < 10 || body.length > 1500) {
    return {
      ok: false,
      persisted: false,
      errorBn: 'নাম ও সেবা লিখুন; মতামত ১০–১,৫০০ অক্ষরের মধ্যে রাখুন এবং ১–৫ স্টার দিন।',
    };
  }
  if (!isSupabaseConfigured) return UNAVAILABLE;

  const client = createClient();
  if (!client) return UNAVAILABLE;

  try {
    const { error } = await client.from('site_reviews').insert({
      name,
      service,
      rating: input.rating,
      body,
      user_id: userId,
      status: 'pending',
    });
    if (!error) return { ok: true, persisted: true, errorBn: '' };
    console.error('site_review_insert_failed', { code: error.code ?? 'unknown' });
    return {
      ok: false,
      persisted: false,
      errorBn: submitErrorMessage(error.code),
    };
  } catch {
    console.error('site_review_insert_failed', { code: 'network_or_client_error' });
    return {
      ok: false,
      persisted: false,
      errorBn: 'রিভিউ জমা হয়নি। ইন্টারনেট সংযোগ যাচাই করে আবার চেষ্টা করুন।',
    };
  }
}

/** All site-wide reviews for the admin moderation screen. RLS enforces admin access. */
export async function fetchAdminSiteReviews(): Promise<SiteReview[]> {
  if (!isSupabaseConfigured) throw new Error('Supabase সংযোগ উপলভ্য নয়।');
  const client = createClient();
  if (!client) throw new Error('Supabase সংযোগ উপলভ্য নয়।');
  const { data, error } = await client
    .from('site_reviews')
    .select('id, name, service, rating, body, created_at, status')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) {
    if (error.code === '42P01' || error.code === 'PGRST205' || error.code === 'PGRST204') {
      throw new Error('site_reviews টেবিল পাওয়া যায়নি। Supabase-এ 20261017160000_site_reviews.sql migration প্রয়োগ করুন।');
    }
    throw new Error(`সাইট রিভিউ লোড হয়নি (কোড: ${error.code || 'unknown'})।`);
  }
  return (data ?? []).map((row) => mapRow(row as RawReviewRow));
}

/** Publish or hide a homepage review. RLS permits this only for admins. */
export async function setSiteReviewStatus(
  id: string,
  status: SiteReview['status']
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase সংযোগ উপলভ্য নয়।' };
  const client = createClient();
  if (!client) return { success: false, error: 'Supabase সংযোগ উপলভ্য নয়।' };
  try {
    const { error } = await client.from('site_reviews').update({ status }).eq('id', id);
    if (error) {
      console.error('site_review_status_update_failed', { code: error.code ?? 'unknown' });
      return { success: false, error: `রিভিউর অবস্থা পরিবর্তন হয়নি (কোড: ${error.code || 'unknown'})।` };
    }
  } catch {
    console.error('site_review_status_update_failed', { code: 'network_or_client_error' });
    return { success: false, error: 'সংযোগ সমস্যার কারণে রিভিউর অবস্থা পরিবর্তন হয়নি।' };
  }
  return { success: true };
}
