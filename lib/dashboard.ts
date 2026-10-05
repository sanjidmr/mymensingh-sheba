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
import { TOLET_PROPERTY_TYPE_INFO, TOLET_LISTING_STATUS_INFO, type ToletListing } from './tolet-types';
import { tagLabel, type CommunityPost, type PostKind, type PostStatus } from './catalog-types';

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

/**
 * The four filter buckets. A to-let `pending_review` is the same idea as a
 * community `pending`; drafts/archived/suspended rows belong to none of the
 * three moderation outcomes, so they surface under "সব" with their own label
 * rather than being silently folded into a bucket that would misreport them.
 */
export type StatusBucket = 'pending' | 'approved' | 'rejected' | 'other';

export interface DashboardRow {
  source: 'post' | 'tolet';
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
  /** Present only when the moderator supplied one. */
  rejectionReason?: string;
  viewHref: string;
  /** Undefined when the source has nothing editable (e.g. an approved post). */
  editHref?: string;
  /** To-let rows are removed by archiving — RLS has no owner DELETE. */
  canArchive?: boolean;
  post?: CommunityPost;
  listing?: ToletListing;
}

function postRow(post: CommunityPost): DashboardRow {
  const meta = POST_STATUS_META[post.status];
  return {
    source: 'post',
    id: post.id,
    title: post.titleBn,
    image: post.coverImageUrl,
    typeLabel: POST_KIND_LABEL[post.kind],
    categoryLabel: post.category ? tagLabel(post.category) : undefined,
    date: post.createdAt,
    statusLabel: meta.label,
    statusClass: meta.className,
    bucket: post.status,
    rejectionReason: post.rejectionReason,
    // The detail page lets an author read their own pending/rejected post
    // through `fetchPostForViewer`, so this link is valid for every status.
    viewHref: `${POST_ROUTE[post.kind]}/${post.slug}`,
    // Approved posts are frozen: `fetchMyPostForEdit` refuses them, so offering
    // an edit button would only lead to a "not found" page.
    editHref:
      post.status === 'approved'
        ? undefined
        : `/profile/posts/${post.kind}/${post.id}/edit`,
  };
}

function listingRow(listing: ToletListing): DashboardRow {
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
    editHref: listing.status === 'archived' ? undefined : `/profile/tolet/${listing.id}/edit`,
    canArchive: listing.status !== 'archived',
    listing,
  };
}

/** Both sources, newest first. */
export function mergeRows(posts: CommunityPost[], listings: ToletListing[]): DashboardRow[] {
  return [...posts.map(postRow), ...listings.map(listingRow)].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function bucketOf(row: DashboardRow): StatusBucket {
  return row.bucket;
}
