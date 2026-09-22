import type {
  BloodDonorProfile,
  BloodDonorStatus,
  BloodRequest,
  BloodRequestStatus,
} from '@/lib/supabase/types';

// =========================================================================
//  BLOOD DONOR (রক্তদাতা) DOMAIN MODULE
//  Single-account model: the same MyMymensinghSheba account is BOTH a
//  customer and a volunteer blood donor. Donor status lifecycle is
//  admin-owned: draft -> pending_approval -> approved (published) ->
//  rejected / paused / suspended.
//  PRIVACY: private_phone is Admin-only. The public blood directory never
//  exposes phone numbers, addresses, or medical/private documents.
//  Blood is a volunteer, fully non-commercial service — no fees.
// =========================================================================

export type { BloodDonorProfile, BloodRequest };

export const DONOR_STATUS_META: Record<
  BloodDonorStatus,
  { labelBn: string; badge: string; chip: string; note: string }
> = {
  draft: {
    labelBn: 'খসড়া',
    badge: 'bg-slate-100 text-slate-600',
    chip: 'border-slate-200 text-slate-500',
    note: 'প্রোফাইলটি এখনও জমা দেওয়া হয়নি।',
  },
  pending_approval: {
    labelBn: 'পর্যালোচনায়',
    badge: 'bg-amber-100 text-amber-700',
    chip: 'border-amber-200 text-amber-600',
    note: 'প্রোফাইলটি প্রশাসকের পর্যালোচনার অপেক্ষায় আছে। অনুমোদনের পর পাবলিক ডিরেক্টরিতে প্রকাশিত হবে।',
  },
  approved: {
    labelBn: 'সক্রিয় রক্তদাতা',
    badge: 'bg-emerald-100 text-emerald-700',
    chip: 'border-emerald-200 text-emerald-600',
    note: 'প্রোফাইলটি পাবলিক ডিরেক্টরিতে প্রকাশিত এবং সক্রিয়।',
  },
  rejected: {
    labelBn: 'প্রত্যাখ্যাত',
    badge: 'bg-rose-100 text-rose-700',
    chip: 'border-rose-200 text-rose-600',
    note: 'প্রোফাইলটি অনুমোদিত হয়নি। নিচের কারণ দেখে সংশোধন করে আবার জমা দিন।',
  },
  paused: {
    labelBn: 'বিরতি',
    badge: 'bg-slate-100 text-slate-600',
    chip: 'border-slate-200 text-slate-500',
    note: 'প্রোফাইলটি সাময়িকভাবে পাবলিক ডিরেক্টরি থেকে লুকানো আছে।',
  },
  suspended: {
    labelBn: 'নিষ্ক্রিয়',
    badge: 'bg-red-100 text-red-700',
    chip: 'border-red-200 text-red-600',
    note: 'প্রোফাইলটি প্রশাসনের সিদ্ধান্তে স্থগিত করা হয়েছে।',
  },
};

export const BLOOD_REQUEST_STATUS_META: Record<
  BloodRequestStatus,
  { labelBn: string; badge: string; dot: string; customerHint: string }
> = {
  pending_review: {
    labelBn: 'পর্যালোচনায়',
    badge: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-500',
    customerHint: 'আপনার রক্তের অনুরোধটি অ্যাডমিন টিম পর্যালোচনা করছে।',
  },
  approved: {
    labelBn: 'অনুমোদিত',
    badge: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-500',
    customerHint: 'আপনার রক্তের অনুরোধটি অনুমোদিত হয়েছে। অ্যাডমিন রক্তদাতার সঙ্গে সমন্বয় করছেন।',
  },
  donor_contacted: {
    labelBn: 'রক্তদাতার সাথে যোগাযোগ',
    badge: 'bg-sky-100 text-sky-700',
    dot: 'bg-sky-500',
    customerHint: 'অ্যাডমিন রক্তদাতার সঙ্গে যোগাযোগ করেছেন। শিগগিরই আপনার সঙ্গে যোগাযোগ করা হবে।',
  },
  in_progress: {
    labelBn: 'চলমান',
    badge: 'bg-violet-100 text-violet-700',
    dot: 'bg-violet-500',
    customerHint: 'রক্তদানের ব্যবস্থা চলছে। প্রয়োজন হলে অ্যাডমিন আপনার মোবাইল নম্বরে কল করবেন।',
  },
  completed: {
    labelBn: 'সম্পন্ন',
    badge: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-500',
    customerHint: 'রক্তদানের ব্যবস্থা সম্পন্ন হয়েছে। রক্তদান একটি মানবিক সেবা — কোনো অর্থ আদান-প্রদান নয়।',
  },
  rejected: {
    labelBn: 'প্রত্যাখ্যাত',
    badge: 'bg-rose-100 text-rose-700',
    dot: 'bg-rose-500',
    customerHint: 'আপনার রক্তের অনুরোধটি অনুমোদিত হয়নি। বিস্তারিত জানতে অ্যাডমিনের কাছ থেকে মেসেজ দেখুন।',
  },
  cancelled: {
    labelBn: 'বাতিল',
    badge: 'bg-slate-100 text-slate-600',
    dot: 'bg-slate-400',
    customerHint: 'আপনার রক্তের অনুরোধটি বাতিল করা হয়েছে।',
  },
};

export const BLOOD_REQUEST_STATUSES: BloodRequestStatus[] = [
  'pending_review',
  'approved',
  'donor_contacted',
  'in_progress',
  'completed',
  'rejected',
  'cancelled',
];

export const DONOR_AVAILABILITY_LABELS: Record<
  'available' | 'unavailable',
  { labelBn: string; className: string }
> = {
  available: { labelBn: 'রক্তদানে প্রস্তুত', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  unavailable: { labelBn: 'বর্তমানে বিরতিতে', className: 'bg-slate-50 text-slate-600 border-slate-200' },
};

/** Friendly Bangla readout of the last donation + main health eligibility hint. */
export function formatLastDonation(date?: string): string {
  if (!date) return 'এখনও রক্ত দেননি';
  try {
    const d = new Date(date);
    const now = new Date();
    const months = Math.max(0, Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24 * 30)));
    if (months >= 4) return `${months} মাস আগে — রক্ত দেওয়ার উপযুক্ত সময়`;
    if (months >= 3) return `${months} মাস আগে (পুনরায় দেওয়ার সময় হয়েছে)`;
    if (months > 0) return `${months} মাস আগে`;
    return 'সম্প্রতি (৪ মাস অপেক্ষা করুন)';
  } catch {
    return date;
  }
}

/** Estimated compatibility — an honest, safe helper for Bangladeshi blood banks. */
const COMPATIBLE_DONORS: Record<string, string[]> = {
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  'AB-': ['A-', 'B-', 'AB-', 'O-'],
  'O+': ['O+', 'O-'],
  'O-': ['O-'],
};

export function canGiveBlood(donorGroup: string, patientGroup: string): boolean {
  return (COMPATIBLE_DONORS[patientGroup] || []).includes(donorGroup);
}