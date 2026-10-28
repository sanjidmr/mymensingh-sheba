'use client';

/**
 * A post (news / job / buy-sell) by slug.
 *
 * The same component serves all three kinds, because the difference is which
 * facts matter — a job leads with salary and a deadline, a marketplace item
 * leads with a price, news is prose. The caller passes those facts in, so the
 * page structure, the not-found state and the moderation notice stay identical.
 *
 * A post that is pending or rejected is shown only to its own author, with an
 * explicit banner. A visitor who cannot see an approved version gets the normal
 * "not found" page rather than a hint that a post exists in moderation.
 */
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Flag, ShieldAlert } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { ListingMedia } from '@/components/catalog/CatalogCards';
import { JobCard } from '@/components/catalog/CommunityCards';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';
import { fetchApprovedPosts, fetchPostForViewer } from '@/lib/catalog-service';
import { useAuth } from '@/lib/auth-context';
import { getAreaById } from '@/lib/locations';
import {
  bnDate,
  bnTaka,
  tagLabel,
  tagLabels,
  JOB_EDUCATION,
  JOB_EXPERIENCE,
  type CommunityPost,
  type PostKind,
} from '@/lib/catalog-types';
import { deskHref, deskLabel, formatNewsTimestamp } from '@/lib/news/news-utils';

/** Resolves a taxonomy id found in `tags` to its Bangla label. */
function pickTag(tags: string[] | undefined, entries: readonly { id: string; labelBn: string }[]): string | undefined {
  if (!tags) return undefined;
  for (const tag of tags) {
    const match = entries.find((e) => e.id === tag);
    if (match) return match.labelBn;
  }
  return undefined;
}

const KIND_META: Record<PostKind, { route: string; title: string; noun: string }> = {
  news: { route: '/news', title: 'সংবাদ', noun: 'সংবাদ' },
  job: { route: '/jobs', title: 'চাকরির খবর', noun: 'চাকরি' },
  buy_sell: { route: '/buy-sell', title: 'ক্রয়-বিক্রয়', noun: 'পোস্ট' },
};

const POST_META: Record<PostKind, string> = {
  news: 'সংবাদ',
  job: 'চাকরি',
  buy_sell: 'বিক্রয়',
};

export function PostDetail({ kind, slug }: { kind: PostKind; slug: string }) {
  const meta = KIND_META[kind];
  const { user } = useAuth();
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [related, setRelated] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchPostForViewer(kind, slug);
        if (active) setPost(data);
      } catch (cause) {
        if (active) {
          setLoadError(cause instanceof Error ? cause.message : 'পোস্ট লোড করা যায়নি।');
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [kind, slug]);

  // A job page recommends other jobs only — never news or buy-sell. Same
  // category first, then same area, so the row is relevant before it is full.
  // Failures are silent: the related row is a bonus, not the page.
  useEffect(() => {
    if (kind !== 'job' || !post) return;
    let active = true;
    (async () => {
      try {
        const rows = await fetchApprovedPosts('job');
        if (!active) return;
        const score = (item: CommunityPost) =>
          (post.category && item.category === post.category ? 2 : 0) +
          (post.areaId && item.areaId === post.areaId ? 1 : 0);
        const next = rows
          .filter((item) => item.slug !== slug && item.status === 'approved')
          .sort((a, b) => score(b) - score(a))
          .slice(0, 4);
        setRelated(next);
      } catch {
        if (active) setRelated([]);
      }
    })();
    return () => {
      active = false;
    };
  }, [kind, slug, post]);

  if (loading) {
    return (
      <Frame kind={kind}>
        <div>
          <div className="h-48 animate-pulse rounded-xl bg-mist-100" aria-hidden="true" />
          <p className="mt-4 text-center text-sm text-ink-500">লোড হচ্ছে…</p>
        </div>
      </Frame>
    );
  }

  if (!post) {
    return (
      <Frame kind={kind}>
        <div className="mx-auto max-w-2xl py-10 text-center">
          {loadError ? (
            <>
              <h1 className="text-lg font-extrabold text-rose-800">পোস্ট লোড করা যায়নি</h1>
              <p role="alert" className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-rose-700">
                {loadError}
              </p>
            </>
          ) : (
            <>
              <h1 className="text-lg font-extrabold text-ink-900">
                {meta.title} পোস্টটি পাওয়া যায়নি
              </h1>
              <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-ink-500">
                পোস্টটি হয় অনুমোদনের অপেক্ষায় আছে, অথবা আর প্রকাশিত নেই। অন্য কোনো
                তালিকা দেখুন।
              </p>
            </>
          )}
          <Link
            href={meta.route}
            className={`mt-4 inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg bg-brand-700 px-5 text-sm font-extrabold text-white transition-colors hover:bg-brand-800 ${LIGHT_FOCUS}`}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            সব {meta.title} দেখুন
          </Link>
        </div>
      </Frame>
    );
  }

  const isAuthor = Boolean(user && post.authorId === user.id);
  const areaName = post.areaId ? getAreaById(post.areaId)?.nameBn : undefined;

  /*
    The form stores taxonomy *ids* so a facet and the row it filters share one
    value. The reader must never see an id, and a row written before a label
    existed must still render, so every lookup falls back to the stored value
    rather than hiding the field.
  */
  const jobTypeLabel = post.jobType ? tagLabel(post.jobType) : undefined;
  const condition = post.conditionLabel ? tagLabel(post.conditionLabel) : undefined;
  const deadlineLabel = post.deadline ? bnDate(post.deadline) : undefined;
  /**
   * Education is free text now (see `PostForm`), but rows written before that
   * change stored one of the fixed `JOB_EDUCATION` slugs. Prefer the known label
   * when there is one, otherwise fall back to the first tag the writer typed —
   * the form puts education first, so that is the education line.
   */
  const education =
    pickTag(post.tags, JOB_EDUCATION) ?? post.tags.find((tag) => tagLabels([tag]).length === 0);
  const experience = pickTag(post.tags, JOB_EXPERIENCE);

  const salary =
    post.salaryMin != null || post.salaryMax != null
      ? `${post.salaryMin != null ? bnTaka(post.salaryMin) : ''}${
          post.salaryMin != null && post.salaryMax != null ? ' – ' : ''
        }${post.salaryMax != null ? bnTaka(post.salaryMax) : ''}`
      : undefined;

  const isNews = kind === 'news';
  const published = formatNewsTimestamp(post.publishedAt || post.createdAt);

  return (
    <Frame kind={kind}>
      <div>
        <Link
          href={meta.route}
          className={`inline-flex items-center gap-1.5 text-xs font-semibold text-ink-500 transition-colors hover:text-brand-700 ${LIGHT_FOCUS}`}
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          সব {meta.title}
        </Link>

        {post.status !== 'approved' && isAuthor && (
          <div
            className={`mt-3 flex items-start gap-2 rounded-lg border p-3 ${
              post.status === 'pending'
                ? 'border-amber-200 bg-amber-50'
                : 'border-red-200 bg-red-50'
            }`}
          >
            <ShieldAlert
              className={`mt-0.5 h-4 w-4 shrink-0 ${
                post.status === 'pending' ? 'text-amber-700' : 'text-red-700'
              }`}
              aria-hidden="true"
            />
            <p
              className={`text-[12.5px] leading-relaxed ${
                post.status === 'pending' ? 'text-amber-900' : 'text-red-900'
              }`}
            >
              {post.status === 'pending'
                ? 'এই পোস্টটি অ্যাডমিন অনুমোদনের অপেক্ষায় আছে। অনুমোদনের পর সবার জন্য দেখা যাবে।'
                : post.rejectionReason
                  ? `অনুমোদিত হয়নি। কারণ: ${post.rejectionReason} — কারণটি ঠিক করে সম্পাদনা করে আবার পাঠান।`
                  : 'এই পোস্টটি অনুমোদিত হয়নি। কারণ জানতে চাইলে সম্পাদনা করে আবার পাঠাতে পারেন।'}
            </p>
          </div>
        )}

        <article
          className={
            isNews
              ? 'mt-4 border-t-2 border-[#141414] pt-4'
              : 'mt-3 overflow-hidden rounded-xl border border-brand-100 bg-white'
          }
        >
          {post.coverImageUrl && (
            <div
              className={
                isNews
                  ? 'relative aspect-[16/9] w-full overflow-hidden bg-[#f2f0ea]'
                  : 'relative aspect-[16/9] w-full overflow-hidden bg-mist-100'
              }
            >
              <ListingMedia
                src={post.coverImageUrl}
                alt={post.titleBn}
                label={post.titleBn}
              />
            </div>
          )}

          <div className={isNews ? 'pt-4' : 'p-4 sm:p-6'}>
            {isNews ? (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[9.5px] font-bold uppercase tracking-[0.14em] text-[#0c3b2e]">
                <Link href={deskHref(post.category)} className="hover:text-[#0a3227]">
                  {deskLabel(post.category)}
                </Link>
                {post.isFeatured && post.status === 'approved' && (
                  <>
                    <span aria-hidden="true" className="text-[#c2bcb0]">
                      •
                    </span>
                    <span className="text-[#8a6b2f]">নির্বাচিত</span>
                  </>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded border border-brand-100 bg-mist-50 px-2 py-1 text-xs font-extrabold text-brand-700">
                  {POST_META[kind]}
                </span>
                {post.kind === 'buy_sell' && post.marketplaceStatus === 'sold' && (
                  <span className="rounded bg-slate-100 px-2 py-1 text-xs font-extrabold text-slate-700">
                    বিক্রি হয়েছে
                  </span>
                )}
                {post.kind === 'buy_sell' && post.marketplaceStatus === 'closed' && (
                  <span className="rounded bg-mist-100 px-2 py-1 text-xs font-extrabold text-ink-600">
                    বন্ধ
                  </span>
                )}
                {post.category && (
                  <span className="truncate text-[13px] font-bold text-brand-700">
                    {tagLabel(post.category)}
                  </span>
                )}
                {post.isFeatured && post.status === 'approved' && (
                  <span className="rounded bg-accent-400 px-2 py-1 text-xs font-extrabold text-brand-950">
                    ফিচার্ড
                  </span>
                )}
              </div>
            )}

            <h1
              className={
                isNews
                  ? 'mt-2 font-[family-name:var(--font-news-serif)] text-[28px] font-black leading-[1.18] tracking-[-0.01em] text-[#141414] sm:text-[38px]'
                  : 'mt-2 text-2xl font-extrabold leading-snug text-ink-900 sm:text-3xl'
              }
            >
              {post.titleBn}
            </h1>

            {isNews ? (
              <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-[#ded9ce] pb-3 text-[11px] text-[#8a857b]">
                <span className="font-semibold text-[#5f5a51]">
                  {post.authorName?.trim() || 'সংবাদ ডেস্ক'}
                </span>
                {areaName && (
                  <>
                    <span aria-hidden="true" className="text-[#c2bcb0]">•</span>
                    <span>{areaName}</span>
                  </>
                )}
                {(published.exact || published.relative) && (
                  <>
                    <span aria-hidden="true" className="text-[#c2bcb0]">•</span>
                    <time
                      dateTime={post.publishedAt || post.createdAt}
                      title={published.relative}
                    >
                      {published.exact ?? published.relative}
                    </time>
                  </>
                )}
              </div>
            ) : (
              (post.authorName || areaName) && (
                <p className="mt-2 text-sm leading-relaxed text-ink-600">
                  {post.authorName || null}
                  {post.authorName && areaName ? ' · ' : ''}
                  {areaName || ''}
                </p>
              )
            )}

            {post.summaryBn && (
              <p
                className={
                  isNews
                    ? 'mt-4 border-l-2 border-[#0c3b2e] pl-3.5 text-[16px] font-medium leading-[1.75] text-[#3f3b34] sm:text-[17px]'
                    : 'mt-3 rounded-lg border border-brand-100 bg-mist-50 p-3.5 text-[15px] font-medium leading-relaxed text-ink-800 sm:p-4 sm:text-base'
                }
              >
                {post.summaryBn}
              </p>
            )}

            {((kind === 'job' &&
              (salary || jobTypeLabel || deadlineLabel || education || experience)) ||
              (kind === 'buy_sell' && (post.price != null || condition))) ? (
              <dl className="mt-4 grid grid-cols-2 gap-3 rounded-lg border border-brand-100 bg-mist-50 p-3.5 sm:grid-cols-3 sm:gap-4 sm:p-4">
                {kind === 'job' && salary && (
                  <Fact label="বেতন" value={salary} />
                )}
                {kind === 'job' && jobTypeLabel && (
                  <Fact label="চাকরির ধরন" value={jobTypeLabel} />
                )}
                {kind === 'job' && deadlineLabel && (
                  <Fact label="শেষ তারিখ" value={deadlineLabel} />
                )}
                {kind === 'job' && education && (
                  <Fact label="শিক্ষাগত যোগ্যতা" value={education} />
                )}
                {kind === 'job' && experience && (
                  <Fact label="অভিজ্ঞতা" value={experience} />
                )}
                {kind === 'buy_sell' && post.price != null && (
                  <Fact label="দাম" value={bnTaka(post.price)} />
                )}
                {kind === 'buy_sell' && condition && (
                  <Fact label="অবস্থা" value={condition} />
                )}
              </dl>
            ) : null}

            {post.bodyBn && (
              <div
                className={
                  isNews
                    ? 'mt-5 space-y-4 text-[16px] leading-[1.9] text-[#242424] sm:text-[17px]'
                    : 'mt-4 space-y-3 text-[15px] leading-[1.8] text-ink-800 sm:text-base'
                }
              >
                {post.bodyBn
                  .split(/\n{2,}/)
                  .map((para) => para.trim())
                  .filter(Boolean)
                  .map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
              </div>
            )}

            {tagLabels(post.tags).length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-1.5">
                {tagLabels(post.tags).map((tag) => (
                  <li
                    key={tag}
                    className={
                      isNews
                        ? 'border border-[#ded9ce] bg-[#faf8f2] px-2.5 py-1 text-[11.5px] font-medium text-[#5f5a51]'
                        : 'rounded border border-brand-100 bg-mist-50 px-2.5 py-1 text-[13px] font-medium text-ink-700'
                    }
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </article>

        {isAuthor && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/profile/posts/${kind}/${post.id}/edit`}
              className={`inline-flex min-h-[44px] items-center justify-center rounded-lg border border-brand-200 bg-white px-4 text-sm font-bold text-brand-700 transition-colors hover:bg-mist-50 ${LIGHT_FOCUS}`}
            >
              সম্পাদনা
            </Link>
            <Link
              href="/profile/posts"
              className={`inline-flex min-h-[44px] items-center justify-center rounded-lg border border-brand-200 bg-white px-4 text-sm font-bold text-brand-700 transition-colors hover:bg-mist-50 ${LIGHT_FOCUS}`}
            >
              আমার সব পোস্ট
            </Link>
          </div>
        )}

        <p className="mt-4 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-ink-400">
          <Flag className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          ভুল বা বিভ্রান্তিকর তথ্য থাকলে{' '}
          <Link href="/contact#contact-form" className="font-semibold text-brand-600">
            জানান
          </Link>
          — অ্যাডমিন যাচাই করে নেবেন।
        </p>

        {kind === 'job' && related.length > 0 && (
          <section
            className="mt-6 border-t border-brand-100 pt-5"
            aria-labelledby="related-jobs-heading"
          >
            <h2
              id="related-jobs-heading"
              className="mb-2.5 text-[15px] font-extrabold text-ink-900"
            >
              আরও চাকরি
            </h2>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {related.map((item) => (
                <JobCard key={item.id} post={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </Frame>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold tracking-wide text-ink-600">
        {label}
      </dt>
      <dd className="mt-1 break-words text-[15px] font-bold leading-snug text-ink-950">{value}</dd>
    </div>
  );
}

function Frame({ children, kind }: { children: React.ReactNode; kind: PostKind }) {
  // No global Footer, matching the other listing and detail pages: the article
  // ends the page and the fixed mobile bottom nav (mounted in the root layout)
  // is the last thing on screen.
  //
  // A news story keeps the newspaper's paper-and-ink frame so it reads as the
  // same publication as `/news`; jobs and marketplace posts keep the service
  // site's navbar and card styling.
  if (kind === 'news') {
    return (
      <div className="flex min-h-screen flex-col overflow-x-clip bg-white text-[#141414]">
        <header className="border-b border-[#ded9ce]">
          <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <Link href="/news" className="flex min-w-0 items-center gap-2.5">
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center bg-[#0c3b2e] font-[family-name:var(--font-news-serif)] text-[19px] font-bold leading-none text-white"
              >
                ম
              </span>
              <span className="min-w-0">
                <span className="block text-[8.5px] font-bold uppercase tracking-[0.22em] text-[#8a6b2f]">
                  ময়মনসিংহ শেবা · সংবাদ
                </span>
                <span className="block font-[family-name:var(--font-news-serif)] text-[18px] font-black leading-tight sm:text-[20px]">
                  ময়মনসিংহের <span className="text-[#0c3b2e]">নিউজ</span>
                </span>
              </span>
            </Link>
            <div className="flex shrink-0 items-center gap-3">
              <Link
                href="/news"
                className="text-[11.5px] font-bold text-[#0c3b2e] transition-colors hover:text-[#0a3227]"
              >
                প্রচ্ছদ
              </Link>
              <Link
                href="/news/create"
                className="hidden h-9 items-center bg-[#0c3b2e] px-3 text-[11.5px] font-bold text-white transition-colors hover:bg-[#0a3227] sm:inline-flex"
              >
                সংবাদ পাঠান
              </Link>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[760px] flex-1 px-4 py-5 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-mist-50">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-3 py-4 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
