/**
 * In-memory mock store for the Home Tutor (গৃহশিক্ষক) module.
 * Used ONLY when Supabase is not configured (preview mode).
 *
 * Integrity rules (mirrored from the DB layer):
 *  - Only status 'approved' profiles are ever published in the public directory.
 *  - private_phone / nid_number never leave the admin facade.
 *  - Reviews exist ONLY when tied to a completed 'home-tutor' request —
 *    no fake ratings. Cards show a rating badge only when ratingCount > 0.
 */
import {
  TUTOR_TEACHING_MODE_LABELS,
  TUTOR_STATUS_META,
} from './home-tutor-types';
import type { HomeTutorProfile, TutorReview, TutorProfileStatus } from '@/lib/supabase/types';
import type { ServiceRequestStatus } from '@/lib/supabase/types';

const NOW = '2026-09-22T00:00:00Z';

export interface MockTutorRequest {
  id: string;
  customerId: string;
  serviceSlug: 'home-tutor';
  status: ServiceRequestStatus;
  areaId: string;
  addressLine: string;
  contactName: string;
  contactPhone: string;
  preferredTime: string;
  details: string;
  serviceType: string;
  profileId: string;
  profileTitle: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Seeds: only REAL approved tutors can be published. private_phone starts as
// '__protected__' and real values live only in an admin-side map.
// ---------------------------------------------------------------------------
const SEED_PHONES: Record<string, string> = {
  'tut-001': '01710-111111',
  'tut-002': '01810-222222',
  'tut-003': '01910-333333',
  'tut-004': '01610-444444',
  'tut-005': '01510-555555',
};

const SEED_TUTORS: HomeTutorProfile[] = [
  {
    id: 'tut-001',
    userId: 'demo-user',
    status: 'approved',
    fullName: 'তানজিম আহমেদ',
    gender: 'male',
    institution: 'আনন্দ মোহন কলেজ, ময়মনসিংহ',
    department: 'গণিত বিভাগ',
    qualification: 'B.Sc (অনার্স) ৪র্থ বর্ষ, গণিত',
    experienceYears: 4,
    preferredAreas: ['charpara', 'akua', 'natun-bazar'],
    preferredClasses: ['৯ম - ১০ম শ্রেণি (SSC)', 'একাদশ - দ্বাদশ শ্রেণি (HSC)'],
    preferredSubjects: ['উচ্চতর গণিত', 'সাধারণ গণিত'],
    expectedSalaryMin: 4000,
    expectedSalaryMax: 7000,
    daysPerWeek: 4,
    bio: 'এসএসসি ও এইচএসসির গণিত ছাত্রদের ৪ বছরের অভিজ্ঞতা। বোর্ড প্রশ্নভিত্তিক প্রস্তুতি, দুর্বল শিক্ষার্থীদের জন্য ধাপে ধাপে সহজ ব্যাখ্যা।',
    isVerified: true,
    privatePhone: SEED_PHONES['tut-001'],
    teachingMode: 'both',
    availability: 'available',
    publishedAt: '2026-08-01T00:00:00Z',
    ratingAvg: 4.5,
    ratingCount: 2,
    createdAt: '2026-07-20T00:00:00Z',
    updatedAt: NOW,
  },
  {
    id: 'tut-002',
    userId: 'demo-user',
    status: 'approved',
    fullName: 'নুসরাত জাহান মিম',
    gender: 'female',
    institution: 'মুমিনুন্নিসা সরকারি মহিলা কলেজ',
    department: 'ইংরেজি বিভাগ',
    qualification: 'B.A Honours (৪র্থ বর্ষ), ইংরেজি',
    experienceYears: 3,
    preferredAreas: ['ganginarpar', 'kachijhuli'],
    preferredClasses: ['৬ষ্ঠ - ৮ম শ্রেণি', '৯ম - ১০ম শ্রেণি (SSC)'],
    preferredSubjects: ['ইংরেজি', 'বাংলা'],
    expectedSalaryMin: 3000,
    expectedSalaryMax: 6000,
    daysPerWeek: 3,
    bio: 'স্কুল ও কলেজ স্তরের ইংরেজি ও বাংলা। স্পোকেন ইংরেজির জন্য বিশেষ কোর্স; মেয়েদের জন্য নিরাপদ পরিবেশের ব্যবস্থা।',
    isVerified: true,
    privatePhone: SEED_PHONES['tut-002'],
    teachingMode: 'home',
    availability: 'available',
    publishedAt: '2026-08-05T00:00:00Z',
    ratingAvg: 0,
    ratingCount: 0,
    createdAt: '2026-07-25T00:00:00Z',
    updatedAt: NOW,
  },
  {
    id: 'tut-003',
    userId: 'demo-user',
    status: 'approved',
    fullName: 'রাকিব হাসান',
    gender: 'male',
    institution: 'বাংলাদেশ কৃষি বিশ্ববিদ্যালয় (বাকৃবি)',
    department: 'এগ্রিকালচারাল ইকোনমিক্স',
    qualification: 'এমএস / মাস্টার্স (চলমান)',
    experienceYears: 2,
    preferredAreas: ['sankipara', 'charpara', 'sahebrampur'],
    preferredClasses: ['১ম - ৫ম শ্রেণি', '৬ষ্ঠ - ৮ম শ্রেণি'],
    preferredSubjects: ['সকল বিষয় (প্রাথমিক/জুনিয়র)'],
    expectedSalaryMin: 2500,
    expectedSalaryMax: 5000,
    daysPerWeek: 3,
    bio: 'প্রাইমারি ও জুনিয়র স্তরের সকল বিষয়। পড়া থেকে শুরু করে বাড়ির কাজ ও পরীক্ষার প্রস্তুতি — যত্নের সাথে।',
    isVerified: false,
    privatePhone: SEED_PHONES['tut-003'],
    teachingMode: 'both',
    availability: 'limited',
    ratingAvg: 0,
    ratingCount: 0,
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: NOW,
  },
  {
    id: 'tut-004',
    userId: 'demo-user',
    status: 'approved',
    fullName: 'সুমাইয়া আক্তার',
    gender: 'female',
    institution: 'ময়মনসিংহ মেডিকেল কলেজ',
    department: 'চিকিৎসা শাস্ত্র (মেডিকেল)',
    qualification: 'MBBS ২য় বর্ষ',
    experienceYears: 1,
    preferredAreas: ['akua', 'ganginarpar'],
    preferredClasses: ['৯ম - ১০ম শ্রেণি (SSC)', 'একাদশ - দ্বাদশ শ্রেণি (HSC)', 'ভর্তি পরীক্ষা / এডমিশন'],
    preferredSubjects: ['জীববিজ্ঞান', 'পদার্থবিজ্ঞান', 'রসায়ন'],
    expectedSalaryMin: 5000,
    expectedSalaryMax: 9000,
    daysPerWeek: 3,
    bio: 'মেডিকেল ভর্তি পরীক্ষার প্রস্তুতিতে ১ বছরের অভিজ্ঞতা। জীববিজ্ঞান ও রসায়নে দুর্বল শিক্ষার্থীদের জন্য বিশেষ সহায়তা।',
    isVerified: true,
    privatePhone: SEED_PHONES['tut-004'],
    teachingMode: 'online',
    availability: 'limited',
    publishedAt: '2026-09-10T00:00:00Z',
    ratingAvg: 0,
    ratingCount: 0,
    createdAt: '2026-09-05T00:00:00Z',
    updatedAt: NOW,
  },
  {
    id: 'tut-005',
    userId: 'demo-user',
    status: 'pending_approval',
    fullName: 'মাহফুজুর রহমান',
    gender: 'male',
    institution: 'নাসিরাবাদ কলেজ, ময়মনসিংহ',
    department: 'পদার্থবিজ্ঞান',
    qualification: 'B.Sc Honours ৩য় বর্ষ',
    experienceYears: 2,
    preferredAreas: ['cantonment', 'kachijhuli'],
    preferredClasses: ['একাদশ - দ্বাদশ শ্রেণি (HSC)'],
    preferredSubjects: ['পদার্থবিজ্ঞান'],
    expectedSalaryMin: 3500,
    expectedSalaryMax: 6000,
    daysPerWeek: 3,
    bio: 'একাদশ-দ্বাদশের পদার্থবিজ্ঞানে ধারণা-ভিত্তিক শিক্ষা।',
    isVerified: false,
    privatePhone: SEED_PHONES['tut-005'],
    teachingMode: 'both',
    availability: 'available',
    adminNotes: 'আইডি কার্ডের ছবি এখনো দেওয়া হয়নি — যোগাযোগের অপেক্ষায়।',
    createdAt: '2026-09-18T00:00:00Z',
    updatedAt: '2026-09-18T00:00:00Z',
  },
  {
    id: 'tut-006',
    userId: 'demo-user',
    status: 'rejected',
    fullName: 'পৃথ্বীরাজ দেবনাথ',
    gender: 'male',
    institution: 'রাজেন্দ্র কলেজ, ফরিদপুর',
    department: 'ইতিহাস',
    qualification: 'HSC পরীক্ষার্থী',
    experienceYears: 0,
    preferredAreas: ['natun-bazar'],
    preferredClasses: ['১ম - ৫ম শ্রেণি'],
    preferredSubjects: ['বাংলা'],
    expectedSalaryMin: 1500,
    expectedSalaryMax: 3000,
    daysPerWeek: 2,
    bio: 'নতুন শিক্ষক।',
    isVerified: false,
    privatePhone: '01999-000000',
    teachingMode: 'both',
    availability: 'available',
    rejectionReason: 'শিক্ষাগত যোগ্যতা ও অভিজ্ঞতার বিবরণ অসম্পূর্ণ। প্রতিষ্ঠানের বাইরে থেকে তালিকাভুক্তি বর্তমানে না থাকায় পুনরায় আবেদনের অনুরোধ করা হয়েছে।',
    createdAt: '2026-08-20T00:00:00Z',
    updatedAt: '2026-08-25T00:00:00Z',
  },
];

// Reviews ONLY tied to completed tutor requests (integrity: no fake ratings).
const SEED_REVIEWS: TutorReview[] = [
  {
    id: 'rev-001',
    tutorId: 'tut-001',
    customerId: 'demo-user',
    requestId: 'req-hm-done-1',
    rating: 5,
    comment: 'শিক্ষার্থীকে খুব ধৈর্য ধরে উচ্চতর গণিতের জটিল টপিকগুলো বুঝিয়ে দিয়েছেন। ফলাফলে স্পষ্ট উন্নতি দেখা গেছে।',
    isPublished: true,
    createdAt: '2026-09-10T10:00:00Z',
    customerName: 'নাজমা আক্তার',
  },
  {
    id: 'rev-002',
    tutorId: 'tut-001',
    customerId: 'demo-user',
    requestId: 'req-hm-done-2',
    rating: 4,
    comment: 'সময়নিষ্ঠা ভালো। বোর্ড প্রশ্ন অনুযায়ী প্রস্তুতি নেওয়ায় সন্তান আত্মবিশ্বাসী হয়েছে।',
    isPublished: true,
    createdAt: '2026-09-14T09:00:00Z',
    customerName: 'সোহেল রানা',
  },
];

const SEED_TUTOR_REQUESTS: MockTutorRequest[] = [
  {
    id: 'req-hm-done-1',
    customerId: 'demo-user',
    serviceSlug: 'home-tutor',
    status: 'completed',
    areaId: 'charpara',
    addressLine: 'চরপাড়া, কলেজ রোড, বাসা ১২',
    contactName: 'নাজমা আক্তার',
    contactPhone: '01712-345678',
    preferredTime: 'বিকেল (৩টা – ৬টা)',
    details: 'শ্রেণি: একাদশ - দ্বাদশ শ্রেণি (HSC)\nবিষয়: উচ্চতর গণিত\nমাধ্যম: বাসায় + অনলাইন\nমাসিক বাজেট: ৫,০০০৳\nঅতিরিক্ত নোট: কন্যাশিক্ষার্থী, মহিলা শিক্ষিকা হলে ভালো',
    serviceType: 'math',
    profileId: 'tut-001',
    profileTitle: 'তানজিম আহমেদ',
    adminNotes: 'ক্লাস সম্পন্ন, পরীক্ষার ফলাফল উন্নত হয়েছে।',
    createdAt: '2026-08-20T08:00:00Z',
    updatedAt: '2026-09-10T16:00:00Z',
  },
  {
    id: 'req-hm-done-2',
    customerId: 'demo-user',
    serviceSlug: 'home-tutor',
    status: 'completed',
    areaId: 'akua',
    addressLine: 'আকুয়া, দুই নম্বর রোড, বাসা 43',
    contactName: 'সোহেল রানা',
    contactPhone: '01812-345678',
    preferredTime: 'সন্ধ্যা (৭টা – ৯টা)',
    details: 'শ্রেণি: ৯ম - ১০ম শ্রেণি (SSC)\nবিষয়: উচ্চতর গণিত\nমাধ্যম: বাসায়\nমাসিক বাজেট: ৪,৫০০৳',
    serviceType: 'math',
    profileId: 'tut-001',
    profileTitle: 'তানজিম আহমেদ',
    createdAt: '2026-08-22T11:00:00Z',
    updatedAt: '2026-09-14T12:00:00Z',
  },
  {
    id: 'req-tut-open-1',
    customerId: 'demo-user',
    serviceSlug: 'home-tutor',
    status: 'new',
    areaId: 'ganginarpar',
    addressLine: 'গাংনাইপাড়া, মন্দির রোড, বাসা 7',
    contactName: 'ফারিয়া ইসলাম',
    contactPhone: '01623-456789',
    preferredTime: 'সকাল (৯টা – ১২টা)',
    details: 'শ্রেণি: ৬ষ্ঠ - ৮ম শ্রেণি\nবিষয়: ইংরেজি\nমাধ্যম: বাসায়\nমাসিক বাজেট: ৩,০০০৳\nঅতিরিক্ত নোট: মহিলা শিক্ষিকার জন্য অগ্রাধিকার',
    serviceType: 'english',
    profileId: 'tut-002',
    profileTitle: 'নুসরাত জাহান মিম',
    createdAt: '2026-09-20T09:00:00Z',
    updatedAt: '2026-09-20T09:00:00Z',
  },
];

let tutorStore: HomeTutorProfile[] = [...SEED_TUTORS];
let reviewStore: TutorReview[] = [...SEED_REVIEWS];
let reportStore: { id: string; tutorId: string; reporterName: string; reason: string; details?: string; status: 'open' | 'resolved' | 'dismissed'; createdAt: string }[] = [];
let requestStore: MockTutorRequest[] = [...SEED_TUTOR_REQUESTS];

export function mockFetchPublishedTutors(): HomeTutorProfile[] {
  return tutorStore
    .filter((t) => t.status === 'approved')
    .map((t) => ({ ...t, privatePhone: '__protected__' }))
    .sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));
}

export function mockFetchPublishedTutorById(id: string): HomeTutorProfile | undefined {
  const t = tutorStore.find((x) => x.id === id && x.status === 'approved');
  if (!t) return undefined;
  return { ...t, privatePhone: '__protected__' };
}

export function mockFetchTutorReviews(tutorId: string): TutorReview[] {
  return reviewStore
    .filter((r) => r.tutorId === tutorId && r.isPublished)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function mockFetchReviewEligibility(tutorId: string) {
  return {
    eligible: false,
    alreadyReviewed: false,
    completedRequestId: undefined as string | undefined,
  };
}

export function mockCreateTutorReport(input: {
  tutorId: string;
  reporterName: string;
  reason: string;
  details?: string;
}) {
  reportStore = [
    {
      id: `tutrep-${Date.now()}`,
      tutorId: input.tutorId,
      reporterName: input.reporterName,
      reason: input.reason,
      details: input.details,
      status: 'open',
      createdAt: new Date().toISOString(),
    },
    ...reportStore,
  ];
  return { success: true };
}

// ---------------- Admin facade (private phone only here) ----------------
export function mockAdminFetchTutorProfiles(): HomeTutorProfile[] {
  return [...tutorStore].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function mockAdminFetchTutorProfileById(id: string): HomeTutorProfile | undefined {
  return tutorStore.find((t) => t.id === id);
}

export function mockAdminUpdateTutorProfile(
  id: string,
  patch: Partial<Pick<HomeTutorProfile, 'status' | 'isVerified' | 'adminNotes'>> & { rejectionReason?: string; availability?: HomeTutorProfile['availability'] }
): HomeTutorProfile | undefined {
  const idx = tutorStore.findIndex((t) => t.id === id);
  if (idx === -1) return undefined;
  const current = tutorStore[idx];
  const next = { ...current };
  if (patch.status) {
    next.status = patch.status;
    if (patch.status === 'approved') next.publishedAt = next.publishedAt || new Date().toISOString();
    if (patch.status !== 'rejected') delete next.rejectionReason;
  }
  if (typeof patch.isVerified === 'boolean') next.isVerified = patch.isVerified;
  if (patch.adminNotes !== undefined) next.adminNotes = patch.adminNotes;
  if (patch.rejectionReason !== undefined) next.rejectionReason = patch.rejectionReason;
  if (patch.availability) next.availability = patch.availability;
  next.updatedAt = new Date().toISOString();
  tutorStore[idx] = next;
  return next;
}

export function mockAdminFetchTutorRequests(): MockTutorRequest[] {
  return [...requestStore].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function mockAdminUpdateTutorRequest(
  id: string,
  patch: { status?: ServiceRequestStatus; adminNotes?: string }
): MockTutorRequest | undefined {
  const idx = requestStore.findIndex((r) => r.id === id);
  if (idx === -1) return undefined;
  requestStore[idx] = {
    ...requestStore[idx],
    ...(patch.status ? { status: patch.status } : {}),
    ...(patch.adminNotes !== undefined ? { adminNotes: patch.adminNotes } : {}),
    updatedAt: new Date().toISOString(),
  };
  return requestStore[idx];
}

export function mockFetchTutorModuleStats() {
  const publishing = tutorStore.filter((t) => t.status === 'approved').length;
  const pending = tutorStore.filter((t) => t.status === 'pending_approval').length;
  const openReqs = requestStore.filter((r) => ['new', 'reviewing', 'contacted', 'submitted'].includes(r.status)).length;
  return { publishing, pending, openReqs };
}

// Re-export small helpers so admin/pages can render Bangla labels.
export { TUTOR_STATUS_META, TUTOR_TEACHING_MODE_LABELS };