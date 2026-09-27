'use client';

import React, { useEffect, useState } from 'react';
import { MessageSquarePlus, Star, X, CheckCircle2, PenLine } from 'lucide-react';

interface HomeReview {
  id: string;
  name: string;
  rating: number;
  text: string;
  date: string;
}

const STORAGE_KEY = 'mms_home_reviews_v1';

function loadReviews(): HomeReview[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HomeReview[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

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
 * রিভিউ মোডাল — হোমপেজের শেষ CTA-র "আপনার রিভিউ দিন" বাটন থেকে
 * `mms:open-review` ইভেন্টে খোলে। স্ট্যান্ডঅ্যালোন সেকশন হিসেবে আর দেখা যায় না।
 */
export default function ReviewSection() {
  const [open, setOpen] = useState(false);
  const [reviews, setReviews] = useState<HomeReview[]>([]);
  const [name, setName] = useState('');
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReviews(loadReviews()), 0);
    return () => clearTimeout(t);
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
    setName('');
    setRating(0);
    setText('');
    setError('');
  };

  const submitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError('দয়া করে স্টার দিয়ে রেটিং দিন।');
      return;
    }
    if (!name.trim()) {
      setError('দয়া করে আপনার নাম লিখুন।');
      return;
    }
    if (!text.trim()) {
      setError('দয়া করে আপনার মতামত লিখুন।');
      return;
    }

    const review: HomeReview = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim(),
      rating,
      text: text.trim(),
      date: new Date().toISOString(),
    };

    let next = [review, ...loadReviews()].slice(0, 24);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      next = [review];
    }
    setReviews(next);
    resetForm();
    setSuccess(true);
  };

  const average = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  if (!open) return null;

  return (
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
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-brand-100 px-5 py-4 sm:px-6">
          <div>
            <h3 className="flex items-center gap-2 text-base font-bold text-ink-900 sm:text-lg">
              <MessageSquarePlus className="h-5 w-5 text-brand-700" />
              আপনার রিভিউ দিন
            </h3>
            <p className="mt-0.5 text-xs text-ink-500">
              সেবা নেওয়ার আগে বা পরে — যেকোনো সময় আপনার মতামত জানাতে পারেন।
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {reviews.length > 0 && (
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-brand-100 bg-mist-50 px-4 py-3">
              <span className="flex items-center gap-1 text-lg font-extrabold text-ink-900">
                {average}
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
              </span>
              <span className="h-4 w-px bg-brand-200" aria-hidden="true" />
              <span className="text-sm text-ink-500">{reviews.length}টি রিভিউ</span>
            </div>
          )}

          <form onSubmit={submitReview} className="space-y-4">
            <div>
              <label htmlFor="review-name" className="mb-1.5 block text-xs font-semibold text-ink-700">
                আপনার নাম
              </label>
              <input
                id="review-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="যেমন: রবিউল ইসলাম"
                className="w-full rounded-xl border border-brand-100 bg-mist-50 px-3.5 py-2.5 text-sm text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <span className="mb-1.5 block text-xs font-semibold text-ink-700">কেমন লাগলো?</span>
              <StarSelector value={rating} onChange={setRating} />
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
                placeholder="আপনার অভিজ্ঞতা বা মতামত লিখুন..."
                className="w-full resize-none rounded-xl border border-brand-100 bg-mist-50 px-3.5 py-2.5 text-sm leading-relaxed text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            {error && <p className="text-[13px] font-medium text-red-600">{error}</p>}

            {success && (
              <p className="flex items-center gap-1.5 text-[13px] font-semibold text-brand-700">
                <CheckCircle2 className="h-4 w-4" />
                ধন্যবাদ! আপনার রিভিউ যুক্ত হয়েছে।
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
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                <PenLine className="h-4 w-4" />
                রিভিউ জমা দিন
              </button>
            </div>
          </form>

          {/* Submitted reviews */}
          {reviews.length > 0 && (
            <div className="mt-7 border-t border-brand-100 pt-5">
              <h4 className="mb-3 text-sm font-bold text-ink-900">আপনাদের মতামত</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                {reviews.slice(0, 6).map((r) => (
                  <figure
                    key={r.id}
                    className="flex h-full flex-col rounded-2xl border border-brand-100 bg-mist-50 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-brand-200'}`}
                            aria-hidden="true"
                          />
                        ))}
                      </span>
                      <time className="text-[11px] text-ink-400">{relativeDate(r.date)}</time>
                    </div>
                    <blockquote className="mt-3 flex-1 text-[14px] leading-relaxed text-ink-700">
                      “{r.text}”
                    </blockquote>
                    <figcaption className="mt-4 flex items-center gap-2.5 border-t border-brand-100 pt-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-700 text-[13px] font-bold text-white">
                        {r.name.charAt(0)}
                      </span>
                      <p className="text-sm font-bold text-ink-900">{r.name}</p>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function relativeDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('bn-BD', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}