'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MessageSquarePlus, Star, X, CheckCircle2, PenLine } from 'lucide-react';
import Reveal from '@/components/home/Reveal';

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
 * রিভিউ সেকশন — homepage bottom. সেবা নেওয়ার আগে বা পরে যেকোনো ব্যবহারকারী
 * তাদের মতামত দিতে পারে (লগইন ছাড়াই)। ক্লিক করলে রেটিং + লিখিত মতামতের বক্স
 * খুলে যায়; জমা হওয়া রিভিউ localStorage-এ সংরক্ষিত হয়ে নিচে তালিকা আকারে দেখায়।
 */
export default function ReviewSection() {
  const [reviews, setReviews] = useState<HomeReview[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const t = setTimeout(() => setReviews(loadReviews()), 0);
  return () => clearTimeout(t);
}, []);

  useEffect(() => {
    if (open && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [open]);

  const openForm = () => {
    setSuccess(false);
    setError('');
    setOpen(true);
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

    let next = [review, ...loadReviews()].slice(0, 24); // keep the newest batch
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      next = [review];
    }
    setReviews([review, ...reviews].slice(0, 24));
    setName('');
    setRating(0);
    setText('');
    setError('');
    setSuccess(true);
  };

  const average = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <section aria-label="রিভিউ ও মতামত" className="border-b border-brand-100 bg-mist-50 py-9 sm:py-12">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-600">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-400" aria-hidden="true" />
              সবার মতামত
            </span>
            <h2 className="mt-1.5 text-xl font-bold leading-tight text-ink-900 sm:text-2xl">
              আপনার রিভিউ দিন
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">
              সেবা নেওয়ার আগে বা পরে — যেকোনো সময় আমাদের অভিজ্ঞতা, প্রশংসা বা মতামত
              জানাতে পারেন। আপনার রিভিউ অন্যদের সঠিক সিদ্ধান্ত নিতে সাহায্য করে।
            </p>
          </div>
        </Reveal>

        {reviews.length > 0 && (
          <div className="mx-auto mt-5 flex max-w-xl items-center justify-center gap-3">
            <span className="flex items-center gap-1 text-base font-extrabold text-ink-900">
              {average}
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
            </span>
            <span className="h-4 w-px bg-brand-200" aria-hidden="true" />
            <span className="text-sm text-ink-500">{reviews.length}টি রিভিউ</span>
          </div>
        )}

        {/* Click area — opens the rating + review box */}
        <div className="mx-auto mt-6 max-w-xl">
          {!open ? (
            <button
              type="button"
              onClick={openForm}
              className="group flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-300 bg-white px-5 py-6 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-500 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 sm:py-7"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mist-50 text-brand-700 transition-colors group-hover:bg-brand-700 group-hover:text-white">
                <MessageSquarePlus className="h-6 w-6" />
              </span>
              <span className="text-base font-bold text-ink-900">রিভিউ দিন</span>
              <span className="text-[13px] text-ink-500">
                ক্লিক করুন — স্টার দিয়ে রেটিং ও মতামত লিখুন
              </span>
            </button>
          ) : (
            <div
              ref={formRef}
              className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-[15px] font-bold text-ink-900">
                  <PenLine className="h-4 w-4 text-brand-700" />
                  আপনার মতামত লিখুন
                </h3>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="বন্ধ করুন"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-mist-50 hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

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

                <button
                  type="submit"
                  className="w-full rounded-xl bg-brand-700 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 sm:w-auto"
                >
                  রিভিউ জমা দিন
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Submitted reviews */}
        {reviews.length > 0 && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.slice(0, 6).map((r) => (
              <figure
                key={r.id}
                className="flex h-full flex-col rounded-2xl border border-brand-100 bg-white p-5 shadow-sm"
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
        )}
      </div>
    </section>
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