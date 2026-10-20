'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  CircleAlert,
  GraduationCap,
  Heart,
  Pencil,
  Plus,
  RefreshCw,
  School,
  ShieldCheck,
  Wifi,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { fetchMyServiceListings } from '@/lib/catalog-service';
import {
  bnRelativeTime,
  SERVICE_LISTING_STATUS_META,
  toBn,
  type ServiceListing,
} from '@/lib/catalog-types';
import { TUTOR_STATUS_META } from '@/lib/home-tutor-types';
import { DONOR_STATUS_META } from '@/lib/blood-donor-types';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';
import { cn } from '@/lib/utils';
import {
  SECONDARY_BUTTON,
  StatusBadge,
  statusTone,
  TEXT_LINK,
  type StatusTone,
} from '@/components/account/ProfileUI';

interface OpenInfo {
  statusLabel: string;
  tone: StatusTone;
  count: number;
  latestDate: string;
}

interface ProfileCard {
  key: string;
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel: string;
  actionIcon: LucideIcon;
  open: OpenInfo | null;
  note?: string;
}

function firstError(reason: unknown, fallback: string) {
  return reason instanceof Error && reason.message ? reason.message : fallback;
}

export default function ProfileManager() {
  const { homeTutorProfile, bloodDonorProfile } = useAuth();
  const [serviceListings, setServiceListings] = useState<ServiceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const rows = await fetchMyServiceListings(true);
        if (active) setServiceListings(rows);
      } catch (cause) {
        if (active) {
          setServiceListings([]);
          setError(firstError(cause, 'WiFi ও কোচিং তালিকা লোড করা যায়নি।'));
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const latestServiceOpen = (category: 'wifi' | 'coaching'): OpenInfo | null => {
    const matches = serviceListings
      .filter((row) => row.category === category)
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime()
      );
    if (matches.length === 0) return null;
    const latest = matches[0];
    const meta = SERVICE_LISTING_STATUS_META[latest.status ?? 'draft'];
    return {
      statusLabel: meta.labelBn,
      tone: statusTone(latest.status ?? 'draft'),
      count: matches.length,
      latestDate: latest.updatedAt || latest.createdAt,
    };
  };

  const serviceHref = (category: 'wifi' | 'coaching', open: OpenInfo | null) =>
    open || error ? '/dashboard/service-listings' : `/dashboard/${category}/new`;

  const wifiOpen = latestServiceOpen('wifi');
  const coachingOpen = latestServiceOpen('coaching');

  const entries: ProfileCard[] = [
    {
      key: 'tutor',
      href: '/profile/home-tutor',
      icon: GraduationCap,
      title: 'গৃহশিক্ষক',
      description: 'ক্লাস, বিষয়, অভিজ্ঞতা ও পড়ানোর সময়সূচি দিয়ে শিক্ষক প্রোফাইল তৈরি করুন।',
      actionLabel: homeTutorProfile ? 'প্রোফাইল পরিচালনা করুন' : 'প্রোফাইল খুলুন',
      actionIcon: homeTutorProfile ? Pencil : Plus,
      open: homeTutorProfile
        ? {
            statusLabel: TUTOR_STATUS_META[homeTutorProfile.status].labelBn,
            tone: statusTone(homeTutorProfile.status),
            count: 1,
            latestDate: homeTutorProfile.updatedAt || homeTutorProfile.createdAt,
          }
        : null,
    },
    {
      key: 'donor',
      href: '/profile/blood-donor',
      icon: Heart,
      title: 'রক্তদাতা',
      description:
        'রক্তের গ্রুপ ও এলাকা দিয়ে রক্তদাতা প্রোফাইল তৈরি করুন। আপনার ফোন নম্বর প্রকাশ্যে যায় না।',
      actionLabel: bloodDonorProfile ? 'প্রোফাইল পরিচালনা করুন' : 'প্রোফাইল খুলুন',
      actionIcon: bloodDonorProfile ? Pencil : Plus,
      open: bloodDonorProfile
        ? {
            statusLabel: DONOR_STATUS_META[bloodDonorProfile.status].labelBn,
            tone: statusTone(bloodDonorProfile.status),
            count: 1,
            latestDate: bloodDonorProfile.updatedAt || bloodDonorProfile.createdAt,
          }
        : null,
    },
    {
      key: 'wifi',
      href: serviceHref('wifi', wifiOpen),
      icon: Wifi,
      title: 'WiFi',
      description: 'আপনার ইন্টারনেট প্যাকেজ, গতি, এলাকা ও যোগাযোগের তথ্য যোগ করুন।',
      actionLabel: wifiOpen
        ? 'তালিকা পরিচালনা করুন'
        : error
          ? 'তালিকা দেখুন'
          : 'WiFi তথ্য যোগ করুন',
      actionIcon: wifiOpen ? Pencil : error ? BookOpen : Plus,
      open: wifiOpen,
      note: error ? 'অবস্থা লোড করা যায়নি; তালিকা পেজে দেখুন।' : undefined,
    },
    {
      key: 'coaching',
      href: serviceHref('coaching', coachingOpen),
      icon: School,
      title: 'কোচিং সেন্টার',
      description: 'কোচিং সেন্টারের ঠিকানা, ক্লাস, বিষয় ও ফি যোগ করুন।',
      actionLabel: coachingOpen
        ? 'তালিকা পরিচালনা করুন'
        : error
          ? 'তালিকা দেখুন'
          : 'কোচিং তথ্য যোগ করুন',
      actionIcon: coachingOpen ? Pencil : error ? BookOpen : Plus,
      open: coachingOpen,
      note: error ? 'অবস্থা লোড করা যায়নি; তালিকা পেজে দেখুন।' : undefined,
    },
  ];

  const statuses: string[] = (
    [
      homeTutorProfile?.status,
      bloodDonorProfile?.status,
      ...serviceListings.map((listing) => listing.status ?? 'draft'),
    ] as (string | undefined)[]
  ).filter((status): status is string => Boolean(status));

  const sortedServiceListings = [...serviceListings].sort(
    (a, b) =>
      new Date(b.updatedAt || b.createdAt).getTime() -
      new Date(a.updatedAt || a.createdAt).getTime()
  );

  const totalProfiles =
    (homeTutorProfile ? 1 : 0) + (bloodDonorProfile ? 1 : 0) + serviceListings.length;
  const publishedProfiles = statuses.filter((status) => status === 'approved').length;
  const pendingProfiles = statuses.filter(
    (status) => status === 'pending_approval' || status === 'pending'
  ).length;
  const draftProfiles = statuses.filter((status) => status === 'draft').length;
  const needsEditProfiles = statuses.filter((status) => status === 'rejected').length;
  const countsUnknown = loading || Boolean(error);

  const reload = () => setReloadKey((key) => key + 1);

  return (
    <div className="space-y-4 sm:space-y-5">
      <header>
        <h1 className="text-[21px] font-bold leading-tight text-ink-900 sm:text-[24px]">
          সেবা প্রোফাইল
        </h1>
        <p className="mt-1.5 max-w-2xl text-[12px] leading-relaxed text-ink-500">
          গৃহশিক্ষক, রক্তদাতা, WiFi ও কোচিং—আপনার সেবা প্রোফাইল এক জায়গায় তৈরি ও পরিচালনা করুন।
          সাধারণ পোস্ট আলাদা;{' '}
          <Link
            href="/dashboard/new"
            className={cn('font-semibold text-ink-900 underline decoration-ink-300 underline-offset-2 hover:decoration-ink-900', LIGHT_FOCUS)}
          >
            নতুন পোস্ট
          </Link>{' '}
          পেজে তৈরি হবে।
        </p>
      </header>

      {/* Real, compact summary — unknown values stay unknown instead of showing 0. */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-ink-900/[0.08] bg-white px-4 py-3 sm:px-5">
        <SummaryValue label="মোট প্রোফাইল" value={countsUnknown ? '—' : toBn(totalProfiles)} />
        <Divider />
        <SummaryValue label="প্রকাশিত" value={countsUnknown ? '—' : toBn(publishedProfiles)} dot="bg-emerald-500" />
        <Divider />
        <SummaryValue label="পর্যালোচনাধীন" value={countsUnknown ? '—' : toBn(pendingProfiles)} dot="bg-amber-500" />
        <Divider />
        <SummaryValue label="খসড়া" value={countsUnknown ? '—' : toBn(draftProfiles)} dot="bg-slate-400" />
        {!countsUnknown && needsEditProfiles > 0 && (
          <>
            <Divider />
            <SummaryValue label="সংশোধন" value={toBn(needsEditProfiles)} dot="bg-rose-500" />
          </>
        )}
      </div>

      {error && (
        <div
          role="status"
          className="flex flex-col gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"
        >
          <div className="flex min-w-0 items-start gap-2.5">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
            <p className="text-[12px] leading-relaxed text-amber-900">
              WiFi ও কোচিং তালিকার অবস্থা লোড করা যায়নি। আপনার গৃহশিক্ষক ও রক্তদাতা প্রোফাইল ঠিক আছে।
            </p>
          </div>
          <button type="button" onClick={reload} className={cn(SECONDARY_BUTTON, 'shrink-0 border-amber-200 text-amber-900 hover:bg-amber-50')}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            আবার চেষ্টা করুন
          </button>
        </div>
      )}

      {loading ? (
        <ProfileCardsSkeleton />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {entries.map((card) => {
            const Icon = card.icon;
            const ActionIcon = card.actionIcon;
            const latestLabel = card.open ? bnRelativeTime(card.open.latestDate) : undefined;
            const note =
              card.note ??
              (card.open
                ? card.open.count > 1
                  ? `${toBn(card.open.count)}টি তালিকা`
                  : latestLabel
                    ? `সর্বশেষ হালনাগাদ ${latestLabel}`
                    : undefined
                : undefined);

            return (
              <li key={card.key} className="min-w-0">
                <Link
                  href={card.href}
                  className={cn(
                    'group flex h-full min-w-0 flex-col rounded-xl border border-ink-900/[0.08] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,20,0.03)] transition-colors hover:border-ink-900/20 hover:bg-mist-50/30 sm:p-5',
                    LIGHT_FOCUS
                  )}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-ink-900/[0.05] bg-mist-50 text-ink-600">
                      <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                    </span>
                    {card.open && (
                      <StatusBadge label={card.open.statusLabel} tone={card.open.tone} />
                    )}
                  </span>

                  <span className="mt-3 block break-words text-[14px] font-bold text-ink-900">
                    {card.title}
                  </span>
                  <span className="mt-1 block text-[12px] leading-relaxed text-ink-500">
                    {card.description}
                  </span>
                  {note && (
                    <span className="mt-2 block text-[11.5px] leading-relaxed text-ink-500">
                      {note}
                    </span>
                  )}

                  <span className="mt-auto flex items-center gap-1.5 border-t border-ink-900/[0.06] pt-3 text-[12px] font-semibold text-ink-800">
                    <ActionIcon className="h-3.5 w-3.5 text-ink-500" aria-hidden="true" />
                    <span className="min-w-0 break-words">{card.actionLabel}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <ApprovalExplainer />

      {!loading && !error && serviceListings.length > 0 && (
        <section aria-labelledby="service-list-heading">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 id="service-list-heading" className="text-[13.5px] font-bold text-ink-900">
                WiFi ও কোচিং তালিকা
              </h2>
              <p className="mt-0.5 text-[12px] text-ink-500">
                আপনার সব তালিকার সর্বশেষ অবস্থা ও সম্পাদনার লিংক।
              </p>
            </div>
            <Link href="/dashboard/service-listings" className={cn(TEXT_LINK, 'shrink-0')}>
              সব তালিকা
            </Link>
          </div>

          <ul className="mt-2.5 divide-y divide-ink-900/[0.05] overflow-hidden rounded-xl border border-ink-900/[0.08] bg-white">
            {sortedServiceListings.slice(0, 6).map((listing) => {
              const meta = SERVICE_LISTING_STATUS_META[listing.status ?? 'draft'];
              const Icon = listing.category === 'wifi' ? Wifi : BookOpen;
              const updated = listing.updatedAt || listing.createdAt;
              return (
                <li key={listing.id}>
                  <Link
                    href={`/dashboard/${listing.category}/${listing.id}/edit`}
                    className={cn(
                      'flex min-w-0 flex-wrap items-start gap-3 px-4 py-3 transition-colors hover:bg-mist-50/70 sm:flex-nowrap sm:items-center sm:px-5',
                      LIGHT_FOCUS
                    )}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink-900/[0.05] bg-mist-50 text-ink-500">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="break-words text-[12.5px] font-semibold text-ink-900">
                          {listing.titleBn}
                        </span>
                        <StatusBadge label={meta.labelBn} tone={statusTone(listing.status ?? 'draft')} />
                      </span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-ink-500">
                        <span>{listing.category === 'wifi' ? 'WiFi' : 'কোচিং'}</span>
                        {bnRelativeTime(updated) && <span>· {bnRelativeTime(updated)}</span>}
                      </span>
                    </span>
                    <span className="inline-flex w-full shrink-0 items-center gap-1.5 pl-12 text-[11.5px] font-semibold text-ink-500 sm:w-auto sm:pl-0">
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      সম্পাদনা
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {sortedServiceListings.length > 6 && (
            <Link
              href="/dashboard/service-listings"
              className={cn('mt-2 inline-flex min-h-9 items-center text-[11.5px] font-semibold text-ink-500 hover:text-ink-900', LIGHT_FOCUS)}
            >
              আরও {toBn(sortedServiceListings.length - 6)}টি তালিকা দেখুন
            </Link>
          )}
        </section>
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-ink-900/[0.06] pt-4 text-[12px] text-ink-500">
        <span>সাধারণ পোস্ট (সংবাদ, চাকরি, কেনাবেচা) আলাদা পেজে তৈরি হয়।</span>
        <Link href="/dashboard/profile" className={cn('font-semibold text-ink-700 hover:text-ink-900 hover:underline', LIGHT_FOCUS)}>
          অ্যাকাউন্ট সেটিংস
        </Link>
      </div>
    </div>
  );
}

function SummaryValue({
  label,
  value,
  dot,
}: {
  label: string;
  value: string;
  dot?: string;
}) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      {dot && <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dot)} aria-hidden="true" />}
      <span className="text-[15px] font-semibold leading-none text-ink-900">{value}</span>
      <span className="text-[11.5px] text-ink-500">{label}</span>
    </span>
  );
}

function Divider() {
  return <span aria-hidden="true" className="hidden h-3 w-px bg-ink-900/10 sm:block" />;
}

function ApprovalExplainer() {
  const steps = [
    {
      title: 'তথ্য জমা দিন',
      body: 'খসড়া সংরক্ষণ করুন বা পর্যালোচনার জন্য জমা দিন।',
    },
    {
      title: 'প্রশাসক যাচাই করেন',
      body: 'তথ্য ও যোগাযোগের নম্বর যাচাই করা হয়।',
    },
    {
      title: 'প্রকাশিত হয়',
      body: 'অনুমোদনের পর ডিরেক্টরিতে দেখা যায়; সংশোধন লাগলে কারণ দেখানো হয়।',
    },
  ];

  return (
    <section
      aria-labelledby="approval-heading"
      className="rounded-xl border border-ink-900/[0.07] bg-mist-50/60 p-4 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink-900/[0.06] bg-white text-ink-500">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 id="approval-heading" className="text-[13px] font-bold text-ink-900">
            অনুমোদন কীভাবে কাজ করে
          </h2>
          <p className="mt-0.5 text-[12px] leading-relaxed text-ink-500">
            প্রতিটি সেবা প্রোফাইল প্রকাশের আগে প্রশাসক যাচাই করেন। অবস্থা কার্ডেই দেখা যাবে।
          </p>
        </div>
      </div>

      <ol className="mt-4 grid gap-3 md:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-ink-900/10 bg-white text-[11.5px] font-semibold text-ink-700">
              {toBn(index + 1)}
            </span>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-ink-900">{step.title}</p>
              <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink-500">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ProfileCardsSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2" aria-busy="true" aria-label="সেবা প্রোফাইল লোড হচ্ছে">
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className="h-48 animate-pulse rounded-xl bg-mist-100" />
      ))}
    </div>
  );
}
