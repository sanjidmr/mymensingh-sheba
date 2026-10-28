'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  CircleAlert,
  GraduationCap,
  Heart,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  School,
  ShieldCheck,
  Wifi,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { deleteCustomerServiceListing, fetchMyServiceListings } from '@/lib/catalog-service';
import { deleteOwnTutorProfile } from '@/lib/home-tutor-service';
import {
  deleteOwnBloodDonorProfile,
  updateOwnBloodDonorAvailability,
} from '@/lib/blood-donor-service';
import { TutorAvatar } from '@/components/home-tutor/TutorCard';
import { DonorAvatar } from '@/components/blood-donor/DonorCard';
import { getAreaById } from '@/lib/locations';
import {
  areaNames,
  bnTakaRange,
  COACHING_CATEGORIES,
  SERVICE_LISTING_STATUS_META,
  tagLabels,
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
} from '@/components/account/ProfileUI';

interface ProfileCard {
  key: 'tutor' | 'donor' | 'wifi' | 'coaching';
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
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
  const [actionError, setActionError] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [donorAvailabilityOverride, setDonorAvailabilityOverride] = useState<{
    profileId: string;
    isAvailable: boolean;
  } | null>(null);
  const [donorAvailabilityBusy, setDonorAvailabilityBusy] = useState(false);
  const donorAvailable = bloodDonorProfile
    ? donorAvailabilityOverride?.profileId === bloodDonorProfile.id
      ? donorAvailabilityOverride.isAvailable
      : bloodDonorProfile.isAvailable
    : false;

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
          setError(firstError(cause, 'ওয়াইফাই ও কোচিং প্রোফাইল লোড করা যায়নি।'));
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

  const entries: ProfileCard[] = [
    {
      key: 'tutor',
      href: '/profile/home-tutor/setup',
      icon: GraduationCap,
      title: 'গৃহ শিক্ষক প্রোফাইল খুলুন',
      description: 'শিক্ষাগত যোগ্যতা, পড়ানোর বিষয় ও পছন্দের এলাকা দিয়ে শিক্ষক প্রোফাইল পরিচালনা করুন।',
    },
    {
      key: 'donor',
      href: '/profile/blood-donor/setup',
      icon: Heart,
      title: 'রক্তদাতা অ্যাকাউন্ট খুলুন',
      description: 'রক্তের গ্রুপ ও এলাকা দিয়ে রক্তদাতা প্রোফাইল পরিচালনা করুন; ব্যক্তিগত নম্বর গোপন থাকে।',
    },
    {
      key: 'wifi',
      href: '/dashboard/wifi/new',
      icon: Wifi,
      title: 'ওয়াইফাই অ্যাকাউন্ট খুলুন',
      description: 'ইন্টারনেট প্যাকেজ, গতি, সেবা এলাকা ও যোগাযোগের তথ্য পরিচালনা করুন।',
    },
    {
      key: 'coaching',
      href: '/dashboard/coaching/new',
      icon: School,
      title: 'কোচিং সেন্টার অ্যাকাউন্ট খুলুন',
      description: 'কোচিং ক্যাটাগরি, এলাকা, ক্লাস, বিষয় ও ফি দিয়ে প্রতিষ্ঠানের তথ্য পরিচালনা করুন।',
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

  const toggleDonorAvailability = async () => {
    if (!bloodDonorProfile || donorAvailabilityBusy) return;
    const nextAvailability = !donorAvailable;
    setDonorAvailabilityBusy(true);
    setActionError('');
    try {
      const result = await updateOwnBloodDonorAvailability(bloodDonorProfile.id, nextAvailability);
      if (!result.success) {
        setActionError(result.error || 'রক্তদানের প্রস্তুতির অবস্থা হালনাগাদ ব্যর্থ হয়েছে।');
        return;
      }
      setDonorAvailabilityOverride({
        profileId: bloodDonorProfile.id,
        isAvailable: nextAvailability,
      });
    } catch (cause) {
      setActionError(firstError(cause, 'রক্তদানের প্রস্তুতির অবস্থা হালনাগাদ ব্যর্থ হয়েছে।'));
    } finally {
      setDonorAvailabilityBusy(false);
    }
  };

  const removeProfile = async (kind: ProfileCard['key'], id: string, label: string) => {
    const confirmation = kind === 'donor'
      ? `“${label}” রক্তদাতা প্রোফাইলটি স্থায়ীভাবে মুছবেন? সম্পর্কিত রিপোর্ট ও যোগাযোগের রেকর্ডও মুছে যেতে পারে।`
      : `“${label}” প্রোফাইলটি স্থায়ীভাবে মুছবেন? এই কাজ ফেরানো যাবে না।`;
    if (!window.confirm(confirmation)) return;
    setDeletingId(id);
    setActionError('');
    try {
      const result = kind === 'tutor'
        ? await deleteOwnTutorProfile(id)
        : kind === 'donor'
          ? await deleteOwnBloodDonorProfile(id)
          : await deleteCustomerServiceListing(id);
      if (!result.success) {
        setActionError(result.error || 'প্রোফাইলটি মুছতে ব্যর্থ হয়েছে।');
        return;
      }
      window.location.reload();
    } catch (cause) {
      setActionError(firstError(cause, 'প্রোফাইলটি মুছতে ব্যর্থ হয়েছে।'));
    } finally {
      setDeletingId('');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <header>
        <h1 className="text-[21px] font-bold leading-tight text-ink-900 sm:text-[24px]">
          সেবা প্রোফাইল
        </h1>
        <p className="mt-1.5 max-w-2xl text-[12px] leading-relaxed text-ink-500">
          শিক্ষক, রক্তদাতা, ওয়াইফাই ও কোচিং—আপনার সেবা প্রোফাইল এক জায়গায় তৈরি ও পরিচালনা করুন।
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
              ওয়াইফাই ও কোচিং প্রোফাইলের অবস্থা লোড করা যায়নি। শিক্ষক ও রক্তদাতা প্রোফাইল ঠিক আছে।
            </p>
          </div>
          <button type="button" onClick={reload} className={cn(SECONDARY_BUTTON, 'shrink-0 border-amber-200 text-amber-900 hover:bg-amber-50')}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            আবার চেষ্টা করুন
          </button>
        </div>
      )}
      {actionError && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[12px] leading-relaxed text-rose-800">
          {actionError}
        </p>
      )}

      {loading ? (
        <ProfileCardsSkeleton />
      ) : (
        <section aria-labelledby="profile-options-heading">
          <div className="mb-2">
            <h2 id="profile-options-heading" className="text-[14px] font-bold text-ink-900">
              সেবা প্রোফাইল খুলুন
            </h2>
            <p className="mt-0.5 text-[12px] text-ink-500">
              প্রতিটি সেবার একটি অ্যাকাউন্ট এখান থেকে পরিচালনা করুন।
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {entries.map((card) => {
              const Icon = card.icon;
              const tutor = card.key === 'tutor' ? homeTutorProfile : null;
              const donor = card.key === 'donor' ? bloodDonorProfile : null;
              const serviceRows = card.key === 'wifi' || card.key === 'coaching'
                ? sortedServiceListings.filter((listing) => listing.category === card.key)
                : [];
              const hasProfile = Boolean(tutor || donor || serviceRows.length > 0);
              const latestStatus = tutor
                ? { label: TUTOR_STATUS_META[tutor.status].labelBn, tone: statusTone(tutor.status) }
                : donor
                  ? { label: DONOR_STATUS_META[donor.status].labelBn, tone: statusTone(donor.status) }
                  : serviceRows[0]
                    ? {
                        label: SERVICE_LISTING_STATUS_META[serviceRows[0].status ?? 'draft'].labelBn,
                        tone: statusTone(serviceRows[0].status ?? 'draft'),
                      }
                    : null;
              const displayTitle = hasProfile
                ? card.key === 'tutor'
                  ? 'গৃহ শিক্ষক প্রোফাইল'
                  : card.title.replace(' অ্যাকাউন্ট খুলুন', ' অ্যাকাউন্ট')
                : card.title;

              return (
                <li key={card.key} className="min-w-0">
                  <article className={cn(
                    'flex min-w-0 flex-col rounded-xl border border-ink-900/[0.08] bg-white shadow-[0_1px_2px_rgba(16,24,20,0.03)]',
                    hasProfile && 'h-full',
                    hasProfile ? 'p-4 sm:p-5' : 'p-3'
                  )}>
                    {hasProfile && (
                      <>
                        <div className="flex items-start justify-between gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-ink-900/[0.05] bg-mist-50 text-ink-600">
                            <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                          </span>
                          {latestStatus && <StatusBadge label={latestStatus.label} tone={latestStatus.tone} />}
                        </div>
                        <h3 className="mt-3 break-words text-[14px] font-bold text-ink-900">{displayTitle}</h3>
                        <p className="mt-1 text-[12px] leading-relaxed text-ink-500">{card.description}</p>
                      </>
                    )}

                    {tutor && (
                      <div className="mt-3 rounded-lg border border-ink-900/[0.06] bg-mist-50/50 p-3">
                        <div className="flex items-center gap-3">
                          <TutorAvatar tutor={tutor} className="h-12 w-12 text-base" />
                          <div className="min-w-0">
                            <p className="break-words text-[13px] font-bold text-ink-900">{tutor.fullName}</p>
                            <p className="mt-0.5 break-words text-[11.5px] text-ink-500">
                              {tutor.qualification || tutor.institution}
                            </p>
                          </div>
                        </div>
                        <p className="mt-2 text-[11.5px] leading-relaxed text-ink-600">
                          বিষয়: {tutor.preferredSubjects.join(' · ') || 'উল্লেখ নেই'}
                        </p>
                        <p className="mt-1 text-[11.5px] leading-relaxed text-ink-600">
                          এলাকা: {tutor.preferredAreas.map((id) => getAreaById(id)?.nameBn ?? id).join(' · ') || 'উল্লেখ নেই'}
                        </p>
                        <ProfileActionLinks
                          editHref="/profile/home-tutor/setup"
                          deleting={deletingId === tutor.id}
                          onDelete={() => void removeProfile('tutor', tutor.id, tutor.fullName)}
                        />
                      </div>
                    )}

                    {donor && (
                      <div className="mt-3 rounded-lg border border-ink-900/[0.06] bg-mist-50/50 p-3">
                        <div className="flex items-center gap-3">
                          <DonorAvatar donor={donor} className="h-12 w-12 text-base" />
                          <div className="min-w-0">
                            <p className="break-words text-[13px] font-bold text-ink-900">{donor.fullName}</p>
                            <p className="mt-0.5 text-[11.5px] text-ink-500">
                              {donor.bloodGroup} · {getAreaById(donor.areaId)?.nameBn ?? donor.areaId}
                            </p>
                          </div>
                        </div>
                        <p className="mt-2 text-[11.5px] text-ink-600">
                          {donorAvailable ? 'রক্তদানে প্রস্তুত' : 'বর্তমানে রক্তদানে বিরতিতে'}
                        </p>
                        <button
                          type="button"
                          onClick={() => void toggleDonorAvailability()}
                          disabled={donorAvailabilityBusy}
                          aria-pressed={donorAvailable}
                          className={cn(
                            'mt-2 inline-flex min-h-9 items-center rounded-lg border px-3 text-[11.5px] font-bold disabled:cursor-wait disabled:opacity-60',
                            donorAvailable
                              ? 'border-amber-200 text-amber-800 hover:bg-amber-50'
                              : 'border-emerald-200 text-emerald-800 hover:bg-emerald-50'
                          )}
                        >
                          {donorAvailabilityBusy
                            ? 'হালনাগাদ হচ্ছে…'
                            : donorAvailable
                              ? 'রক্তদানে প্রস্তুত নই'
                              : 'রক্তদানে প্রস্তুত'}
                        </button>
                        <ProfileActionLinks
                          editHref="/profile/blood-donor/setup"
                          deleting={deletingId === donor.id}
                          onDelete={() => void removeProfile('donor', donor.id, donor.fullName)}
                        />
                      </div>
                    )}

                    {serviceRows.map((listing) => {
                      const status = listing.status ?? 'draft';
                      const profileImage = listing.imageUrl || listing.logoUrl;
                      const categoryLabel = COACHING_CATEGORIES.find(
                        (item) => item.id === listing.coachingCategory
                      )?.labelBn;
                      const price = listing.category === 'wifi'
                        ? bnTakaRange(listing.priceMin, listing.priceMax)
                        : bnTakaRange(listing.monthlyFeeMin, listing.monthlyFeeMax);
                      return (
                        <div key={listing.id} className="mt-3 rounded-lg border border-ink-900/[0.06] bg-mist-50/50 p-3">
                          <div className="flex items-center gap-3">
                            <div
                              role={profileImage ? 'img' : undefined}
                              aria-label={profileImage ? listing.titleBn : undefined}
                              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-ink-900/[0.06] bg-white bg-cover bg-center text-ink-500"
                              style={profileImage ? { backgroundImage: `url(${JSON.stringify(profileImage)})` } : undefined}
                            >
                              {!profileImage && <Icon className="h-5 w-5" aria-hidden="true" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="break-words text-[13px] font-bold text-ink-900">{listing.titleBn}</p>
                              <p className="mt-0.5 text-[11.5px] text-ink-500">
                                {listing.category === 'coaching' ? categoryLabel || 'কোচিং সেন্টার' : 'ইন্টারনেট সেবা'}
                                {price ? ` · ${price}${listing.category === 'coaching' ? '/মাস' : ''}` : ''}
                              </p>
                            </div>
                            <StatusBadge label={SERVICE_LISTING_STATUS_META[status].labelBn} tone={statusTone(status)} />
                          </div>
                          {listing.subtitleBn && (
                            <p className="mt-2 text-[11.5px] leading-relaxed text-ink-600">{listing.subtitleBn}</p>
                          )}
                          <p className="mt-2 text-[11.5px] leading-relaxed text-ink-600">
                            এলাকা: {areaNames(listing.areaIds) || 'উল্লেখ নেই'}
                          </p>
                          {listing.addressBn && (
                            <p className="mt-1 text-[11.5px] leading-relaxed text-ink-600">ঠিকানা: {listing.addressBn}</p>
                          )}
                          {listing.contactPhonePublic && (
                            <p className="mt-1 text-[11.5px] text-ink-600">যোগাযোগ: {listing.contactPhonePublic}</p>
                          )}
                          {listing.tags.length > 0 && (
                            <p className="mt-1 text-[11.5px] leading-relaxed text-ink-600">
                              {listing.category === 'coaching' ? 'বিষয় / ক্লাস' : 'সুবিধা'}: {tagLabels(listing.tags).join(' · ')}
                            </p>
                          )}
                          {listing.admissionInfoBn && (
                            <p className="mt-1 text-[11.5px] leading-relaxed text-ink-600">ভর্তি তথ্য: {listing.admissionInfoBn}</p>
                          )}
                          {listing.descriptionBn && (
                            <p className="mt-1 line-clamp-3 text-[11.5px] leading-relaxed text-ink-600">{listing.descriptionBn}</p>
                          )}
                          <ProfileActionLinks
                            editHref={`/dashboard/${listing.category}/${listing.id}/edit`}
                            deleting={deletingId === listing.id}
                            onDelete={() => void removeProfile(card.key, listing.id, listing.titleBn)}
                          />
                        </div>
                      );
                    })}

                    {!hasProfile && (card.key === 'tutor' || card.key === 'donor' || !error) && (
                      <Link
                        href={card.href}
                        className={cn(
                          'group flex min-h-[72px] items-center gap-3 rounded-2xl border border-brand-100 bg-white p-3.5 text-left transition-colors hover:border-brand-300',
                          LIGHT_FOCUS
                        )}
                      >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[14px] font-extrabold text-ink-900">{card.title}</span>
                          <span className="mt-0.5 block truncate text-[11.5px] text-ink-500">{card.description}</span>
                        </span>
                        <Plus className="h-4 w-4 shrink-0 text-brand-700" aria-hidden="true" />
                      </Link>
                    )}
                    {!hasProfile && error && (card.key === 'wifi' || card.key === 'coaching') && (
                      <p role="status" className="mt-3 text-[11.5px] text-amber-800">
                        আগে প্রোফাইলের অবস্থা লোড করুন; এরপর নতুন অ্যাকাউন্ট খোলা যাবে।
                      </p>
                    )}
                  </article>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <ApprovalExplainer />

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-ink-900/[0.06] pt-4 text-[12px] text-ink-500">
        <span>চাকরি ও কেনাবেচার পোস্ট আলাদা পেজে তৈরি হয়।</span>
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

function ProfileActionLinks({
  editHref,
  deleting,
  onDelete,
}: {
  editHref: string;
  deleting: boolean;
  onDelete: () => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2 border-t border-ink-900/[0.06] pt-3">
      <Link
        href={editHref}
        className={cn(SECONDARY_BUTTON, 'min-h-9 px-3 text-[11.5px]', LIGHT_FOCUS)}
      >
        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
        সম্পাদনা
      </Link>
      <button
        type="button"
        disabled={deleting}
        onClick={onDelete}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-rose-200 px-3 text-[11.5px] font-semibold text-rose-700 transition-colors hover:bg-rose-50 disabled:cursor-wait disabled:opacity-60"
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        {deleting ? 'মুছে ফেলা হচ্ছে…' : 'মুছুন'}
      </button>
    </div>
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
