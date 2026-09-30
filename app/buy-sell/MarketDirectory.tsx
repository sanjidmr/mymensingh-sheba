'use client';

import React, { useCallback, useMemo } from 'react';
import CommunityDirectory from '@/components/catalog/CommunityDirectory';
import { MarketCard } from '@/components/catalog/CommunityCards';
import { rangeGroup, tagFacet } from '@/components/catalog/CatalogDirectory';
import { areaFilterGroupMulti, type FilterGroup } from '@/lib/directory-filters';
import {
  MARKET_CATEGORIES,
  MARKET_CONDITIONS,
  MARKET_PRICE_BANDS,
  type CommunityPost,
} from '@/lib/catalog-types';

const TITLE = 'ক্রয়-বিক্রয়';
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
    (b.price ?? -1) - (a.price ?? -1),
};

export default function MarketDirectory() {
  const filterGroups = useMemo<FilterGroup[]>(
    () => [
      areaFilterGroupMulti(),
      tagFacet('category', 'ক্যাটাগরি', MARKET_CATEGORIES),
      tagFacet('condition', 'অবস্থা', MARKET_CONDITIONS),
      rangeGroup('price', 'দাম', MARKET_PRICE_BANDS),
    ],
    []
  );

  const renderCard = useCallback((post: CommunityPost) => <MarketCard post={post} />, []);

  return (
    <CommunityDirectory
      kind="buy_sell"
      title={TITLE}
      subtitle="ময়মনসিংহে ব্যবহৃত ও নতুন পণ্য কেনাবেচার তালিকা — ক্যাটাগরি, অবস্থা ও দাম অনুযায়ী খুঁজুন।"
      placeholder="পণ্যের নাম, ক্যাটাগরি বা এলাকা লিখে খুঁজুন..."
      noun="পণ্য"
      highlights={['সরাসরি বিক্রেতার পোস্ট', 'অ্যাডমিন অনুমোদনের পর প্রকাশ', 'দাম ও অবস্থা স্পষ্ট']}
      createHref={CREATE_HREF}
      createLabel="পণ্য বিক্রির পোস্ট দিন"
      requiresAuth
      filterGroups={filterGroups}
      sortOptions={SORT_OPTIONS}
      sorters={SORTERS}
      rangeField={(post) => post.price}
      renderCard={renderCard}
      // Brief: buy-sell is 2-up on a phone and 5-up on desktop.
      gridClass="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
    />
  );
}
