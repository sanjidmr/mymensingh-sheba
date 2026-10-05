'use client';

/**
 * The marketplace product card.
 *
 * The brief for this card is: big image, title, price, area, condition, short
 * info, seller name, posted date. That is eight facts on a card that is one
 * column of a five-up desktop grid and half a phone screen — so the hierarchy
 * has to be explicit about what wins:
 *
 *   1. the photo   — on a marketplace the picture is the product
 *   2. the price   — the second thing, and the only number
 *   3. the title   — three lines, because a used phone listing says
 *                    "সেলস ইউনুস এস২১ আর, কারভার আছে, ঢাকা থেকে"
 *   4. area + condition + date + seller — one thin metadata strip
 *
 * The old card showed photo, price, title, area and condition and nothing else,
 * which meant a reader who liked a photo could not tell whether it was twelve
 * days old or from 2021 — and on a page whose entire purpose is buying something
 * from a stranger, age is the second-most important thing after price.
 *
 * This is a separate component rather than a revision of the old `MarketCard`
 * in `components/catalog/CommunityCards.tsx`, which has been deleted. That card
 * had room for a photo, a price, a title, an area and a condition — no seller,
 * no date — because it was written before the marketplace had a `gallery`
 * column or an author name on the card.
 */

import React from 'react';
import Link from 'next/link';
import { Clock, MapPin, Package, User } from 'lucide-react';
import { ListingMedia } from '@/components/catalog/CatalogCards';
import {
  bnRelativeTime,
  bnTaka,
  tagLabel,
  type CommunityPost,
} from '@/lib/catalog-types';
import { getAreaById } from '@/lib/locations';

interface ProductCardProps {
  post: CommunityPost;
  /**
   * Pinned clock for the "posted" line.
   *
   * Passed in rather than read from `Date.now()` inside the card so a server
   * render and a client render of the same list cannot disagree about whether
   * a listing is "২ দিন আগে" or "৩ দিন আগে".
   */
  now: number;
}

export function ProductCard({ post, now }: ProductCardProps) {
  const area = post.areaId ? getAreaById(post.areaId)?.nameBn : undefined;
  const posted = bnRelativeTime(post.publishedAt ?? post.createdAt, now);
  // The condition lives in `conditionLabel` (display text, already Bangla) and the
  // band id in `tags` (what the filter matches). Resolve the label from either,
  // so a row written before the column existed still shows its condition.
  const condition = post.conditionLabel || conditionFromTags(post.tags);
  // Anything in `tags` that is neither the category nor the condition is the
  // seller's own extra note ("ফোন চার্জার সহ", "নিজস্ব লাইসেনসহ").
  const extras = post.tags.filter((t) => t !== post.category && !isConditionId(t));

  return (
    <Link
      href={`/buy-sell/${post.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-mist-200 bg-white transition-all duration-150 hover:border-brand-300 hover:shadow-[0_6px_20px_rgba(7,39,31,0.09)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
    >
      {/* 4:3, not square. A square crop of a phone listing crops the top and
          bottom of the handset off; 4:3 shows what was actually for sale. */}
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-mist-100">
        <ListingMedia src={post.coverImageUrl} alt={post.titleBn} label={post.titleBn} />
        <div className="absolute left-0 top-0 flex flex-col items-start gap-1 p-1.5">
          {post.isFeatured && (
            <span className="rounded-md bg-accent-400 px-1.5 py-[3px] text-[10px] font-extrabold text-brand-950 shadow-sm">
              ফিচার্ড
            </span>
          )}
          {post.isDemo && (
            <span className="rounded-md border border-white/40 bg-brand-900/75 px-1.5 py-[3px] text-[10px] font-extrabold text-white shadow-sm">
              নমুনা
            </span>
          )}
        </div>
        {condition && (
          <span className="absolute bottom-1.5 left-1.5 rounded-md bg-white/90 px-1.5 py-[3px] text-[10px] font-bold text-ink-700 shadow-sm backdrop-blur-[2px]">
            {condition}
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-2.5">
        <p className="truncate text-[15px] font-black leading-tight text-brand-800">
          {post.price != null ? bnTaka(post.price) : 'দাম আলোচনা'}
        </p>

        <h3 className="mt-1 line-clamp-2 text-[12.5px] font-semibold leading-snug text-ink-900">
          {post.titleBn}
        </h3>

        {post.summaryBn && (
          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-ink-500">
            {post.summaryBn}
          </p>
        )}

        {extras.length > 0 && (
          <p className="mt-1.5 flex items-start gap-1 text-[10.5px] leading-snug text-brand-700">
            <Package className="mt-[1px] h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="line-clamp-1">{extras.slice(0, 2).join(' · ')}</span>
          </p>
        )}

        {/* Metadata strip. Two rows on a narrow card rather than one crammed
            row, because four facts and a timestamp do not fit on one line at
            200px and truncating the seller name to three characters is worse
            than wrapping. */}
        <div className="mt-auto space-y-0.5 pt-2">
          {area && (
            <p className="flex items-center gap-1 truncate text-[10.5px] text-ink-500">
              <MapPin className="h-3 w-3 shrink-0 text-brand-500" aria-hidden="true" />
              <span className="truncate">{area}</span>
            </p>
          )}
          {post.authorName && (
            <p className="flex items-center gap-1 truncate text-[10.5px] text-ink-500">
              <User className="h-3 w-3 shrink-0 text-ink-300" aria-hidden="true" />
              <span className="truncate">{post.authorName}</span>
            </p>
          )}
          {posted && (
            <p className="flex items-center gap-1 text-[10.5px] text-ink-400">
              <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span>{posted}</span>
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

const CONDITION_IDS = new Set(['new', 'like-new', 'good', 'used']);

function isConditionId(tag: string): boolean {
  return CONDITION_IDS.has(tag);
}

/** The condition band, resolved back to its Bangla label from `tags`. */
function conditionFromTags(tags: string[]): string | undefined {
  const hit = tags.find(isConditionId);
  return hit ? tagLabel(hit) : undefined;
}