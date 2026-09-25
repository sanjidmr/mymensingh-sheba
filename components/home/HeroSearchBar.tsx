'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight } from 'lucide-react';

/**
 * Hero search bar. Quiet white pill that sits inside the deep-green hero text
 * area; the CTA uses the lime accent sparingly. Submits a keyword to the
 * services catalog (`/services?q=…`).
 */
export default function HeroSearchBar() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/services?q=${encodeURIComponent(q)}` : '/services');
  };

  return (
    <form
      onSubmit={submit}
      className="flex w-full items-center gap-1.5 rounded-full border border-brand-100 bg-white p-1.5 shadow-sm ring-1 ring-brand-100/60 focus-within:border-brand-300 focus-within:ring-brand-300"
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 pl-3">
        <Search className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="কী খুঁজছেন? যেমন: বাসা ভাড়া, প্লাম্বার…"
          aria-label="সেবা খুঁজুন"
          className="w-full min-w-0 bg-transparent py-2 text-sm font-medium text-ink-900 outline-none placeholder:text-ink-400 [&::-webkit-search-cancel-button]:hidden"
        />
      </div>
      <button
        type="submit"
        className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-accent-400 px-4 text-sm font-bold text-brand-800 transition-colors hover:bg-accent-500 active:scale-[0.98] sm:px-5"
      >
        খুঁজুন
        <ArrowRight className="h-4 w-4 hidden sm:block" aria-hidden="true" />
      </button>
    </form>
  );
}