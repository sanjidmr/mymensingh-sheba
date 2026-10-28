import Link from 'next/link';
import { ArrowUpRight, PenLine } from 'lucide-react';
import { NEWS_CATEGORIES } from '@/lib/catalog-types';
import type { NewsSearchItem } from '@/lib/news/news-utils';
import NewsSearch from './NewsSearch';

/**
 * The masthead is the newspaper's identity: date line, wordmark, section rail,
 * and the two reader actions (search / send news). It intentionally does not
 * reuse the service-site navbar — the news desk is its own publication inside
 * Mymensingh Sheba.
 */
export default function NewsMasthead({
  todayLabel,
  searchItems,
  activeCategory,
}: {
  todayLabel: string;
  searchItems: NewsSearchItem[];
  activeCategory?: string;
}) {
  const active = activeCategory?.trim() || '';

  return (
    <header className="bg-white text-[#141414]">
      {/* Utility strip */}
      <div className="border-b border-[#ded9ce] bg-[#faf8f2]">
        <div className="mx-auto flex h-9 w-full max-w-[1180px] items-center justify-between gap-3 px-4 text-[11px] text-[#5f5a51] sm:px-6 lg:px-8">
          <p className="truncate">{todayLabel}</p>
          <div className="hidden items-center gap-4 md:flex">
            <span className="text-[#8a857b]">ময়মনসিংহ ও আশপাশের এলাকার সংবাদ</span>
            <Link
              href="/"
              className="inline-flex items-center gap-1 font-semibold text-[#0c3b2e] transition-colors hover:text-[#0a3227]"
            >
              ময়মনসিংহ শেবা
              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </div>
          <Link
            href="/news/create"
            className="inline-flex items-center gap-1 font-semibold text-[#0c3b2e] transition-colors hover:text-[#0a3227] md:hidden"
          >
            সংবাদ পাঠান
            <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* Masthead */}
      <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3.5 sm:grid-cols-[1fr_auto] sm:py-4 lg:grid-cols-[1fr_auto_1fr] lg:py-6">
          <div className="hidden lg:block">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8a857b]">
              সংবাদ ডেস্ক
            </p>
            <p className="mt-2 max-w-[210px] text-[11.5px] leading-relaxed text-[#6d685f]">
              স্থানীয় প্রতিবেদন, নাগরিক কণ্ঠ ও ময়মনসিংহের প্রয়োজনীয় খবর।
            </p>
          </div>

          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3 lg:justify-center">
            <span
              aria-hidden="true"
              className="hidden h-12 w-12 shrink-0 items-center justify-center bg-[#0c3b2e] font-[family-name:var(--font-news-serif)] text-[26px] font-bold leading-none text-white sm:flex"
            >
              ম
            </span>
            <div className="min-w-0">
              <p className="truncate text-[8.5px] font-bold uppercase tracking-[0.2em] text-[#8a6b2f] sm:text-[9px] sm:tracking-[0.22em]">
                ময়মনসিংহ শেবা · সংবাদ
              </p>
              <div
                aria-label="ময়মনসিংহের নিউজ"
                className="font-[family-name:var(--font-news-serif)] text-[24px] font-black leading-[1.08] tracking-[-0.015em] text-[#141414] sm:text-[38px] lg:text-[46px]"
              >
                ময়মনসিংহের <span className="text-[#0c3b2e]">নিউজ</span>
              </div>
              <p className="mt-1 hidden text-[11px] font-medium text-[#6d685f] sm:block">
                ময়মনসিংহ থেকে প্রকাশিত নির্ভরযোগ্য সংবাদ
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <NewsSearch items={searchItems} />
            <Link
              href="/news/create"
              className="hidden h-10 items-center gap-1.5 bg-[#0c3b2e] px-3.5 text-[12px] font-bold text-white transition-colors hover:bg-[#0a3227] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0c3b2e] focus-visible:ring-offset-2 sm:inline-flex"
            >
              <PenLine className="h-3.5 w-3.5" aria-hidden="true" />
              সংবাদ পাঠান
            </Link>
          </div>
        </div>
      </div>

      {/* Section rail */}
      <nav
        aria-label="সংবাদ বিভাগ"
        className="sticky top-0 z-40 border-y border-[#141414]/15 bg-white/95 backdrop-blur-md"
      >
        <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-8">
          <div className="no-scrollbar flex min-h-11 items-stretch gap-0 overflow-x-auto">
            <Link
              href="/news"
              aria-current={!active ? 'page' : undefined}
              className={`relative flex shrink-0 items-center whitespace-nowrap px-3 text-[12.5px] font-bold transition-colors first:pl-0 sm:px-4 ${
                !active ? 'text-[#0c3b2e]' : 'text-[#4b473f] hover:text-[#0c3b2e]'
              }`}
            >
              প্রচ্ছদ
              {!active && (
                <span className="absolute inset-x-2 bottom-0 h-[2px] bg-[#0c3b2e] first:left-0 sm:inset-x-3" />
              )}
            </Link>
            <span aria-hidden="true" className="my-2.5 w-px shrink-0 bg-[#ded9ce]" />
            {NEWS_CATEGORIES.map((desk) => {
              const isActive = active === desk.id;
              return (
                <Link
                  key={desk.id}
                  href={`/news?category=${encodeURIComponent(desk.id)}`}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative flex shrink-0 items-center whitespace-nowrap px-3 text-[12.5px] font-semibold transition-colors sm:px-4 ${
                    isActive
                      ? 'text-[#0c3b2e]'
                      : 'text-[#4b473f] hover:text-[#0c3b2e]'
                  }`}
                >
                  {desk.labelBn}
                  {isActive && <span className="absolute inset-x-2 bottom-0 h-[2px] bg-[#0c3b2e] sm:inset-x-3" />}
                </Link>
              );
            })}
            <Link
              href="/news/create"
              className="ml-auto hidden shrink-0 items-center whitespace-nowrap pl-4 text-[12px] font-bold text-[#0c3b2e] hover:text-[#0a3227] lg:flex"
            >
              আপনার খবর পাঠান →
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
