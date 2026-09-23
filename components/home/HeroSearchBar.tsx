'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight } from 'lucide-react';

/**
 * Hero search bar (mobile hero overlay). Submits a keyword query to the
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
      className="flex w-full items-center gap-1.5 rounded-full border border-white/25 bg-white/95 p-1.5 shadow-2xl shadow-black/25 backdrop-blur-md focus-within:border-brand-400"
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
        className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-brand-700 px-4 text-sm font-bold text-white transition-colors hover:bg-brand-800 active:scale-[0.98] sm:px-5"
      >
        খুঁজুন
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </form>
  );
}