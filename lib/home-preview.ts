import type { ToletListing } from '@/lib/tolet-types';
import type { StaffProfile } from '@/lib/staff-types';
import type { HomeTutorProfile, BloodDonorProfile } from '@/lib/supabase/types';
import type { ServiceListing, CommunityPost } from '@/lib/catalog-types';
import {
  STAFF_SERVICE_UI,
  STAFF_AVAILABILITY_LABELS,
  formatExperienceBn,
  formatSalaryBn,
} from '@/lib/staff-types';
import { TUTOR_AVAILABILITY_LABELS, formatTutorFee } from '@/lib/home-tutor-types';
import { DONOR_AVAILABILITY_LABELS, formatLastDonation } from '@/lib/blood-donor-types';
import { getAreaById } from '@/lib/locations';
import { resolveStaffImageUrl } from '@/lib/staff-service';
import { resolveListingPhotoUrl } from '@/lib/tolet-service';
import { resolveTutorPhotoUrl } from '@/lib/home-tutor-service';
import { resolveDonorPhotoUrl } from '@/lib/blood-donor-service';
import { staffWorkTypeLabels } from '@/lib/staff-labels';
import { TOLET_PROPERTY_TYPE_INFO } from '@/lib/tolet-types';

export interface HomePreviewCard {
  id: string;
  href: string;
  imageUrl?: string;
  avatarLabel: string;
  avatarTone?: 'green' | 'rose';
  title: string;
  subtitle?: string;
  location?: string;
  rating?: number;
  ratingCount?: number;
  metaChips: string[];
  availability?: {
    label: string;
    tone: 'green' | 'amber' | 'slate';
  };
  verified?: boolean;
  footer?: string;
  footerLabel?: string;
}

const STAFF_AVAILABILITY_TONE: Record<string, 'green' | 'amber' | 'slate'> = {
  available: 'green',
  limited: 'amber',
  busy: 'slate',
};

const TUTOR_AVAILABILITY_TONE: Record<string, 'green' | 'amber' | 'slate'> = {
  available: 'green',
  limited: 'amber',
  busy: 'slate',
};

export function toletToPreviewCard(listing: ToletListing): HomePreviewCard {
  const area = getAreaById(listing.areaId);
  const typeInfo = TOLET_PROPERTY_TYPE_INFO[listing.propertyType] || {
    labelBn: 'বাসা',
    shortLabelBn: 'বাসা',
  };
  return {
    id: listing.id,
    href: `/tolet/${listing.id}`,
    imageUrl: listing.photos?.[0]
      ? resolveListingPhotoUrl(listing.photos[0])
      : undefined,
    avatarLabel: listing.title.charAt(0) || 'বাসা',
    avatarTone: 'green',
    title: listing.title,
    subtitle: `${typeInfo.labelBn} • ময়মনসিংহ সিটি কর্পোরেশন`,
    location: area?.nameBn || 'ময়মনসিংহ',
    metaChips: [
      `৳${listing.rentPrice.toLocaleString('bn-BD')}/মাস`,
      `${listing.bedrooms} বেড`,
      `${listing.bathrooms} বাথ`,
    ],
    availability:
      listing.status === 'approved'
        ? { label: 'সরাসরি মালিকের সাথে যোগাযোগ', tone: 'green' }
        : { label: 'অনুপলব্ধ', tone: 'slate' },
    verified: listing.isVerified || listing.ownerVerified,
    footer: listing.ownerName,
    footerLabel: 'বিস্তারিত দেখুন',
  };
}

export function staffToPreviewCard(profile: StaffProfile): HomePreviewCard {
  const ui = STAFF_SERVICE_UI[profile.serviceSlug];
  const labels = staffWorkTypeLabels(profile.serviceSlug, profile.workTypes);
  const areas = profile.areaIds
    .map((id) => getAreaById(id)?.nameBn)
    .filter((n): n is string => Boolean(n));
  const rate =
    ui.usesSalary && (profile.salaryMin != null || profile.salaryMax != null)
      ? formatSalaryBn(profile.salaryMin, profile.salaryMax)
      : profile.rateLabel;
  const workHeadline = labels.slice(0, 3).join(' · ');
  return {
    id: profile.id,
    href: `${ui.route}/${profile.id}`,
    imageUrl: profile.imageUrl
      ? resolveStaffImageUrl(profile.imageUrl)
      : undefined,
    avatarLabel: profile.nameBn.charAt(0) || '?',
    avatarTone: 'green',
    title: profile.nameBn,
    subtitle: workHeadline || profile.titleBn,
    location: areas.length ? areas.slice(0, 2).join(', ') : 'ময়মনসিংহ সিটি কর্পোরেশন',
    metaChips: [formatExperienceBn(profile.experienceYears)],
    availability: {
      label: STAFF_AVAILABILITY_LABELS[profile.availability] || 'সীমিত সময়ে',
      tone: STAFF_AVAILABILITY_TONE[profile.availability] || 'slate',
    },
    verified: profile.isVerified,
    footer: rate,
    footerLabel: 'বিস্তারিত দেখুন',
  };
}

export function tutorToPreviewCard(tutor: HomeTutorProfile): HomePreviewCard {
  const areas = (tutor.preferredAreas || [])
    .map((id) => getAreaById(id)?.nameBn)
    .filter((n): n is string => Boolean(n));
  const subjectHeadline = (tutor.preferredSubjects || []).slice(0, 2).join(', ');
  return {
    id: tutor.id,
    href: `/home-tutor/${tutor.id}`,
    imageUrl: tutor.profilePhotoUrl
      ? resolveTutorPhotoUrl(tutor.profilePhotoUrl)
      : undefined,
    avatarLabel: tutor.fullName.charAt(0) || '?',
    avatarTone: 'green',
    title: tutor.fullName,
    subtitle: subjectHeadline || tutor.department || tutor.institution,
    location: areas.length ? areas.slice(0, 2).join(', ') : 'ময়মনসিংহ সিটি কর্পোরেশন',
    rating: tutor.ratingAvg && tutor.ratingCount ? tutor.ratingAvg : undefined,
    ratingCount: tutor.ratingCount,
    metaChips: [
      formatExperienceBn(tutor.experienceYears),
      tutor.institution ? tutor.institution.split(',')[0] : '',
    ].filter(Boolean),
    availability: {
      label: TUTOR_AVAILABILITY_LABELS[tutor.availability]?.labelBn || 'প্রস্তুত',
      tone: TUTOR_AVAILABILITY_TONE[tutor.availability] || 'slate',
    },
    verified: tutor.isVerified,
    footer: formatTutorFee(tutor.expectedSalaryMin, tutor.expectedSalaryMax),
    footerLabel: 'বিস্তারিত দেখুন',
  };
}

export function donorToPreviewCard(donor: BloodDonorProfile): HomePreviewCard {
  const area = getAreaById(donor.areaId);
  return {
    id: donor.id,
    href: `/blood-donor/${donor.id}`,
    imageUrl: donor.profilePhotoUrl
      ? resolveDonorPhotoUrl(donor.profilePhotoUrl)
      : undefined,
    avatarLabel: donor.fullName.charAt(0) || '?',
    avatarTone: 'rose',
    title: donor.fullName,
    subtitle: `${donor.bloodGroup} রক্তের গ্রুপ`,
    location: area?.nameBn || 'ময়মনসিংহ সিটি কর্পোরেশন',
    metaChips: [
      `${donor.donationCount} বার রক্তদান`,
      formatLastDonation(donor.lastDonationDate),
    ],
    availability: {
      label: DONOR_AVAILABILITY_LABELS[
        donor.isAvailable ? 'available' : 'unavailable'
      ].labelBn,
      tone: donor.isAvailable ? 'green' : 'slate',
    },
    verified: donor.isVerified,
    footer: 'রক্তদানে প্রস্তুত',
    footerLabel: 'বিস্তারিত দেখুন',
  };
}

/** Formats a numeric salary range the way it appears on a job post. */
function formatPostSalaryBn(min: number | undefined, max: number | undefined): string | undefined {
  if (min != null && max != null && max > min) {
    return `৳${min.toLocaleString('bn-BD')}-${max.toLocaleString('bn-BD')}`;
  }
  if (min != null) return `৳${min.toLocaleString('bn-BD')}+`;
  if (max != null) return `৳${max.toLocaleString('bn-BD')} পর্যন্ত`;
  return undefined;
}

export function vehicleToPreviewCard(listing: ServiceListing): HomePreviewCard {
  const areas = listing.areaIds
    .map((id) => getAreaById(id)?.nameBn)
    .filter((n): n is string => Boolean(n));
  const chips = [
    listing.modelYear ? `${listing.modelYear} মডেল` : '',
    listing.hasAc ? 'এসি' : '',
    listing.driverIncluded ? 'ড্রাইভারসহ' : '',
  ].filter(Boolean);
  const price =
    listing.priceNoteBn ||
    (listing.priceMin != null && listing.priceMax != null
      ? `৳${listing.priceMin.toLocaleString('bn-BD')}-${listing.priceMax.toLocaleString('bn-BD')}`
      : listing.priceMin != null
        ? `৳${listing.priceMin.toLocaleString('bn-BD')}`
        : undefined);
  return {
    id: listing.id,
    href: `/gari-auto-cng/${listing.slug}`,
    imageUrl: listing.photos?.[0] ?? listing.imageUrl,
    avatarLabel: listing.titleBn.charAt(0) || '?',
    avatarTone: 'green',
    title: listing.titleBn,
    subtitle: listing.subtitleBn || listing.modelNameBn,
    location: areas.length ? areas.slice(0, 2).join(', ') : 'ময়মনসিংহ সিটি কর্পোরেশন',
    metaChips: chips,
    availability: listing.isActive
      ? { label: 'চলমান', tone: 'green' }
      : { label: 'অনুপলব্ধ', tone: 'slate' },
    footer: price || 'সরাসরি যোগাযোগ',
    footerLabel: 'বিস্তারিত দেখুন',
  };
}

export function postToPreviewCard(post: CommunityPost): HomePreviewCard {
  const area = post.areaId ? getAreaById(post.areaId) : undefined;
  const href =
    post.kind === 'buy_sell'
      ? `/buy-sell/${post.slug}`
      : post.kind === 'job'
        ? `/jobs/${post.slug}`
        : `/news/${post.slug}`;
  const price =
    post.kind === 'buy_sell' && post.price != null
      ? `৳${post.price.toLocaleString('bn-BD')}`
      : undefined;
  const chips =
    post.kind === 'buy_sell'
      ? price
        ? [price]
        : (post.tags || []).slice(0, 2)
      : post.kind === 'job'
        ? [
            formatPostSalaryBn(post.salaryMin, post.salaryMax) || '',
            post.jobType || '',
          ].filter(Boolean)
        : (post.tags || []).slice(0, 2);
  return {
    id: post.id,
    href,
    imageUrl: post.coverImageUrl,
    avatarLabel: post.titleBn.charAt(0) || '?',
    avatarTone: 'green',
    title: post.titleBn,
    subtitle: post.summaryBn,
    location: area?.nameBn || 'ময়মনসিংহ সিটি কর্পোরেশন',
    metaChips: chips,
    verified: post.isFeatured,
    footer:
      post.kind === 'buy_sell'
        ? price || 'সরাসরি যোগাযোগ'
        : post.kind === 'job'
          ? post.organizationBn || 'পূর্ণ বিজ্ঞাপন দেখুন'
          : 'পূর্ণ খবর পড়ুন',
    footerLabel: 'বিস্তারিত দেখুন',
  };
}
