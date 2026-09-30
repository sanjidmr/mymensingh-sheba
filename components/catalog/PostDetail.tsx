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
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';
import { fetchPostForViewer } from '@/lib/catalog-service';
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

/** Resolves a taxonomy id found in `tags` to its Bangla label. */
function pickTag(
  tags: string[] | undefined,
  entries: readonly { id: string; labelBn: string }[]
): string | undefined {
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchPostForViewer(kind, slug);
        if (active) setPost(data);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [kind, slug]);

  if (loading) {
    return (
      <Frame>
        <div>
          <div className="h-48 animate-pulse rounded-xl bg-mist-100" aria-hidden="true" />
          <p className="mt-4 text-center text-sm text-ink-500">লোড হচ্ছে…</p>
        </div>
      </Frame>
    );
  }

  if (!post) {
    return (
      <Frame>
        <div className="mx-auto max-w-2xl py-10 text-center">
          <h1 className="text-lg font-extrabold text-ink-900">
            {meta.title} পোস্টটি পাওয়া যায়নি
          </h1>
          <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-ink-500">
            পোস্টটি হয় অনুমোদনের অপেক্ষায় আছে, অথবা আর প্রকাশিত নেই। অন্য কোনো
            তালিকা দেখুন।
          </p>
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
  const education = pickTag(post.tags, JOB_EDUCATION);
  const experience = pickTag(post.tags, JOB_EXPERIENCE);

  const salary =
    post.salaryMin != null || post.salaryMax != null
      ? `${post.salaryMin != null ? bnTaka(post.salaryMin) : ''}${
          post.salaryMin != null && post.salaryMax != null ? ' – ' : ''
        }${post.salaryMax != null ? bnTaka(post.salaryMax) : ''}`
      : undefined;

  return (
    <Frame>
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
                : 'এই পোস্টটি অনুমোদিত হয়নি। কারণ জানতে চাইলে সম্পাদনা করে আবার পাঠাতে পারেন।'}
            </p>
          </div>
        )}

        <article className="mt-3 overflow-hidden rounded-xl border border-brand-100 bg-white">
          {post.coverImageUrl && (
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-mist-100">
              <ListingMedia
                src={post.coverImageUrl}
                alt={post.titleBn}
                label={post.titleBn}
              />
            </div>
          )}

          <div className="p-4 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded border border-brand-100 bg-mist-50 px-1.5 py-[2px] text-[10px] font-extrabold text-brand-700">
                {POST_META[kind]}
              </span>
              {post.category && (
                <span className="truncate text-[11px] font-bold text-brand-600">
                  {tagLabel(post.category)}
                </span>
              )}
              {post.isFeatured && post.status === 'approved' && (
                <span className="rounded bg-accent-400 px-1.5 py-[2px] text-[10px] font-extrabold text-brand-950">
                  ফিচার্ড
                </span>
              )}
            </div>

            <h1 className="mt-2 text-xl font-extrabold leading-snug text-ink-900 sm:text-2xl">
              {post.titleBn}
            </h1>

            <p className="mt-1.5 text-[12px] text-ink-500">
              {post.authorName || 'সদস্য'}
              {areaName ? ` · ${areaName}` : ''}
            </p>

            {post.summaryBn && (
              <p className="mt-3 rounded-lg border border-brand-100 bg-mist-50 p-3 text-[13.5px] font-medium leading-relaxed text-ink-700 sm:text-[15px]">
                {post.summaryBn}
              </p>
            )}

            {((kind === 'job' &&
              (salary || jobTypeLabel || deadlineLabel || education || experience)) ||
              (kind === 'buy_sell' && (post.price != null || condition))) ? (
              <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 rounded-lg border border-brand-100 bg-mist-50 p-3 sm:grid-cols-3">
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
              <div className="mt-4 space-y-3 text-[14px] leading-[1.75] text-ink-700 sm:text-[15px]">
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
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {tagLabels(post.tags).map((tag) => (
                  <li
                    key={tag}
                    className="rounded border border-brand-100 bg-mist-50 px-2 py-[3px] text-[11px] font-medium text-ink-600"
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
      </div>
    </Frame>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-400">
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-[13.5px] font-bold text-ink-900">{value}</dd>
    </div>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  // No global Footer, matching the other listing and detail pages: the article
  // ends the page and the fixed mobile bottom nav (mounted in the root layout)
  // is the last thing on screen.
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-mist-50">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-3 py-4 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
