/**
 * In-memory mock store for Admin-managed Home Moving (বাসা পাল্টানো) requests.
 * Used when Supabase is not configured (preview mode).
 *
 * Integrity notes:
 *  - Requests submitted by customers at runtime live in auth-context state;
 *    this store only holds admin-side data (seeds + admin updates).
 *  - No automatic pricing anywhere — the admin records the quotation manually.
 */
import type { HomeMovingRequest } from './home-moving-types';
import type { ServiceRequestStatus } from '@/lib/supabase/types';

const NOW = '2026-09-22T00:00:00Z';

const SEED_REQUESTS: HomeMovingRequest[] = [
  {
    id: 'hm-9001',
    customerId: 'demo-user',
    serviceSlug: 'home-moving',
    status: 'new',
    pickupAreaId: 'charpara',
    destinationAreaId: 'kachijhuli',
    pickupAddress: 'চরপাড়া, নাহার মেমোরিয়াল রোড, বাসা ১২',
    destinationAddress: 'কাঁচিঝুলি, জিলা স্কুল রোড, ভবন 8/ক',
    preferredDate: '2026-09-26',
    preferredTime: 'সকাল (৯টা – ১২টা)',
    items: [
      { id: 'bed', labelBn: 'বেড / খাট', quantity: 2 },
      { id: 'fridge', labelBn: 'ফ্রিজ', quantity: 1 },
      { id: 'sofa', labelBn: 'সোফা', quantity: 1 },
    ],
    pickupFloor: '3',
    destinationFloor: '2',
    hasLift: true,
    parkingInfo: 'বাসার সামনে ভ্যান রাখার জায়গা আছে',
    description: '৩ বেডরুমের বাসা থেকে ২ বেডরুমে স্থানান্তর। আলমারি ২টি, টিভি, ওয়াশিং মেশিন ও কয়েকটি বাক্স রাখা হবে।',
    photoUrls: [],
    contactName: 'নাজমা আক্তার',
    contactPhone: '01712-345678',
    adminNotes: '',
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'hm-9002',
    customerId: 'demo-user',
    serviceSlug: 'home-moving',
    status: 'reviewing',
    pickupAreaId: 'akua',
    destinationAreaId: 'natun-bazar',
    pickupAddress: 'আকুয়া, দুই নম্বর রোড, বাসা 43',
    destinationAddress: 'নতুন বাজার, মাসকান্দা সড়ক, বাসা 7',
    preferredDate: '2026-09-27',
    preferredTime: 'বিকেল (৩টা – ৬টা)',
    items: [
      { id: 'wardrobe', labelBn: 'আলমারি', quantity: 2 },
      { id: 'table', labelBn: 'টেবিল', quantity: 1 },
      { id: 'chair', labelBn: 'চেয়ার', quantity: 4 },
      { id: 'other', labelBn: 'অন্যান্য মালামাল' },
    ],
    pickupFloor: '5',
    destinationFloor: '1',
    hasLift: false,
    parkingInfo: 'ভ্যান নেওয়ার জন্য রাস্তা সরু, সাবধানতা প্রয়োজন',
    description: '',
    photoUrls: [],
    contactName: 'সোহেল রানা',
    contactPhone: '01812-345678',
    adminNotes: 'ফোন করে ভাঙাচোরা নিরাপত্তা নিশ্চিত করতে বলা হয়েছে।',
    createdAt: '2026-09-21T09:30:00Z',
    updatedAt: '2026-09-21T15:00:00Z',
  },
  {
    id: 'hm-9003',
    customerId: 'demo-user',
    serviceSlug: 'home-moving',
    status: 'completed',
    pickupAreaId: 'sankipara',
    destinationAreaId: 'akua',
    pickupAddress: 'সানকিপাড়া, ব্রাহ্মপল্লী, বাসা 21',
    destinationAddress: 'আকুয়া, মোড়লপাড়া, বাসা 9/বি',
    preferredDate: '2026-09-15',
    preferredTime: 'যেকোনো সময়',
    items: [
      { id: 'bed', labelBn: 'বেড / খাট', quantity: 1 },
      { id: 'tv', labelBn: 'টিভি', quantity: 1 },
      { id: 'washing_machine', labelBn: 'ওয়াশিং মেশিন', quantity: 1 },
    ],
    pickupFloor: '2',
    destinationFloor: 'ground',
    hasLift: true,
    parkingInfo: '',
    description: 'নিচতলার ফ্ল্যাটে উঠাবেন।',
    photoUrls: [],
    contactName: 'ফারিয়া ইসলাম',
    contactPhone: '01623-456789',
    adminNotes: 'কাজ সফলভাবে সম্পন্ন হয়েছে।',
    quotation: '৳২,৫০০',
    createdAt: '2026-09-13T10:00:00Z',
    updatedAt: '2026-09-16T12:00:00Z',
  },
];

let requests: HomeMovingRequest[] = [...SEED_REQUESTS];

export function mockAdminFetchHomeMovingRequests(): HomeMovingRequest[] {
  return [...requests].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

export function mockAdminFetchHomeMovingRequestById(id: string): HomeMovingRequest | undefined {
  return requests.find((r) => r.id === id);
}

export function mockAdminUpdateHomeMovingRequest(
  id: string,
  patch: { status?: ServiceRequestStatus; adminNotes?: string; quotation?: string }
): HomeMovingRequest | undefined {
  const idx = requests.findIndex((r) => r.id === id);
  if (idx === -1) return undefined;
  requests[idx] = {
    ...requests[idx],
    ...(patch.status ? { status: patch.status } : {}),
    ...(typeof patch.adminNotes === 'string' ? { adminNotes: patch.adminNotes } : {}),
    ...(typeof patch.quotation === 'string' ? { quotation: patch.quotation } : {}),
    updatedAt: new Date().toISOString(),
  };
  return requests[idx];
}

export function mockAdminFetchHomeMovingRequestStats(): number {
  return requests.filter(
    (r) => r.status === 'new' || r.status === 'submitted' || r.status === 'reviewing'
  ).length;
}