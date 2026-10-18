'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Camera, CheckCircle2, CircleAlert, Clock, Eye, FileText, GraduationCap, Heart, Home, Loader2, MapPin, Mail, Phone, PhoneCall, PlusCircle, Settings, ShieldCheck, UserRound, Wifi, XCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { fetchMyPostViewCounts, fetchMyPosts, fetchMyProfileViewCounts, fetchMyServiceListings } from '@/lib/catalog-service';
import { fetchMyListings } from '@/lib/tolet-service';
import { bnRelativeTime, SERVICE_LISTING_STATUS_META, type CommunityPost, type ServiceListing } from '@/lib/catalog-types';
import type { ToletListing, ToletListingStats } from '@/lib/tolet-types';
import { TUTOR_STATUS_META } from '@/lib/home-tutor-types';
import { DONOR_STATUS_META } from '@/lib/blood-donor-types';
import { fetchOwnListingStats } from '@/lib/tolet-tracking';
import type { ServiceRequestStatus } from '@/lib/supabase/types';
import { mergeRows } from '@/lib/dashboard';
import { ListingMedia } from '@/components/catalog/CatalogCards';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';
import { getAreaById } from '@/lib/locations';

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

export default function DashboardHome() {
  const { user, requests, notifications, isLoading: authLoading, uploadAvatar, homeTutorProfile, bloodDonorProfile } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [listings, setListings] = useState<ToletListing[]>([]);
  const [serviceListings, setServiceListings] = useState<ServiceListing[]>([]);
  const [listingStats, setListingStats] = useState<Record<string, ToletListingStats>>({});
  const [postViews, setPostViews] = useState<Record<string, number>>({});
  const [profileViews, setProfileViews] = useState<Record<string, number>>({});
  const [analyticsError, setAnalyticsError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState('');
  const [avatarFailed, setAvatarFailed] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      try {
        const [myPosts, myListings] = await Promise.all([fetchMyPosts(true), fetchMyListings(user.id, true)]);
        if (!active) return;
        setPosts(myPosts);
        setListings(myListings);
        setLoadError('');
        // Engagement is best-effort: a stats failure must never hide the posts.
        try {
          const stats = await fetchOwnListingStats(myListings.map((listing) => listing.id));
          if (active) {
            setListingStats(stats);
            setAnalyticsError('');
          }
        } catch (cause) {
          if (active) {
            setListingStats({});
            setAnalyticsError(
              cause instanceof Error ? cause.message : 'বাসাভাড়ার পরিসংখ্যান লোড করা যায়নি।'
            );
          }
        }
        const views = await fetchMyPostViewCounts();
        if (active) setPostViews(views);
        const profViews = await fetchMyProfileViewCounts();
        if (active) setProfileViews(profViews);
      } catch (error) {
        if (active) {
          setLoadError(error instanceof Error ? error.message : 'আপনার পোস্ট লোড করা যায়নি।');
        }
      } finally {
        if (active) setLoaded(true);
      }
      // WiFi / coaching ids are best-effort; a failure must never block the overview.
      try {
        const myServices = await fetchMyServiceListings(true);
        if (active) setServiceListings(myServices);
      } catch {
        if (active) setServiceListings([]);
      }
    })();
    return () => { active = false; };
  }, [user]);

  const pickAvatar = async (file: File | undefined) => {
    if (!file) return;
    setAvatarBusy(true);
    setAvatarMsg('');
    setAvatarFailed(false);
    try {
      const result = await uploadAvatar(file);
      setAvatarFailed(!result.success);
      setAvatarMsg(result.success ? 'প্রোফাইল ছবি হালনাগাদ হয়েছে।' : (result.error || 'ছবি আপলোড ব্যর্থ হয়েছে।'));
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
  const stats = useMemo(() => {
    let pending = 0, approved = 0, rejected = 0, active = 0;
    for (const r of rows) {
      if (r.bucket === 'pending') pending++;
      else if (r.bucket === 'approved') { approved++; active++; }
      else if (r.bucket === 'rejected') rejected++;
    }
    return { total: rows.length, pending, approved, rejected, active };
  }, [rows]);

  const profileIds = useMemo(() => {
    type IdRow = {
      key: string;
      icon: typeof FileText;
      typeLabel: string;
      title: string;
      href: string;
      statusLabel: string;
      statusClass: string;
      views?: number;
    };
    const idRows: IdRow[] = [];
    if (homeTutorProfile) {
      const meta = TUTOR_STATUS_META[homeTutorProfile.status];
      idRows.push({
        key: 'tutor',
        icon: GraduationCap,
        typeLabel: 'গৃহশিক্ষক প্রোফাইল',
        title: homeTutorProfile.fullName,
        href: '/profile/home-tutor',
        statusLabel: meta.labelBn,
        statusClass: meta.badge,
        views: profileViews[homeTutorProfile.id],
      });
    }
    if (bloodDonorProfile) {
      const meta = DONOR_STATUS_META[bloodDonorProfile.status];
      idRows.push({
        key: 'donor',
        icon: Heart,
        typeLabel: `রক্তদাতা প্রোফাইল · ${bloodDonorProfile.bloodGroup}`,
        title: bloodDonorProfile.fullName,
        href: '/profile/blood-donor',
        statusLabel: meta.labelBn,
        statusClass: meta.badge,
      });
    }
    for (const sl of serviceListings) {
      const meta = SERVICE_LISTING_STATUS_META[sl.status ?? 'pending'];
      idRows.push({
        key: `service-${sl.id}`,
        icon: sl.category === 'wifi' ? Wifi : BookOpen,
        typeLabel: sl.category === 'wifi' ? 'WiFi আইডি' : 'কোচিং আইডি',
        title: sl.titleBn,
        href: '/dashboard/service-listings',
        statusLabel: meta.labelBn,
        statusClass: meta.className,
        views: profileViews[sl.slug],
      });
    }
    return idRows;
  }, [homeTutorProfile, bloodDonorProfile, serviceListings, profileViews]);
  const activity = [
    ...rows.map((row) => ({
      id: `post-${row.source}-${row.id}`,
      date: row.date,
      title: row.title,
      detail: `${row.typeLabel} · ${row.statusLabel}`,
      href: row.viewHref,
    })),
    ...requests.map((request) => ({
      id: `request-${request.id}`,
      date: request.createdAt,
      title: request.serviceTitleBn,
      detail: `সেবা রিকোয়েস্ট · ${REQUEST_STATUS_LABEL[request.status]}`,
      href: '/profile/requests',
    })),
    ...notifications.map((notification) => ({
      id: `notification-${notification.id}`,
      date: notification.createdAt,
      title: notification.title,
      detail: notification.body,
      href: notification.linkHref ?? '/dashboard/notifications',
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  if (authLoading || (!!user && !loaded)) {
    return (
      <div className="space-y-4" aria-hidden="true">
        <div className="h-24 animate-pulse rounded-2xl bg-mist-100" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[0,1,2,3].map((i) => (<div key={i} className="h-20 animate-pulse rounded-xl bg-mist-100" />))}
        </div>
        <div className="h-40 animate-pulse rounded-2xl bg-mist-100" />
      </div>
    );
  }
  if (!user) return null;
  const area = getAreaById(user.primaryAreaId);
  return (
    <div className="space-y-6">
      <section className="border-b border-brand-100 bg-white px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex items-start gap-3.5 sm:gap-5">
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarBusy}
              aria-label={user.avatarUrl ? 'প্রোফাইল ছবি বদলান' : 'প্রোফাইল ছবি যোগ করুন'}
              className={`group relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-brand-100 bg-accent-400 text-xl font-black text-brand-900 disabled:opacity-70 sm:h-16 sm:w-16 ${LIGHT_FOCUS}`}
            >
              {user.avatarUrl ? (
                <ListingMedia src={user.avatarUrl} alt={user.fullName} label={user.fullName} imgClassName="h-full w-full object-cover" />
              ) : (
                user.fullName.charAt(0)
              )}
              <span
                aria-hidden="true"
                className={`absolute inset-0 flex items-center justify-center bg-brand-900/45 text-white transition-opacity ${avatarBusy ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'}`}
              >
                {avatarBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
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
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h1 className="break-words text-lg font-extrabold leading-tight text-ink-900 sm:text-xl">{user.fullName}</h1>
              <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${user.isVerified ? 'text-brand-700' : 'text-ink-400'}`}>
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                {user.isVerified ? 'যাচাইকৃত' : 'যাচাই বাকি'}
              </span>
            </div>
            <p className="mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-ink-500 sm:text-[12.5px]">
              <span className="inline-flex min-w-0 items-center gap-1.5"><Phone className="h-3.5 w-3.5 shrink-0 text-ink-400" />{user.phone}</span>
              <span className="inline-flex min-w-0 items-center gap-1.5"><MapPin className="h-3.5 w-3.5 shrink-0 text-ink-400" />{area?.nameBn ?? 'ময়মনসিংহ'}</span>
            </p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-ink-500">আপনার পোস্ট ও সেবার আপডেট এক জায়গায় দেখুন। ছবিতে চাপ দিয়ে প্রোফাইল ছবি বদলাতে পারেন।</p>
            {avatarMsg && (
              <p role={avatarFailed ? 'alert' : 'status'} className={`mt-1 text-[11.5px] font-semibold ${avatarFailed ? 'text-rose-700' : 'text-brand-700'}`}>
                {avatarMsg}
              </p>
            )}
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/dashboard/profile" className={`inline-flex min-h-10 w-fit items-center rounded-lg border border-brand-200 px-3.5 text-[12px] font-bold text-brand-800 hover:bg-brand-50 ${LIGHT_FOCUS}`}>
            প্রোফাইল সম্পাদনা
          </Link>
          <Link href="/dashboard/new" className={`flex min-h-[50px] items-center justify-between gap-3 rounded-lg bg-brand-800 px-4 text-white hover:bg-brand-900 sm:min-w-64 ${LIGHT_FOCUS}`}>
            <span className="flex items-center gap-2.5"><PlusCircle className="h-5 w-5" /><span className="text-[14px] font-extrabold">নতুন পোস্ট তৈরি করুন</span></span>
          </Link>
        </div>
      </section>
      <section aria-labelledby="stats-h">
        <h2 id="stats-h" className="mb-3 text-[14px] font-extrabold text-ink-900">পোস্টের সারসংক্ষেপ</h2>
        {loadError ? (
          <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-[12.5px] leading-relaxed text-rose-800">{loadError}</p>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            <Stat href="/dashboard/posts" icon={FileText} label="মোট পোস্ট" v={stats.total} ic="text-brand-600" />
            <Stat href="/dashboard/posts?status=approved" icon={CheckCircle2} label="প্রকাশিত" v={stats.approved} ic="text-brand-600" />
            <Stat href="/dashboard/posts?status=pending" icon={Clock} label="অনুমোদনের অপেক্ষায়" v={stats.pending} ic="text-amber-600" />
            <Stat href="/dashboard/posts?status=rejected" icon={XCircle} label="সম্পাদনা প্রয়োজন" v={stats.rejected} ic="text-red-600" />
            <Stat href="/dashboard/profiles" icon={UserRound} label="খোলা প্রোফাইল" v={profileIds.length} ic="text-brand-600" />
          </div>
        )}
      </section>
      <section aria-labelledby="ids-h" className="rounded-2xl border border-brand-100 bg-white p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 id="ids-h" className="text-[13px] font-extrabold text-ink-900">আমার প্রোফাইল ও আইডি</h2>
          <Link href="/dashboard/profiles" className={`text-[11px] font-bold text-brand-700 hover:underline ${LIGHT_FOCUS}`}>প্রোফাইল ব্যবস্থাপনা</Link>
        </div>
        {profileIds.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-brand-200 bg-mist-50 px-4 py-5 text-center">
            <p className="text-[12.5px] font-bold text-ink-900">এখনো কোনো প্রোফাইল বা আইডি খোলা হয়নি</p>
            <p className="mx-auto mt-1 max-w-sm text-[11.5px] leading-relaxed text-ink-500">গৃহশিক্ষক, রক্তদাতা, WiFi বা কোচিং প্রোফাইল খুললে এখানে অবস্থা ও দেখার সংখ্যা দেখা যাবে।</p>
            <Link href="/dashboard/profiles" className={`mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-brand-700 px-4 text-[12px] font-bold text-white hover:bg-brand-800 ${LIGHT_FOCUS}`}>প্রোফাইল খুলুন</Link>
          </div>
        ) : (
          <ul className="mt-2 divide-y divide-brand-100/70">
            {profileIds.map((row) => {
              const Icon = row.icon;
              return (
                <li key={row.key}>
                  <Link href={row.href} className={`flex items-center gap-3 py-2.5 ${LIGHT_FOCUS}`}>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><Icon className="h-4 w-4" aria-hidden="true" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="shrink-0 text-[10px] font-extrabold text-brand-600">{row.typeLabel}</span>
                        <span className="truncate text-[12.5px] font-bold text-ink-900">{row.title}</span>
                      </span>
                      {typeof row.views === 'number' && (
                        <span className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                          <span className="inline-flex items-center gap-0.5 text-[10.5px] font-semibold text-brand-600"><Eye className="h-3 w-3" aria-hidden="true" />দেখা {row.views}</span>
                        </span>
                      )}
                    </span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${row.statusClass}`}>{row.statusLabel}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <section aria-labelledby="recent-h" className="rounded-2xl border border-brand-100 bg-white p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 id="recent-h" className="text-[13px] font-extrabold text-ink-900">সাম্প্রতিক পোস্ট</h2>
          {rows.length > 0 && (<Link href="/dashboard/posts" className={`inline-flex items-center gap-1 text-[12px] font-bold text-brand-700 hover:underline ${LIGHT_FOCUS}`}>সব দেখুন</Link>)}
        </div>
        {analyticsError && (
          <p role="alert" className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11.5px] leading-relaxed text-amber-900">{analyticsError}</p>
        )}
        {loadError ? (
          <p className="mt-3 text-[12px] leading-relaxed text-ink-500">পোস্টের তালিকা এখন দেখানো যাচ্ছে না। পরে আবার চেষ্টা করুন।</p>
        ) : rows.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-brand-200 bg-mist-50 px-4 py-6 text-center">
            <Home className="mx-auto h-7 w-7 text-brand-300" />
            <p className="mt-2 text-[13px] font-bold text-ink-900">এখনো কোনো পোস্ট করেননি</p>
            <p className="mx-auto mt-1 max-w-xs text-[12px] leading-relaxed text-ink-500">প্রথম পোস্ট করুন — বাসা ভাড়া, গৃহশিক্ষক, কেনাবেচা, চাকরি, রক্তদাতা বা সংবাদ।</p>
            <Link href="/dashboard/new" className={`mt-3 inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-brand-700 px-5 text-[13px] font-bold text-white hover:bg-brand-800 ${LIGHT_FOCUS}`}><PlusCircle className="h-4 w-4" />নতুন পোস্ট করুন</Link>
          </div>
        ) : (
          <ul className="mt-3 space-y-2">
            {rows.map((row) => (
              <li key={`${row.source}-${row.id}`}>
                <Link href={row.viewHref} className={`flex min-w-0 items-center gap-3 rounded-xl border border-brand-100 p-2.5 hover:border-brand-200 ${LIGHT_FOCUS}`}>
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-mist-100"><ListingMedia src={row.image} alt={row.title} label={row.title} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`shrink-0 rounded-full border px-1.5 py-px text-[10px] font-extrabold ${row.statusClass}`}>{row.statusLabel}</span>
                      <span className="truncate text-[10px] font-bold text-brand-600">{row.typeLabel}{row.categoryLabel ? ` · ${row.categoryLabel}` : ''}</span>
                    </div>
                    <h3 className="mt-0.5 line-clamp-1 text-[12.5px] font-bold text-ink-900">{row.title}</h3>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                      <span className="text-[10.5px] text-ink-400">{bnRelativeTime(row.date) ?? ''}</span>
                      {row.source === 'tolet' && row.analytics && (
                        <>
                          <span className="inline-flex items-center gap-0.5 text-[10.5px] font-semibold text-brand-600"><Eye className="h-3 w-3" aria-hidden="true" />দেখা {row.analytics.views}</span>
                          <span className="inline-flex items-center gap-0.5 text-[10.5px] font-semibold text-brand-600"><PhoneCall className="h-3 w-3" aria-hidden="true" />কল বাটন {row.analytics.callClicks}</span>
                        </>
                      )}
                      {row.source === 'post' && typeof row.postViews === 'number' && (
                        <span className="inline-flex items-center gap-0.5 text-[10.5px] font-semibold text-brand-600"><Eye className="h-3 w-3" aria-hidden="true" />দেখা {row.postViews}</span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section aria-labelledby="quick-h" className="rounded-2xl border border-brand-100 bg-white p-4 sm:p-5">
        <h2 id="quick-h" className="text-[13px] font-extrabold text-ink-900">দ্রুত মেনু</h2>
        <div className="mt-3 grid grid-cols-3 gap-1.5 sm:grid-cols-5 sm:gap-2">
          <QuickSmall href="/dashboard/posts" icon={FileText} label="আমার পোস্ট" />
          <QuickSmall href="/dashboard/profiles" icon={UserRound} label="প্রোফাইল ব্যবস্থাপনা" />
          <QuickSmall href="/dashboard/messages" icon={Mail} label="বার্তা" />
          <QuickSmall href="/dashboard/complaints" icon={CircleAlert} label="অভিযোগ" />
          <QuickSmall href="/dashboard/profile" icon={Settings} label="প্রোফাইল সেটিংস" />
        </div>
      </section>
      <section aria-labelledby="activity-h" className="rounded-2xl border border-brand-100 bg-white p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 id="activity-h" className="text-[13px] font-extrabold text-ink-900">সাম্প্রতিক কার্যকলাপ</h2>
          <Link href="/dashboard/notifications" className={`text-[11px] font-bold text-brand-700 hover:underline ${LIGHT_FOCUS}`}>সব আপডেট</Link>
        </div>
        {activity.length === 0 ? (
          <p className="mt-2 text-[12px] text-ink-500">আপনার পোস্ট, অনুরোধ বা নোটিফিকেশনের আপডেট এখানে দেখা যাবে।</p>
        ) : (
          <ol className="mt-2 divide-y divide-brand-100/70">
            {activity.map((item) => (
              <li key={item.id}>
                <Link href={item.href} className={`block py-2.5 ${LIGHT_FOCUS}`}>
                  <span className="block truncate text-[12px] font-bold text-ink-800">{item.title}</span>
                  <span className="mt-0.5 block line-clamp-1 text-[11px] text-ink-500">{item.detail}</span>
                  <time className="mt-0.5 block text-[10px] text-ink-400" dateTime={item.date}>{bnRelativeTime(item.date) ?? ''}</time>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
function Stat({ href, icon: Icon, label, v, ic }: { href: string; icon: typeof FileText; label: string; v: number; ic: string }) {
  return (
    <Link href={href} className={`flex items-center gap-2.5 rounded-xl border border-brand-100 bg-white p-3 hover:border-brand-200 ${LIGHT_FOCUS}`}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-mist-50"><Icon className={`h-4 w-4 ${ic}`} /></span>
      <span className="min-w-0"><span className="block text-lg font-black leading-none text-ink-900">{v}</span><span className="mt-1 block truncate text-[11px] font-bold text-ink-500">{label}</span></span>
    </Link>
  );
}
function QuickSmall({ href, icon: Icon, label }: { href: string; icon: typeof FileText; label: string }) {
  return (
    <Link href={href} className={`group flex min-h-[74px] flex-col items-center justify-center gap-1.5 rounded-xl border border-brand-100 bg-mist-50/50 px-1.5 py-2.5 text-center transition-colors hover:border-brand-300 hover:bg-brand-50 ${LIGHT_FOCUS}`}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-brand-700 shadow-sm ring-1 ring-brand-100 transition-colors group-hover:bg-brand-100/60">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="line-clamp-2 text-[10px] font-bold leading-tight text-ink-800 sm:text-[10.5px]">{label}</span>
    </Link>
  );
}
