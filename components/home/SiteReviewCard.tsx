import { Star, Tag } from 'lucide-react';
import type { SiteReview } from '@/lib/review-service';

export default function SiteReviewCard({
  review,
  compact = false,
}: {
  review: SiteReview;
  compact?: boolean;
}) {
  return (
    <figure
      className={`flex flex-col rounded-2xl border border-brand-100 bg-white shadow-sm ${
        compact ? 'h-[248px] p-4' : 'h-full p-5'
      }`}
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
          {formatReviewDate(review.createdAt)}
        </time>
      </div>
      {review.service && (
        <p className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-md border border-brand-100 bg-brand-50 px-2 py-1 text-[11px] font-bold text-brand-800">
          <Tag className="h-3 w-3" aria-hidden="true" />
          {review.service}
        </p>
      )}
      <blockquote
        className={`mt-3 flex-1 text-sm leading-relaxed text-ink-700 ${
          compact ? 'line-clamp-5' : ''
        }`}
      >
        “{review.body}”
      </blockquote>
      <figcaption className="mt-4 flex items-center gap-2.5 border-t border-brand-100 pt-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-700 text-[13px] font-bold text-white">
          {review.name.charAt(0)}
        </span>
        <p className="text-sm font-bold text-ink-900">{review.name}</p>
      </figcaption>
    </figure>
  );
}

function formatReviewDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const months = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর',
  ];
  const toBanglaDigits = (value: number) =>
    String(value).replace(/\d/g, (digit) => '০১২৩৪৫৬৭৮৯'[Number(digit)]);
  return `${toBanglaDigits(date.getDate())} ${months[date.getMonth()]}, ${toBanglaDigits(date.getFullYear())}`;
}
