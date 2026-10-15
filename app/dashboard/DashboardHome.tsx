'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Bell, Bookmark, CheckCircle2, CircleAlert, ClipboardList, Clock, FileText, Home, MapPin, Mail, Phone, PlusCircle, ShieldCheck, UserRound, XCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { fetchMyPosts } from '@/lib/catalog-service';
import { fetchMyListings } from '@/lib/tolet-service';
import { bnRelativeTime, type CommunityPost } from '@/lib/catalog-types';
import type { ToletListing } from '@/lib/tolet-types';
import type { ServiceRequestStatus } from '@/lib/supabase/types';
import { mergeRows } from '@/lib/dashboard';
import { ListingMedia } from '@/components/catalog/CatalogCards';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';
import NotificationBell from '@/components/account/NotificationBell';
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
  const { user, toletProfile, homeTutorProfile, bloodDonorProfile, savedListings, requests, notifications, isLoading: authLoading } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [listings, setListings] = useState<ToletListing[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      try {
        const [myPosts, myListings] = await Promise.all([fetchMyPosts(true), fetchMyListings(user.id, true)]);
        if (!active) return;
        setPosts(myPosts);
        setListings(myListings);
      } catch (error) {
        if (active) {
          setLoadError(error instanceof Error ? error.message : 'আপনার পোস্ট লোড করা যায়নি।');
        }
      } finally {
        if (active) setLoaded(true);
      }
    })();
    return () => { active = false; };
  }, [user]);

  const rows = useMemo(() => mergeRows(posts, listings), [posts, listings]);
  const stats = useMemo(() => {
    let pending = 0, approved = 0, rejected = 0, active = 0;
    for (const r of rows) {
      if (r.bucket === 'pending') pending++;
      else if (r.bucket === 'approved') { approved++; active++; }
      else if (r.bucket === 'rejected') rejected++;
    }
    return { total: rows.length, pending, approved, rejected, active };
  }, [rows]);
  const unread = notifications.filter((n) => !n.isRead);
  const unreadMessages = unread.filter((notification) => notification.relatedType === 'contact_message').length;
  const recentRows = rows.slice(0, 4);
  const recentNotifs = notifications.slice(0, 3);
  const svcCount = [toletProfile, homeTutorProfile, bloodDonorProfile].filter(Boolean).length;
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
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-brand-100 bg-accent-400 text-xl font-black text-brand-900 sm:h-16 sm:w-16">
              {user.avatarUrl ? (
                <ListingMedia src={user.avatarUrl} alt={user.fullName} label={user.fullName} imgClassName="h-full w-full object-cover" />
              ) : (
                user.fullName.charAt(0)
              )}
            </div>
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
            <p className="mt-1.5 text-[12px] leading-relaxed text-ink-500">আপনার পোস্ট ও সেবার আপডেট এক জায়গায় দেখুন।</p>
          </div>
          <NotificationBell />
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/dashboard/profile" className={`inline-flex min-h-10 w-fit items-center rounded-lg border border-brand-200 px-3.5 text-[12px] font-bold text-brand-800 hover:bg-brand-50 ${LIGHT_FOCUS}`}>
            প্রোফাইল সম্পাদনা
          </Link>
          <Link href="/dashboard/new" className={`flex min-h-[50px] items-center justify-between gap-3 rounded-lg bg-brand-800 px-4 text-white hover:bg-brand-900 sm:min-w-64 ${LIGHT_FOCUS}`}>
            <span className="flex items-center gap-2.5"><PlusCircle className="h-5 w-5" /><span className="text-[14px] font-extrabold">নতুন পোস্ট তৈরি করুন</span></span>
            <ArrowRight className="h-4 w-4 opacity-80" />
          </Link>
        </div>
      </section>
      <section aria-labelledby="stats-h">
        <h2 id="stats-h" className="mb-3 text-[14px] font-extrabold text-ink-900">পোস্টের সারসংক্ষেপ</h2>
        {loadError ? (
          <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-[12.5px] leading-relaxed text-rose-800">{loadError}</p>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            <Stat href="/dashboard/posts" icon={FileText} label="মোট পোস্ট" v={stats.total} ic="text-brand-600" />
            <Stat href="/dashboard/posts?status=approved" icon={CheckCircle2} label="প্রকাশিত" v={stats.approved} ic="text-brand-600" />
            <Stat href="/dashboard/posts?status=pending" icon={Clock} label="অনুমোদনের অপেক্ষায়" v={stats.pending} ic="text-amber-600" />
            <Stat href="/dashboard/posts?status=rejected" icon={XCircle} label="সম্পাদনা প্রয়োজন" v={stats.rejected} ic="text-red-600" />
          </div>
        )}
      </section>
      <section aria-labelledby="recent-h" className="rounded-2xl border border-brand-100 bg-white p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 id="recent-h" className="text-[13px] font-extrabold text-ink-900">সাম্প্রতিক পোস্ট</h2>
          {rows.length > 0 && (<Link href="/dashboard/posts" className={`inline-flex items-center gap-1 text-[12px] font-bold text-brand-700 hover:underline ${LIGHT_FOCUS}`}>সব দেখুন<ArrowRight className="h-3.5 w-3.5" /></Link>)}
        </div>
        {loadError ? (
          <p className="mt-3 text-[12px] leading-relaxed text-ink-500">পোস্টের তালিকা এখন দেখানো যাচ্ছে না। পরে আবার চেষ্টা করুন।</p>
        ) : recentRows.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-brand-200 bg-mist-50 px-4 py-6 text-center">
            <Home className="mx-auto h-7 w-7 text-brand-300" />
            <p className="mt-2 text-[13px] font-bold text-ink-900">এখনো কোনো পোস্ট করেননি</p>
            <p className="mx-auto mt-1 max-w-xs text-[12px] leading-relaxed text-ink-500">প্রথম পোস্ট করুন — বাসা ভাড়া, গৃহশিক্ষক, কেনাবেচা, চাকরি, রক্তদাতা বা সংবাদ।</p>
            <Link href="/dashboard/new" className={`mt-3 inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-brand-700 px-5 text-[13px] font-bold text-white hover:bg-brand-800 ${LIGHT_FOCUS}`}><PlusCircle className="h-4 w-4" />নতুন পোস্ট করুন</Link>
          </div>
        ) : (
          <ul className="mt-3 space-y-2">
            {recentRows.map((row) => (
              <li key={`${row.source}-${row.id}`}>
                <Link href={row.viewHref} className={`flex min-w-0 items-center gap-3 rounded-xl border border-brand-100 p-2.5 hover:border-brand-200 ${LIGHT_FOCUS}`}>
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-mist-100"><ListingMedia src={row.image} alt={row.title} label={row.title} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`shrink-0 rounded-full border px-1.5 py-px text-[10px] font-extrabold ${row.statusClass}`}>{row.statusLabel}</span>
                      <span className="truncate text-[10px] font-bold text-brand-600">{row.typeLabel}{row.categoryLabel ? ` · ${row.categoryLabel}` : ''}</span>
                    </div>
                    <h3 className="mt-0.5 line-clamp-1 text-[12.5px] font-bold text-ink-900">{row.title}</h3>
                    <p className="mt-0.5 text-[10.5px] text-ink-400">{bnRelativeTime(row.date) ?? ''}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-brand-300" />
                </Link>
              </li>
            ))}
          </ul>
        )}
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
      <section aria-labelledby="quick-h">
        <h2 id="quick-h" className="mb-2 text-[13px] font-extrabold text-ink-900">দ্রুত মেনু</h2>
        <div className="grid grid-cols-2 gap-3">
          <Quick href="/dashboard/posts?status=approved" icon={CheckCircle2} label="সক্রিয় পোস্ট" hint="অনুমোদিত ও প্রকাশিত" v={stats.active} />
          <Quick href="/profile/saved" icon={Bookmark} label="সেভ করা" hint="পছন্দের তালিকা" v={savedListings.length} />
          <Quick href="/profile/requests" icon={ClipboardList} label="আমার রিকোয়েস্ট" hint="সেবার আবেদন" v={requests.length} />
          <Quick href="/dashboard/messages" icon={Mail} label="সাপোর্ট বার্তা" hint={unreadMessages ? 'নতুন উত্তর এসেছে' : 'সাপোর্টের সাথে কথা বলুন'} v={unreadMessages} />
          <Quick href="/dashboard/complaints" icon={CircleAlert} label="অভিযোগ" hint="সাপোর্টে অভিযোগ জানান" />
          <Quick href="/dashboard/notifications" icon={Bell} label="নোটিফিকেশন" hint={unread.length > 0 ? 'নতুন বার্তা আছে' : 'সব পড়া হয়েছে'} v={unread.length} />
          <Quick href="/dashboard/profile" icon={UserRound} label="আমার প্রোফাইল" hint={svcCount > 0 ? 'টি সার্ভিস প্রোফাইল' : 'তথ্য হালনাগাদ করুন'} v={svcCount > 0 ? svcCount : undefined} />
        </div>
      </section>
      <section aria-labelledby="notif-h" className="rounded-2xl border border-brand-100 bg-white p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 id="notif-h" className="text-[13px] font-extrabold text-ink-900">নোটিফিকেশন</h2>
          <Link href="/dashboard/notifications" className={`inline-flex items-center gap-1 text-[12px] font-bold text-brand-700 hover:underline ${LIGHT_FOCUS}`}>সব দেখুন<ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
        {recentNotifs.length === 0 ? (
          <p className="mt-2 text-[12.5px] leading-relaxed text-ink-500">এখনো কোনো নোটিফিকেশন নেই। পোস্ট অনুমোদন বা বাতিল হলে এখানে জানিয়ে দেওয়া হবে।</p>
        ) : (
          <ul className="mt-2 divide-y divide-brand-100/70">
            {recentNotifs.map((n) => (
              <li key={n.id} className="flex items-start gap-2.5 py-2.5">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.isRead ? 'bg-brand-100' : 'bg-brand-600'}`} />
                <div className="min-w-0">
                  <p className="line-clamp-1 text-[12.5px] font-bold text-ink-900">{n.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-[12px] leading-relaxed text-ink-500">{n.body}</p>
                  <p className="mt-0.5 text-[10.5px] text-ink-400">{bnRelativeTime(n.createdAt) ?? ''}</p>
                </div>
              </li>
            ))}
          </ul>
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
function Quick({ href, icon: Icon, label, hint, v }: { href: string; icon: typeof Bell; label: string; hint: string; v?: number }) {
  return (
    <Link href={href} className={`flex items-center gap-2.5 rounded-xl border border-brand-100 bg-white p-3 hover:border-brand-200 ${LIGHT_FOCUS}`}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><Icon className="h-4 w-4" /></span>
      <span className="min-w-0"><span className="block truncate text-[12.5px] font-extrabold text-ink-900">{label}{typeof v === 'number' ? ` (${v})` : ''}</span><span className="mt-0.5 block truncate text-[11px] text-ink-400">{hint}</span></span>
    </Link>
  );
}
