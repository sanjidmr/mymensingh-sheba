/**
 * Blood Donor (রক্তদাতা) demo / showcase profiles.
 *
 * Purpose
 * -------
 * The donor card is the whole feature — there is no detail page by design (see
 * `app/blood-donor/[id]/page.tsx`) — so it is the card grid that has to look
 * credible on a fresh checkout. This module seeds six donors spread across the
 * blood groups a Mymensingh emergency actually needs and across both recovery
 * states, so the "এখন দান করতে পারবেন" / "বিরতিতে" split can be reviewed:
 *
 *   | # | id              | group | area              | last donation | state    |
 *   |---|-----------------|-------|-------------------|---------------|----------|
 *   | 1 | demo-donor-01   | O+    | কাঁচিঝুলি          | ১০২ দিন আগে    | দানে প্রস্তুত |
 *   | 2 | demo-donor-02   | A+    | টাউন হল            | ৪৮ দিন আগে    | দানে প্রস্তুত |
 *   | 3 | demo-donor-03   | B+    | চরপাড়া             | ৯৫ দিন আগে    | দানে প্রস্তুত |
 *   | 4 | demo-donor-04   | O-    | শাম্বুগঞ্জ          | ৩৭ দিন আগে    | বিরতিতে      |
 *   | 5 | demo-donor-05   | AB+   | গাঙ্গিনারপাড়       | ১৩৫ দিন আগে   | দানে প্রস্তুত |
 *   | 6 | demo-donor-06   | A-    | নতুন বাজার         | ৭৮ দিন আগে    | দানে প্রস্তুত |
 *
 * The four-month gap between donor 4's last donation and donor 5's is the point.
 * A card that shows everyone as available is a card that gets a volunteer
 * turned away at the blood bank, so the recovery state is real data on half
 * the rows rather than decoration.
 *
 * SAFETY CONTRACT — read before changing anything here
 * ---------------------------------------------------
 * **There is no phone number in this file, and there must never be one.**
 *
 * `app/safety/page.tsx` and `app/help/page.tsx` both promise a reader that a
 * donor's number is not published, because it is not: `blood_donor_profiles.
 * private_phone` is admin-only at the RLS layer, it is absent from
 * `PUBLIC_DONOR_COLUMNS`, and a number reaches a patient only after an admin
 * has checked the prescription slip and released contact for that specific
 * request (`blood_contact_releases`). Putting a number on a card would break
 * that promise, expose a real volunteer to unsolicited calls, and undo a
 * deliberate safety control — so the demo data models what is actually stored.
 *
 * `privatePhone` below is the same `__protected__` sentinel the public mapper
 * writes. `isVerified` is `false` on every row, because a badge demo content
 * did not earn is worse than no badge.
 *
 * When does this data appear?
 * ---------------------------
 * `lib/blood-donor-service.ts` falls back to it only while the live directory
 * has no approved donors, and deep links to these ids resolve in every mode.
 */

import type { BloodDonorProfile } from './supabase/types';

/** Unsplash is allow-listed in `next.config.ts`. */
function U(id: string) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=640&q=80`;
}

const PORTRAIT = {
  manOne: U('photo-1494790108377-be9c29b29330'),
  womanOne: U('photo-1438761681033-6461ffad8d80'),
  manTwo: U('photo-1500648767791-00dcc994a43e'),
  womanTwo: U('photo-1544005313-94ddf0286df2'),
  manThree: U('photo-1531123897727-8f129e1688ce'),
  womanThree: U('photo-1534528741775-53994a69daeb'),
} as const;

export type DonorDemoProfile = BloodDonorProfile & { isDemo: true };

const PROTECTED = '__protected__';

interface DonorSeed {
  id: string;
  fullName: string;
  gender: 'male' | 'female';
  bloodGroup: BloodDonorProfile['bloodGroup'];
  areaId: string;
  birthYear: number;
  weightKg: number;
  isAvailable: boolean;
  lastDonationDate: string;
  donationCount: number;
  intro: string;
  photo: string;
}

const SEEDS: DonorSeed[] = [
  {
    id: 'demo-donor-01',
    fullName: 'জামাল নবী',
    gender: 'male',
    bloodGroup: 'O+',
    areaId: 'kachijhuli',
    birthYear: 1996,
    weightKg: 72,
    isAvailable: true,
    lastDonationDate: '2026-06-12',
    donationCount: 7,
    intro: 'নিয়মিত রক্তদাতা। হাসপাতালে গিয়ে দেওয়ার অভ্যাস আছে।',
    photo: PORTRAIT.manOne,
  },
  {
    id: 'demo-donor-02',
    fullName: 'সালমা বেগম',
    gender: 'female',
    bloodGroup: 'A+',
    areaId: 'town-hall',
    birthYear: 1993,
    weightKg: 58,
    isAvailable: true,
    lastDonationDate: '2026-08-13',
    donationCount: 11,
    intro: 'ছয় বছর ধরে দিচ্ছি। সন্ধ্যায় হাসপাতালে যেতে পারি।',
    photo: PORTRAIT.womanOne,
  },
  {
    id: 'demo-donor-03',
    fullName: 'রফিকুল করিম',
    gender: 'male',
    bloodGroup: 'B+',
    areaId: 'charpara',
    birthYear: 1989,
    weightKg: 78,
    isAvailable: true,
    lastDonationDate: '2026-06-25',
    donationCount: 14,
    intro: 'মেডিকেল এলাকায় থাকি, জরুরি প্রয়োজনে দ্রুত যেতে পারি।',
    photo: PORTRAIT.manTwo,
  },
  {
    id: 'demo-donor-04',
    fullName: 'নুসরাত হাসান',
    gender: 'female',
    bloodGroup: 'O-',
    areaId: 'shambhuganj',
    birthYear: 1990,
    weightKg: 61,
    // Recovering: donated inside the four-month window, so NOT available.
    isAvailable: false,
    lastDonationDate: '2026-09-08',
    donationCount: 9,
    intro: 'সাম্প্রতিক অস্ত্রোপচার করেছি। পরের সার্জারির পর আবার যোগাযোগ করলেই হবে।',
    photo: PORTRAIT.womanTwo,
  },
  {
    id: 'demo-donor-05',
    fullName: 'তারেক হোসেন',
    gender: 'male',
    bloodGroup: 'AB+',
    areaId: 'ganginarpar',
    birthYear: 1985,
    weightKg: 80,
    isAvailable: true,
    lastDonationDate: '2026-04-20',
    donationCount: 21,
    intro: 'শুধু রক্তদান নয়, মাঝে মাঝে প্লাজমাও দিয়েছি।',
    photo: PORTRAIT.manThree,
  },
  {
    id: 'demo-donor-06',
    fullName: 'ফারজানা খাতুন',
    gender: 'female',
    bloodGroup: 'A-',
    areaId: 'natun-bazar',
    birthYear: 1998,
    weightKg: 55,
    isAvailable: true,
    lastDonationDate: '2026-07-01',
    donationCount: 4,
    intro: 'প্রথমবার দিয়েছিলাম ২০২৩ সালে। এখন নিয়মিত দিই।',
    photo: PORTRAIT.womanThree,
  },
];

/** Staggered so "সর্বশেষ দান" ordering is meaningful rather than uniform. */
const PUBLISHED = [
  '2026-09-26T10:00:00Z',
  '2026-09-20T12:30:00Z',
  '2026-09-15T09:45:00Z',
  '2026-09-11T15:10:00Z',
  '2026-09-05T11:20:00Z',
  '2026-08-30T08:55:00Z',
] as const;

export const DEMO_DONOR_PROFILES: DonorDemoProfile[] = SEEDS.map((seed, index) => ({
  id: seed.id,
  userId: `demo-user-${seed.id}`,
  status: 'approved',
  fullName: seed.fullName,
  bloodGroup: seed.bloodGroup,
  areaId: seed.areaId,
  gender: seed.gender,
  birthYear: seed.birthYear,
  weightKg: seed.weightKg,
  isAvailable: seed.isAvailable,
  lastDonationDate: seed.lastDonationDate,
  donationCount: seed.donationCount,
  // SAFETY: see the contract at the top of this file.
  privatePhone: PROTECTED,
  isVerified: false,
  intro: seed.intro,
  profilePhotoUrl: seed.photo,
  adminNotes: undefined,
  rejectionReason: undefined,
  publishedAt: PUBLISHED[index],
  createdAt: PUBLISHED[index],
  updatedAt: PUBLISHED[index],
  isDemo: true,
}));

export function getDemoDonor(id: string): DonorDemoProfile | null {
  return DEMO_DONOR_PROFILES.find((donor) => donor.id === id) ?? null;
}
