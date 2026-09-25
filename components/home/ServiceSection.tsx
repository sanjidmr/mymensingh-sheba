'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Reveal from '@/components/home/Reveal';

interface ServiceSectionProps {
  id?: string;
  eyebrow: string;
  title: string;
  description?: string;
  seeMoreHref: string;
  background?: 'white' | 'soft' | 'tint';
  children: React.ReactNode;
}

const BG_CLASS: Record<NonNullable<ServiceSectionProps['background']>, string> = {
  white: 'bg-white',
  soft: 'bg-mist-50',
  tint: 'bg-mist-50',
};

export default function ServiceSection({
  id,
  eyebrow,
  title,
  description,
  seeMoreHref,
  background = 'white',
  children,
}: ServiceSectionProps) {
  return (
    <section
      id={id}
      className={`${BG_CLASS[background]} py-9 sm:py-12 scroll-mt-24`}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-600">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-400" aria-hidden="true" />
                {eyebrow}
              </span>
              <h2 className="mt-1.5 text-xl font-bold leading-tight text-ink-900 sm:text-2xl">
                {title}
              </h2>
              {description && (
                <p className="mt-1.5 text-sm leading-relaxed text-ink-500 sm:text-[15px]">
                  {description}
                </p>
              )}
            </div>
            <Link
              href={seeMoreHref}
              className="group inline-flex min-h-[44px] w-full shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 transition-all duration-300 hover:border-brand-300 hover:bg-brand-50 sm:w-auto sm:self-auto"
            >
              আরও দেখুন
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Reveal>

        {children}
      </div>
    </section>
  );
}