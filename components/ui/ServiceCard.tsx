import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { Rating } from '@/components/ui/Rating';
import { cn } from '@/lib/utils';

export interface ServiceCardProps {
  title: string;
  href: string;
  image?: string | null;
  imageAlt?: string;
  price?: string;
  area?: string;
  rating?: number;
  ratingCount?: number;
  ctaLabel?: string;
  className?: string;
}

export function ServiceCard({
  title,
  href,
  image,
  imageAlt = '',
  price,
  area,
  rating,
  ratingCount,
  ctaLabel = 'বিস্তারিত দেখুন',
  className,
}: ServiceCardProps) {
  return (
    <article className={cn('ui-card ui-pressable group min-w-0 overflow-hidden rounded-2xl transition-shadow hover:shadow-lg', className)}>
      <Link href={href} className="block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600">
        {image ? (
          <div className="relative aspect-[16/10] overflow-hidden bg-[var(--ui-surface-muted)]">
            <Image src={image} alt={imageAlt || title} fill sizes="(max-width: 767px) 90vw, 360px" className="object-cover transition-transform duration-200 group-hover:scale-[1.03]" />
          </div>
        ) : (
          <div aria-hidden="true" className="flex aspect-[16/10] items-center justify-center bg-brand-50 text-brand-700">
            <span className="text-4xl font-bold">{title.trim().slice(0, 1)}</span>
          </div>
        )}
        <div className="space-y-3 p-4">
          <h3 className="line-clamp-2 text-base font-bold leading-snug text-text">{title}</h3>
          <div className="flex min-h-5 flex-wrap items-center justify-between gap-2">
            {area && (
              <span className="inline-flex min-w-0 items-center gap-1 text-sm text-text-muted">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{area}</span>
              </span>
            )}
            {rating !== undefined && <Rating value={rating} count={ratingCount} />}
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-[var(--ui-border)] pt-3">
            {price && <span className="font-bold text-brand-800">{price}</span>}
            <span className="ml-auto inline-flex min-h-10 items-center gap-1 rounded-xl bg-brand-50 px-3 text-sm font-semibold text-brand-800">
              {ctaLabel}
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
