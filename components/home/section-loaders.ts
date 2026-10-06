import { toletToPreviewCard, staffToPreviewCard, tutorToPreviewCard, donorToPreviewCard, vehicleToPreviewCard, postToPreviewCard } from '@/lib/home-preview';
import type { HomePreviewCard } from '@/lib/home-preview';
import { fetchPublicListings } from '@/lib/tolet-service';
import { fetchPublicStaffProfiles } from '@/lib/staff-service';
import { fetchPublishedTutors } from '@/lib/home-tutor-service';
import { fetchPublishedDonors } from '@/lib/blood-donor-service';
import { fetchServiceListings, fetchApprovedPosts } from '@/lib/catalog-service';
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

/** গাড়ি / অটো / CNG ভাড়া — admin-curated service_listings. */
export const loadVehicleCards = (): Promise<HomePreviewCard[]> =>
  fetchServiceListings('vehicle').then((listings) => listings.map(vehicleToPreviewCard));

/** কেনাবেচা — approved marketplace posts. */
export const loadMarketCards = (): Promise<HomePreviewCard[]> =>
  fetchApprovedPosts('buy_sell').then((posts) => posts.map(postToPreviewCard));

/** স্থানীয় খবর — approved news posts (empty until the first real post). */
export const loadNewsCards = (): Promise<HomePreviewCard[]> =>
  fetchApprovedPosts('news').then((posts) => posts.map(postToPreviewCard));