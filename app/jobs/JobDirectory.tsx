'use client';

import React, { useCallback, useMemo } from 'react';
import CommunityDirectory from '@/components/catalog/CommunityDirectory';
import { JobCard } from '@/components/catalog/CommunityCards';
import { rangeGroup, tagFacet } from '@/components/catalog/CatalogDirectory';
import { areaFilterGroupMulti, type FilterGroup } from '@/lib/directory-filters';
import {
  JOB_EDUCATION,
  JOB_EXPERIENCE,
  JOB_TYPES,
  type CommunityPost,
} from '@/lib/catalog-types';

const TITLE = 'চাকরির খবর';
const CREATE_HREF = '/jobs/create';

const SORT_OPTIONS = [
  { id: 'newest', labelBn: 'নতুন আগে' },
  { id: 'salary_desc', labelBn: 'বেশি বেতন আগে' },
  { id: 'salary_asc', labelBn: 'কম বেতন আগে' },
];

const SORTERS = {
  // Compare on the top of the band, since that is the figure a reader scanning
  // a salary filter is reacting to.
  salary_desc: (a: CommunityPost, b: CommunityPost) =>
    (b.salaryMax ?? b.salaryMin ?? -1) - (a.salaryMax ?? a.salaryMin ?? -1),
  salary_asc: (a: CommunityPost, b: CommunityPost) =>
    (a.salaryMin ?? a.salaryMax ?? Number.MAX_SAFE_INTEGER) -
    (b.salaryMin ?? b.salaryMax ?? Number.MAX_SAFE_INTEGER),
};

export default function JobDirectory() {
  const filterGroups = useMemo<FilterGroup[]>(
    () => [
      areaFilterGroupMulti(),
      tagFacet('jobType', 'চাকরির ধরন', JOB_TYPES),
      tagFacet('category', 'শিক্ষাগত যোগ্যতা', JOB_EDUCATION),
      tagFacet('experience', 'অভিজ্ঞতা', JOB_EXPERIENCE),
    ],
    []
  );

  const renderCard = useCallback((post: CommunityPost) => <JobCard post={post} />, []);

  return (
    <CommunityDirectory
      kind="job"
      title={TITLE}
      subtitle="ময়মনসিংহে চাকরি ও ফ্রিল্যান্স কাজের খবর — বেতন, যোগ্যতা ও এলাকা অনুযায়ী খুঁজুন।"
      placeholder="পদের নাম, প্রতিষ্ঠান বা এলাকা লিখে খুঁজুন..."
      noun="চাকরি"
      highlights={['বেতন ও যোগ্যতা স্পষ্ট', 'সদস্যদের পোস্ট', 'অ্যাডমিন অনুমোদনের পর প্রকাশ']}
      createHref={CREATE_HREF}
      createLabel="চাকরির খবর দিন"
      requiresAuth
      filterGroups={filterGroups}
      sortOptions={SORT_OPTIONS}
      sorters={SORTERS}
      rangeField={(post) => post.salaryMin ?? post.salaryMax}
      renderCard={renderCard}
      gridClass="grid gap-2.5 sm:gap-3 md:grid-cols-2 lg:grid-cols-3"
    />
  );
}
