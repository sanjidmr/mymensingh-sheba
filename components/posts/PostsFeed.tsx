'use client';

/**
 * `/posts` — the community feed.
 *
 * Every approved `community_posts` row, newest first, in one stream. The three
 * kinds the table actually holds (news / job / buy-sell) are pulled through the
 * SAME public reads the /news, /jobs and /buy-sell pages already use, so this
 * page can never surface a row those pages would not, and the author contact
 * columns stay behind the same gate.
 *
 * Filtering happens in memory over that single list — six chips, one
 * predicate. The chips are deliberately NOT a new taxonomy:
 *
 *   সব পোস্ট        → everything
 *   চাকরি            → kind = 'job'
 *   কেনাবেচা         → kind = 'buy_sell'
 *   খবর             → kind = 'news'
 *   সেবা             → category = 'service'  (a NEWS_CATEGORIES desk the create
 *                                             form already offers)
 *   অন্যান্য         → category = 'others' / 'other' (the news "অন্যান্য" desk
 *                                             and the marketplace "অন্যান্য")
 *
 * Every chip maps onto a column value the database can already contain — no
 * bucket is invented, and an empty chip says so honestly instead of showing
 * placeholder posts.
 *
 * The shell (header, chips, skeleton) renders on the server; the feed arrives
 * after hydration, which is also why the relative timestamps are safe to
 * compute during render without a hydration mismatch.
 */
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, MapPin, Plus } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { ListingMedia } from '@/components/catalog/CatalogCards';
import { fetchApprovedPosts } from '@/lib/catalog-service';
import { POST_ROUTE } from '@/lib/dashboard';
import {
  bnDate,
  bnRelativeTime,
  bnTaka,
  bnTakaRange,
  tagLabel,
  toBn,
  type CommunityPost,
  type PostKind,
} from '@/lib/catalog-types';
import { getAreaById } from '@/lib/locations';

// ---------------------------------------------------------------------------
// Category filter
// ---------------------------------------------------------------------------

type FeedChip = 'all' | 'job' | 'buy_sell' | 'news' | 'service' | 'other';

const CHIPS: { id: FeedChip; label: string }[] = [
  { id: 'all', label: 'সব পোস্ট' },
  { id: 'job', label: 'চাকরি' },
  { id: 'buy_sell', label: 'কেনাবেচা' },
  { id: 'service', label: 'সেবা' },
  { id: 'news', label: 'খবর' },
  { id: 'other', label: 'অন্যান্য' },
];

/** Chip → post predicate. See the file header for why each one is shaped this way. */
function matchesChip(post: CommunityPost, chip: FeedChip): boolean {
  switch (chip) {
    case 'all':
      return true;
    case 'job':
      return post.kind === 'job';
    case 'buy_sell':
      return post.kind === 'buy_sell';
    case 'news':
      return post.kind === 'news';
    case 'service':
      return post.category === 'service';
    case 'other':
      return post.category === 'others' || post.category === 'other';
  }
}

/** Kind → the short label this page prints on a card and inside a chip. */
const KIND_LABEL: Record<PostKind, string> = {
  news: 'খবর',
  job: 'চাকরি',
  buy_sell: 'কেনাবেচা',
};

const KIND_BADGE: Record<PostKind, string> = {
  news: 'bg-brand-50 text-brand-800 ring-1 ring-brand-100',
  job: 'bg-accent-100 text-brand-900 ring-1 ring-accent-200',
  buy_sell: 'bg-bronze-50 text-bronze-700 ring-1 ring-bronze-200',
};

// ---------------------------------------------------------------------------
// One feed card
// ---------------------------------------------------------------------------

function FeedCard({ post }: { post: CommunityPost }) {
  const href = `${POST_ROUTE[post.kind]}/${post.slug}`;
  const excerpt = post.summaryBn || post.bodyBn;
  const author = post.authorName?.trim() || 'সদস্য';
  const category = post.category ? tagLabel(post.category) : undefined;
  const area = post.areaId ? getAreaById(post.areaId)?.nameBn : undefined;
  const time = bnRelativeTime(post.publishedAt || post.createdAt);

  const priceLine =
    post.kind === 'buy_sell'
      ? bnTaka(post.price)
      : post.kind === 'job'
        ? bnTakaRange(post.salaryMin, post.salaryMax)
        : undefined;
  const deadline = post.kind === 'job' && post.deadline ? bnDate(post.deadline) : undefined;

  // The category chip already carries one of these ids; showing it twice would
  // just be noise under the headline.
  const tags = post.tags.filter((tag) => tag && tag !== post.category).slice(0, 4);

  return (
    <article className="group overflow-hidden rounded-xl border border-brand-100 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-bronze-300 hover:shadow-md hover:shadow-brand-900/[0.07] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand-600">
      <Link href={href} className="block">
        {post.coverImageUrl && (
          // 16:9 on a phone; capped on wide screens, where a full-width 16:9
          // would otherwise stretch the photo to ~400px and turn every card
          // into a billboard. `object-cover` crops instead of distorting.
          <div className="relative aspect-[16/9] max-h-[240px] w-full overflow-hidden bg-mist-100">
            <ListingMedia
              src={post.coverImageUrl}
              alt={post.titleBn}
              label={post.titleBn}
              imgClassName="transition-transform duration-500 group-hover:scale-[1.02]"
            />
            {post.isFeatured && (
              <span className="absolute left-2 top-2 rounded-md bg-accent-400 px-2 py-1 text-[10px] font-extrabold text-brand-950 shadow-sm">
                ফিচার্ড
              </span>
            )}
          </div>
        )}

        <div className="p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`rounded-md px-1.5 py-[3px] text-[10px] font-extrabold ${KIND_BADGE[post.kind]}`}>
              {KIND_LABEL[post.kind]}
            </span>
            {category && (
              <span className="rounded-md bg-mist-100 px-1.5 py-[3px] text-[10px] font-semibold text-ink-600">
                {category}
              </span>
            )}
            {time && <span className="ml-auto text-[11px] text-ink-400">{time}</span>}
          </div>

          <h2 className="mt-2 line-clamp-2 text-[15px] font-bold leading-snug text-ink-900 transition-colors group-hover:text-brand-800 sm:text-[17px]">
            {post.titleBn}
          </h2>

          {excerpt && (
            <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-ink-500 sm:text-[13.5px]">
              {excerpt}
            </p>
          )}

          {/* The facts a reader decides on: who posted it, where, and for how
              much / by when. Nothing is invented — an absent salary or area is
              simply not rendered. */}
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11.5px] text-ink-500">
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <span
                aria-hidden="true"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700"
              >
                {author.slice(0, 1)}
              </span>
              <span className="truncate font-semibold text-ink-700">{author}</span>
            </span>
            {post.organizationBn && (
              <span className="min-w-0 truncate text-ink-500">• {post.organizationBn}</span>
            )}
            {area && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-500" aria-hidden="true" />
                <span className="truncate">{area}</span>
              </span>
            )}
            {priceLine && (
              <span className="font-bold text-brand-700">{priceLine}</span>
            )}
            {deadline && <span className="text-ink-500">শেষ তারিখ {deadline}</span>}
          </div>

          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-mist-100 px-2 py-0.5 text-[10.5px] font-medium text-ink-600"
                >
                  {tagLabel(tag)}
                </span>
              ))}
            </div>
          )}

          <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-bold text-brand-700">
            বিস্তারিত পড়ুন
            <ArrowRight
              className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </span>
        </div>
      </Link>
    </article>
  );
}

/** Keeps the feed's rhythm while the three reads are still in flight. */
function CardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-brand-100 bg-white">
      <div className="aspect-[16/9] w-full bg-mist-100" />
      <div className="space-y-2.5 p-3 sm:p-4">
        <div className="h-3 w-24 rounded bg-mist-100" />
        <div className="h-4 w-4/5 rounded bg-mist-100" />
        <div className="h-3 w-full rounded bg-mist-100" />
        <div className="h-3 w-2/5 rounded bg-mist-100" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PostsFeed() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<FeedChip>('all');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Three kinds, three reads — exactly what the three directory pages
      // already do, so the feed and those pages can never disagree about what
      // "approved" means. Each read returns [] on failure rather than throwing,
      // so one broken surface cannot take the feed down with it.
      const [news, jobs, market] = await Promise.all([
        fetchApprovedPosts('news'),
        fetchApprovedPosts('job'),
        fetchApprovedPosts('buy_sell'),
      ]);
      if (cancelled) return;
      const merged = [...news, ...jobs, ...market].sort(
        (a, b) =>
          new Date(b.publishedAt || b.createdAt).getTime() -
          new Date(a.publishedAt || a.createdAt).getTime()
      );
      setPosts(merged);
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const counts = useMemo(() => {
    const tally: Record<FeedChip, number> = {
      all: 0,
      job: 0,
      buy_sell: 0,
      news: 0,
      service: 0,
      other: 0,
    };
    for (const post of posts) {
      for (const chip of CHIPS) {
        if (matchesChip(post, chip.id)) tally[chip.id] += 1;
      }
    }
    return tally;
  }, [posts]);

  const visible = useMemo(
    () => posts.filter((post) => matchesChip(post, active)),
    [posts, active]
  );

  return (
    <>
      <Navbar />

      <header className="border-b border-brand-100 bg-white">
        <div className="mx-auto w-full max-w-3xl px-4 pb-4 pt-5 sm:px-6 sm:pb-5 sm:pt-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand-600">
                কমিউনিটি
              </p>
              <h1 className="mt-1 text-2xl font-extrabold leading-tight tracking-tight text-ink-900 sm:text-[28px]">
                কমিউনিটি পোস্ট
              </h1>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500 sm:text-sm">
                ময়মনসিংহের মানুষদের প্রকাশিত খবর, চাকরি, কেনাবেচা ও সেবার পোস্ট — নতুন থেকে
                পুরনো, এক ফিডে।
              </p>
            </div>
            <Link
              href="/dashboard/new"
              className="hidden shrink-0 items-center gap-1.5 rounded-xl bg-brand-700 px-4 py-2.5 text-[13px] font-bold text-white shadow-sm transition-colors hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 sm:inline-flex"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              পোস্ট করুন
            </Link>
          </div>
        </div>
      </header>

      {/* Category filter — parked under the sticky Navbar (h-16 / 4.5rem), the
          same offset the dashboard tab strip already uses. It wraps rather than
          scrolls sideways so all six chips stay visible on a 360px phone. */}
      <div className="sticky top-16 z-30 border-b border-brand-100/80 bg-white/95 backdrop-blur-md sm:top-[4.5rem]">
        <div className="mx-auto w-full max-w-3xl px-4 py-3 sm:px-6">
          <div className="flex flex-wrap gap-2" role="group" aria-label="পোস্ট ক্যাটাগরি">
            {CHIPS.map((chip) => {
              const isActive = active === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setActive(chip.id)}
                  aria-pressed={isActive}
                  className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 ${
                    isActive
                      ? 'border-brand-700 bg-brand-700 text-white'
                      : 'border-brand-200 bg-white text-ink-700 hover:border-brand-300 hover:bg-brand-50'
                  }`}
                >
                  {chip.label}
                  {!loading && (
                    <span
                      className={`text-[11px] font-semibold ${
                        isActive ? 'text-brand-100' : 'text-ink-400'
                      }`}
                    >
                      {toBn(counts[chip.id])}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-3xl px-4 py-4 sm:px-6 sm:py-6">
        {loading ? (
          <div className="flex flex-col gap-3">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-xl border border-dashed border-brand-200 bg-white px-4 py-10 text-center">
            <p className="text-sm font-bold text-ink-900">
              {active === 'all'
                ? 'এখনো কোনো পোস্ট প্রকাশিত হয়নি।'
                : 'এই ক্যাটাগরিতে এখনো কোনো পোস্ট নেই।'}
            </p>
            <p className="mx-auto mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-ink-500">
              মডারেটর অনুমোদনের পর প্রতিটি পোস্ট এখানে দেখা যাবে। প্রথমটি হতে পারে আপনারই।
            </p>
            <Link
              href="/dashboard/new"
              className="mt-4 inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 py-2.5 text-[13px] font-bold text-white shadow-sm transition-colors hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              পোস্ট করুন
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-3 text-[12px] text-ink-500">
              {toBn(visible.length)}টি পোস্ট
            </p>
            <div className="flex flex-col gap-3">
              {visible.map((post) => (
                <FeedCard key={post.id} post={post} />
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}
