import { toletToPreviewCard, staffToPreviewCard, tutorToPreviewCard, donorToPreviewCard } from '@/lib/home-preview';
import type { HomePreviewCard } from '@/lib/home-preview';
import { fetchPublicListings } from '@/lib/tolet-service';
import { fetchPublicStaffProfiles } from '@/lib/staff-service';
import { fetchPublishedTutors } from '@/lib/home-tutor-service';
import { fetchPublishedDonors } from '@/lib/blood-donor-service';
import type { StaffServiceKey } from '@/lib/staff-types';

export const loadToletCards = (): Promise<HomePreviewCard[]> =>
  fetchPublicListings().then((listings) => listings.map(toletToPreviewCard));

export function makeLoadStaffCards(slug: StaffServiceKey): () => Promise<HomePreviewCard[]> {
  return () =>
    fetchPublicStaffProfiles(slug).then((profiles) => profiles.map(staffToPreviewCard));
}

export const loadElectricianCards = makeLoadStaffCards('electrician');
export const loadPlumberCards = makeLoadStaffCards('plumber');
export const loadMaidCards = makeLoadStaffCards('kajer-bua');

/** Electrician + Plumber শো-কেস মিশ্রণ — হোমে এক কার্ড হিসেবে দেখানো হয়। */
export const loadRepairCards = (): Promise<HomePreviewCard[]> =>
  Promise.all([loadElectricianCards(), loadPlumberCards()]).then(([e, p]) => [...e, ...p]);

export const loadTutorCards = (): Promise<HomePreviewCard[]> =>
  fetchPublishedTutors().then((tutors) => tutors.map(tutorToPreviewCard));

export const loadDonorCards = (): Promise<HomePreviewCard[]> =>
  fetchPublishedDonors().then((donors) => donors.map(donorToPreviewCard));