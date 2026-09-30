'use client';

/**
 * Search + filter for the user-authored post pages.
 *
 * Unlike the curated directories, these pages have no admin to add rows, so the
 * "still empty" state is different: it invites the reader to create the post.
 * That is the only place on the site where an empty community list is treated as
 * an invitation rather than a gap.
 */
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import DirectoryShell from '@/components/directory/DirectoryShell';
import DirectorySearchBar from '@/components/directory/DirectorySearchBar';
import DirectoryResults from '@/components/directory/DirectoryResults';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';
import { useDirectoryController } from '@/lib/use-directory-controller';
import { useAuth } from '@/lib/auth-context';
import type { FilterGroup, MatchableRecord } from '@/lib/directory-filters';
import type { SearchableFields } from '@/lib/directory-search';
import { getAreaById } from '@/lib/locations';
import { fetchApprovedPosts, fetchMyPosts } from '@/lib/catalog-service';
import type { CommunityPost, PostKind } from '@/lib/catalog-types';

export interface CommunityDirectoryProps {
  /** Which posts this page shows; drives the fetch and the create link. */
  kind: PostKind;
  title: string;
  subtitle: string;
  placeholder: string;
  noun: string;
  highlights: string[];
  /** Where the "add a post" button points, and the label for it. */
  createHref: string;
  createLabel: string;
  /** Requires a signed-in account. Shown as a login prompt instead of a button. */
  requiresAuth: boolean;
  filterGroups: FilterGroup[];
  sortOptions: { id: string; labelBn: string }[];
  sorters: Record<string, (a: CommunityPost, b: CommunityPost) => number>;
  /** The value a `range` group compares against on this page. */
  rangeField: (post: CommunityPost) => number | undefined;
  renderCard: (post: CommunityPost) => React.ReactNode;
  /** Mobile / desktop cards per row, per the page's design. */
  gridClass: string;
}

export default function CommunityDirectory(props: CommunityDirectoryProps) {
  const {
    kind,
    title,
    subtitle,
    placeholder,
    noun,
    highlights,
    createHref,
    createLabel,
    requiresAuth,
    filterGroups,
    sortOptions,
    sorters,
    rangeField,
    renderCard,
    gridClass,
  } = props;
  const { user } = useAuth();

  const posts = usePosts(kind);

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
      ranges: { price: rangeField(post) },
      values: {
        // Taxonomy-backed facets. `category` is also used for the news desk and
        // the education requirement, which is why it shares one key: a post has
        // exactly one desk, and the facets shown are chosen by the page.
        category: post.category,
        jobType: post.jobType,
        // Experience and condition live in `tags` like the curated categories,
        // so they are matched as a list.
        experience: post.tags,
        condition: post.conditionLabel,
      },
    }),
    [rangeField]
  );

  const controller = useDirectoryController<CommunityPost>({
    items: posts.items,
    searchable,
    matchable,
    filterGroups,
    sorters,
  });

  const needsLogin = requiresAuth && !user;

  return (
    <DirectoryShell
      title={title}
      subtitle={subtitle}
      breadcrumbs={[{ label: title }]}
      highlights={highlights}
      action={
        needsLogin ? (
          <Link
            href={`/login?next=${encodeURIComponent(createHref)}`}
            className={`inline-flex min-h-[40px] shrink-0 items-center rounded-lg bg-brand-700 px-3.5 text-[13px] font-extrabold text-white transition-colors hover:bg-brand-800 ${LIGHT_FOCUS}`}
          >
            পোস্ট করতে লগইন
          </Link>
        ) : (
          <Link
            href={createHref}
            className={`inline-flex min-h-[40px] shrink-0 items-center rounded-lg bg-brand-700 px-3.5 text-[13px] font-extrabold text-white transition-colors hover:bg-brand-800 ${LIGHT_FOCUS}`}
          >
            {createLabel}
          </Link>
        )
      }
    >
      <DirectorySearchBar
        value={controller.query}
        onChange={controller.setQuery}
        placeholder={placeholder}
        filterGroups={filterGroups}
        filterState={controller.filterState}
        onFilterStateChange={controller.setFilterState}
        resultCount={controller.results.length}
        resultNoun={noun}
        tone="choose"
        sortOptions={sortOptions}
        currentSort={controller.sort}
        onSortChange={controller.setSort}
      />

      <div className="mt-2.5">
        <DirectoryResults
          loading={posts.loading}
          empty={controller.results.length === 0}
          count={controller.results.length}
          noun={noun}
          loadingText="তালিকা লোড হচ্ছে…"
          onReset={controller.resetAll}
          unpopulated={
            <CommunityEmpty
              title={title}
              hasAnyData={posts.items.length > 0}
              createHref={createHref}
              createLabel={createLabel}
              needsLogin={needsLogin}
            />
          }
        >
          <div className={gridClass}>
            {controller.results.map((post) => (
              <React.Fragment key={post.id}>{renderCard(post)}</React.Fragment>
            ))}
          </div>
        </DirectoryResults>
      </div>
    </DirectoryShell>
  );
}

function CommunityEmpty({
  title,
  hasAnyData,
  createHref,
  createLabel,
  needsLogin,
}: {
  title: string;
  hasAnyData: boolean;
  createHref: string;
  createLabel: string;
  needsLogin: boolean;
}) {
  return (
    <div className="rounded-xl border border-dashed border-brand-200 bg-white px-5 py-9 text-center">
      <h2 className="text-base font-extrabold text-ink-900">
        {hasAnyData ? 'আপনার খোঁজার মতো কোনো তথ্য পাওয়া যায়নি।' : `এখনো কোনো ${title} পোস্ট নেই`}
      </h2>
      <p className="mx-auto mt-1.5 max-w-md text-[13px] leading-relaxed text-ink-500">
        {hasAnyData
          ? 'সার্চ বা ফিল্টারের শর্ত বদলে আবার চেষ্টা করুন।'
          : 'প্রথম পোস্টটি আপনিই করুন — পোস্টটি অ্যাডমিন অনুমোদনের পর প্রকাশিত হবে।'}
      </p>
      {!hasAnyData && (
        <Link
          href={needsLogin ? `/login?next=${encodeURIComponent(createHref)}` : createHref}
          className={`mt-4 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-brand-700 px-5 text-sm font-extrabold text-white transition-colors hover:bg-brand-800 ${LIGHT_FOCUS}`}
        >
          {needsLogin ? 'পোস্ট করতে লগইন করুন' : createLabel}
        </Link>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

/**
 * Fetches approved posts of one kind, plus the caller's own unpublished rows.
 *
 * Including the author's own pending and rejected posts is what makes the page
 * an honest view of "my posts are in here" instead of making a rejected
 * submission look deleted. The service layer scopes those rows to the caller.
 */
function usePosts(kind: PostKind) {
  const [items, setItems] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [approved, mine] = await Promise.all([
          fetchApprovedPosts(kind),
          fetchMyPosts(),
        ]);
        if (!active) return;
        const ownUnpublished = mine.filter(
          (p) => p.kind === kind && p.status !== 'approved'
        );
        setItems([...approved, ...ownUnpublished]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [kind]);

  return { items, loading };
}
