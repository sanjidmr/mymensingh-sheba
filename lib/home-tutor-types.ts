import type {
  HomeTutorProfile,
  TutorAvailability,
  TutorProfileStatus,
  TutorTeachingMode,
} from '@/lib/supabase/types';

// =========================================================================
//  HOME TUTOR (গৃহশিক্ষক) DOMAIN MODULE
//  Single-account model: the same MyMensinghSheba account is BOTH a
//  customer and a home tutor. Status lifecycle is admin-owned:
//  draft -> pending_approval -> approved (published) -> rejected/suspended.
//  PRIVACY: private_phone & nid_number are Admin-only. The public
//  directory never exposes private contact details.
// =========================================================================

export type { HomeTutorProfile };

export const TUTOR_STATUS_META: Record<
  TutorProfileStatus,
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
    labelBn: 'প্রকাশিত',
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
    labelBn: 'নিষিদ্ধ',
    badge: 'bg-red-100 text-red-700',
    chip: 'border-red-200 text-red-600',
    note: 'প্রোফাইলটি প্রশাসনের সিদ্ধান্তে স্থগিত করা হয়েছে।',
  },
};

export const TUTOR_TEACHING_MODE_LABELS: Record<TutorTeachingMode, string> = {
  home: 'বাসায় পড়াবেন',
  online: 'অনলাইনে পড়াবেন',
  both: 'বাসায় + অনলাইন',
};

export const TUTOR_AVAILABILITY_LABELS: Record<TutorAvailability, { labelBn: string; className: string }> = {
  available: { labelBn: 'প্রস্তুত / ফ্রি', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  limited: { labelBn: 'সীমিত সময়ে', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  busy: { labelBn: 'সাময়িক ব্যস্ত', className: 'bg-slate-50 text-slate-600 border-slate-200' },
};

export interface TutorJoin {
  id: string;
  fullName: string;
  teachingMode: TutorTeachingMode;
  subject: string;
  classLevel: string;
  areaId: string;
  preferredTime: string;
  budget: string;
  note: string;
}

export function formatTutorFee(min: number, max: number): string {
  if (!min && !max) return 'আলোচনা সাপেক্ষে';
  if (min && !max) return `৳${min.toLocaleString('bn-BD')} + (আলোচনা সাপেক্ষে)`;
  if (!min) return `৳${max.toLocaleString('bn-BD')} এর নিচে`;
  return `৳${min.toLocaleString('bn-BD')} – ${max.toLocaleString('bn-BD')} (মাসিক)`;
}

/** Keyword-based education filter. Tutoreducation is stored as free-text
 * institution / department / qualification, so we match against all of them. */
const EDUCATION_KEYWORDS: Record<string, string[]> = {
  medical: ['মেডিকেল', 'mbbs', 'হাত', 'বি.এম', 'এমবিবিএস'],
  university: ['বিশ্ববিদ্যালয়', 'বিশ্ববিদ্যালয়', 'ইউনিভার্সিটি', 'বাকৃবি', 'নজরুল', 'জাবি', 'ভূ', 'শেরপুর'],
  honours_masters: ['অনার্স', 'মাস্টার্স', 'আনার্স', 'হনার্স'],
  hsc: ['hsc', 'এইচএসসি', 'কলেজ', 'কুমুদিনী', 'পলিটেকনিক'],
  other: [],
};

export function matchesTutorEducation(tutor: HomeTutorProfile, educationId: string): boolean {
  if (!educationId || educationId === 'all') return true;
  const haystack =
    `${tutor.institution} ${tutor.department} ${tutor.qualification}`.toLowerCase();
  const keywords = EDUCATION_KEYWORDS[educationId] || [];
  return keywords.some((k) => haystack.includes(k.toLowerCase()));
}

/** subject filter id -> stored subject labels (stored as friendly Bangla labels). */
const SUBJECT_INCLUDE_ANY: Record<string, string[]> = {
  all_primary: ['সকল'],
  math: ['গণিত'],
  english: ['ইংরেজি', 'english'],
  physics: ['পদার্থ'],
  chemistry: ['রসায়ন'],
  biology: ['জীববিজ্ঞান'],
  ict: ['আইসিটি', 'তথ্য'],
  bangla: ['বাংলা'],
};

export function tutorSubjectMatches(subjectId: string, subjects: string[]): boolean {
  if (!subjectId || subjectId === 'all') return true;
  const needles = SUBJECT_INCLUDE_ANY[subjectId] || [];
  return needles.some((n) => subjects.some((s) => s.toLowerCase().includes(n.toLowerCase())));
}

/** class filter id -> stored class labels. */
const CLASS_INCLUDE_ANY: Record<string, string[]> = {
  primary: ['১ম'],
  middle: ['৬ষ্ঠ'],
  ssc: ['৯ম'],
  hsc: ['একাদশ', 'এইচএসসি', 'hsc'],
  admission: ['ভর্তি', 'এডমিশন'],
};

export function tutorClassMatches(classId: string, classes: string[]): boolean {
  if (!classId || classId === 'all') return true;
  const needles = CLASS_INCLUDE_ANY[classId] || [];
  return needles.some((n) => classes.some((c) => c.toLowerCase().includes(n.toLowerCase())));
}