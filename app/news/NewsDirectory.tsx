'use client';

import React, { useCallback, useMemo } from 'react';
import CommunityDirectory from '@/components/catalog/CommunityDirectory';
import { NewsCard } from '@/components/catalog/CommunityCards';
import { areaFilterGroupMulti, type FilterGroup } from '@/lib/directory-filters';
import { rangeGroup, tagFacet } from '@/components/catalog/CatalogDirectory';
import {
  NEWS_CATEGORIES,
  type CommunityPost,
} from '@/lib/catalog-types';

const TITLE = 'সংবাদ';
const CREATE_HREF = '/news/create';

const SORT_OPTIONS = [
  { id: 'newest', labelBn: 'নতুন আগে' },
  { id: 'oldest', labelBn: 'পুরোনো আগে' },
];

/** `published_at` is the editorial order; fall back to creation for a draft. */
function publishedTime(post: CommunityPost): number {
  const value = post.publishedAt ?? post.createdAt;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

const SORTERS = {
  newest: (a: CommunityPost, b: CommunityPost) => publishedTime(b) - publishedTime(a),
  oldest: (a: CommunityPost, b: CommunityPost) => publishedTime(a) - publishedTime(b),
};

export default function NewsDirectory() {
  const filterGroups = useMemo<FilterGroup[]>(
    () => [tagFacet('category', 'বিভাগ', NEWS_CATEGORIES)],
    []
  );

  const renderCard = useCallback((post: CommunityPost) => <NewsCard post={post} />, []);

  return (
    <CommunityDirectory
      kind="news"
      title={TITLE}
      subtitle="ময়মনসিংহ ও আশপাশের এলাকার খবর, স্থানীয় সংবাদ ও তথ্য — সদস্যদের পোস্ট থেকে।"
      placeholder="খবরের শিরোনাম, বিভাগ বা এলাকা লিখে খুঁজুন..."
      noun="সংবাদ"
      highlights={['সদস্যদের পোস্ট', 'অ্যাডমিন অনুমোদনের পর প্রকাশ', 'বিভাগ অনুযায়ী খোঁজা']}
      createHref={CREATE_HREF}
      createLabel="সংবাদ পোস্ট করুন"
      requiresAuth
      filterGroups={filterGroups}
      sortOptions={SORT_OPTIONS}
      sorters={SORTERS}
      rangeField={() => undefined}
      renderCard={renderCard}
      // News is a single editorial column on every breakpoint — a lead story
      // reads as a story, not as one tile in a grid.
      gridClass="grid gap-2.5 sm:gap-3"
    />
  );
}
