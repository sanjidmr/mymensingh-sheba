/**
 * In-memory mock store for Admin-managed staff services (কাজের বুয়া / Electrician / Plumber).
 * Used when Supabase is not configured (preview mode).
 *
 * Integrity notes:
 *  - All seeded profiles have isVerified = false (no fake verification in preview).
 *  - phonePrivate is present for admin flows only (never rendered on public UI).
 */
import type {
  StaffProfile,
  StaffProfileInput,
  StaffServiceKey,
  StaffRequest,
  StaffReport,
  StaffReportStatus,
} from './staff-types';
import { STAFF_REPORT_REASONS } from './staff-types';
import type { ServiceRequestStatus } from '@/lib/supabase/types';

const IMG_WOMAN_1 = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=80';
const IMG_WOMAN_2 = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80';
const IMG_WOMAN_3 = 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&auto=format&fit=crop&q=80';
const IMG_WOMAN_4 = 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=500&auto=format&fit=crop&q=80';
const IMG_MAN_1 = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&auto=format&fit=crop&q=80';
const IMG_MAN_2 = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80';
const IMG_MAN_3 = 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=500&auto=format&fit=crop&q=80';
const IMG_MAN_4 = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=500&auto=format&fit=crop&q=80';

const NOW = '2026-09-21T00:00:00Z';

const SEED_PROFILES: StaffProfile[] = [
  // ---------------- কাজের বুয়া ----------------
  {
    id: 'kb-1001',
    serviceSlug: 'kajer-bua',
    nameBn: 'রহিমা বেগম',
    titleBn: 'রান্না ও ঘর পরিষ্কারের অভিজ্ঞ গৃহকর্মী (সকাল শিফট)',
    imageUrl: IMG_WOMAN_1,
    areaIds: ['charpara', 'kachijhuli'],
    workTypes: ['cooking', 'cleaning'],
    workMode: 'part_time',
    timeSlot: 'morning',
    experienceYears: 6,
    availability: 'available',
    salaryMin: 4000,
    salaryMax: 5000,
    aboutBn:
      'প্রতিদিন সকাল ৭টা থেকে দুপুর ১২টা পর্যন্ত বাসায় প্রয়োজন অনুযায়ী রান্না ও ঘর পরিষ্কারের কাজে প্রস্তুত। গ্যাস, বৈদ্যুতিক যন্ত্রপাতি ও পরিবারের সাথে সুসম্পর্ক রাখতে পারদর্শী।',
    isVerified: false,
    isActive: true,
    phonePrivate: '01700-112233',
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'kb-1002',
    serviceSlug: 'kajer-bua',
    nameBn: 'আলেয়া খাতুন',
    titleBn: 'বাসা পরিষ্কার ও কাপড় ধোয়ার সহকারী (দুপুর)',
    imageUrl: IMG_WOMAN_2,
    areaIds: ['sankipara'],
    workTypes: ['cleaning', 'laundry'],
    workMode: 'part_time',
    timeSlot: 'afternoon',
    experienceYears: 3,
    availability: 'limited',
    salaryMin: 3500,
    salaryMax: 4500,
    aboutBn:
      'দুপুর ১২টা থেকে বিকেল ৪টা পর্যন্ত বাসা ঝাড়ু, মোছা, বাসন-কোসন ও কাপড় ধোয়ার কাজে পারদর্শী। কাজের প্রতি আন্তরিক ও দায়িত্বশীল। চরপাড়া ও কাঁচিঝুলি এলাকায় যাতায়াতে অভ্যস্ত।',
    isVerified: false,
    isActive: true,
    phonePrivate: '01800-445566',
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'kb-1003',
    serviceSlug: 'kajer-bua',
    nameBn: 'শাহানারা বেগম',
    titleBn: 'ফুল-টাইম রান্না ও সার্বিক গৃহস্থালি (লাইভ-ইন সম্ভব)',
    imageUrl: IMG_WOMAN_3,
    areaIds: ['kachijhuli', 'natun-bazar'],
    workTypes: ['cooking', 'all_round'],
    workMode: 'live_in',
    timeSlot: 'live_in',
    experienceYears: 8,
    availability: 'available',
    salaryMin: 7000,
    salaryMax: 9000,
    aboutBn:
      'ফুল-টাইম বা বাসায় থাকার শর্তে সার্বিক গৃহস্থালির সব কাজে দীর্ঘ অভিজ্ঞতা। রান্না, ঘর মোছা, কাপড় ধোয়া ও বাচ্চা দেখাশোনা সামলাতে পারেন। দরদাম ও শর্ত নিয়ে অ্যাডমিনের মাধ্যমে আলোচনা করা যায়।',
    isVerified: false,
    isActive: true,
    phonePrivate: '01911-223344',
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'kb-1004',
    serviceSlug: 'kajer-bua',
    nameBn: 'রুবিনা আক্তার',
    titleBn: 'বাচ্চা দেখাশোনা ও হালকা রান্নায় অভিজ্ঞ (দিন ভিত্তিক)',
    imageUrl: IMG_WOMAN_4,
    areaIds: ['akua'],
    workTypes: ['babysitting', 'cooking'],
    workMode: 'day_based',
    timeSlot: 'afternoon',
    experienceYears: 2,
    availability: 'busy',
    salaryMin: 2500,
    salaryMax: 4000,
    aboutBn:
      'ছোট বাচ্চার দেখাশোনা ও পরিবারের জন্য হালকা রান্নার কাজে আগ্রহী। নির্দিষ্ট দিনে (দিন ভিত্তিক) বা দরকার অনুযায়ী কাজ করতে পারেন। আকুয়া ও আশপাশের এলাকায় থাকেন।',
    isVerified: false,
    isActive: true,
    phonePrivate: '01622-556677',
    createdAt: NOW,
    updatedAt: NOW,
  },

  // ---------------- Electrician ----------------
  {
    id: 'el-2001',
    serviceSlug: 'electrician',
    nameBn: 'মো. জামাল হোসেন',
    titleBn: 'শর্ট সার্কিট, ওয়্যারিং ও বসতবাড়ি মেরামতে দক্ষ ইলেক্ট্রিশিয়ান',
    imageUrl: IMG_MAN_1,
    areaIds: ['charpara', 'sankipara', 'kachijhuli'],
    workTypes: ['short_circuit', 'fan_light', 'wiring'],
    experienceYears: 10,
    availability: 'available',
    isEmergency: true,
    rateLabel: 'পরিদর্শন ৳১৫০ + কাজ অনুযায়ী',
    aboutBn:
      'দশ বছরের অভিজ্ঞতায় বাসা-বাড়ির শর্ট সার্কিট, লাইন ফল্ট, নতুন ওয়্যারিং ও ডিস্ট্রিবিউশন বোর্ড স্থাপনে দক্ষ। নিরাপত্তা নিয়ম মেনে নির্ভুল কাজের জন্য পরিচিত। চরপাড়া ও সংলগ্ন এলাকায় সাড়া দেন।',
    isVerified: false,
    isActive: true,
    phonePrivate: '01777-889900',
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'el-2002',
    serviceSlug: 'electrician',
    nameBn: 'মো. সজীব মিয়া',
    titleBn: 'ফ্যান-লাইট, সুইচ-বোর্ড ও গিজার ইনস্টলেশন',
    imageUrl: IMG_MAN_2,
    areaIds: ['natun-bazar', 'akua'],
    workTypes: ['fan_light', 'switch_socket', 'geyser_ips'],
    experienceYears: 5,
    availability: 'limited',
    isEmergency: false,
    rateLabel: 'কাজ অনুযায়ী সাশ্রয়ী রেট',
    aboutBn:
      'নতুন সিলিং ফ্যান, এলইডি লাইট, সুইচ-সকেট ও গিজার কানেকশন স্থাপনে অভিজ্ঞ। যন্ত্রপাতি সঠিক ভাবে বাছাই করে কাজ করে। সীমিত সময়ে উপলব্ধ — আগে ফোনে সম্মত হলে সেবা দেওয়া যায়।',
    isVerified: false,
    isActive: true,
    phonePrivate: '01888-112233',
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'el-2003',
    serviceSlug: 'electrician',
    nameBn: 'আব্দুল করিম',
    titleBn: 'জরুরি নাইট ও অন-কল ইলেকট্রিক সার্ভিস',
    imageUrl: IMG_MAN_3,
    areaIds: ['kachijhuli', 'nawmahal'],
    workTypes: ['emergency', 'short_circuit'],
    experienceYears: 7,
    availability: 'available',
    isEmergency: true,
    rateLabel: 'জরুরি সার্ভিস ফি প্রযোজ্য',
    aboutBn:
      'রাত-দিন যেকোনো সময় আকস্মিক বিদ্যুৎ বিভ্রাট, ফিউজ পড়া বা স্পার্কিং সমস্যায় দ্রুত পৌঁছাতে পারেন। জরুরি অন-কল সাপোর্টের জন্য অ্যাডমিনের মাধ্যমে সমন্বয় করা হয়।',
    isVerified: false,
    isActive: true,
    phonePrivate: '01999-334455',
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'el-2004',
    serviceSlug: 'electrician',
    nameBn: 'মো. রাশেদ আলম',
    titleBn: 'বাসা-অফিসের পূর্ণাঙ্গ ইলেকট্রিক ওয়্যারিং',
    imageUrl: IMG_MAN_4,
    areaIds: ['charpara'],
    workTypes: ['wiring', 'switch_socket'],
    experienceYears: 4,
    availability: 'busy',
    isEmergency: false,
    rateLabel: 'কোটেশন অনুযায়ী প্যাকেজ',
    aboutBn:
      'নতুন বাসা বা রেনোভেশনের ক্ষেত্রে নিরাপত্তাবান্ধব সম্পূর্ণ ওয়্যারিং, স্বয়ংক্রিয় সুইচ বোর্ড ও আর্থিং-এর কাজ করে। মাপজোখ নিয়ে আগে থেকেই খরচের আনুমানিক হিসাব জানানো হয়।',
    isVerified: false,
    isActive: true,
    phonePrivate: '01555-667788',
    createdAt: NOW,
    updatedAt: NOW,
  },

  // ---------------- Plumber ----------------
  {
    id: 'pl-3001',
    serviceSlug: 'plumber',
    nameBn: 'মো. আফজাল মিয়া',
    titleBn: 'পাইপ লিক, মোটর-পাম্প ও ওয়াটারলাইন মেরামতে অভিজ্ঞ',
    imageUrl: IMG_MAN_2,
    areaIds: ['charpara', 'sankipara'],
    workTypes: ['leakage', 'motor_pump'],
    experienceYears: 9,
    availability: 'available',
    isEmergency: true,
    rateLabel: 'পরিদর্শন ফি ৳১০০ + কাজের চার্জ',
    aboutBn:
      'সাবমার্সিবল ও সেন্ট্রিফিউগাল পাম্প সংযোগ, পাইপ লিক ও পানির চাপ সমস্যা সমাধানে অভিজ্ঞ। জরুরি প্রয়োজনে দ্রুত উপস্থিতির জন্য পরিচিত।',
    isVerified: false,
    isActive: true,
    phonePrivate: '01711-505060',
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'pl-3002',
    serviceSlug: 'plumber',
    nameBn: 'রফিকুল ইসলাম',
    titleBn: 'বেসিন, কমোড ও বাথরুম স্যানিটারি ফিটিংস',
    imageUrl: IMG_MAN_1,
    areaIds: ['kachijhuli', 'natun-bazar'],
    workTypes: ['bathroom_fitting', 'leakage'],
    experienceYears: 6,
    availability: 'limited',
    isEmergency: false,
    rateLabel: 'কাজ অনুযায়ী',
    aboutBn:
      'ট্যাপ, শাওয়ার, মিক্সার, কমোড ও বেসিনের নতুন স্থাপন বা মেরামতের নিখুঁত কাজ করে। স্যানিটারি সামগ্রী কিনে দেওয়া কিংবা নিজ সামগ্রীতে fit-up — দুটোই চলে।',
    isVerified: false,
    isActive: true,
    phonePrivate: '01800-717273',
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'pl-3003',
    serviceSlug: 'plumber',
    nameBn: 'মো. সুমন মিয়া',
    titleBn: 'ড্রেন ও পাইপ ব্লকেজ দূরীকরণ (জরুরি)',
    imageUrl: IMG_MAN_3,
    areaIds: ['akua', 'nawmahal'],
    workTypes: ['drain_cleaning', 'tank_cleaning'],
    experienceYears: 4,
    availability: 'available',
    isEmergency: true,
    rateLabel: 'জরুরিতে ৩০-৬০ মিনিটে উপস্থিত',
    aboutBn:
      'রান্নাঘর-বাথরুমের ড্রেন ব্লকেজ, ময়লা পানির লাইনে সমস্যা ও পানির ট্যাংক পরিষ্কারের কাজে দ্রুত সাড়া দেন। ব্লকেজ দূর করার আধুনিক টুলস রয়েছে।',
    isVerified: false,
    isActive: true,
    phonePrivate: '01900-808182',
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'pl-3004',
    serviceSlug: 'plumber',
    nameBn: 'আবু বক্কর সিদ্দিক',
    titleBn: 'ট্যাংক পরিষ্কার ও নতুন স্যানিটারি স্থাপন',
    imageUrl: IMG_MAN_4,
    areaIds: ['charpara'],
    workTypes: ['tank_cleaning', 'bathroom_fitting'],
    experienceYears: 11,
    availability: 'busy',
    isEmergency: false,
    rateLabel: 'সুলভ মূল্যে টিমসহ সেবা',
    aboutBn:
      'বাসার পানির ট্যাংক পরিষ্কার, নতুন স্যানিটারি ও সেপটিক লাইন স্থাপনের জন্য একজন সহকারীসহ কাজ করেন। বড় প্রকল্পের জন্য দিন-তারিখ নির্ধারণ করে নেওয়া হয়।',
    isVerified: false,
    isActive: true,
    phonePrivate: '01611-212223',
    createdAt: NOW,
    updatedAt: NOW,
  },
];

let profiles: StaffProfile[] = [...SEED_PROFILES];
let profileSeq = 0;

const SEED_REQUESTS: StaffRequest[] = [
  {
    id: 'req-demo-301',
    serviceSlug: 'kajer-bua',
    profileId: 'kb-1001',
    profileTitleBn: 'রান্না ও ঘর পরিষ্কারের অভিজ্ঞ গৃহকর্মী (সকাল শিফট)',
    customerId: 'demo-user',
    customerName: 'নাজমা আক্তার',
    customerPhone: '01712-345678',
    areaId: 'charpara',
    addressLine: 'চরপাড়া, নাহার মেমোরিয়াল রোড, বাসা ১২',
    serviceType: 'cooking',
    description: 'দুইজনের পরিবারের জন্য সকালের রান্না ও ঘর পরিষ্কারের কাজ প্রয়োজন।',
    preferredDate: '2026-09-23',
    preferredTime: 'সকাল (৯টা – ১২টা)',
    status: 'new',
    createdAt: '2026-09-21T06:00:00Z',
    updatedAt: '2026-09-21T06:00:00Z',
  },
  {
    id: 'req-demo-302',
    serviceSlug: 'electrician',
    profileId: 'el-2003',
    profileTitleBn: 'জরুরি নাইট ও অন-কল ইলেকট্রিক সার্ভিস',
    customerId: 'demo-user',
    customerName: 'সোহেল রানা',
    customerPhone: '01812-345678',
    areaId: 'kachijhuli',
    addressLine: 'কাঁচিঝুলি, জিলা স্কুল রোড, বাসা 8/ক',
    serviceType: 'short_circuit',
    description: 'রান্নাঘরের সুইচ থেকে বিদ্যুৎ চলে যাচ্ছে, বারবার ফিউজ পড়ছে।',
    preferredDate: '2026-09-22',
    preferredTime: 'বিকেল (৩টা – ৬টা)',
    status: 'reviewing',
    createdAt: '2026-09-20T14:30:00Z',
    updatedAt: '2026-09-21T09:00:00Z',
  },
  {
    id: 'req-demo-303',
    serviceSlug: 'plumber',
    profileId: 'pl-3003',
    profileTitleBn: 'ড্রেন ও পাইপ ব্লকেজ দূরীকরণ (জরুরি)',
    customerId: 'demo-user',
    customerName: 'ফারিয়া ইসলাম',
    customerPhone: '01623-456789',
    areaId: 'akua',
    addressLine: 'আকুয়া, দুই নম্বর রোড, বাসা 43',
    serviceType: 'drain_cleaning',
    description: 'বাথরুমের ড্রেন পরিপূর্ণভাবে বন্ধ, পানি গড়াচ্ছে না।',
    preferredDate: '2026-09-21',
    preferredTime: 'যেকোনো সময়',
    status: 'completed',
    createdAt: '2026-09-19T10:00:00Z',
    updatedAt: '2026-09-20T18:00:00Z',
  },
];

let requests: StaffRequest[] = [...SEED_REQUESTS];
let requestSeq = 0;

let reports: StaffReport[] = [];
let reportSeq = 0;

// ---- Profiles ----

export function mockFetchPublicStaffProfiles(slug: StaffServiceKey): StaffProfile[] {
  return profiles
    .filter((p) => p.serviceSlug === slug && p.isActive)
    .sort((a, b) => (a.isVerified === b.isVerified ? 0 : a.isVerified ? -1 : 1));
}

export function mockFetchStaffProfileById(
  id: string,
  opts: { admin?: boolean } = {}
): StaffProfile | undefined {
  const p = profiles.find((x) => x.id === id);
  if (!p) return undefined;
  if (!opts.admin && !p.isActive) return undefined;
  return p;
}

export function mockAdminFetchStaffProfiles(slug?: StaffServiceKey): StaffProfile[] {
  const list = slug ? profiles.filter((p) => p.serviceSlug === slug) : [...profiles];
  return list.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
}

export function mockAdminFetchStaffProfileById(id: string): StaffProfile | undefined {
  return profiles.find((p) => p.id === id);
}

export function mockCreateStaffProfile(input: StaffProfileInput): StaffProfile {
  const now = new Date().toISOString();
  const profile: StaffProfile = {
    ...input,
    id: `sp-${Date.now()}-${profileSeq++}`,
    createdAt: now,
    updatedAt: now,
  };
  profiles = [profile, ...profiles];
  return profile;
}

export function mockUpdateStaffProfile(
  id: string,
  patch: Partial<StaffProfileInput>
): StaffProfile | undefined {
  const idx = profiles.findIndex((p) => p.id === id);
  if (idx === -1) return undefined;
  const updated = {
    ...profiles[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  profiles[idx] = updated;
  return updated;
}

export function mockDeleteStaffProfile(id: string): boolean {
  const before = profiles.length;
  profiles = profiles.filter((p) => p.id !== id);
  return profiles.length < before;
}

// ---- Requests (admin) ----

export function mockAdminFetchStaffRequests(slug?: StaffServiceKey): StaffRequest[] {
  const list = slug ? requests.filter((r) => r.serviceSlug === slug) : [...requests];
  return list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

export function mockAdminFetchStaffRequestById(id: string): StaffRequest | undefined {
  return requests.find((r) => r.id === id);
}

export function mockAdminUpdateStaffRequest(
  id: string,
  status: ServiceRequestStatus,
  adminNotes?: string
): StaffRequest | undefined {
  const idx = requests.findIndex((r) => r.id === id);
  if (idx === -1) return undefined;
  requests[idx] = {
    ...requests[idx],
    status,
    adminNotes: adminNotes ?? requests[idx].adminNotes,
    updatedAt: new Date().toISOString(),
  };
  return requests[idx];
}

// ---- Reports ----

export function mockCreateStaffReport(input: {
  profileId: string;
  serviceSlug: StaffServiceKey;
  reporterId?: string;
  reporterName: string;
  reason: string;
  details?: string;
}): { success: boolean; id?: string; error?: string } {
  const reason = input.reason || STAFF_REPORT_REASONS[0];
  reports = [
    {
      id: `rpt-${Date.now()}-${reportSeq++}`,
      profileId: input.profileId,
      serviceSlug: input.serviceSlug,
      reporterId: input.reporterId,
      reporterName: input.reporterName,
      reason,
      details: input.details,
      status: 'open',
      createdAt: new Date().toISOString(),
    },
    ...reports,
  ];
  return { success: true, id: reports[0].id };
}

export function mockAdminFetchStaffReports(): StaffReport[] {
  return [...reports].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

export function mockAdminUpdateStaffReportStatus(
  id: string,
  status: StaffReportStatus
): StaffReport | undefined {
  const idx = reports.findIndex((r) => r.id === id);
  if (idx === -1) return undefined;
  reports[idx] = { ...reports[idx], status };
  return reports[idx];
}