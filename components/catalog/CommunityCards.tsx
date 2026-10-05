'use client';

/**
 * The community-post card family: news, jobs, buy-sell.
 *
 * These three are the user-submitted half of the site, so the card design has to
 * carry two extra ideas the curated cards do not: the post is by a named person,
 * and it has not necessarily been published yet (a signed-in author sees their
 * own pending and rejected posts). Both are stated explicitly rather than
 * implied, so nobody mistakes a queued post for a live one.
 *
 * Layouts follow the brief: news is editorial and wide, jobs are a compact
 * list, buy-sell is a tight 2-up phone / 5-up desktop grid.
 */
import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, MapPin } from 'lucide-react';
import { ListingMedia } from '@/components/catalog/CatalogCards';
import { bnTaka, tagLabel, tagLabels } from '@/lib/catalog-types';
import type { CommunityPost, PostStatus } from '@/lib/catalog-types';
import { getAreaById } from '@/lib/locations';

const CARD_BASE =
  'group flex h-full flex-col overflow-hidden rounded-xl border border-brand-100 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-bronze-300 hover:shadow-md hover:shadow-brand-900/[0.07] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';

/**
 * The desk a post belongs to, as a readable label.
 *
 * `category` stores the taxonomy id so the facet can match on it, which means
 * it has to be resolved back to Bangla before it reaches a reader.
 */
function categoryLabel(category?: string): string | undefined {
  return category ? tagLabel(category) : undefined;
}

const STATUS_META: Record<PostStatus, { labelBn: string; className: string }> = {
  pending: { labelBn: 'অনুমোদনের অপেক্ষায়', className: 'bg-amber-100 text-amber-900' },
  approved: { labelBn: 'প্রকাশিত', className: 'bg-brand-50 text-brand-800' },
  rejected: { labelBn: 'অনুমোদিত হয়নি', className: 'bg-red-50 text-red-800' },
};

/** Only shown to the author, on their own not-yet-published post. */
function StatusBadge({ status }: { status: PostStatus }) {
  if (status === 'approved') return null;
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md px-1.5 py-[3px] text-[10px] font-extrabold ${meta.className}`}
    >
      {meta.labelBn}
    </span>
  );
}

function AreaLine({ areaId }: { areaId?: string }) {
  const name = areaId ? getAreaById(areaId)?.nameBn : undefined;
  if (!name) return null;
  return (
    <span className="inline-flex min-w-0 items-center gap-1 text-[10.5px] text-ink-400">
      <MapPin className="h-3 w-3 shrink-0 text-brand-500" aria-hidden="true" />
      <span className="truncate">{name}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// News — editorial, horizontal on desktop
// ---------------------------------------------------------------------------

export function NewsCard({ post }: { post: CommunityPost }) {
  return (
    <Link href={`/news/${post.slug}`} className={`${CARD_BASE} flex-row`}>
      <div className="relative aspect-[4/3] w-[38%] shrink-0 overflow-hidden bg-mist-100 sm:aspect-[16/10] sm:w-[42%]">
        <ListingMedia src={post.coverImageUrl} alt={post.titleBn} label={post.titleBn} />
        {post.isFeatured && (
          <span className="absolute left-1.5 top-1.5 rounded-md bg-accent-400 px-1.5 py-[3px] text-[10px] font-extrabold text-brand-950 shadow-sm">
            ফিচার্ড
          </span>
        )}
        <span className="absolute right-1.5 top-1.5">
          <StatusBadge status={post.status} />
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-2.5 sm:p-4">
        <div className="flex items-center gap-2">
          {post.category && (
            <span className="truncate text-[10px] font-extrabold uppercase tracking-wide text-brand-600">
              {categoryLabel(post.category)}
            </span>
          )}
          <span className="truncate text-[10.5px] text-ink-400">
            {post.authorName || 'সদস্য'}
          </span>
        </div>

        <h3 className="mt-1 line-clamp-2 text-[13.5px] font-bold leading-snug text-ink-900 sm:text-base">
          {post.titleBn}
        </h3>

        {post.summaryBn && (
          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-ink-500 sm:line-clamp-3 sm:text-[13px]">
            {post.summaryBn}
          </p>
        )}

        <span className="mt-auto flex items-center gap-1 pt-2 text-[11px] font-bold text-brand-700 sm:text-xs">
          <span className="truncate">বিস্তারিত পড়ুন</span>
          <ArrowRight
            className="h-3 w-3 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  );
}

/** One item in the news "latest" list — no image, denser than the lead card. */
export function NewsListRow({ post }: { post: CommunityPost }) {
  return (
    <Link
      href={`/news/${post.slug}`}
      className="group flex min-w-0 items-start gap-2.5 border-b border-brand-100 py-2.5 last:border-b-0"
    >
      <div className="min-w-0 flex-1">
        {post.category && (
          <span className="text-[10px] font-extrabold uppercase tracking-wide text-brand-600">
            {categoryLabel(post.category)}
          </span>
        )}
        <h3 className="mt-0.5 line-clamp-2 text-[13px] font-bold leading-snug text-ink-900 group-hover:text-brand-800 sm:text-sm">
          {post.titleBn}
        </h3>
        <p className="mt-0.5 truncate text-[10.5px] text-ink-400">
          {post.authorName || 'সদস্য'}
        </p>
      </div>
      <StatusBadge status={post.status} />
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Jobs — compact, salary-forward
// ---------------------------------------------------------------------------

export function JobCard({ post }: { post: CommunityPost }) {
  const salary =
    post.salaryMin != null || post.salaryMax != null
      ? `${post.salaryMin != null ? bnTaka(post.salaryMin) : ''}${
          post.salaryMin != null && post.salaryMax != null ? ' – ' : ''
        }${post.salaryMax != null ? bnTaka(post.salaryMax) : ''}`
      : undefined;

  return (
    <Link href={`/jobs/${post.slug}`} className={CARD_BASE}>
      <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          {post.category && (
            <span className="truncate rounded border border-brand-100 bg-mist-50 px-1.5 py-[2px] text-[10px] font-extrabold text-brand-700">
              {categoryLabel(post.category)}
            </span>
          )}
          <StatusBadge status={post.status} />
        </div>

        <h3 className="mt-1.5 line-clamp-2 text-[13.5px] font-bold leading-snug text-ink-900 sm:text-[15px]">
          {post.titleBn}
        </h3>

        {post.summaryBn && (
          <p className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-ink-500 sm:text-[13px]">
            {post.summaryBn}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          {salary && (
            <span className="text-[13px] font-extrabold text-brand-800 sm:text-sm">
              {salary}
            </span>
          )}
          <AreaLine areaId={post.areaId} />
        </div>

        {tagLabels(post.tags).length > 0 && (
          <ul className="mt-1.5 flex flex-wrap gap-1">
            {tagLabels(post.tags).slice(0, 3).map((tag) => (
              <li
                key={tag}
                className="max-w-full truncate rounded border border-brand-100 bg-mist-50 px-1.5 py-[2px] text-[10px] font-medium text-ink-600"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-brand-100 pt-2.5">
          <span className="flex min-w-0 items-center gap-1 text-[11px] font-bold text-brand-700 sm:text-xs">
            <span className="truncate">বিস্তারিত</span>
            <ArrowRight
              className="h-3 w-3 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </span>
        </div>
      </div>
    </Link>
  );
}

// The buy-sell card used to live here too. It is now
// `components/buy-sell/ProductCard`, which carries the seller name and the
// posted date that this one had no room for.

// ---------------------------------------------------------------------------
// The compact card used in "my posts"
// ---------------------------------------------------------------------------

export function MyPostRow({
  post,
  href,
}: {
  post: CommunityPost;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex min-w-0 items-center gap-3 rounded-xl border border-brand-100 bg-white p-2.5 transition-colors hover:border-brand-200"
    >
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-mist-100">
        <ListingMedia src={post.coverImageUrl} alt={post.titleBn} label={post.titleBn} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <StatusBadge status={post.status} />
          {post.category && (
            <span className="truncate text-[10px] font-bold text-brand-600">
              {categoryLabel(post.category)}
            </span>
          )}
        </div>
        <h3 className="mt-0.5 line-clamp-1 text-[12.5px] font-bold text-ink-900 sm:text-[13.5px]">
          {post.titleBn}
        </h3>
        <p className="mt-0.5 text-[10.5px] text-ink-400">
          {post.kind === 'job' ? 'চাকরির পোস্ট' : post.kind === 'news' ? 'সংবাদ' : 'বিক্রয়ের পোস্ট'}
        </p>
      </div>
      <ArrowRight
        className="h-4 w-4 shrink-0 text-brand-300 transition-transform duration-200 group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </Link>
  );
}
