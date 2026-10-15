'use client';

/**
 * DirectoryReviews — the public review section for coaching centres and WiFi
 * providers.
 *
 * What it does, and why it is one component for both categories:
 *
 *  * Shows the star average + count, then the published written reviews.
 *  * Lets a signed-in member submit ONE review (star rating + optional comment),
 *    edit it, or delete it. The database enforces "one per member per listing";
 *    this UI mirrors that so a member sees their own review instead of a second
 *    form.
 *  * Gates submission behind sign-in: a signed-out visitor gets a login link
 *    carrying `?next=` back to this page, matching the rest of the app.
 *
 * The average shown here is computed from the reviews actually returned, so it
 * cannot drift from the list beneath it. The card the reader clicked uses the
 * database aggregate, which the same trigger keeps in step.
 */
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Loader2, Pencil, Star, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import {
  deleteMyDirectoryReview,
  fetchDirectoryReviews,
  fetchMyDirectoryReview,
  submitDirectoryReview,
  updateMyDirectoryReview,
} from '@/lib/catalog-service';
import { bnRelativeTime, toBn, type DirectoryReview, type DirectoryReviewCategory } from '@/lib/catalog-types';

const LIGHT_FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';

function Stars({ value, size = 'md' }: { value: number; size?: 'sm' | 'md' }) {
  const rounded = Math.round(value);
  const cls = size === 'md' ? 'h-5 w-5' : 'h-3.5 w-3.5';
  return (
    <span className="inline-flex items-center gap-[2px]" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={n <= rounded ? `${cls} fill-amber-400 text-amber-400` : `${cls} text-brand-100`} />
      ))}
    </span>
  );
}

/** Interactive 1–5 picker. Buttons, not a range input, so it is keyboard-usable. */
function StarPicker({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (next: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="inline-flex items-center gap-1" role="radiogroup" aria-label="রেটিং দিন">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${toBn(n)} তারা`}
          disabled={disabled}
          onClick={() => onChange(n)}
          className={`rounded p-0.5 disabled:opacity-60 ${LIGHT_FOCUS}`}
        >
          <Star className={n <= value ? 'h-6 w-6 fill-amber-400 text-amber-400' : 'h-6 w-6 text-brand-100'} />
        </button>
      ))}
    </div>
  );
}

export default function DirectoryReviews({
  category,
  listingId,
  ratingAvg,
  ratingCount,
}: {
  category: DirectoryReviewCategory;
  listingId: string;
  ratingAvg?: number;
  ratingCount?: number;
}) {
  const { user, isLoading: authLoading } = useAuth();
  const pathname = usePathname();
  const [reviews, setReviews] = useState<DirectoryReview[]>([]);
  const [mine, setMine] = useState<DirectoryReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    const [list, own] = await Promise.all([
      fetchDirectoryReviews(category, listingId),
      fetchMyDirectoryReview(category, listingId),
    ]);
    setReviews(list);
    setMine(own);
    if (own) {
      setRating(own.rating);
      setComment(own.commentBn ?? '');
    }
    setLoading(false);
  }, [category, listingId]);

  useEffect(() => {
    if (authLoading) return;
    let active = true;
    (async () => {
      const [list, own] = await Promise.all([
        fetchDirectoryReviews(category, listingId),
        fetchMyDirectoryReview(category, listingId),
      ]);
      if (!active) return;
      setReviews(list);
      setMine(own);
      if (own) {
        setRating(own.rating);
        setComment(own.commentBn ?? '');
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [authLoading, category, listingId]);

  // Prefer the reviews actually on screen for the headline, so it can never
  // contradict the list below; fall back to the passed aggregate while loading.
  const shownCount = loading ? ratingCount ?? 0 : reviews.length;
  const shownAvg =
    loading || reviews.length === 0
      ? ratingAvg ?? 0
      : reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  const resetForm = () => {
    setEditing(false);
    setRating(mine?.rating ?? 0);
    setComment(mine?.commentBn ?? '');
    setError('');
  };

  const submit = async () => {
    setError('');
    setNotice('');
    if (rating < 1 || rating > 5) {
      setError('রেটিং দিতে ১ থেকে ৫ তারার মধ্যে বাছাই করুন।');
      return;
    }
    setBusy(true);
    const result = mine
      ? await updateMyDirectoryReview(mine.id, rating, comment)
      : await submitDirectoryReview({ category, listingId, rating, commentBn: comment });
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setNotice(mine ? 'আপনার রিভিউ হালনাগাদ হয়েছে।' : 'ধন্যবাদ! আপনার রিভিউ প্রকাশিত হয়েছে।');
    setEditing(false);
    await load();
  };

  const removeMine = async () => {
    if (!mine) return;
    setError('');
    setNotice('');
    setBusy(true);
    const result = await deleteMyDirectoryReview(mine.id);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setMine(null);
    setRating(0);
    setComment('');
    setNotice('আপনার রিভিউ মুছে ফেলা হয়েছে।');
    await load();
  };

  return (
    <section className="mt-6" aria-labelledby="directory-reviews-heading">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 id="directory-reviews-heading" className="text-[15px] font-extrabold text-ink-900 sm:text-base">
          রেটিং ও রিভিউ
        </h2>
        {shownCount > 0 && (
          <span className="inline-flex items-center gap-2">
            <Stars value={shownAvg} size="sm" />
            <span className="text-[12px] font-bold text-ink-700">
              {toBn(shownAvg.toFixed(1))} / ৫
            </span>
            <span className="text-[11.5px] text-ink-400">({toBn(shownCount)} টি রিভিউ)</span>
          </span>
        )}
      </div>

      {/* --- submission / own review --- */}
      <div className="mt-3 rounded-xl border border-brand-100 bg-mist-50 p-3.5">
        {authLoading ? (
          <p className="flex items-center gap-2 text-[12.5px] text-ink-500">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> লোড হচ্ছে…
          </p>
        ) : !user ? (
          <p className="text-[12.5px] leading-relaxed text-ink-600">
            রেটিং ও রিভিউ দিতে অনুগ্রহ করে{' '}
            <Link
              href={`/login?next=${encodeURIComponent(pathname || '/')}`}
              className="font-bold text-brand-700 underline"
            >
              লগইন করুন
            </Link>
            ।
          </p>
        ) : mine && !editing ? (
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[12px] font-bold text-ink-700">আপনার রিভিউ</p>
              <div className="mt-1 flex items-center gap-2">
                <Stars value={mine.rating} size="sm" />
                <span className="text-[11.5px] text-ink-400">
                  {bnRelativeTime(mine.createdAt) ?? ''}
                </span>
              </div>
              {mine.commentBn && (
                <p className="mt-1 text-[12.5px] leading-relaxed text-ink-600">{mine.commentBn}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className={`inline-flex min-h-[40px] items-center gap-1 rounded-lg border border-brand-200 bg-white px-3 text-[12.5px] font-bold text-brand-700 ${LIGHT_FOCUS}`}
              >
                <Pencil className="h-3.5 w-3.5" /> সম্পাদনা
              </button>
              <button
                type="button"
                onClick={() => void removeMine()}
                disabled={busy}
                className={`inline-flex min-h-[40px] items-center gap-1 rounded-lg border border-brand-200 bg-white px-3 text-[12.5px] font-bold text-status-danger disabled:opacity-60 ${LIGHT_FOCUS}`}
              >
                <Trash2 className="h-3.5 w-3.5" /> মুছুন
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-[12.5px] font-bold text-ink-700">
              {mine ? 'রিভিউ হালনাগাদ করুন' : 'আপনার অভিজ্ঞতা জানান'}
            </p>
            <div className="mt-1.5">
              <StarPicker value={rating} onChange={setRating} disabled={busy} />
            </div>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={2000}
              placeholder="ঐচ্ছিক: সংক্ষেপে লিখুন…"
              className="mt-2 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-[13px] text-ink-800"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void submit()}
                disabled={busy}
                className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 text-sm font-extrabold text-white disabled:opacity-60 ${LIGHT_FOCUS}`}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {mine ? 'হালনাগাদ করুন' : 'রিভিউ জমা দিন'}
              </button>
              {mine && (
                <button
                  type="button"
                  onClick={resetForm}
                  className={`inline-flex min-h-[44px] items-center rounded-lg border border-brand-200 bg-white px-4 text-sm font-bold text-ink-600 ${LIGHT_FOCUS}`}
                >
                  বাতিল
                </button>
              )}
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-2 rounded-md border border-red-200 bg-red-50 p-2 text-[12px] text-red-700">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 p-2 text-[12px] text-emerald-800">
            {notice}
          </p>
        )}
      </div>

      {/* --- published list --- */}
      <div className="mt-3 space-y-2">
        {loading ? (
          <p className="flex items-center gap-2 text-[12.5px] text-ink-500">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> রিভিউ লোড হচ্ছে…
          </p>
        ) : reviews.length === 0 ? (
          <p className="rounded-xl border border-dashed border-brand-200 bg-white px-4 py-6 text-center text-[12.5px] text-ink-500">
            এখনো কোনো রিভিউ নেই। প্রথম রিভিউটি আপনিই দিতে পারেন।
          </p>
        ) : (
          reviews.map((r) => (
            <article key={r.id} className="rounded-xl border border-brand-100 bg-white p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2">
                  <Stars value={r.rating} size="sm" />
                  <span className="text-[12px] font-bold text-ink-700">
                    {r.authorId === mine?.authorId ? 'আপনি' : 'সদস্য'}
                  </span>
                </span>
                <span className="text-[11px] text-ink-400">{bnRelativeTime(r.createdAt) ?? ''}</span>
              </div>
              {r.commentBn && (
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-600">{r.commentBn}</p>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
