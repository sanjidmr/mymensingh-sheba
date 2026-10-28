/**
 * Shared, framework-free helpers for the newspaper homepage.
 *
 * The public news surface reads the same `community_posts` rows the old
 * `/news` directory did (kind = 'news', status = 'approved'). This module only
 * shapes those rows for display; it never invents a story, a view count or a
 * publication time.
 */
import { NEWS_CATEGORIES, bnRelativeTime, toBn } from '@/lib/catalog-types';

export type NewsStory = {
  id: string;
  slug: string;
  titleBn: string;
  summaryBn?: string;
  bodyBn?: string;
  coverImageUrl?: string;
  category?: string;
  authorName?: string;
  areaId?: string;
  tags: string[];
  isFeatured: boolean;
  /** ISO timestamp used for ordering and the printed publication line. */
  publishedAt: string;
  createdAt: string;
};

export type NewsSearchItem = {
  id: string;
  slug: string;
  titleBn: string;
  summaryBn?: string;
  categoryLabel: string;
  publishedLabel: string;
};

/** A desk heading on the homepage. */
export type NewsGroup = {
  id: string;
  label: string;
  stories: NewsStory[];
};

const BN_MONTHS = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

const BN_WEEKDAYS = [
  'রবিবার',
  'সোমবার',
  'মঙ্গলবার',
  'বুধবার',
  'বৃহস্পতিবার',
  'শুক্রবার',
  'শনিবার',
];

/**
 * Labels for desk ids that exist in production rows but are not (yet) in the
 * public create-form taxonomy. `local` is stored by several older submissions;
 * printing a raw id at a reader would be worse than resolving it.
 */
const DESK_ALIASES: Record<string, string> = {
  local: 'স্থানীয়',
  service: 'সেবা',
  other: 'অন্যান্য',
  others: 'অন্যান্য',
};

export function deskLabel(category?: string | null): string {
  if (!category) return 'সংবাদ';
  const known = NEWS_CATEGORIES.find((desk) => desk.id === category);
  if (known) return known.labelBn;
  return DESK_ALIASES[category] ?? 'অন্যান্য';
}

export function deskHref(category?: string | null): string {
  return category ? `/news?category=${encodeURIComponent(category)}` : '/news';
}

/** `published_at` is the editorial order; created_at is the honest fallback. */
export function storyTimestamp(story: NewsStory): number {
  const value = Date.parse(story.publishedAt || story.createdAt);
  return Number.isNaN(value) ? 0 : value;
}

export function sortNewestFirst(stories: NewsStory[]): NewsStory[] {
  return [...stories].sort((a, b) => storyTimestamp(b) - storyTimestamp(a));
}

/**
 * The lead slot prefers a featured story that actually has a photograph, then
 * any story with a photograph, then the newest story. This is an editorial
 * choice about the composition — it never promotes invented content.
 */
export function pickLead(stories: NewsStory[]): NewsStory | undefined {
  if (stories.length === 0) return undefined;
  return (
    stories.find((story) => story.isFeatured && story.coverImageUrl) ??
    stories.find((story) => story.coverImageUrl) ??
    stories[0]
  );
}

/** Bangla date for a Dhaka wall clock, without Intl/hydration drift. */
export function formatLongBnDate(date: Date): string {
  const dhaka = new Date(date.getTime() + 6 * 60 * 60 * 1000);
  return `${BN_WEEKDAYS[dhaka.getUTCDay()]}, ${toBn(
    dhaka.getUTCDate()
  )} ${BN_MONTHS[dhaka.getUTCMonth()]} ${toBn(dhaka.getUTCFullYear())}`;
}

function bnClock(date: Date): string {
  const hour = date.getUTCHours();
  const minute = date.getUTCMinutes();
  const period = hour < 6 ? 'রাত' : hour < 12 ? 'সকাল' : hour < 16 ? 'দুপুর' : hour < 19 ? 'বিকাল' : 'রাত';
  const displayHour = hour % 12 || 12;
  return `${period} ${toBn(displayHour)}:${toBn(String(minute).padStart(2, '0'))}`;
}

export function formatNewsTimestamp(
  value: string | undefined,
  now?: number
): { relative?: string; exact?: string } {
  if (!value) return {};
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return {};
  const dhaka = new Date(parsed.getTime() + 6 * 60 * 60 * 1000);
  return {
    relative: now == null ? undefined : bnRelativeTime(value, now),
    exact: `${toBn(dhaka.getUTCDate())} ${BN_MONTHS[dhaka.getUTCMonth()]} ${toBn(
      dhaka.getUTCFullYear()
    )}, ${bnClock(dhaka)}`,
  };
}

export function searchItems(stories: NewsStory[], now: number): NewsSearchItem[] {
  return sortNewestFirst(stories).map((story) => ({
    id: story.id,
    slug: story.slug,
    titleBn: story.titleBn,
    summaryBn: story.summaryBn,
    categoryLabel: deskLabel(story.category),
    publishedLabel: formatNewsTimestamp(story.publishedAt || story.createdAt, now).relative ?? '',
  }));
}

/** Case-insensitive search over the fields a reader can actually see. */
export function matchesNewsQuery(story: NewsStory, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [
    story.titleBn,
    story.summaryBn,
    story.bodyBn,
    story.authorName,
    deskLabel(story.category),
    ...story.tags,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(needle);
}

export function filterNews(
  stories: NewsStory[],
  options: { category?: string; query?: string }
): NewsStory[] {
  const category = options.category?.trim();
  const query = options.query?.trim();
  return stories.filter((story) => {
    const matchesCategory = !category || story.category === category;
    const matchesQuery = !query || matchesNewsQuery(story, query);
    return matchesCategory && matchesQuery;
  });
}

/** Actual desks with at least one published story, in the site's desk order. */
export function groupByDesk(stories: NewsStory[]): NewsGroup[] {
  const map = new Map<string, NewsStory[]>();
  for (const story of sortNewestFirst(stories)) {
    const id = story.category?.trim() || 'others';
    const bucket = map.get(id);
    if (bucket) bucket.push(story);
    else map.set(id, [story]);
  }
  const order = new Map(NEWS_CATEGORIES.map((desk, index) => [desk.id, index]));
  return [...map.entries()]
    .map(([id, groupStories]) => ({ id, label: deskLabel(id), stories: groupStories }))
    .sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));
}

/**
 * Only desks that can carry a real section are rendered: a one-story desk would
 * be a lonely card, not a section. Anything left over is listed once under
 * "আরও সংবাদ" instead of wearing a heading it cannot fill.
 */
export function homepageDeskSections(stories: NewsStory[]): NewsGroup[] {
  return groupByDesk(stories).filter((group) => group.stories.length >= 2);
}
