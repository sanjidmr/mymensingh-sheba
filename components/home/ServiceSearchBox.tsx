'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight } from 'lucide-react';

const QUICK_SUGGESTIONS = [
  'বাসা ভাড়া',
  'ইলেকট্রিশিয়ান',
  'ডাক্তার',
  'চাকরি',
  'বাস টিকিট',
  'গাড়ি ভাড়া',
];

/**
 * The homepage's main search product — not an ordinary input.
 * A large, confident search bar with a gold submit, plus quick suggestion
 * chips that fill in the query and submit to `/services?q=…`.
 */
export default function ServiceSearchBox() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const submit = (value?: string) => {
    const q = (value ?? query).trim();
    router.push(q ? `/services?q=${encodeURIComponent(q)}` : '/services');
  };

  return (
    <div className="w-full">
      <div className="relative">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="flex w-full items-center gap-1.5 rounded-xl border border-brand-100/90 bg-white p-1.5 shadow-md shadow-brand-900/5 transition-shadow focus-within:border-brand-400 focus-within:shadow-lg focus-within:shadow-brand-900/10 sm:gap-2 sm:p-2"
        >
          <div className="flex min-w-0 flex-1 items-center gap-1.5 pl-2 sm:gap-2 sm:pl-3">
            <Search className="h-4 w-4 shrink-0 text-ink-400 sm:h-5 sm:w-5" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="যেমন: বাসা ভাড়া, ইলেকট্রিশিয়ান, ডাক্তার, চাকরি…"
              aria-label="আপনার কী সেবা প্রয়োজন?"
              className="h-11 w-full min-w-0 bg-transparent text-sm font-medium text-ink-900 outline-none placeholder:font-normal placeholder:text-ink-400 sm:h-13 sm:text-[15px] [&::-webkit-search-cancel-button]:hidden"
            />
          </div>
          <button
            type="submit"
            className="inline-flex h-11 shrink-0 items-center gap-1 rounded-lg bg-accent-400 px-3 text-sm font-bold text-brand-900 transition-colors hover:bg-accent-500 active:scale-[0.98] sm:h-12 sm:gap-1.5 sm:px-5 sm:text-[15px]"
          >
            খুঁজুন
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </form>
      </div>

      {/* Quick suggestions */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-ink-400">জনপ্রিয়:</span>
        {QUICK_SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setQuery(s);
              submit(s);
            }}
            className="inline-flex min-h-[34px] items-center rounded-lg border border-brand-100 bg-white/80 px-3 py-1.5 text-[13px] font-medium text-brand-700 transition-colors hover:border-brand-300 hover:bg-white hover:text-brand-800"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}