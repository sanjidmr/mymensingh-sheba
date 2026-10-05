import type {
  HomeTutorProfile,
  TutorAvailability,
  TutorEducationStatus,
  TutorProfileStatus,
  TutorTeachingMode,
} from '@/lib/supabase/types';
import { toBn } from '@/lib/catalog-types';

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
  available: { labelBn: 'প্রস্তুত', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
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

/**
 * Monthly fee, in Bangla, for a tutor profile.
 *
 * The three shapes a real tutor quotes, and all three have to read naturally:
 *   - a fixed fee            → "৳৫,০০০ (মাসিক)"
 *   - a band                → "৳৫,০০০ – ৳৭,০০০ (মাসিক)"
 *   - an open end            → "৳৫,০০০ + (আলোচনা সাপেক্ষে)"
 *
 * `min === max` is the fixed case and is common enough to matter: a tutor who
 * quotes one number is the single most common row in the directory, and printing
 * "৳৫,০০০ – ৳৫,০০০" for it looks like a bug rather than a quote.
 */
export function formatTutorFee(min: number, max: number): string {
  if (!min && !max) return 'আলোচনা সাপেক্ষে';
  if (min && !max) return `৳${min.toLocaleString('bn-BD')} + (আলোচনা সাপেক্ষে)`;
  if (!min) return `৳${max.toLocaleString('bn-BD')} এর নিচে`;
  if (min === max) return `৳${min.toLocaleString('bn-BD')} (মাসিক)`;
  return `৳${min.toLocaleString('bn-BD')} – ৳${max.toLocaleString('bn-BD')} (মাসিক)`;
}

/**
 * The five class bands a Bangladeshi home tutor actually quotes for.
 *
 * This is an ORDERING aid, not a display taxonomy. `preferredClasses` stores
 * whatever the tutor typed — "১ম – ৫ম শ্রেণি", "ক্লাস ৩", "প্রাইমারি" — so the
 * detail page must render those strings verbatim rather than force them into a
 * fixed vocabulary and mangle them. What this list buys is a sensible order for
 * the chips: primary first, admission last, which is the order a parent reads
 * them in. Anything unrecognised keeps its place at the end, still rendered as
 * typed, so no value is ever dropped.
 */
export const TUTOR_CLASS_LEVELS: { id: string; labelBn: string; needles: string[] }[] = [
  {
    id: 'primary',
    labelBn: '১ম – ৫ম শ্রেণি',
    needles: ['১ম', '১-৫', '১০ম', 'প্রাইমারি', 'primary', 'ক্লাস ১', 'ক্লাস ২', 'ক্লাস ৩', 'ক্লাস ৪', 'ক্লাস ৫'],
  },
  {
    id: 'middle',
    labelBn: '৬ষ্ঠ – ৮ম শ্রেণি',
    needles: ['৬ষ্ঠ', '৬-৮', '৮ম', 'মাধ্যমিক', 'middle'],
  },
  {
    id: 'ssc',
    labelBn: '৯ম – ১০ম শ্রেণি (SSC)',
    needles: ['৯ম', '৯-১০', 'দশম', 'এসএসসি', 'ssc'],
  },
  {
    id: 'hsc',
    labelBn: 'একাদশ – দ্বাদশ শ্রেণি (HSC)',
    needles: ['একাদশ', 'দ্বাদশ', 'এইচএসসি', 'hsc', '১১', '১২'],
  },
  {
    id: 'admission',
    labelBn: 'ভর্তি পরীক্ষা',
    needles: ['ভর্তি', 'এডমিশন', 'admission', 'পরীক্ষা'],
  },
];

/** Index of a stored class string in the canonical order, or Infinity. */
function classLevelRank(value: string): number {
  const haystack = value.toLowerCase();
  const index = TUTOR_CLASS_LEVELS.findIndex((band) =>
    band.needles.some((needle) => haystack.includes(needle.toLowerCase()))
  );
  return index === -1 ? Number.POSITIVE_INFINITY : index;
}

/**
 * The class strings a tutor declared, in primary-to-admission order.
 *
 * Duplicates are dropped and unrecognised values are kept verbatim, because a
 * band this list has never heard of is still something the tutor said they
 * teach, and hiding it would be the page quietly narrowing what they offer.
 */
export function sortTutorClasses(classes: string[]): string[] {
  const seen = new Set<string>();
  return classes
    .map((value) => value.trim())
    .filter((value) => {
      if (!value || seen.has(value)) return false;
      seen.add(value);
      return true;
    })
    .sort((a, b) => classLevelRank(a) - classLevelRank(b));
}

/** Which band a stored class string belongs to, or null if unrecognised. */
export function tutorClassBand(value: string): string | null {
  return TUTOR_CLASS_LEVELS[classLevelRank(value)]?.id ?? null;
}

/**
 * How each education row should be read.
 *
 * `passed` and `completed` are different words for the same fact, and both exist
 * in the table because two admins typed them. They render the same so the
 * timeline does not look like it is making a distinction it cannot support.
 */
export const TUTOR_EDUCATION_STATUS_LABELS: Record<
  TutorEducationStatus,
  { labelBn: string; className: string }
> = {
  passed: { labelBn: 'পাশ করেছেন', className: 'border-brand-200 bg-brand-50 text-brand-700' },
  completed: { labelBn: 'পাশ করেছেন', className: 'border-brand-200 bg-brand-50 text-brand-700' },
  studying: { labelBn: 'চলতে', className: 'border-accent-200 bg-accent-100/70 text-accent-700' },
};

/**
 * Class duration as the phrase a parent would say it.
 *
 * Bangla digits throughout. The `whole === 1` branch exists because Bangla
 * counts "1 ঘণ্টা" without the plural ঘণ্টাা/ঘণ্টার form that a naive
 * `${n} ঘণ্টা` produces — but the number itself still goes through `toBn`, or
 * "1 ঘণ্টা 30 মিনিট" ends up half-ASCII and half-Bangla next to the rest of
 * the page.
 */
export function formatClassDuration(minutes?: number): string | undefined {
  if (!minutes || minutes <= 0) return undefined;
  if (minutes < 60) return `${toBn(minutes)} মিনিট`;
  const hours = minutes / 60;
  const whole = Math.floor(hours);
  const rest = minutes % 60;
  if (rest === 0) return whole === 1 ? '১ ঘণ্টা' : `${toBn(whole)} ঘণ্টা`;
  return `${toBn(whole)} ঘণ্টা ${toBn(rest)} মিনিট`;
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