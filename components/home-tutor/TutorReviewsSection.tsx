'use client';

import React, { useEffect, useState } from 'react';
import { Star, MessageSquareQuote, Loader2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import {
  fetchTutorReviews,
  fetchReviewEligibility,
  createTutorReview,
  type ReviewEligibility,
} from '@/lib/home-tutor-service';
import type { HomeTutorProfile, TutorReview } from '@/lib/supabase/types';
import { useAuth } from '@/lib/auth-context';

interface TutorReviewsSectionProps {
  tutor: HomeTutorProfile;
}

function StarRow({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i <= Math.round(value) ? 'fill-amber-400 text-amber-500' : 'text-slate-300'}`}
        />
      ))}
    </div>
  );
}

export function TutorReviewsSection({ tutor }: TutorReviewsSectionProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<TutorReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [eligibility, setEligibility] = useState<ReviewEligibility>({
    eligible: false,
    alreadyReviewed: false,
  });
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const list = await fetchTutorReviews(tutor.id);
      if (cancelled) return;
      setReviews(list);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tutor.id]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetchReviewEligibility(user.id, tutor.id).then((el) => {
      if (!cancelled) setEligibility(el);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, tutor.id]);

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eligibility.completedRequestId) return;
    setSending(true);
    const res = await createTutorReview({
      tutorId: tutor.id,
      requestId: eligibility.completedRequestId,
      rating,
      comment: comment.trim() || undefined,
    });
    setSending(false);
    if (res.success) setSent(true);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <MessageSquareQuote className="w-4 h-4 text-emerald-800" />
          অভিভাবকদের রিভিউ
        </h3>
        {Number(tutor.ratingCount ?? 0) > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            {Number(tutor.ratingAvg ?? 0).toFixed(1)} / 5
            <span className="font-medium text-amber-600/80">({tutor.ratingCount ?? 0}টি রিভিউ)</span>
          </span>
        )}
      </div>

      {loading ? (
        <div className="py-8 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-700" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="mt-4 p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200 text-center">
          <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-xs text-slate-600 leading-relaxed">
            এখনও কোনো রিভিউ নেই। প্রথম ক্লাস সম্পন্নের পরপরই কেবল রিভিউ দেওয়া যায় — তাই সব রিভিউ
            বাস্তব অভিজ্ঞতার প্রতিফলন।
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="p-4 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-sm font-black shrink-0">
                    {(r.customerName || 'অ').charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-slate-900 truncate">
                      {r.customerName || 'ভেরিফায়েড অভিভাবক'}
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      {new Date(r.createdAt).toLocaleDateString('bn-BD')}
                    </span>
                  </div>
                </div>
                <StarRow value={r.rating} />
              </div>
              {r.comment && (
                <p className="mt-2.5 text-xs text-slate-600 leading-relaxed">{r.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {sent && (
        <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-center">
          <CheckCircle2 className="w-7 h-7 text-emerald-700 mx-auto mb-1.5" />
          <p className="text-sm font-bold">ধন্যবাদ! আপনার রিভিউ জমা হয়েছে।</p>
        </div>
      )}

      {!sent && eligibility.eligible && !sending && (
        <form onSubmit={submitReview} className="mt-5 pt-5 border-t border-slate-100">
          <h4 className="text-sm font-bold text-slate-900 mb-3">
            আপনার সম্পন্ন টিউশনের অভিজ্ঞতা লিখুন
          </h4>
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setRating(i)}
                className="p-1"
                aria-label={`${i} স্টার`}
              >
                <Star
                  className={`w-7 h-7 ${i <= rating ? 'fill-amber-400 text-amber-500' : 'text-slate-300'}`}
                />
              </button>
            ))}
          </div>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="শিক্ষক সম্পর্কে সংক্ষেপে লিখুন..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
          />
          <button
            type="submit"
            className="mt-3 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold"
          >
            রিভিউ জমা দিন
          </button>
        </form>
      )}

      {!sent && eligibility.alreadyReviewed && (
        <p className="mt-4 text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-3">
          আপনি এই শিক্ষকের জন্য ইতোমধ্যে রিভিউ দিয়েছেন। প্রতি সম্পন্ন টিউশনে একটি করে রিভিউ দেওয়া
          যায়।
        </p>
      )}
    </div>
  );
}