'use client';

import { useEffect, useState } from 'react';
import SiteReviewCard from '@/components/home/SiteReviewCard';
import {
  fetchPublishedSiteReviews,
  type SiteReview,
} from '@/lib/review-service';

export default function ReviewListing() {
  const [reviews, setReviews] = useState<SiteReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetchPublishedSiteReviews(null)
      .then((list) => {
        if (active) setReviews(list);
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : 'রিভিউ লোড করা যায়নি।');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <p className="mt-6 text-sm text-ink-500">রিভিউ লোড হচ্ছে…</p>;
  }

  if (error) {
    return (
      <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </p>
    );
  }

  if (reviews.length === 0) {
    return (
      <p className="mt-6 rounded-2xl border border-dashed border-brand-200 bg-white px-5 py-8 text-center text-sm text-ink-500">
        এখনো কোনো প্রকাশিত রিভিউ নেই।
      </p>
    );
  }

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {reviews.map((review) => (
        <SiteReviewCard key={review.id} review={review} />
      ))}
    </div>
  );
}
