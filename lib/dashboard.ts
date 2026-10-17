/**
 * Shared row model for the customer dashboard's post lists.
 *
 * The dashboard shows TWO kinds of submission side by side — community posts
 * (news / jobs / buy-sell) and to-let listings — which live in different
 * tables with different status vocabularies. Normalising both into one row
 * shape is what lets the home page and the "আমার পোস্ট" page sort, filter and
 * render them with a single code path instead of two drifting copies.
 *
 * Pure data helpers only: no Supabase, no React — safe to import anywhere.
 */
import { TOLET_PROPERTY_TYPE_INFO, TOLET_LISTING_STATUS_INFO, type ToletListing, type ToletListingStats } from './tolet-types';
import { tagLabel, type CommunityPost, type PostKind, type PostStatus } from './catalog-types';
import type { BloodDonorProfile, HomeTutorProfile } from './supabase/types';

/** Public route per post kind (kept here so both dashboard pages agree). */
export const POST_ROUTE: Record<PostKind, string> = {
  news: '/news',
  job: '/jobs',
  buy_sell: '/buy-sell',
};

/** Community post status → the three labels the dashboard promises users. */
const POST_STATUS_META: Record<PostStatus, { label: string; className: string }> = {
  pending: { label: 'অনুমোদনের অপেক্ষায়', className: 'bg-amber-100 text-amber-900' },
  approved: { label: 'অনুমোদিত', className: 'bg-brand-50 text-brand-800' },
  rejected: { label: 'বাতিল', className: 'bg-red-50 text-red-800' },
};

const POST_KIND_LABEL: Record<PostKind, string> = {
  news: 'সংবাদ',
  job: 'চাকরি',
  buy_sell: 'কেনাবেচা',
};

const DHAKA_DATE_FORMATTER = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Dhaka',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/**
 * The four filter buckets. A to-let `pending_review` is the same idea as a
 * community `pending`; drafts/archived/suspended rows belong to none of the
 * three moderation outcomes, so they surface under "সব" with their own label
 * rather than being silently folded into a bucket that would misreport them.
 */
export type StatusBucket = 'pending' | 'approved' | 'rejected' | 'other';

export interface DashboardRow {
  source: 'post' | 'tolet' | 'tutor' | 'donor' | 'draft';
  id: string;
  title: string;
  image?: string;
  /** সংবাদ / চাকরি / কেনাবেচা / বাসা ভাড়া */
  typeLabel: string;
  /** Category facet (news desk, market type, property type). */
  categoryLabel?: string;
  /** ISO timestamp — for sorting and relative display. */
  date: string;
  statusLabel: string;
  statusClass: string;
  bucket: StatusBucket;
  statusFilter: string;
  categoryFilter: string;
  /** Present only when the moderator supplied one. */
  rejectionReason?: string;
  viewHref: string;
  /** Undefined when the source has nothing editable (e.g. an approved post). */
  editHref?: string;
  /** To-let rows are removed by archiving — RLS has no owner DELETE. */
  canArchive?: boolean;
  canRemove?: boolean;
  draftKind?: PostKind;
  post?: CommunityPost;
  listing?: ToletListing;
  analytics?: ToletListingStats;
  /** Real page views for a community post (keyed by slug); undefined when unknown. */
  postViews?: number;
}

function postRow(post: CommunityPost, postViews?: number): DashboardRow {
  const meta = POST_STATUS_META[post.status];
  const marketplaceStatus = post.kind === 'buy_sell' ? post.marketplaceStatus ?? 'available' : 'available';
  const isApprovedMarket = post.status === 'approved' && post.kind === 'buy_sell';
  const todayInDhaka = DHAKA_DATE_FORMATTER.format(new Date());
  const isExpiredJob =
    post.status === 'approved' && post.kind === 'job' && Boolean(post.deadline && post.deadline < todayInDhaka);
  return {
    source: 'post',
    id: post.id,
    title: post.titleBn,
    image: post.coverImageUrl,
    typeLabel: POST_KIND_LABEL[post.kind],
    categoryLabel: post.category ? tagLabel(post.category) : undefined,
    date: post.createdAt,
    statusLabel: isExpiredJob ? 'মেয়াদ শেষ' : isApprovedMarket
      ? marketplaceStatus === 'sold' ? 'বিক্রি হয়েছে'
        : marketplaceStatus === 'closed' ? 'বন্ধ' : 'প্রকাশিত'
      : meta.label,
    statusClass: isExpiredJob
      ? 'bg-slate-100 text-slate-700'
      : isApprovedMarket && marketplaceStatus === 'sold'
      ? 'bg-slate-100 text-slate-700'
      : isApprovedMarket && marketplaceStatus === 'closed'
        ? 'bg-mist-100 text-ink-600'
        : meta.className,
    bucket: post.status,
    statusFilter: isExpiredJob ? 'expired' : isApprovedMarket && marketplaceStatus !== 'available'
      ? marketplaceStatus
      : post.status === 'approved' ? 'published' : post.status,
    categoryFilter: post.kind,
    rejectionReason: post.rejectionReason,
    canRemove: true,
    // The detail page lets an author read their own pending/rejected post
    // through `fetchPostForViewer`, so this link is valid for every status.
    viewHref: `${POST_ROUTE[post.kind]}/${post.slug}`,
    // Approved posts are frozen: `fetchMyPostForEdit` refuses them, so offering
    // an edit button would only lead to a "not found" page.
    editHref:
      post.status === 'approved'
        ? undefined
        : `/profile/posts/${post.kind}/${post.id}/edit`,
    postViews,
  };
}

function listingRow(listing: ToletListing, analytics?: ToletListingStats): DashboardRow {
  const status = TOLET_LISTING_STATUS_INFO[listing.status];
  return {
    source: 'tolet',
    id: listing.id,
    title: listing.title,
    image: listing.photos[0],
    typeLabel: 'বাসা ভাড়া',
    categoryLabel: TOLET_PROPERTY_TYPE_INFO[listing.propertyType].shortLabelBn,
    date: listing.createdAt,
    statusLabel: status.labelBn,
    statusClass: status.badgeClass,
    bucket:
      listing.status === 'pending_review'
        ? 'pending'
        : listing.status === 'approved' || listing.status === 'rejected'
          ? listing.status
          : 'other',
    rejectionReason: listing.rejectionReason,
    viewHref: `/tolet/${listing.id}`,
    editHref: `/profile/tolet/${listing.id}/edit`,
    canArchive: listing.status !== 'archived' && listing.status !== 'suspended',
    canRemove: true,
    statusFilter: listing.status === 'pending_review' ? 'pending' :
      listing.status === 'approved' ? 'published' :
        listing.status === 'archived' ? 'archived' :
          listing.status === 'unavailable' ? 'closed' : listing.status,
    categoryFilter: 'tolet',
    listing,
    analytics,
  };
}

function profileRow(profile: HomeTutorProfile | BloodDonorProfile, kind: 'tutor' | 'donor'): DashboardRow {
  const status = profile.status;
  const labels: Record<string, string> = {
    draft: 'খসড়া',
    pending_approval: 'অনুমোদনের অপেক্ষায়',
    approved: 'প্রকাশিত',
    rejected: 'সংশোধন প্রয়োজন',
    paused: 'বিরতি',
    suspended: 'স্থগিত',
  };
  const isTutor = kind === 'tutor';
  return {
    source: kind,
    id: profile.id,
    title: profile.fullName,
    typeLabel: isTutor ? 'গৃহশিক্ষক' : 'রক্তদাতা',
    categoryFilter: kind,
    date: profile.createdAt,
    statusLabel: labels[status] || status,
    statusClass: status === 'approved' ? 'bg-brand-50 text-brand-800'
      : status === 'pending_approval' ? 'bg-amber-100 text-amber-900'
        : status === 'rejected' ? 'bg-red-50 text-red-800' : 'bg-mist-100 text-ink-700',
    bucket: status === 'pending_approval' ? 'pending'
      : status === 'approved' ? 'approved'
        : status === 'rejected' ? 'rejected' : 'other',
    statusFilter: status === 'approved' ? 'published'
      : status === 'pending_approval' ? 'pending'
        : status === 'rejected' ? 'needs_edit' : status,
    image: profile.profilePhotoUrl,
    rejectionReason: profile.rejectionReason,
    canRemove: false,
    viewHref: status === 'approved'
      ? (isTutor ? `/home-tutor/${profile.id}` : `/blood-donor/${profile.id}`)
      : (isTutor ? '/profile/home-tutor/setup' : '/profile/blood-donor/setup'),
    editHref: status === 'suspended' || status === 'paused'
      ? undefined
      : isTutor ? '/profile/home-tutor/edit' : '/profile/blood-donor/edit',
  };
}

export function communityDraftRow(
  kind: PostKind,
  values: Record<string, string>,
  date: string,
  image?: string
): DashboardRow {
  const labels: Record<PostKind, string> = { news: 'সংবাদ', job: 'চাকরি', buy_sell: 'কেনাবেচা' };
  return {
    source: 'draft',
    id: `draft-${kind}`,
    title: values.title || labels[kind] + ' খসড়া',
    image,
    typeLabel: labels[kind],
    categoryFilter: kind,
    date,
    statusLabel: 'খসড়া',
    statusClass: 'bg-mist-100 text-ink-700',
    bucket: 'other',
    statusFilter: 'draft',
    viewHref: kind === 'news' ? '/news/create' : kind === 'job' ? '/jobs/create' : '/buy-sell/create',
    editHref: kind === 'news' ? '/news/create' : kind === 'job' ? '/jobs/create' : '/buy-sell/create',
    canRemove: true,
    draftKind: kind,
  };
}

/** All customer-managed profile and post rows, newest first. */
export function mergeRows(
  posts: CommunityPost[],
  listings: ToletListing[],
  tutor?: HomeTutorProfile | null,
  donor?: BloodDonorProfile | null,
  drafts: DashboardRow[] = [],
  listingStats: Record<string, ToletListingStats> = {},
  postViewsBySlug: Record<string, number> = {}
): DashboardRow[] {
  return [
    ...posts.map((post) => postRow(post, postViewsBySlug[post.slug])),
    ...listings.map((listing) => listingRow(listing, listingStats[listing.id])),
    ...(tutor ? [profileRow(tutor, 'tutor')] : []),
    ...(donor ? [profileRow(donor, 'donor')] : []),
    ...drafts,
  ].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function bucketOf(row: DashboardRow): StatusBucket {
  return row.bucket;
}
