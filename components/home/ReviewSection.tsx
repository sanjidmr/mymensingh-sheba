'use client';

import React, { useEffect, useState } from 'react';
import { MessageSquarePlus, Star, X, CheckCircle2, PenLine, Tag } from 'lucide-react';
import Link from 'next/link';
import { LAUNCH_SERVICES } from '@/lib/services-data';
import { useAuth } from '@/lib/auth-context';
import {
  fetchPublishedSiteReviews,
  submitSiteReview,
  type SiteReview,
} from '@/lib/review-service';

/** যেসব সেবার রিভিউ দেওয়া যায় — তালিকা থেকে নাম সিঙ্ক রাখতে নির্বাচিত স্লাগ */
const REVIEWABLE_SLUGS = [
  'tolet',
  'kajer-bua',
  'electrician',
  'plumber',
  'home-moving',
  'ac-fridge',
  'home-tutor',
  'gari-auto-cng',
  'buysell',
  'bus-ticket',
  'coaching',
  'wifi',
];

const SERVICE_OPTIONS = REVIEWABLE_SLUGS.map((slug) => {
  const service = LAUNCH_SERVICES.find((s) => s.slug === slug);
  return { slug, nameBn: service?.nameBn ?? slug };
});

function StarSelector({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex items-center gap-0.5" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          aria-label={`${n} স্টার`}
          className="rounded-md p-1 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          <Star
            className={`h-6 w-6 sm:h-7 sm:w-7 ${n <= shown ? 'fill-amber-400 text-amber-400' : 'text-brand-200'}`}
          />
        </button>
      ))}
    </div>
  );
}

/**
 * প্রকাশিত রিভিউ দেখায় এবং লগইন করা ব্যবহারকারীকে নতুন রিভিউ জমা দিতে দেয়।
 */
export default function ReviewSection() {
  const { user, isLoading: authLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const [reviews, setReviews] = useState<SiteReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState('');
  const [service, setService] = useState('');
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchPublishedSiteReviews()
      .then((list) => {
        if (alive) setReviews(list);
      })
      .catch((cause: unknown) => {
        if (alive) {
          setReviewsError(cause instanceof Error ? cause.message : 'রিভিউ লোড করা যায়নি।');
        }
      })
      .finally(() => {
        if (alive) setReviewsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const handler = () => {
      setError('');
      setSuccess(false);
      setOpen(true);
    };
    window.addEventListener('mms:open-review', handler);
    return () => window.removeEventListener('mms:open-review', handler);
  }, []);

  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const resetForm = () => {
    setService('');
    setRating(0);
    setText('');
    setError('');
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!user) {
      setError('রিভিউ দিতে আগে লগইন করুন।');
      return;
    }
    if (rating === 0) {
      setError('দয়া করে স্টার দিয়ে রেটিং দিন।');
      return;
    }
    if (!service) {
      setError('দয়া করে কোন সেবা নিয়েছেন সেটি নির্বাচন করুন।');
      return;
    }
    if (!text.trim()) {
      setError('দয়া করে আপনার মতামত লিখুন।');
      return;
    }

    setSubmitting(true);
    const result = await submitSiteReview({
      name: user.fullName,
      service,
      rating,
      body: text.trim(),
      userId: user.id,
    });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.errorBn);
      return;
    }

    resetForm();
    setSuccess(true);
  };

  const average = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <>
      <section className="bg-mist-50 py-10 sm:py-14" aria-labelledby="site-reviews-heading">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">
                আপনাদের অভিজ্ঞতা
              </span>
              <h2 id="site-reviews-heading" className="mt-1 text-2xl font-extrabold text-ink-900 sm:text-3xl">
                ময়মনসিংহবাসীর মতামত
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-500">
                Mymensingh Sheba ব্যবহারকারীদের প্রকাশিত রিভিউ।
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setError('');
                setSuccess(false);
                setOpen(true);
              }}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              <MessageSquarePlus className="h-4 w-4" />
              রিভিউ দিন
            </button>
          </div>

          {reviewsError ? (
            <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {reviewsError}
            </p>
          ) : reviewsLoading ? (
            <p className="mt-6 text-sm text-ink-500">রিভিউ লোড হচ্ছে…</p>
          ) : reviews.length > 0 && (
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white px-3 py-1.5 text-sm font-semibold text-ink-700">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
              {average} <span className="font-normal text-ink-500">/ ৫ · {reviews.length}টি রিভিউ</span>
            </div>
          )}

          {!reviewsError && !reviewsLoading && reviews.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-dashed border-brand-200 bg-white px-5 py-8 text-center text-sm text-ink-500">
              এখনো কোনো প্রকাশিত রিভিউ নেই। আপনার অভিজ্ঞতা জানাতে রিভিউ দিন।
            </p>
          ) : !reviewsError && !reviewsLoading && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.slice(0, 6).map((review) => (
                <figure
                  key={review.id}
                  className="flex h-full flex-col rounded-2xl border border-brand-100 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-0.5" aria-label={`${review.rating} স্টার`}>
                      {Array.from({ length: 5 }, (_, index) => (
                        <Star
                          key={index}
                          className={`h-4 w-4 ${index < review.rating ? 'fill-amber-400 text-amber-400' : 'text-brand-200'}`}
                          aria-hidden="true"
                        />
                      ))}
                    </span>
                    <time className="text-[11px] text-ink-400" dateTime={review.createdAt}>
                      {relativeDate(review.createdAt)}
                    </time>
                  </div>
                  {review.service && (
                    <p className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-md border border-brand-100 bg-brand-50 px-2 py-1 text-[11px] font-bold text-brand-800">
                      <Tag className="h-3 w-3" aria-hidden="true" />
                      {review.service}
                    </p>
                  )}
                  <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-ink-700">
                    “{review.body}”
                  </blockquote>
                  <figcaption className="mt-4 flex items-center gap-2.5 border-t border-brand-100 pt-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-700 text-[13px] font-bold text-white">
                      {review.name.charAt(0)}
                    </span>
                    <p className="text-sm font-bold text-ink-900">{review.name}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </div>
      </section>

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-900/50 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="আপনার রিভিউ দিন"
        >
          <div
            className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-brand-100 px-5 py-4 sm:px-6">
              <div>
                <h3 className="flex items-center gap-2 text-base font-bold text-ink-900 sm:text-lg">
                  <MessageSquarePlus className="h-5 w-5 text-brand-700" />
                  আপনার রিভিউ দিন
                </h3>
                <p className="mt-0.5 text-xs text-ink-500">
                  জমা দেওয়ার পর অ্যাডমিন অনুমোদন করলে রিভিউটি প্রকাশিত হবে।
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="বন্ধ করুন"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-ink-500 transition-colors hover:bg-mist-50 hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              {authLoading ? (
                <p className="text-sm text-ink-500">অ্যাকাউন্ট যাচাই হচ্ছে…</p>
              ) : !user ? (
                <div className="rounded-2xl border border-brand-100 bg-mist-50 p-5 text-center">
                  <p className="text-sm leading-relaxed text-ink-700">
                    রিভিউ দিতে আপনার অ্যাকাউন্টে লগইন করুন।
                  </p>
                  <Link
                    href={`/login?next=${encodeURIComponent('/')}`}
                    className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-800"
                  >
                    লগইন করুন
                  </Link>
                </div>
              ) : (
                <form onSubmit={submitReview} className="space-y-4">
                  <p className="rounded-xl bg-mist-50 px-3.5 py-2.5 text-sm text-ink-700">
                    রিভিউ দিচ্ছেন: <span className="font-bold">{user.fullName}</span>
                  </p>

                  <div>
                    <span className="mb-1.5 block text-xs font-semibold text-ink-700">কেমন লাগলো?</span>
                    <StarSelector value={rating} onChange={setRating} />
                  </div>

                  <div>
                    <label htmlFor="review-service" className="mb-1.5 block text-xs font-semibold text-ink-700">
                      কোন সেবা নিয়েছেন?
                    </label>
                    <select
                      id="review-service"
                      value={service}
                      onChange={(e) => setService(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-brand-100 bg-mist-50 px-3.5 py-2.5 text-sm text-ink-900 outline-none transition-colors focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20"
                    >
                      <option value="">সেবা নির্বাচন করুন</option>
                      {SERVICE_OPTIONS.map((option) => (
                        <option key={option.slug} value={option.nameBn}>
                          {option.nameBn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="review-text" className="mb-1.5 block text-xs font-semibold text-ink-700">
                      আপনার রিভিউ
                    </label>
                    <textarea
                      id="review-text"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      rows={4}
                      minLength={10}
                      maxLength={1500}
                      placeholder="আপনার অভিজ্ঞতা বা মতামত লিখুন..."
                      className="w-full resize-none rounded-xl border border-brand-100 bg-mist-50 px-3.5 py-2.5 text-sm leading-relaxed text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20"
                    />
                    <p className="mt-1 text-right text-[11px] text-ink-400">{text.length}/১৫০০</p>
                  </div>

                  {error && <p role="alert" className="text-[13px] font-medium text-red-600">{error}</p>}

                  {success && (
                    <p role="status" className="flex items-center gap-1.5 text-[13px] font-semibold text-brand-700">
                      <CheckCircle2 className="h-4 w-4" />
                      ধন্যবাদ! আপনার রিভিউ জমা হয়েছে। অ্যাডমিন অনুমোদনের পর এটি হোমপেজে দেখা যাবে।
                    </p>
                  )}

                  <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={close}
                      className="rounded-xl border border-brand-200 px-5 py-3 text-sm font-semibold text-brand-800 transition-colors hover:bg-mist-50"
                    >
                      পরে দেব
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <PenLine className="h-4 w-4" />
                      {submitting ? 'জমা হচ্ছে…' : 'রিভিউ জমা দিন'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function relativeDate(iso: string): string {
  // Hand-formatted rather than toLocaleDateString: Node and the browser carry
  // different ICU data and render bn-BD differently, which is a hydration
  // mismatch. See formatBanglaDate in lib/mymensingh-live.ts.
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const months = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর',
  ];
  const bn = (n: number) =>
    String(n).replace(/\d/g, (d2) => '০১২৩৪৫৬৭৮৯'[Number(d2)]);
  return `${bn(d.getDate())} ${months[d.getMonth()]}, ${bn(d.getFullYear())}`;
}
