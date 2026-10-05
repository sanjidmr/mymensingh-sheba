'use client';

/**
 * কেনা-বেচা (Kena Becha) — the marketplace browser at `/buy-sell`.
 *
 * This is a real page of its own rather than the shared `CommunityDirectory`
 * with different props, because the brief asks for three things that component
 * has no room for:
 *
 *   1. A hero with the promise, one sentence of explanation and the "পণ্য বিক্রি
 *      করুন" action. `CommunityDirectory` opens with a breadcrumb, a title and a
 *      small header button; a marketplace has to sell the idea that selling here
 *      is normal, and the post button has to be the biggest thing on the screen
 *      not the smallest.
 *   2. A category rail — ten tiles, tappable, showing how many items each has.
 *      The filter drawer is where you narrow a search you already know; the rail
 *      is how you start one. A reader who arrives with only "আমার একটা পুরোনো
 *      ফোন আছে, কোথায় দিব" needs the categories visible before any tapping.
 *   3. Image-first cards (see `ProductCard`).
 *
 * It deliberately still uses `useDirectoryController`, `DirectorySearchBar` and
 * `DirectoryResults` rather than reimplementing search. Search, filtering,
 * sorting and the empty/reset states are the same problems they are on the tolet
 * and tutor pages; having them in one place is what keeps five directory pages
 * behaving identically.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Armchair,
  BedDouble,
  Bike,
  BookOpen,
  Car,
  ChevronRight,
  Home,
  Laptop,
  LucideIcon,
  Package,
  Plug,
  PlusCircle,
  Search,
  Shirt,
  Smartphone,
  Tag,
  Truck,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import DirectorySearchBar from '@/components/directory/DirectorySearchBar';
import DirectoryResults from '@/components/directory/DirectoryResults';
import { ProductCard } from '@/components/buy-sell/ProductCard';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';
import { rangeGroup, tagFacet } from '@/components/catalog/CatalogDirectory';
import { areaFilterGroupMulti, type FilterGroup, type MatchableRecord } from '@/lib/directory-filters';
import { useDirectoryController } from '@/lib/use-directory-controller';
import { useAuth } from '@/lib/auth-context';
import { fetchApprovedPosts, fetchMyPosts } from '@/lib/catalog-service';
import {
  MARKET_CATEGORIES,
  MARKET_CATEGORY_ICONS,
  MARKET_CONDITIONS,
  MARKET_PRICE_BANDS,
  toBn,
  type CommunityPost,
} from '@/lib/catalog-types';
import type { SearchableFields } from '@/lib/directory-search';
import { getAreaById } from '@/lib/locations';

const CREATE_HREF = '/buy-sell/create';

const SORT_OPTIONS = [
  { id: 'newest', labelBn: 'নতুন আগে' },
  { id: 'price_asc', labelBn: 'কম দাম আগে' },
  { id: 'price_desc', labelBn: 'বেশি দাম আগে' },
];

const SORTERS = {
  price_asc: (a: CommunityPost, b: CommunityPost) =>
    (a.price ?? Number.MAX_SAFE_INTEGER) - (b.price ?? Number.MAX_SAFE_INTEGER),
  price_desc: (a: CommunityPost, b: CommunityPost) =>
    (b.price ?? Number.POSITIVE_INFINITY) - (a.price ?? Number.POSITIVE_INFINITY),
};

/**
 * Icon per category, resolved once.
 *
 * `MARKET_CATEGORY_ICONS` stores a name rather than a component so the taxonomy
 * module stays free of JSX. The mapping below is the only place that turns a
 * name into something drawable, and it is an explicit lookup rather than a
 * dynamic index into the lucide module — a name typo then fails the build
 * instead of rendering an invisible tile.
 */
const CATEGORY_ICON: Record<string, LucideIcon> = {
  Smartphone,
  Laptop,
  Plug,
  Armchair,
  Bike,
  Car,
  BookOpen,
  Shirt,
  BedDouble,
  Package,
};

// ---------------------------------------------------------------------------

export default function MarketplaceBrowser() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  // Pinned once per mount so every card in one render pass agrees about "৩ দিন
  // আগে". Read on the client only; this whole view is client-fetched, so there
  // is no server render to disagree with.
  const [now] = useState(() => Date.now());

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [approved, mine] = await Promise.all([
          fetchApprovedPosts('buy_sell'),
          fetchMyPosts(),
        ]);
        if (!active) return;
        // A seller's own queued and rejected listings stay visible to them, the
        // same rule every community page follows — a rejected post that vanished
        // reads as a platform failure.
        const ownUnpublished = mine.filter(
          (p) => p.kind === 'buy_sell' && p.status !== 'approved'
        );
        setPosts([...approved, ...ownUnpublished]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const filterGroups = useMemo<FilterGroup[]>(
    () => [
      areaFilterGroupMulti(),
      tagFacet('category', 'ক্যাটাগরি', MARKET_CATEGORIES),
      tagFacet('condition', 'অবস্থা', MARKET_CONDITIONS),
      rangeGroup('price', 'দাম', MARKET_PRICE_BANDS),
    ],
    []
  );

  const searchable = useCallback(
    (post: CommunityPost): SearchableFields => ({
      title: post.titleBn,
      subtitle: post.summaryBn,
      area: post.areaId ? (getAreaById(post.areaId)?.nameBn ?? '') : '',
      tags: post.tags,
      description: post.bodyBn ?? '',
      numbers: [post.price, post.salaryMin, post.salaryMax].filter(
        (n): n is number => typeof n === 'number'
      ),
    }),
    []
  );

  const matchable = useCallback(
    (post: CommunityPost): MatchableRecord => ({
      areaIds: post.areaId ? [post.areaId] : [],
      ranges: { price: post.price },
      values: {
        category: post.category,
        // The condition band id is in `tags`, so it matches as a list. The
        // display label in `conditionLabel` is the same value resolved to Bangla
        // and is included so a row that only stored the label still filters.
        condition: [...post.tags, post.conditionLabel].filter((v): v is string =>
          Boolean(v)
        ),
      },
    }),
    []
  );

  const controller = useDirectoryController<CommunityPost>({
    items: posts,
    searchable,
    matchable,
    filterGroups,
    sorters: SORTERS,
  });

  // Counts are computed from every loaded row, not from the filtered set: a
  // reader tapping "মোবাইল (৩)" is asking how many phones exist, not how many
  // phones their own current filters happen to leave visible.
  const countsByCategory = useMemo(() => {
    const counts = new Map<string, number>();
    for (const post of posts) {
      if (post.category) counts.set(post.category, (counts.get(post.category) ?? 0) + 1);
    }
    return counts;
  }, [posts]);

  const activeCategory = useMemo(() => {
    const raw = controller.filterState.category;
    const id = Array.isArray(raw) ? raw[0] : raw;
    return id && id !== 'all' ? id : null;
  }, [controller.filterState]);

  /**
   * The rail and the drawer filter are two views of one state, so tapping a
   * tile writes into the controller rather than keeping a parallel selection.
   * That is what keeps the active-filter chip row and the "সব পণ্য" tile from
   * disagreeing after a reset.
   */
  const selectCategory = useCallback(
    (categoryId: string | null) => {
      const next = { ...controller.filterState };
      if (categoryId === null || activeCategory === categoryId) {
        delete next.category;
      } else {
        next.category = [categoryId];
      }
      controller.setFilterState(next);
    },
    [activeCategory, controller]
  );

  const showingDemo = posts.length > 0 && posts.every((p) => p.isDemo);
  const createHref = user ? CREATE_HREF : `/login?next=${encodeURIComponent(CREATE_HREF)}`;

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-mist-50">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-8 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        {/* -----------------------------------------------------------------
            Hero. The headline is the promise, not the noun: nobody arrives
            because they want a page called "ক্রয়-বিক্রয়", they arrive
            because they want to know they can sell or find something here.
            ----------------------------------------------------------------- */}
        <section className="rounded-2xl border border-mist-200 bg-white p-4 sm:p-6">
          <h1 className="text-[22px] font-black leading-tight tracking-tight text-ink-900 sm:text-[28px]">
            ময়মনসিংহে কেনাকাটা ও বিক্রি, এখন এক জায়গায়
          </h1>
          <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-ink-600 sm:text-[14.5px]">
            মোবাইল থেকে আসবাবপত্র, বাইক থেকে বই — আপনার এলাকার ব্যবহৃত বা নতুন
            পণ্যের বিজ্ঞাপন দিন, অথবা যা খুঁজছেন তা খুঁজে নিন। সব বিজ্ঞাপন অ্যাডমিন
            যাচাই করে প্রকাশ করেন।
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <Link
              href={createHref}
              className={`inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand-700 px-5 text-[14px] font-extrabold text-white transition-colors hover:bg-brand-800 ${LIGHT_FOCUS}`}
            >
              <PlusCircle className="h-4.5 w-4.5" strokeWidth={2.25} aria-hidden="true" />
              পণ্য বিক্রি করুন
            </Link>
            <a
              href="#market-categories"
              className={`inline-flex min-h-12 items-center gap-2 rounded-xl border border-brand-200 bg-white px-5 text-[14px] font-bold text-brand-700 transition-colors hover:bg-brand-50 ${LIGHT_FOCUS}`}
            >
              <Tag className="h-4 w-4" aria-hidden="true" />
              ক্যাটাগরি দেখুন
            </a>
          </div>
        </section>

        {/* -----------------------------------------------------------------
            Category rail. Tiles, not chips: a chip is a filter control, a tile
            is a destination, and this is where a first-time reader starts.
            ----------------------------------------------------------------- */}
        <section id="market-categories" className="mt-4 scroll-mt-4">
          <div className="mb-2.5 flex items-baseline justify-between gap-3">
            <h2 className="text-[15px] font-extrabold text-ink-900">ক্যাটাগরি</h2>
            {activeCategory && (
              <button
                type="button"
                onClick={() => selectCategory(null)}
                className={`text-[12.5px] font-bold text-brand-700 hover:text-brand-800 ${LIGHT_FOCUS}`}
              >
                সব পণ্য দেখুন
              </button>
            )}
          </div>

          {/* 2-up on the narrowest phone. Four or five tiles per row is what a
              360px screen can hold with a legible Bangla label, and a
              horizontal scroll rail here would hide eight of the ten categories
              behind a swipe nobody tries on a first visit. */}
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            <li>
              <CategoryTile
                labelBn="সব পণ্য"
                Icon={Search}
                count={posts.length}
                active={activeCategory === null}
                onClick={() => selectCategory(null)}
              />
            </li>
            {MARKET_CATEGORIES.map((category) => (
              <li key={category.id}>
                <CategoryTile
                  labelBn={category.labelBn}
                  Icon={CATEGORY_ICON[MARKET_CATEGORY_ICONS[category.id]] ?? Package}
                  count={countsByCategory.get(category.id) ?? 0}
                  active={activeCategory === category.id}
                  onClick={() => selectCategory(category.id)}
                />
              </li>
            ))}
          </ul>
        </section>

        {/* -----------------------------------------------------------------
            Search + filters.
            ----------------------------------------------------------------- */}
        <div className="mt-4">
          <DirectorySearchBar
            value={controller.query}
            onChange={controller.setQuery}
            placeholder="পণ্যের নাম, ক্যাটাগরি, এলাকা বা দাম লিখে খুঁজুন..."
            filterGroups={filterGroups}
            filterState={controller.filterState}
            onFilterStateChange={controller.setFilterState}
            resultCount={controller.results.length}
            resultNoun="পণ্য"
            tone="narrow"
            sortOptions={SORT_OPTIONS}
            currentSort={controller.sort}
            onSortChange={controller.setSort}
          />
        </div>

        {showingDemo && (
          <p className="mt-3 rounded-xl border border-accent-200 bg-accent-100/50 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-accent-700">
            এখনকার কেনাবেচার তালিকায় কোনো পণ্য যোগ করা হয়নি। নিচের সবগুলো{' '}
            <strong className="font-bold">নমুনা বিজ্ঞাপন</strong> — বিক্রেতার সঙ্গে কোনো
            যোগাযোগ হবে না, নম্বরও কল করা যাবে না। আপনার পণ্য বিক্রি করতে চাইলে উপরের{' '}
            <strong className="font-bold">পণ্য বিক্রি করুন</strong> ব্যবহার করুন।
          </p>
        )}

        <div className="mt-2.5">
          <DirectoryResults
            loading={loading}
            empty={controller.results.length === 0}
            count={controller.results.length}
            noun="পণ্য"
            loadingText="পণ্য লোড হচ্ছে…"
            onReset={controller.resetAll}
            unpopulated={<MarketEmpty hasAnyData={posts.length > 0} createHref={createHref} />}
          >
            {/* 2-up on a phone per the brief; 5-up on a wide desktop, which is
                where five cards at 240px each still leave the price legible. */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {controller.results.map((post) => (
                <ProductCard key={post.id} post={post} now={now} />
              ))}
            </div>
          </DirectoryResults>
        </div>

        {/* The seller's own call to action, repeated at the foot of the page
            where a reader who scrolled past everything else will reach it. */}
        <section className="mt-6 rounded-2xl border border-brand-200 bg-brand-50 p-4 sm:p-5">
          <h2 className="flex items-center gap-2 text-[15px] font-extrabold text-brand-900">
            <Truck className="h-4.5 w-4.5" aria-hidden="true" />
            আপনার পণ্য বিক্রি করতে চান?
          </h2>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-brand-800/85">
            ছবি, দাম, অবস্থা ও এলাকা দিলে বিজ্ঞাপনটি অ্যাডমিন যাচাইয়ের পর প্রকাশিত হয়।
            বিক্রেতার নম্বর সরাসরি কল করতে পারবেন।
          </p>
          <Link
            href={createHref}
            className={`mt-3.5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-700 px-4 text-[13.5px] font-extrabold text-white transition-colors hover:bg-brand-800 ${LIGHT_FOCUS}`}
          >
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            পণ্য বিক্রি করুন
          </Link>
        </section>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------

/**
 * One category tile.
 *
 * The count is the reason this is a tile and not a chip: a reader who is about
 * to sell a phone wants to know there are buyers looking at phones, and a
 * reader who wants to buy one wants to know there is a choice. Both answers are
 * the number under the label, so it is set as large as the label rather than
 * hidden in a corner.
 */
function CategoryTile({
  labelBn,
  Icon,
  count,
  active,
  onClick,
}: {
  labelBn: string;
  Icon: LucideIcon;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  const empty = count === 0;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex min-h-[76px] w-full flex-col items-start justify-center gap-1 rounded-xl border px-3 py-2.5 text-left transition-colors ${LIGHT_FOCUS} ${
        active
          ? 'border-brand-600 bg-brand-700 text-white'
          : empty
            ? 'border-mist-200 bg-mist-50 text-ink-400 hover:border-mist-300'
            : 'border-mist-200 bg-white text-ink-800 hover:border-brand-300 hover:bg-brand-50'
      }`}
    >
      <span className="flex w-full items-center gap-2">
        <Icon
          className={`h-4.5 w-4.5 shrink-0 ${active ? 'text-accent-300' : 'text-brand-600'}`}
          strokeWidth={2}
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1 truncate text-[12.5px] font-bold leading-snug">
          {labelBn}
        </span>
        {active && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/70" aria-hidden="true" />}
      </span>
      <span
        className={`text-[11px] font-semibold ${
          active ? 'text-white/75' : empty ? 'text-ink-300' : 'text-ink-400'
        }`}
      >
        {empty ? 'এখনো নেই' : `${toBn(count)} টি পণ্য`}
      </span>
    </button>
  );
}

/**
 * The empty state, in two voices.
 *
 * With rows in the database but none matching, offer a reset. With no rows at
 * all, invite the first post — an empty marketplace that only says "কিছু নেই"
 * reads as a dead website rather than a new one.
 */
function MarketEmpty({
  hasAnyData,
  createHref,
}: {
  hasAnyData: boolean;
  createHref: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-brand-200 bg-white px-5 py-10 text-center">
      <Home className="mx-auto mb-3 h-9 w-9 text-brand-200" aria-hidden="true" />
      <h2 className="text-base font-extrabold text-ink-900">
        {hasAnyData
          ? 'আপনার খোঁজার মতো কোনো পণ্য পাওয়া যায়নি।'
          : 'এখনো কোনো পণ্যের বিজ্ঞাপন নেই'}
      </h2>
      <p className="mx-auto mt-1.5 max-w-md text-[13px] leading-relaxed text-ink-500">
        {hasAnyData
          ? 'ক্যাটাগরি বা দামের ফিল্টার বদলে আবার চেষ্টা করুন, অথবা সব পণ্য দেখুন।'
          : 'প্রথম বিজ্ঞাপনটি আপনিই দিন — অ্যাডমিন অনুমোদনের পর এটি প্রকাশিত হবে।'}
      </p>
      {!hasAnyData && (
        <Link
          href={createHref}
          className={`mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 text-[13.5px] font-extrabold text-white transition-colors hover:bg-brand-800 ${LIGHT_FOCUS}`}
        >
          <PlusCircle className="h-4 w-4" aria-hidden="true" />
          পণ্য বিক্রি করুন
        </Link>
      )}
    </div>
  );
}