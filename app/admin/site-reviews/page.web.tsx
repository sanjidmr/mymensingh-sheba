'use client';

import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, Star } from 'lucide-react';
import { AdminEmpty, AdminError, AdminLoading } from '@/components/admin/States';
import { PageHeader, Panel } from '@/components/admin/PageHeader';
import {
  fetchAdminSiteReviews,
  setSiteReviewStatus,
  type SiteReview,
} from '@/lib/review-service';

export default function AdminSiteReviewsPage() {
  const [reviews, setReviews] = useState<SiteReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const data = await fetchAdminSiteReviews();
        if (active) setReviews(data);
      } catch (cause) {
        if (active) {
          setError(cause instanceof Error ? cause.message : 'সাইট রিভিউ লোড করা যায়নি।');
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const toggleStatus = async (review: SiteReview) => {
    setBusyId(review.id);
    setError('');
    const status = review.status === 'published' ? 'hidden' : 'published';
    const result = await setSiteReviewStatus(review.id, status);
    if (!result.success) {
      setError(result.error ?? 'রিভিউর অবস্থা পরিবর্তন করা যায়নি।');
    } else {
      setReviews((current) =>
        current.map((item) => item.id === review.id ? { ...item, status } : item)
      );
    }
    setBusyId(null);
  };

  return (
    <>
      <PageHeader
        title="হোমপেজ রিভিউ"
        description="হোমপেজের “আপনার রিভিউ দিন” ফর্ম থেকে আসা রিভিউ দেখুন এবং প্রকাশ বা আড়াল করুন।"
        count={`মোট ${reviews.length} টি`}
      />
      {error && (
        <div className="mb-4">
          <AdminError title="সাইট রিভিউ ব্যবস্থাপনায় সমস্যা" message={error} />
        </div>
      )}
      <Panel>
        {loading ? (
          <AdminLoading label="হোমপেজ রিভিউ লোড হচ্ছে…" />
        ) : reviews.length === 0 ? (
          <AdminEmpty
            title="এখনো কোনো হোমপেজ রিভিউ নেই"
            description="ফর্ম থেকে সফলভাবে জমা হওয়া রিভিউ এখানে দেখা যাবে।"
          />
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <article key={review.id} className="rounded-xl border border-admin-border p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-bold text-admin-text">{review.name}</h2>
                      <span className="rounded-md bg-admin-page px-2 py-1 text-[11px] text-admin-muted">
                        {review.service}
                      </span>
                      <span className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                        review.status === 'published'
                          ? 'bg-emerald-50 text-emerald-800'
                          : review.status === 'pending'
                            ? 'bg-amber-50 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                      }`}>
                        {review.status === 'published'
                          ? 'প্রকাশিত'
                          : review.status === 'pending'
                            ? 'অনুমোদনের অপেক্ষায়'
                            : 'আড়াল করা'}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-amber-600" aria-label={`${review.rating} স্টার`}>
                      {Array.from({ length: 5 }, (_, index) => (
                        <Star
                          key={index}
                          className={`h-4 w-4 ${index < review.rating ? 'fill-current' : 'text-slate-300'}`}
                        />
                      ))}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-admin-text">
                      {review.body}
                    </p>
                    <time className="mt-2 block text-[11px] text-admin-muted" dateTime={review.createdAt}>
                      {new Date(review.createdAt).toLocaleString('bn-BD')}
                    </time>
                  </div>
                  <button
                    type="button"
                    disabled={busyId === review.id}
                    onClick={() => void toggleStatus(review)}
                    className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-admin-border bg-white px-3 text-xs font-semibold text-admin-text hover:bg-admin-page disabled:opacity-60"
                  >
                    {review.status === 'published'
                      ? <><EyeOff className="h-4 w-4" /> আড়াল করুন</>
                      : <><Eye className="h-4 w-4" /> {review.status === 'pending' ? 'অনুমোদন করে প্রকাশ করুন' : 'প্রকাশ করুন'}</>}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}
