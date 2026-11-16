import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

const CATEGORIES = [
  { slug: 'car', title: 'গাড়ি ভাড়া করুন', image: '/car.jpg', alt: 'ভাড়ার গাড়ি' },
  { slug: 'auto', title: 'অটো ভাড়া করুন', image: '/auto.jpg', alt: 'ভাড়ার অটো' },
  { slug: 'cng', title: 'সিএনজি ভাড়া করুন', image: '/cng.jpg', alt: 'ভাড়ার সিএনজি' },
] as const;

export default function VehicleCategoryCards({ className = '' }: { className?: string }) {
  return (
    <div className={`grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3 ${className}`}>
      {CATEGORIES.map((category) => (
        <Link
          key={category.slug}
          href={`/gari-auto-cng/book/${category.slug}`}
          className="group flex min-h-24 min-w-0 overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 md:min-h-0 md:flex-col"
          aria-label={category.title}
        >
          <span className="relative block aspect-[5/4] w-[40%] shrink-0 overflow-hidden bg-mist-100 md:aspect-[16/10] md:w-full">
            <Image
              src={category.image}
              alt={category.alt}
              fill
              sizes="(max-width: 767px) 40vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            />
          </span>
          <span className="flex min-w-0 flex-1 items-center justify-between gap-2 px-3.5 py-3 text-sm font-extrabold text-ink-900 sm:px-5 sm:py-4 sm:text-base md:min-h-20">
            <span className="min-w-0">
              <span className="block leading-snug">{category.title}</span>
              <span className="mt-1 block text-xs font-medium text-ink-500">যাত্রার বুকিং অনুরোধ পাঠান</span>
            </span>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-brand-700 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </Link>
      ))}
    </div>
  );
}
