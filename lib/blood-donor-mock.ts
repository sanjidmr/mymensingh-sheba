/**
 * In-memory mock store for the Blood Donor (রক্তদাতা) module.
 * Used ONLY when Supabase is not configured (preview mode).
 *
 * Integrity rules (mirrored from the DB layer):
 *  - Only status 'approved' donors are ever published in the public directory.
 *  - private_phone never leaves the admin facade; public rows are '__protected__'.
 *  - Blood requests: customer can only create requests; status flow is admin-owned.
 *  - Prescriptions are private admin-view-only (mock stores an opaque token path).
 *  - Donor contact is released ONLY through the audited admin action.
 */
import type {
  BloodContactRelease,
  BloodDonorProfile,
  BloodDonorReport,
  BloodRequest,
  BloodRequestStatus,
  BloodGroup,
} from '@/lib/supabase/types';
import { BLOOD_REQUEST_STATUSES, BLOOD_REQUEST_STATUS_META, DONOR_STATUS_META } from './blood-donor-types';

const NOW = '2026-09-22T00:00:00Z';

export interface MockBloodRequestInput {
  donorProfileId: string;
  patientName: string;
  phone: string;
  bloodGroup: BloodGroup;
  units: number;
  hospitalName: string;
  hospitalAreaId?: string;
  hospitalLocation: string;
  requiredDateTime?: string;
  areaId: string;
  patientInfo?: string;
  prescriptionUrl: string;
}

// ---------------------------------------------------------------------------
// Seeds: private phone values live ONLY in this admin-side map. Public rows
// expose 'privatePhone: "__protected__"'.
// ---------------------------------------------------------------------------
const SEED_PHONES: Record<string, string> = {
  'bdn-001': '01713-000001',
  'bdn-002': '01813-000002',
  'bdn-003': '01913-000003',
  'bdn-004': '01613-000004',
  'bdn-005': '01513-000005',
  'bdn-006': '01713-000006',
  'bdn-007': '01813-000007',
  'bdn-008': '01913-000008',
  'bdn-009': '01613-000009',
};

const SEED_DONORS: BloodDonorProfile[] = [
  {
    id: 'bdn-001',
    userId: 'demo-user',
    status: 'approved',
    fullName: 'মেহেদী হাসান',
    bloodGroup: 'O+',
    areaId: 'charpara',
    gender: 'male',
    birthYear: 1996,
    weightKg: 68,
    isAvailable: true,
    lastDonationDate: '2026-05-10',
    donationCount: 5,
    privatePhone: SEED_PHONES['bdn-001'],
    isVerified: true,
    intro: 'বছরের পর বছর স্বেচ্ছায় রক্ত দিয়ে আসছি। হাসপাতালে কাউকে সাহায্যের মুখে দেখলে পাশে থাকার চেষ্টা করি।',
    publishedAt: '2026-01-20T00:00:00Z',
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: NOW,
  },
  {
    id: 'bdn-002',
    userId: 'demo-user',
    status: 'approved',
    fullName: 'শারমিন সুলতানা',
    bloodGroup: 'A+',
    areaId: 'kachijhuli',
    gender: 'female',
    birthYear: 1999,
    weightKg: 55,
    isAvailable: true,
    lastDonationDate: '2026-04-22',
    donationCount: 3,
    privatePhone: SEED_PHONES['bdn-002'],
    isVerified: true,
    intro: 'রক্তদান একটি খাঁটি মানবিক সেবা। যেকোনো প্রয়োজনে ডাকবেন।',
    publishedAt: '2026-02-02T00:00:00Z',
    createdAt: '2026-01-28T00:00:00Z',
    updatedAt: NOW,
  },
  {
    id: 'bdn-003',
    userId: 'demo-user',
    status: 'approved',
    fullName: 'আব্দুল করিম',
    bloodGroup: 'B+',
    areaId: 'sankipara',
    gender: 'male',
    birthYear: 1992,
    weightKg: 71,
    isAvailable: true,
    lastDonationDate: '2026-03-15',
    donationCount: 8,
    privatePhone: SEED_PHONES['bdn-003'],
    isVerified: true,
    intro: 'ময়মনসিংহ মেডিকেল আশপাশের কয়েকটি ক্যাম্পেইনে রক্ত দিয়েছি।',
    publishedAt: '2026-01-10T00:00:00Z',
    createdAt: '2026-01-05T00:00:00Z',
    updatedAt: NOW,
  },
  {
    id: 'bdn-004',
    userId: 'demo-user',
    status: 'approved',
    fullName: 'তানভীর আহমেদ',
    bloodGroup: 'AB+',
    areaId: 'natun-bazar',
    gender: 'male',
    birthYear: 2000,
    weightKg: 62,
    isAvailable: false,
    lastDonationDate: '2026-06-25',
    donationCount: 2,
    privatePhone: SEED_PHONES['bdn-004'],
    isVerified: false,
    intro: 'এখনও ছোট্ট পথচলা, তবে মনের মধ্যে দৃঢ় প্রতিজ্ঞা।',
    publishedAt: '2026-03-01T00:00:00Z',
    createdAt: '2026-02-20T00:00:00Z',
    updatedAt: NOW,
  },
  {
    id: 'bdn-005',
    userId: 'demo-user',
    status: 'approved',
    fullName: 'নাদিয়া আক্তার',
    bloodGroup: 'O-',
    areaId: 'ganginarpar',
    gender: 'female',
    birthYear: 1995,
    weightKg: 58,
    isAvailable: true,
    lastDonationDate: '2026-02-01',
    donationCount: 6,
    privatePhone: SEED_PHONES['bdn-005'],
    isVerified: true,
    intro: 'O নেগেটিভ — বিরল গ্রুপ হলেও কোনো একদিন কারো প্রাণ বাঁচানোর সুযোগ পাব বলে প্রতীক্ষা।',
    publishedAt: '2026-01-30T00:00:00Z',
    createdAt: '2026-01-25T00:00:00Z',
    updatedAt: NOW,
  },
  {
    id: 'bdn-006',
    userId: 'demo-user',
    status: 'approved',
    fullName: 'রফিকুল ইসলাম',
    bloodGroup: 'B-',
    areaId: 'naomahal',
    gender: 'male',
    birthYear: 1990,
    weightKg: 66,
    isAvailable: true,
    lastDonationDate: '2026-01-18',
    donationCount: 4,
    privatePhone: SEED_PHONES['bdn-006'],
    isVerified: true,
    intro: 'কর্মজীবী মানুষ, ব্যস্ত প্রাত্যহিক জীবনের মাঝেও রক্তদানে কোনো দ্বিধা নেই।',
    publishedAt: '2026-02-11T00:00:00Z',
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: NOW,
  },
  {
    id: 'bdn-007',
    userId: 'demo-user',
    status: 'approved',
    fullName: 'সামিয়া রহমান',
    bloodGroup: 'A-',
    areaId: 'maskanda',
    gender: 'female',
    birthYear: 1998,
    weightKg: 54,
    isAvailable: false,
    lastDonationDate: '2026-07-12',
    donationCount: 3,
    privatePhone: SEED_PHONES['bdn-007'],
    isVerified: true,
    intro: 'গতবার রক্ত দিয়েছি। সুস্থ হয়ে ফেরানোর জন্য ৪ মাস অপেক্ষা করছি।',
    publishedAt: '2026-03-05T00:00:00Z',
    createdAt: '2026-02-25T00:00:00Z',
    updatedAt: NOW,
  },
  {
    id: 'bdn-008',
    userId: 'demo-user',
    status: 'approved',
    fullName: 'জাকির হোসেন',
    bloodGroup: 'AB-',
    areaId: 'akua',
    gender: 'male',
    birthYear: 1993,
    weightKg: 69,
    isAvailable: true,
    lastDonationDate: '2026-01-05',
    donationCount: 4,
    privatePhone: SEED_PHONES['bdn-008'],
    isVerified: true,
    intro: 'AB নেগেটিভ রক্তের চাহিদা কম, কিন্তু জরুরি সময়ে এই গ্রুপটিই সবচেয়ে বেশি দরকার হয়।',
    publishedAt: '2026-03-12T00:00:00Z',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: NOW,
  },
  {
    id: 'bdn-009',
    userId: 'demo-user',
    status: 'rejected',
    fullName: 'আরিফ মিয়া',
    bloodGroup: 'O+',
    areaId: 'charpara',
    gender: 'male',
    birthYear: 1988,
    weightKg: 60,
    isAvailable: true,
    lastDonationDate: undefined,
    donationCount: 0,
    privatePhone: '01999-000009',
    isVerified: false,
    rejectionReason: 'রক্তদানের শারীরিক শর্ত (বয়স ১৮–৬০ এবং ওজন ৫০কেজি+) ঠিক থাকলেও ফোন যাচাই সম্পন্ন হয়নি। সঠিক নম্বর দিয়ে পুনরায় আবেদন করুন।',
    createdAt: '2026-08-15T00:00:00Z',
    updatedAt: '2026-08-20T00:00:00Z',
  },
];

const SEED_REQUESTS: BloodRequest[] = [
  {
    id: 'breq-001',
    customerId: 'demo-user',
    donorProfileId: 'bdn-001',
    donorName: 'মেহেদী হাসান',
    donorBloodGroup: 'O+',
    status: 'donor_contacted',
    patientName: 'রুহুল আমিন',
    phone: '01712-345678',
    bloodGroup: 'O+',
    units: 2,
    hospitalName: 'ময়মনসিংহ মেডিকেল কলেজ হাসপাতাল',
    hospitalAreaId: 'charpara',
    hospitalLocation: 'মমেক হাসপাতাল, ৩ নম্বর সার্জারি ওয়ার্ড',
    requiredDateTime: '2026-09-23 সকাল ১০টা',
    areaId: 'charpara',
    patientInfo: 'শল্যচিকিৎসা (অপারেশন) এর জন্য রক্ত প্রয়োজন।',
    prescriptionUrl: '__mock__/prescriptions/breq-001.jpg',
    adminNotes: 'প্রেসক্রিপশন যাচাই হয়েছে। রক্তদাতার সঙ্গে যোগাযোগ করা হয়েছে।',
    contactedDonorName: 'মেহেদী হাসান',
    contactReleasedAt: '2026-09-22T09:00:00Z',
    createdAt: '2026-09-21T10:00:00Z',
    updatedAt: '2026-09-22T09:00:00Z',
  },
  {
    id: 'breq-002',
    customerId: 'demo-user',
    donorProfileId: 'bdn-005',
    donorName: 'নাদিয়া আক্তার',
    donorBloodGroup: 'O-',
    status: 'pending_review',
    patientName: 'মোছা. জাহানারা বেগম',
    phone: '01823-456789',
    bloodGroup: 'O-',
    units: 1,
    hospitalName: 'কমিউনিটি ক্লিনিক, গাংগিনারপাড়',
    hospitalAreaId: 'ganginarpar',
    hospitalLocation: 'গাংগিনারপাড় কমিউনিটি ক্লিনিক',
    requiredDateTime: '2026-09-24 বিকাল ৪টা',
    areaId: 'ganginarpar',
    patientInfo: 'জরুরি প্রয়োজন, ডেলিভারি-জনিত জটিলতা।',
    prescriptionUrl: '__mock__/prescriptions/breq-002.pdf',
    createdAt: '2026-09-22T08:00:00Z',
    updatedAt: '2026-09-22T08:00:00Z',
  },
  {
    id: 'breq-003',
    customerId: 'demo-user',
    donorProfileId: 'bdn-003',
    donorName: 'আব্দুল করিম',
    donorBloodGroup: 'B+',
    status: 'completed',
    patientName: 'সাব্বির হোসেন',
    phone: '01634-567890',
    bloodGroup: 'B+',
    units: 1,
    hospitalName: 'ময়মনসিংহ মেডিকেল কলেজ হাসপাতাল',
    hospitalAreaId: 'charpara',
    hospitalLocation: 'মমেক হাসপাতাল',
    requiredDateTime: '2026-09-10 সকাল ৯টা',
    areaId: 'sankipara',
    patientInfo: 'শল্যচিকিৎসা পরবর্তী রক্ত।',
    prescriptionUrl: '__mock__/prescriptions/breq-003.jpg',
    adminNotes: 'রক্তদান সম্পন্ন হয়েছে। রোগী সুস্থ আছেন।',
    contactedDonorName: 'আব্দুল করিম',
    contactReleasedAt: '2026-09-09T12:00:00Z',
    createdAt: '2026-09-08T18:00:00Z',
    updatedAt: '2026-09-11T14:00:00Z',
  },
];

const SEED_RELEASES: BloodContactRelease[] = [
  {
    id: 'bcr-001',
    requestId: 'breq-001',
    donorProfileId: 'bdn-001',
    releasedBy: 'admin-user',
    releasedToCustomer: 'demo-user',
    contactPhone: SEED_PHONES['bdn-001'],
    createdAt: '2026-09-22T09:00:00Z',
  },
  {
    id: 'bcr-002',
    requestId: 'breq-003',
    donorProfileId: 'bdn-003',
    releasedBy: 'admin-user',
    releasedToCustomer: 'demo-user',
    contactPhone: SEED_PHONES['bdn-003'],
    createdAt: '2026-09-09T12:00:00Z',
  },
];

const SEED_REPORTS: BloodDonorReport[] = [
  {
    id: 'bdrep-001',
    donorProfileId: 'bdn-004',
    reporterId: 'demo-user',
    reporterName: 'কোনো এক ব্যবহারকারী',
    reason: 'রক্তদানে অনিয়মিত / ভুল তথ্য',
    details: 'প্রোফাইলে রক্তদানের সংখ্যা ভুল দেখানো হয়েছে।',
    status: 'open',
    createdAt: '2026-09-15T10:00:00Z',
  },
];

let donorStore: BloodDonorProfile[] = [...SEED_DONORS];
let requestStore: BloodRequest[] = [...SEED_REQUESTS];
let releaseStore: BloodContactRelease[] = [...SEED_RELEASES];
let reportStore: BloodDonorReport[] = [...SEED_REPORTS];

function donorById(id?: string) {
  if (!id) return undefined;
  return donorStore.find((d) => d.id === id);
}

function publicDonor(d: BloodDonorProfile): BloodDonorProfile {
  return { ...d, privatePhone: '__protected__' };
}

// ---------------------------- Public layer --------------------------------
export function mockFetchPublishedDonors(filters?: {
  bloodGroup?: string;
  areaId?: string;
  isAvailableNow?: boolean;
}): BloodDonorProfile[] {
  return donorStore
    .filter((d) => {
      if (d.status !== 'approved') return false;
      if (filters?.bloodGroup && filters.bloodGroup !== 'all' && d.bloodGroup !== filters.bloodGroup) return false;
      if (filters?.areaId && d.areaId !== filters.areaId) return false;
      if (filters?.isAvailableNow && !d.isAvailable) return false;
      return true;
    })
    .map(publicDonor)
    .sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));
}

export function mockFetchPublishedDonorById(id: string): BloodDonorProfile | undefined {
  const d = donorStore.find((x) => x.id === id && x.status === 'approved');
  return d ? publicDonor(d) : undefined;
}

export function mockCreateBloodRequest(input: MockBloodRequestInput, customerId: string) {
  const donor = donorStore.find((d) => d.id === input.donorProfileId && d.status === 'approved');
  if (!donor) return { success: false, error: 'রক্তদাতাটি আর পাওয়া যাচ্ছে না' };
  if (!input.patientName.trim()) return { success: false, error: 'রোগী / যোগাযোগকারীর নাম লিখুন' };
  if (!input.phone.trim()) return { success: false, error: 'আপনার ফোন নম্বর লিখুন' };
  if (!input.prescriptionUrl.trim()) {
    return { success: false, error: 'প্রেসক্রিপশন / ডাক্তারের লিখন আপলোড বাধ্যতামূলক' };
  }
  if (!input.hospitalName.trim() || !input.hospitalLocation.trim()) {
    return { success: false, error: 'হাসপাতাল / ল্যাবের নাম ও অবস্থান লিখুন' };
  }
  const request: BloodRequest = {
    id: `breq-${Date.now()}`,
    customerId,
    donorProfileId: donor.id,
    donorName: donor.fullName,
    donorBloodGroup: donor.bloodGroup,
    status: 'pending_review',
    patientName: input.patientName.trim(),
    phone: input.phone.trim(),
    bloodGroup: input.bloodGroup,
    units: input.units,
    hospitalName: input.hospitalName.trim(),
    hospitalAreaId: input.hospitalAreaId,
    hospitalLocation: input.hospitalLocation.trim(),
    requiredDateTime: input.requiredDateTime,
    areaId: input.areaId,
    patientInfo: input.patientInfo?.trim(),
    prescriptionUrl: input.prescriptionUrl,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  requestStore = [request, ...requestStore];
  return { success: true, request };
}

export function mockFetchMyBloodRequests(customerId: string): BloodRequest[] {
  return requestStore
    .filter((r) => r.customerId === customerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function mockCancelBloodRequest(id: string, customerId: string) {
  const idx = requestStore.findIndex((r) => r.id === id && r.customerId === customerId);
  if (idx === -1) return { success: false, error: 'আবেদনটি খুঁজে পাওয়া যায়নি' };
  const cur = requestStore[idx];
  if (cur.status !== 'pending_review' && cur.status !== 'approved') {
    return { success: false, error: 'এই অবস্থায় আর বাতিল করা সম্ভব নয়' };
  }
  requestStore[idx] = { ...cur, status: 'cancelled', updatedAt: new Date().toISOString() };
  return { success: true, request: requestStore[idx] };
}

export function mockCreateBloodDonorReport(input: {
  donorProfileId: string;
  reporterName: string;
  reason: string;
  details?: string;
}) {
  if (!donorStore.some((d) => d.id === input.donorProfileId)) {
    return { success: false, error: 'রক্তদাতা পাওয়া যায়নি' };
  }
  reportStore = [
    {
      id: `bdrep-${Date.now()}`,
      donorProfileId: input.donorProfileId,
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

// ------------------------- Admin layer (private) --------------------------
export function mockAdminFetchDonorProfiles(): BloodDonorProfile[] {
  return [...donorStore].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function mockAdminFetchDonorProfileById(id: string): BloodDonorProfile | undefined {
  return donorStore.find((d) => d.id === id);
}

export function mockAdminUpdateDonorProfile(
  id: string,
  patch: Partial<Pick<BloodDonorProfile, 'status' | 'isVerified' | 'adminNotes' | 'isAvailable'>> & {
    rejectionReason?: string;
  }
): BloodDonorProfile | undefined {
  const idx = donorStore.findIndex((d) => d.id === id);
  if (idx === -1) return undefined;
  const next = { ...donorStore[idx] };
  if (patch.status) {
    next.status = patch.status;
    if (patch.status === 'approved') next.publishedAt = next.publishedAt || new Date().toISOString();
    if (patch.status !== 'rejected') delete next.rejectionReason;
  }
  if (typeof patch.isVerified === 'boolean') next.isVerified = patch.isVerified;
  if (patch.adminNotes !== undefined) next.adminNotes = patch.adminNotes;
  if (patch.rejectionReason !== undefined) next.rejectionReason = patch.rejectionReason;
  if (typeof patch.isAvailable === 'boolean') next.isAvailable = patch.isAvailable;
  next.updatedAt = new Date().toISOString();
  donorStore[idx] = next;
  return next;
}

export function mockAdminFetchBloodRequests(): BloodRequest[] {
  return [...requestStore].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function mockAdminFetchBloodRequestById(id: string): BloodRequest | undefined {
  return requestStore.find((r) => r.id === id);
}

export function mockAdminUpdateBloodRequest(
  id: string,
  patch: { status?: BloodRequestStatus; adminNotes?: string; rejectionReason?: string }
): BloodRequest | undefined {
  const idx = requestStore.findIndex((r) => r.id === id);
  if (idx === -1) return undefined;
  const next = { ...requestStore[idx] };
  if (patch.status) {
    next.status = patch.status;
    if (patch.status !== 'rejected') delete next.rejectionReason;
  }
  if (patch.adminNotes !== undefined) next.adminNotes = patch.adminNotes;
  if (patch.rejectionReason !== undefined) next.rejectionReason = patch.rejectionReason;
  next.updatedAt = new Date().toISOString();
  requestStore[idx] = next;
  return next;
}

export function mockAdminReleaseDonorContact(requestId: string, releasedBy: string) {
  const idx = requestStore.findIndex((r) => r.id === requestId);
  if (idx === -1) return { success: false, error: 'আবেদনটি পাওয়া যায়নি' };
  const req = requestStore[idx];
  const donor = donorById(req.donorProfileId);
  if (!donor) return { success: false, error: 'রক্তদাতার তথ্য পাওয়া যায়নি' };
  const already = releaseStore.find((c) => c.requestId === requestId);
  if (already) return { success: true, phone: donor.privatePhone, alreadyReleased: true };

  const release: BloodContactRelease = {
    id: `bcr-${Date.now()}`,
    requestId,
    donorProfileId: donor.id,
    releasedBy,
    releasedToCustomer: req.customerId,
    contactPhone: donor.privatePhone,
    createdAt: new Date().toISOString(),
  };
  releaseStore = [release, ...releaseStore];
  requestStore[idx] = {
    ...req,
    contactedDonorName: donor.fullName,
    contactReleasedAt: release.createdAt,
    updatedAt: release.createdAt,
  };
  return { success: true, phone: donor.privatePhone, alreadyReleased: false };
}

export function mockAdminFetchContactReleases(requestId: string): BloodContactRelease[] {
  return releaseStore
    .filter((c) => c.requestId === requestId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function mockFetchMyContactReleases(customerId: string): BloodContactRelease[] {
  return releaseStore
    .filter((c) => c.releasedToCustomer === customerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function mockAdminFetchDonorReports(donorId?: string): BloodDonorReport[] {
  return reportStore.filter((r) => !donorId || r.donorProfileId === donorId);
}

export function mockFetchDonorModuleStats() {
  const publishing = donorStore.filter((d) => d.status === 'approved').length;
  const pending = donorStore.filter((d) => d.status === 'pending_approval').length;
  const openReqs = requestStore.filter((r) =>
    ['pending_review', 'approved', 'donor_contacted', 'in_progress'].includes(r.status)
  ).length;
  return { publishing, pending, openReqs };
}

export {
  BLOOD_REQUEST_STATUS_META,
  BLOOD_REQUEST_STATUSES,
  DONOR_STATUS_META,
};