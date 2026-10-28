'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Search, X } from 'lucide-react';
import type { NewsSearchItem } from '@/lib/news/news-utils';

/**
 * Real search over the approved stories the server just sent.
 *
 * The input both filters in place (instant suggestions) and submits to
 * `/news?q=…`, which the server filters against the same published rows. No
 * placeholder "search" field, and no query is answered with invented results.
 */
export default function NewsSearch({ items }: { items: NewsSearchItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 40);
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', closeOnEscape);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [open]);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items.slice(0, 5);
    return items
      .filter((item) =>
        [item.titleBn, item.summaryBn, item.categoryLabel]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(needle)
      )
      .slice(0, 7);
  }, [items, query]);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = query.trim();
    setOpen(false);
    setQuery('');
    router.push(value ? `/news?q=${encodeURIComponent(value)}` : '/news');
  };

  const close = () => setOpen(false);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label="সংবাদ খুঁজুন"
        className="inline-flex h-10 items-center gap-2 border border-[#d9d5cb] bg-white px-2.5 text-[12px] font-semibold text-[#242424] transition-colors hover:border-[#0c3b2e] hover:text-[#0c3b2e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0c3b2e] focus-visible:ring-offset-2 sm:px-3.5"
      >
        <Search className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">খুঁজুন</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[90]">
          <button
            type="button"
            tabIndex={-1}
            aria-label="সার্চ বন্ধ করুন"
            onClick={close}
            className="absolute inset-0 h-full w-full cursor-default bg-[#101010]/45 backdrop-blur-[1px]"
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="news-search-title"
            className="relative mx-auto mt-[7vh] w-[calc(100%-1.5rem)] max-w-2xl border border-[#d9d5cb] bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b-2 border-[#141414] px-4 py-3 sm:px-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#0c3b2e]">
                  ময়মনসিংহের নিউজ
                </p>
                <h2 id="news-search-title" className="mt-0.5 text-lg font-extrabold text-[#141414]">
                  সংবাদ খুঁজুন
                </h2>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="সার্চ বন্ধ করুন"
                className="flex h-10 w-10 items-center justify-center border border-transparent text-[#555] transition-colors hover:border-[#d9d5cb] hover:text-[#141414] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0c3b2e]"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={submit} role="search" className="border-b border-[#e4e0d6] p-4 sm:p-5">
              <div className="flex items-center gap-2 border border-[#cfcabf] bg-[#fbfaf7] px-3 focus-within:border-[#0c3b2e]">
                <Search className="h-4 w-4 shrink-0 text-[#0c3b2e]" aria-hidden="true" />
                <input
                  ref={inputRef}
                  type="search"
                  name="q"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="শিরোনাম, বিভাগ বা বিষয় লিখুন…"
                  aria-label="সংবাদ খুঁজুন"
                  className="h-12 min-w-0 flex-1 bg-transparent text-[15px] text-[#141414] outline-none placeholder:text-[#8a857b]"
                />
                <button
                  type="submit"
                  className="hidden h-8 shrink-0 items-center bg-[#0c3b2e] px-3 text-[12px] font-bold text-white transition-colors hover:bg-[#0a3227] sm:inline-flex"
                >
                  খুঁজুন
                </button>
              </div>
              <p className="mt-2 text-[11px] text-[#78736a]">
                সব ফলাফল দেখতে Enter চাপুন।
              </p>
            </form>

            <div className="max-h-[52vh] overflow-y-auto">
              <p className="px-4 pb-1 pt-3 text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#78736a] sm:px-5">
                {query.trim() ? 'মিলে যাওয়া সংবাদ' : 'সাম্প্রতিক সংবাদ'}
              </p>
              {results.length > 0 ? (
                <ul>
                  {results.map((item) => (
                    <li key={item.id} className="border-b border-[#eeeae1] last:border-b-0">
                      <Link
                        href={`/news/${item.slug}`}
                        onClick={close}
                        className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[#f8f6f1] focus:outline-none focus-visible:bg-[#f8f6f1] sm:px-5"
                      >
                        <span className="mt-0.5 shrink-0 text-[10px] font-bold text-[#0c3b2e]">
                          {item.categoryLabel}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[14px] font-bold leading-snug text-[#141414] group-hover:text-[#0c3b2e]">
                            {item.titleBn}
                          </span>
                          {item.publishedLabel && (
                            <span className="mt-1 block text-[11px] text-[#78736a]">
                              {item.publishedLabel}
                            </span>
                          )}
                        </span>
                        <ArrowRight
                          className="mt-1 h-3.5 w-3.5 shrink-0 text-[#a5a096] group-hover:text-[#0c3b2e]"
                          aria-hidden="true"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm font-bold text-[#141414]">এই শব্দে কোনো সংবাদ পাওয়া যায়নি</p>
                  <p className="mt-1 text-[12px] text-[#78736a]">
                    অন্য কোনো শব্দ বা বিভাগের নাম দিয়ে আবার চেষ্টা করুন।
                  </p>
                </div>
              )}
            </div>

            {query.trim() && (
              <form onSubmit={submit} className="border-t border-[#e4e0d6] p-3">
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-1.5 py-2 text-[12.5px] font-bold text-[#0c3b2e] transition-colors hover:text-[#0a3227]"
                >
                  সব ফলাফল দেখুন
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </form>
            )}
          </section>
        </div>
      )}
    </>
  );
}
