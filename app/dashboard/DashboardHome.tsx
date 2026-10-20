'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  BookOpen,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  Clock,
  Eye,
  FileText,
  GraduationCap,
  Heart,
  Loader2,
  MapPin,
  Pencil,
  Phone,
  PhoneCall,
  PlusCircle,
  RefreshCw,
  ShieldCheck,
  UserRound,
  Wifi,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import {
  fetchMyPostViewCounts,
  fetchMyPosts,
  fetchMyProfileViewCounts,
  fetchMyServiceListings,
} from '@/lib/catalog-service';
import { fetchMyListings } from '@/lib/tolet-service';
import {
  bnRelativeTime,
  SERVICE_LISTING_STATUS_META,
  toBn,
  type CommunityPost,
  type ServiceListing,
} from '@/lib/catalog-types';
import type { ToletListing, ToletListingStats } from '@/lib/tolet-types';
import { TUTOR_STATUS_META, TUTOR_TEACHING_MODE_LABELS } from '@/lib/home-tutor-types';
import { DONOR_STATUS_META } from '@/lib/blood-donor-types';
import { fetchOwnListingStats } from '@/lib/tolet-tracking';
import type { ServiceRequestStatus } from '@/lib/supabase/types';
import { mergeRows, type DashboardRow } from '@/lib/dashboard';
import { ListingMedia } from '@/components/catalog/CatalogCards';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';
import { getAreaById } from '@/lib/locations';
import { cn } from '@/lib/utils';
import {
  EmptyState,
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
  SectionCard,
  SectionHeader,
  StatusBadge,
  statusTone,
  TEXT_LINK,
  type StatusTone,
} from '@/components/account/ProfileUI';

const REQUEST_STATUS_LABEL: Record<ServiceRequestStatus, string> = {
  new: 'নতুন',
  reviewing: 'পর্যালোচনাধীন',
  contacted: 'যোগাযোগ হয়েছে',
  in_progress: 'কাজ চলছে',
  completed: 'সম্পন্ন',
  cancelled: 'বাতিল',
  rejected: 'প্রত্যাখ্যাত',
  submitted: 'জমা দেওয়া হয়েছে',
  assigned: 'কর্মী নির্ধারিত',
};

type PostFilter = 'all' | 'published' | 'pending' | 'needs_edit';

interface ServiceRow {
  key: string;
  icon: LucideIcon;
  typeLabel: string;
  title: string;
  meta?: string;
  href: string;
  statusLabel: string;
  tone: StatusTone;
  date: string;
  views?: number;
  /** Donor profiles have no public view counter in the current data layer. */
  tracked: boolean;
}

interface ActivityItem {
  id: string;
  date: string;
  title: string;
  detail: string;
  href: string;
  icon: LucideIcon;
}

function postTone(row: DashboardRow): StatusTone {
  if (row.bucket === 'pending') return 'pending';
  if (row.bucket === 'rejected') return 'rejected';
  if (row.bucket !== 'approved') return 'neutral';
  return row.statusFilter === 'sold' || row.statusFilter === 'closed' || row.statusFilter === 'expired'
    ? 'neutral'
    : 'approved';
}

function firstError(reason: unknown, fallback: string) {
  return reason instanceof Error && reason.message ? reason.message : fallback;
}

export default function DashboardHome() {
  const {
    user,
    requests,
    notifications,
    isLoading: authLoading,
    uploadAvatar,
    homeTutorProfile,
    bloodDonorProfile,
  } = useAuth();

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [listings, setListings] = useState<ToletListing[]>([]);
  const [serviceListings, setServiceListings] = useState<ServiceListing[]>([]);
  const [listingStats, setListingStats] = useState<Record<string, ToletListingStats>>({});
  const [postViews, setPostViews] = useState<Record<string, number>>({});
  const [profileViews, setProfileViews] = useState<Record<string, number>>({});
  const [analyticsError, setAnalyticsError] = useState('');
  const [serviceError, setServiceError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [postFilter, setPostFilter] = useState<PostFilter>('all');
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState('');
  const [avatarFailed, setAvatarFailed] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    let active = true;

    void (async () => {
      if (!active) return;
      setLoaded(false);
      setLoadError('');
      setServiceError('');
      setAnalyticsError('');
      setPosts([]);
      setListings([]);
      setServiceListings([]);
      setListingStats({});
      setPostViews({});
      setProfileViews({});

      try {
        const settled = await Promise.allSettled([
          fetchMyPosts(true),
          fetchMyListings(userId, true),
          fetchMyServiceListings(true),
        ]);
        if (!active) return;

        const [postsResult, listingsResult, servicesResult] = settled;
        const errors: string[] = [];

        if (postsResult.status === 'fulfilled') {
          setPosts(postsResult.value);
        } else {
          setPosts([]);
          errors.push(firstError(postsResult.reason, 'আপনার পোস্ট লোড করা যায়নি।'));
        }

        let nextListings: ToletListing[] = [];
        if (listingsResult.status === 'fulfilled') {
          nextListings = listingsResult.value;
          setListings(nextListings);
        } else {
          setListings([]);
          errors.push(firstError(listingsResult.reason, 'বাসা ভাড়ার তালিকা লোড করা যায়নি।'));
        }

        if (servicesResult.status === 'fulfilled') {
          setServiceListings(servicesResult.value);
        } else {
          setServiceListings([]);
          setServiceError(
            firstError(servicesResult.reason, 'সেবা প্রোফাইল ও তালিকা লোড করা যায়নি।')
          );
        }

        setLoadError(errors.join(' '));

        // Engagement is best-effort: a stats failure must never hide the posts.
        if (nextListings.length > 0) {
          try {
            const stats = await fetchOwnListingStats(nextListings.map((listing) => listing.id));
            if (active) setListingStats(stats);
          } catch (cause) {
            if (active) {
              setListingStats({});
              setAnalyticsError(
                firstError(cause, 'বাসা ভাড়ার ভিউ ও কল পরিসংখ্যান লোড করা যায়নি।')
              );
            }
          }
        }

        try {
          const [views, profViews] = await Promise.all([
            fetchMyPostViewCounts(),
            fetchMyProfileViewCounts(),
          ]);
          if (active) {
            setPostViews(views);
            setProfileViews(profViews);
          }
        } catch (cause) {
          if (active) {
            setPostViews({});
            setProfileViews({});
            setAnalyticsError(
              firstError(cause, 'ভিউ পরিসংখ্যান লোড করা যায়নি।')
            );
          }
        }
      } catch (cause) {
        if (active) {
          setLoadError(firstError(cause, 'ড্যাশবোর্ডের তথ্য লোড করা যায়নি।'));
        }
      } finally {
        if (active) setLoaded(true);
      }
    })();

    return () => {
      active = false;
    };
  }, [userId, reloadKey]);

  const pickAvatar = async (file: File | undefined) => {
    if (!file) return;
    setAvatarBusy(true);
    setAvatarMsg('');
    setAvatarFailed(false);
    try {
      const result = await uploadAvatar(file);
      setAvatarFailed(!result.success);
      setAvatarMsg(
        result.success ? 'প্রোফাইল ছবি হালনাগাদ হয়েছে।' : result.error || 'ছবি আপলোড ব্যর্থ হয়েছে।'
      );
    } catch (error) {
      setAvatarFailed(true);
      setAvatarMsg(error instanceof Error ? error.message : 'ছবি আপলোড ব্যর্থ হয়েছে।');
    } finally {
      setAvatarBusy(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const rows = useMemo(
    () => mergeRows(posts, listings, undefined, undefined, [], listingStats, postViews),
    [posts, listings, listingStats, postViews]
  );

  const postStats = useMemo(() => {
    let published = 0;
    let pending = 0;
    let needsEdit = 0;
    let other = 0;
    for (const row of rows) {
      if (row.statusFilter === 'published') published += 1;
      else if (row.bucket === 'pending') pending += 1;
      else if (row.bucket === 'rejected') needsEdit += 1;
      else other += 1;
    }
    return { total: rows.length, published, pending, needsEdit, other };
  }, [rows]);

  const postViewTotal = useMemo(
    () =>
      rows.reduce((sum, row) => {
        const views = row.postViews ?? row.analytics?.views;
        return sum + (typeof views === 'number' ? views : 0);
      }, 0),
    [rows]
  );
  const hasPostViews = rows.some(
    (row) => typeof (row.postViews ?? row.analytics?.views) === 'number'
  );

  const visiblePosts = useMemo(() => {
    const filtered =
      postFilter === 'all'
        ? rows
        : rows.filter((row) => {
            if (postFilter === 'published') return row.statusFilter === 'published';
            if (postFilter === 'pending') return row.bucket === 'pending';
            return row.bucket === 'rejected';
          });
    return filtered.slice(0, 5);
  }, [rows, postFilter]);

  const serviceRows = useMemo<ServiceRow[]>(() => {
    const next: ServiceRow[] = [];

    if (homeTutorProfile) {
      const meta = TUTOR_STATUS_META[homeTutorProfile.status];
      next.push({
        key: 'tutor',
        icon: GraduationCap,
        typeLabel: 'গৃহশিক্ষক',
        title: homeTutorProfile.fullName,
        meta: TUTOR_TEACHING_MODE_LABELS[homeTutorProfile.teachingMode],
        href: '/profile/home-tutor',
        statusLabel: meta.labelBn,
        tone: statusTone(homeTutorProfile.status),
        date: homeTutorProfile.updatedAt || homeTutorProfile.createdAt,
        views: profileViews[homeTutorProfile.id],
        tracked: true,
      });
    }

    if (bloodDonorProfile) {
      const meta = DONOR_STATUS_META[bloodDonorProfile.status];
      const donorArea = getAreaById(bloodDonorProfile.areaId);
      next.push({
        key: 'donor',
        icon: Heart,
        typeLabel: 'রক্তদাতা',
        title: bloodDonorProfile.fullName,
        meta: [bloodDonorProfile.bloodGroup, donorArea?.nameBn].filter(Boolean).join(' · '),
        href: '/profile/blood-donor',
        statusLabel: meta.labelBn,
        tone: statusTone(bloodDonorProfile.status),
        date: bloodDonorProfile.updatedAt || bloodDonorProfile.createdAt,
        tracked: false,
      });
    }

    for (const listing of serviceListings) {
      const meta = SERVICE_LISTING_STATUS_META[listing.status ?? 'draft'];
      next.push({
        key: `service-${listing.id}`,
        icon: listing.category === 'wifi' ? Wifi : BookOpen,
        typeLabel: listing.category === 'wifi' ? 'WiFi' : 'কোচিং',
        title: listing.titleBn,
        meta: listing.category === 'wifi' ? 'ইন্টারনেট সেবা' : 'কোচিং সেন্টার',
        href: `/dashboard/${listing.category}/${listing.id}/edit`,
        statusLabel: meta.labelBn,
        tone: statusTone(listing.status ?? 'draft'),
        date: listing.updatedAt || listing.createdAt,
        views: profileViews[listing.slug],
        tracked: true,
      });
    }

    return next.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [homeTutorProfile, bloodDonorProfile, serviceListings, profileViews]);

  const profileViewTotal = useMemo(
    () =>
      serviceRows.reduce(
        (sum, row) => sum + (typeof row.views === 'number' ? row.views : 0),
        0
      ),
    [serviceRows]
  );
  const hasProfileViews = serviceRows.some((row) => typeof row.views === 'number');
  const publishedProfiles = serviceRows.filter((row) => row.tone === 'approved').length;
  const pendingProfiles = serviceRows.filter(
    (row) => row.tone === 'pending'
  ).length;

  const activity = useMemo<ActivityItem[]>(() => {
    return [
      ...rows.map((row) => ({
        id: `post-${row.source}-${row.id}`,
        date: row.date,
        title: row.title,
        detail: `${row.typeLabel} · ${row.statusLabel}`,
        href: row.viewHref,
        icon: FileText,
      })),
      ...requests.map((request) => ({
        id: `request-${request.id}`,
        date: request.createdAt,
        title: request.serviceTitleBn,
        detail: `সেবা রিকোয়েস্ট · ${REQUEST_STATUS_LABEL[request.status]}`,
        href: '/profile/requests',
        icon: ClipboardList,
      })),
      ...notifications.map((notification) => ({
        id: `notification-${notification.id}`,
        date: notification.createdAt,
        title: notification.title,
        detail: notification.body,
        href: notification.linkHref ?? '/dashboard/notifications',
        icon: Bell,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [rows, requests, notifications]);

  if (authLoading || (!!user && !loaded)) {
    return <DashboardSkeleton />;
  }
  if (!user) return null;

  const area = getAreaById(user.primaryAreaId);
  const memberSince = (() => {
    const created = new Date(user.createdAt);
    if (Number.isNaN(created.getTime())) return '';
    return new Intl.DateTimeFormat('bn-BD', { month: 'long', year: 'numeric' }).format(created);
  })();

  const profileChecklist = [
    { label: 'ফোন নম্বর', done: Boolean(user.phone?.trim()) },
    { label: 'এলাকা', done: Boolean(area) },
    { label: 'প্রোফাইল ছবি', done: Boolean(user.avatarUrl) },
  ];
  const completedProfileItems = profileChecklist.filter((item) => item.done).length;

  const reload = () => setReloadKey((key) => key + 1);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Identity — compact, not a hero banner. */}
      <section
        aria-labelledby="dashboard-title"
        className="rounded-xl border border-ink-900/[0.08] bg-white shadow-[0_1px_2px_rgba(16,24,20,0.03)]"
      >
        <div className="p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3.5">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarBusy}
                aria-label={user.avatarUrl ? 'প্রোফাইল ছবি বদলান' : 'প্রোফাইল ছবি যোগ করুন'}
                title={user.avatarUrl ? 'প্রোফাইল ছবি বদলান' : 'প্রোফাইল ছবি যোগ করুন'}
                className={cn(
                  'group relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-ink-900/10 bg-mist-100 text-xl font-semibold text-ink-600 disabled:opacity-70 sm:h-16 sm:w-16',
                  LIGHT_FOCUS
                )}
              >
                {user.avatarUrl ? (
                  <ListingMedia
                    src={user.avatarUrl}
                    alt={user.fullName}
                    label={user.fullName}
                    imgClassName="h-full w-full object-cover"
                  />
                ) : (
                  user.fullName.charAt(0)
                )}
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute inset-0 flex items-center justify-center bg-ink-900/45 text-white transition-opacity',
                    avatarBusy
                      ? 'opacity-100'
                      : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
                  )}
                >
                  {avatarBusy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </span>
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => void pickAvatar(event.target.files?.[0])}
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                  <h1
                    id="dashboard-title"
                    className="break-words text-[20px] font-bold leading-tight text-ink-900 sm:text-[23px]"
                  >
                    {user.fullName}
                  </h1>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11.5px] font-semibold ring-1 ring-inset',
                      user.isVerified
                        ? 'bg-emerald-50 text-emerald-800 ring-emerald-600/15'
                        : 'bg-slate-50 text-slate-600 ring-slate-500/15'
                    )}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    {user.isVerified ? 'যাচাইকৃত' : 'যাচাই বাকি'}
                  </span>
                </div>

                <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-3.5 gap-y-1.5 text-[12px] text-ink-500 sm:text-[12px]">
                  {user.phone?.trim() ? (
                    <span className="inline-flex min-w-0 items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-ink-400" aria-hidden="true" />
                      <span className="break-all">{user.phone}</span>
                    </span>
                  ) : (
                    <Link href="/dashboard/profile" className={cn('inline-flex items-center gap-1.5 text-ink-600', LIGHT_FOCUS)}>
                      <Phone className="h-3.5 w-3.5 text-ink-400" aria-hidden="true" />
                      ফোন নম্বর যোগ করুন
                    </Link>
                  )}
                  {area ? (
                    <span className="inline-flex min-w-0 items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-400" aria-hidden="true" />
                      <span className="break-words">{area.nameBn}</span>
                    </span>
                  ) : (
                    <Link href="/dashboard/profile" className={cn('inline-flex items-center gap-1.5 text-ink-600', LIGHT_FOCUS)}>
                      <MapPin className="h-3.5 w-3.5 text-ink-400" aria-hidden="true" />
                      এলাকা যোগ করুন
                    </Link>
                  )}
                  {memberSince && (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-ink-400" aria-hidden="true" />
                      সদস্য {memberSince}
                    </span>
                  )}
                </div>

                {avatarMsg && (
                  <p
                    role={avatarFailed ? 'alert' : 'status'}
                    className={cn(
                      'mt-2 text-[12px] font-medium',
                      avatarFailed ? 'text-rose-700' : 'text-emerald-700'
                    )}
                  >
                    {avatarMsg}
                  </p>
                )}
              </div>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <Link
                href="/dashboard/profile"
                className={cn(SECONDARY_BUTTON, 'w-full sm:w-auto')}
              >
                <UserRound className="h-4 w-4" aria-hidden="true" />
                প্রোফাইল সম্পাদনা
              </Link>
              <Link
                href="/dashboard/new"
                className={cn(PRIMARY_BUTTON, 'w-full sm:w-auto')}
              >
                <PlusCircle className="h-4 w-4" aria-hidden="true" />
                নতুন পোস্ট
              </Link>
            </div>
          </div>
        </div>
      </section>

      {loadError && (
        <ErrorPanel
          title="ড্যাশবোর্ডের কিছু তথ্য লোড করা যায়নি"
          body="আপনার পোস্ট বা তালিকা আপাতত দেখানো যাচ্ছে না। আবার চেষ্টা করুন।"
          detail={loadError}
          onRetry={reload}
        />
      )}

      {/* Compact, real statistics. Never invent a number for a failed query. */}
      {!loadError && (
        <section aria-labelledby="stats-heading">
          <div className="mb-2.5 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 id="stats-heading" className="text-[14px] font-bold text-ink-900">
                এক নজরে
              </h2>
              <p className="mt-0.5 text-[12px] text-ink-500">
                আপনার পোস্ট ও সেবা প্রোফাইলের বর্তমান অবস্থা।
              </p>
            </div>
            <Link href="/dashboard/posts" className={cn(TEXT_LINK, 'shrink-0')}>
              সব পোস্ট
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
            <StatTile
              href="/dashboard/posts"
              icon={FileText}
              label="মোট পোস্ট"
              value={postStats.total}
              hint="সব পোস্ট"
              dot="bg-ink-400"
            />
            <StatTile
              href="/dashboard/posts?status=approved"
              icon={CheckCircle2}
              label="প্রকাশিত"
              value={postStats.published}
              hint="অনুমোদিত"
              dot="bg-emerald-500"
            />
            <StatTile
              href="/dashboard/posts?status=pending"
              icon={Clock}
              label="অপেক্ষমাণ"
              value={postStats.pending}
              hint="পর্যালোচনাধীন"
              dot="bg-amber-500"
            />
            <StatTile
              href="/dashboard/posts?status=rejected"
              icon={CircleAlert}
              label="সংশোধন"
              value={postStats.needsEdit}
              hint="প্রয়োজন"
              dot="bg-rose-500"
            />
            <StatTile
              href="/dashboard/profiles"
              icon={UserRound}
              label="সেবা প্রোফাইল"
              value={serviceError ? '—' : serviceRows.length}
              hint={serviceError ? 'লোড হয়নি' : 'মোট প্রোফাইল'}
              dot="bg-ink-400"
            />
            <StatTile
              href="/dashboard/profiles"
              icon={Eye}
              label="প্রোফাইল ভিউ"
              value={hasProfileViews ? profileViewTotal : '—'}
              hint={hasProfileViews ? 'ট্র্যাক করা ভিউ' : 'ভিউ তথ্য নেই'}
              dot="bg-ink-400"
            />
          </div>
        </section>
      )}

      <div className="grid items-start gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)]">
        {/* Posts */}
        <SectionCard
          labelledBy="my-posts-heading"
          className="order-1 xl:order-none xl:col-start-1 xl:row-start-1"
        >
          <SectionHeader
            id="my-posts-heading"
            title="আপনার পোস্ট"
            description={
              loadError
                ? 'পোস্টের তথ্য লোড করা যায়নি।'
                : postStats.total === 0
                  ? 'এখনো কোনো পোস্ট তৈরি করা হয়নি।'
                  : `${toBn(postStats.total)}টি পোস্ট · ${toBn(postStats.published)}টি প্রকাশিত${
                      postStats.other > 0 ? ` · ${toBn(postStats.other)}টি অন্যান্য` : ''
                    }${hasPostViews && postViewTotal > 0 ? ` · ${toBn(postViewTotal)} ভিউ` : ''}`
            }
            action={
              <Link href="/dashboard/posts" className={TEXT_LINK}>
                সব পোস্ট
              </Link>
            }
          />

          {!loadError && postStats.total > 0 && (
            <div className="flex flex-wrap gap-1.5 border-b border-ink-900/[0.06] px-4 pb-3 sm:px-5">
              <FilterChip
                active={postFilter === 'all'}
                label="সব"
                count={postStats.total}
                onClick={() => setPostFilter('all')}
              />
              <FilterChip
                active={postFilter === 'published'}
                label="প্রকাশিত"
                count={postStats.published}
                onClick={() => setPostFilter('published')}
              />
              <FilterChip
                active={postFilter === 'pending'}
                label="অপেক্ষমাণ"
                count={postStats.pending}
                onClick={() => setPostFilter('pending')}
              />
              <FilterChip
                active={postFilter === 'needs_edit'}
                label="সংশোধন"
                count={postStats.needsEdit}
                onClick={() => setPostFilter('needs_edit')}
              />
            </div>
          )}

          <div className="px-2 py-2 sm:px-3">
            {loadError ? (
              <ErrorState
                icon={CircleAlert}
                title="পোস্টের তালিকা লোড করা যায়নি"
                body="আপনার পোস্টগুলো আপাতত দেখানো যাচ্ছে না। আবার চেষ্টা করুন।"
                onRetry={reload}
              />
            ) : rows.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="এখনো কোনো পোস্ট নেই"
                body="বাসা ভাড়া, চাকরি, কেনাবেচা বা সংবাদ—আপনার প্রথম পোস্ট তৈরি করুন।"
                action={
                  <Link href="/dashboard/new" className={PRIMARY_BUTTON}>
                    <PlusCircle className="h-4 w-4" aria-hidden="true" />
                    নতুন পোস্ট করুন
                  </Link>
                }
              />
            ) : visiblePosts.length === 0 ? (
              <div className="px-3 py-7 text-center">
                <p className="text-[12.5px] font-semibold text-ink-900">এই অবস্থায় কোনো পোস্ট নেই</p>
                <p className="mt-1 text-[12px] text-ink-500">অন্য ফিল্টার বেছে নিন বা সব পোস্ট দেখুন।</p>
                <button
                  type="button"
                  onClick={() => setPostFilter('all')}
                  className={cn(SECONDARY_BUTTON, 'mt-3 min-h-9')}
                >
                  সব পোস্ট দেখুন
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-ink-900/[0.05]">
                {visiblePosts.map((row) => {
                  const views = row.postViews ?? row.analytics?.views;
                  return (
                    <li key={`${row.source}-${row.id}`}>
                      <Link
                        href={row.viewHref}
                        className={cn(
                          'flex min-w-0 gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-mist-50/70 sm:px-3',
                          LIGHT_FOCUS
                        )}
                      >
                        <span className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-ink-900/[0.05] bg-mist-100">
                          <ListingMedia src={row.image} alt={row.title} label={row.title} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <StatusBadge label={row.statusLabel} tone={postTone(row)} />
                            <span className="text-[11.5px] font-medium text-ink-500">
                              {row.typeLabel}
                              {row.categoryLabel ? ` · ${row.categoryLabel}` : ''}
                            </span>
                          </span>
                          <span className="mt-1 block break-words text-[13px] font-semibold leading-snug text-ink-900">
                            {row.title}
                          </span>
                          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-ink-500">
                            <span>{bnRelativeTime(row.date) ?? 'তারিখ নেই'}</span>
                            {typeof views === 'number' && (
                              <span className="inline-flex items-center gap-1">
                                <Eye className="h-3 w-3" aria-hidden="true" />
                                {toBn(views)} ভিউ
                              </span>
                            )}
                            {row.source === 'tolet' && row.analytics && row.analytics.callClicks > 0 && (
                              <span className="inline-flex items-center gap-1">
                                <PhoneCall className="h-3 w-3" aria-hidden="true" />
                                {toBn(row.analytics.callClicks)} কল
                              </span>
                            )}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {!loadError && analyticsError && (
            <div
              className="border-t border-ink-900/[0.05] px-4 py-2.5 text-[11.5px] leading-relaxed text-ink-500 sm:px-5"
              title={analyticsError}
              role="status"
            >
              কিছু ভিউ ও কল পরিসংখ্যান লোড হয়নি; পোস্টের তথ্য ঠিক আছে।{' '}
              <button
                type="button"
                onClick={reload}
                className={cn('font-semibold underline underline-offset-2 hover:text-ink-900', LIGHT_FOCUS)}
              >
                আবার চেষ্টা করুন
              </button>
            </div>
          )}
        </SectionCard>

        {/* Service profiles */}
        <SectionCard
          labelledBy="service-profiles-heading"
          className="order-2 xl:order-none xl:col-start-2 xl:row-start-1"
        >
          <SectionHeader
            id="service-profiles-heading"
            title="সেবা প্রোফাইল"
            description={
              serviceError
                ? serviceRows.length > 0
                  ? `${toBn(serviceRows.length)}টি পরিচিত প্রোফাইল · কিছু তালিকা লোড হয়নি`
                  : 'প্রোফাইল তালিকা লোড করা যায়নি।'
                : serviceRows.length === 0
                  ? 'গৃহশিক্ষক, রক্তদাতা, WiFi ও কোচিং—এক জায়গায়।'
                  : `${toBn(serviceRows.length)}টি প্রোফাইল · ${toBn(publishedProfiles)}টি প্রকাশিত${
                      pendingProfiles > 0 ? ` · ${toBn(pendingProfiles)}টি পর্যালোচনাধীন` : ''
                    }`
            }
            action={
              <Link href="/dashboard/profiles" className={TEXT_LINK}>
                সব প্রোফাইল
              </Link>
            }
          />

          {serviceRows.length === 0 ? (
            serviceError ? (
              <ErrorState
                icon={CircleAlert}
                title="তালিকা লোড করা যায়নি"
                body="সেবা প্রোফাইলগুলো আপাতত দেখানো যাচ্ছে না।"
                onRetry={reload}
                compact
              />
            ) : (
              <EmptyState
                icon={UserRound}
                title="এখনো কোনো সেবা প্রোফাইল নেই"
                body="প্রোফাইল খুললে এখানে অবস্থা, ধরন ও ভিউ দেখতে পাবেন।"
                action={
                  <Link href="/dashboard/profiles" className={PRIMARY_BUTTON}>
                    <PlusCircle className="h-4 w-4" aria-hidden="true" />
                    সেবা প্রোফাইল খুলুন
                  </Link>
                }
                compact
              />
            )
          ) : (
            <>
              <ul className="divide-y divide-ink-900/[0.05]">
                {serviceRows.slice(0, 4).map((row) => {
                  const Icon = row.icon;
                  return (
                    <li key={row.key}>
                      <Link
                        href={row.href}
                        className={cn(
                          'flex min-w-0 items-start gap-3 px-4 py-3 transition-colors hover:bg-mist-50/70 sm:px-5',
                          LIGHT_FOCUS
                        )}
                      >
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink-900/[0.05] bg-mist-50 text-ink-500">
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <StatusBadge label={row.statusLabel} tone={row.tone} />
                            <span className="text-[11.5px] font-medium text-ink-500">
                              {row.typeLabel}
                            </span>
                          </span>
                          <span className="mt-1 block break-words text-[12.5px] font-semibold leading-snug text-ink-900">
                            {row.title}
                          </span>
                          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-ink-500">
                            {typeof row.views === 'number' ? (
                              <span className="inline-flex items-center gap-1">
                                <Eye className="h-3 w-3" aria-hidden="true" />
                                {toBn(row.views)} ভিউ
                              </span>
                            ) : !row.tracked ? (
                              <span>ভিউ গণনা নেই</span>
                            ) : null}
                            {row.meta && <span className="break-words">{row.meta}</span>}
                            <span>{bnRelativeTime(row.date) ?? ''}</span>
                          </span>
                        </span>
                        <Pencil className="mt-1 h-3.5 w-3.5 shrink-0 text-ink-300" aria-hidden="true" />
                        <span className="sr-only">সম্পাদনা</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              {serviceError && (
                <div
                  role="status"
                  className="border-t border-amber-200/70 bg-amber-50/50 px-4 py-2.5 text-[11.5px] leading-relaxed text-amber-900 sm:px-5"
                >
                  WiFi ও কোচিং তালিকা লোড করা যায়নি।{' '}
                  <button
                    type="button"
                    onClick={reload}
                    className={cn('font-semibold underline underline-offset-2 hover:text-amber-950', LIGHT_FOCUS)}
                  >
                    আবার চেষ্টা করুন
                  </button>
                </div>
              )}
              {serviceRows.length > 4 && (
                <Link
                  href="/dashboard/profiles"
                  className={cn(
                    'block border-t border-ink-900/[0.05] px-4 py-2.5 text-[11.5px] font-semibold text-ink-500 hover:bg-mist-50/70 hover:text-ink-900 sm:px-5',
                    LIGHT_FOCUS
                  )}
                >
                  আরও {toBn(serviceRows.length - 4)}টি প্রোফাইল দেখুন
                </Link>
              )}
              <div className="flex items-center justify-between gap-3 border-t border-ink-900/[0.05] px-4 py-3 sm:px-5">
                <span
                  className="text-[11.5px] text-ink-500"
                  title="যেসব প্রোফাইলের ভিউ গণনা পাওয়া যায়, শুধু সেগুলোর যোগফল"
                >
                  মোট প্রোফাইল ভিউ
                </span>
                <span className="text-[12px] font-semibold text-ink-900">
                  {hasProfileViews ? toBn(profileViewTotal) : '—'}
                </span>
              </div>
            </>
          )}
        </SectionCard>

        {/* Recent activity */}
        <SectionCard
          labelledBy="activity-heading"
          className="order-3 xl:order-none xl:col-start-1 xl:row-start-2"
        >
          <SectionHeader
            id="activity-heading"
            title="সাম্প্রতিক কার্যকলাপ"
            description="পোস্ট, রিকোয়েস্ট ও নোটিফিকেশনের সর্বশেষ আপডেট।"
            action={
              <Link href="/dashboard/notifications" className={TEXT_LINK}>
                সব আপডেট
              </Link>
            }
          />
          {activity.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="এখনো কোনো কার্যকলাপ নেই"
              body="পোস্ট, রিকোয়েস্ট বা নোটিফিকেশনের আপডেট এখানে দেখা যাবে।"
              compact
            />
          ) : (
            <ul className="divide-y divide-ink-900/[0.05]">
              {activity.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex min-w-0 gap-3 px-4 py-3 transition-colors hover:bg-mist-50/70 sm:px-5',
                        LIGHT_FOCUS
                      )}
                    >
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-ink-900/[0.05] bg-mist-50 text-ink-400">
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block break-words text-[12.5px] font-semibold leading-snug text-ink-900">
                          {item.title}
                        </span>
                        <span className="mt-0.5 block break-words text-[11.5px] leading-relaxed text-ink-500">
                          {item.detail}
                        </span>
                        <time
                          dateTime={item.date}
                          className="mt-1 block text-[11.5px] text-ink-500"
                        >
                          {bnRelativeTime(item.date) ?? ''}
                        </time>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>

        {/* Profile completeness */}
        <SectionCard
          labelledBy="account-heading"
          className="order-4 xl:order-none xl:col-start-2 xl:row-start-2"
        >
          <SectionHeader
            id="account-heading"
            title="প্রোফাইল সম্পূর্ণতা"
            description={`${toBn(completedProfileItems)}/${toBn(profileChecklist.length)}টি তথ্য সম্পূর্ণ`}
          />
          <div className="px-4 pb-4 sm:px-5 sm:pb-5">
            <ul className="space-y-2.5">
              {profileChecklist.map((item) => (
                <li key={item.label} className="flex items-center gap-2.5 text-[12px]">
                  <span
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                      item.done
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-ink-900/10 bg-white text-transparent'
                    )}
                    aria-hidden="true"
                  >
                    <Check className="h-3 w-3" />
                  </span>
                  <span className={cn('min-w-0 flex-1', item.done ? 'text-ink-500' : 'font-medium text-ink-900')}>
                    {item.label}
                  </span>
                  {!item.done && (
                    <Link href="/dashboard/profile" className={cn('inline-flex min-h-9 items-center text-[11.5px] font-semibold text-ink-500 hover:text-ink-900', LIGHT_FOCUS)}>
                      যোগ করুন
                    </Link>
                  )}
                </li>
              ))}
            </ul>

            {completedProfileItems === profileChecklist.length && (
              <p className="mt-3 flex items-center gap-1.5 text-[11.5px] text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                আপনার প্রোফাইল সম্পূর্ণ।
              </p>
            )}

            <Link
              href="/dashboard/profile"
              className={cn(SECONDARY_BUTTON, 'mt-4 w-full')}
            >
              <UserRound className="h-4 w-4" aria-hidden="true" />
              প্রোফাইল সম্পাদনা
            </Link>
          </div>
        </SectionCard>

        {/* Shortcuts */}
        <SectionCard
          labelledBy="quick-heading"
          className="order-5 xl:order-none xl:col-start-2 xl:row-start-3"
        >
          <SectionHeader id="quick-heading" title="দ্রুত কাজ" />
          <div className="grid grid-cols-2 gap-1.5 px-4 pb-4 sm:px-5 sm:pb-5">
            <QuickAction href="/dashboard/new" icon={PlusCircle} label="নতুন পোস্ট" />
            <QuickAction href="/dashboard/posts" icon={FileText} label="আমার পোস্ট" />
            <QuickAction href="/dashboard/profiles" icon={UserRound} label="সেবা প্রোফাইল" />
            <QuickAction href="/profile/requests" icon={ClipboardList} label="আমার রিকোয়েস্ট" />
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function StatTile({
  href,
  icon: Icon,
  label,
  value,
  hint,
  dot,
  className,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  value: number | string;
  hint: string;
  dot: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group flex flex-col rounded-xl border border-ink-900/[0.08] bg-white p-3.5 transition-colors hover:border-ink-900/20 hover:bg-mist-50/40',
        LIGHT_FOCUS,
        className
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-[11.5px] font-medium text-ink-500">{label}</span>
        <Icon
          className="h-4 w-4 shrink-0 text-ink-300 transition-colors group-hover:text-ink-500"
          aria-hidden="true"
        />
      </span>
      <span className="mt-2.5 text-[25px] font-semibold leading-none text-ink-900">
        {typeof value === 'number' ? toBn(value) : value}
      </span>
      <span className="mt-2 inline-flex items-center gap-1.5 text-[11.5px] text-ink-500">
        <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dot)} aria-hidden="true" />
        {hint}
      </span>
    </Link>
  );
}

function FilterChip({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex min-h-10 items-center gap-1.5 rounded-md px-2.5 text-[11.5px] font-semibold transition-colors',
        active
          ? 'bg-ink-900 text-white'
          : 'bg-mist-50 text-ink-600 hover:bg-mist-100 hover:text-ink-900',
        LIGHT_FOCUS
      )}
    >
      {label}
      <span
        className={cn(
          'rounded px-1 text-[11px] leading-4',
          active ? 'bg-white/15 text-white' : 'bg-white text-ink-500'
        )}
      >
        {toBn(count)}
      </span>
    </button>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex min-h-12 min-w-0 items-center gap-2 rounded-lg border border-ink-900/[0.07] px-2.5 py-2 text-[12px] font-semibold text-ink-700 transition-colors hover:border-ink-900/15 hover:bg-mist-50',
        LIGHT_FOCUS
      )}
    >
      <Icon className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
      <span className="min-w-0 break-words">{label}</span>
    </Link>
  );
}

function ErrorPanel({
  title,
  body,
  detail,
  onRetry,
}: {
  title: string;
  body: string;
  detail?: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      title={detail}
      className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50/60 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-rose-600 ring-1 ring-rose-200">
          <CircleAlert className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[12.5px] font-semibold text-rose-900">{title}</p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-rose-800">{body}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className={cn(SECONDARY_BUTTON, 'shrink-0 border-rose-200 text-rose-800 hover:bg-rose-50')}
      >
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        আবার চেষ্টা করুন
      </button>
    </div>
  );
}

function ErrorState({
  icon: Icon,
  title,
  body,
  onRetry,
  compact = false,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  onRetry: () => void;
  compact?: boolean;
}) {
  return (
    <div className={cn('flex flex-col items-center px-4 text-center', compact ? 'py-6' : 'py-8')}>
      <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="mt-3 text-[13px] font-semibold text-ink-900">{title}</p>
      <p className="mt-1 max-w-sm text-[12px] leading-relaxed text-ink-500">{body}</p>
      <button
        type="button"
        onClick={onRetry}
        className={cn(SECONDARY_BUTTON, 'mt-3')}
      >
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        আবার চেষ্টা করুন
      </button>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-5" aria-busy="true" aria-label="ড্যাশবোর্ড লোড হচ্ছে">
      <div className="h-36 animate-pulse rounded-xl border border-ink-900/[0.05] bg-mist-100 sm:h-32" />
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <div key={index} className="h-24 animate-pulse rounded-xl bg-mist-100" />
        ))}
      </div>
      <div className="grid items-start gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)]">
        <div className="h-80 animate-pulse rounded-xl bg-mist-100" />
        <div className="h-64 animate-pulse rounded-xl bg-mist-100" />
      </div>
    </div>
  );
}
