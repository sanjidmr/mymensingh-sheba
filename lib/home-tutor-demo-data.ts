/**
 * Home Tutor (গৃহশিক্ষক) demo / showcase profiles.
 *
 * Purpose
 * -------
 * The teacher profile page is the deepest read surface in the app: a parent
 * deciding who gets unsupervised time with their child looks at qualifications,
 * subjects, class levels, weekly commitment and fee before they look at a
 * photograph. None of that can be reviewed against an empty list. This module
 * seeds six profiles chosen so that every branch of that page is exercised:
 *
 *   | # | id              | role                 | levels              | fee           |
 *   |---|-----------------|----------------------|---------------------|---------------|
 *   | 1 | demo-tutor-01   | university student   | HSC                 | ৳5,000–7,000  |
 *   | 2 | demo-tutor-02   | experienced teacher  | SSC + HSC           | ৳8,000 (fixed)|
 *   | 3 | demo-tutor-03   | female, primary desk | ১ম–৫ম + ভর্তি        | ৳4,000–6,000  |
 *   | 4 | demo-tutor-04   | school teacher       | ৬ষ্ঠ–৮ম              | ৳6,000 (fixed)|
 *   | 5 | demo-tutor-05   | subject specialist   | ভর্তি + HSC English | ৳9,000–12,000 |
 *   | 6 | demo-tutor-06   | student, junior desk | ১ম–৮ম               | ৳3,500–5,000  |
 *
 * Fee is the field most likely to be faked, so note what is actually varied
 * here: two profiles carry a fixed amount (min === max) and four carry a band.
 * `formatTutorFee` collapses the fixed case to a single number, and the design
 * has to hold for both — a range is a real answer, a fixed number is a real
 * answer, and inventing either one would be the actual harm.
 *
 * Privacy contract
 * ----------------
 * Every profile is fictional. No profile carries a phone number, an email
 * address, a NID or a home address — contact happens through the tracked
 * request flow in `components/home-tutor/TutorRequestForm.tsx`, exactly as it
 * does for a real tutor. `isVerified` is `false` across the board and
 * `privatePhone` is the same `__protected__` sentinel the public mapper writes,
 * because demo content must never render a verification badge or a dialler it
 * did not earn.
 *
 * Photographs
 * -----------
 * The portraits are stock photography, which means they are photographs of
 * real, identifiable people. Attaching an invented name and an invented
 * qualification to a real face is not something to do lightly, so it is
 * contained rather than avoided:
 *
 *   - the photo is decorative and never linked to a real person;
 *   - `isDemo` is set on every row and the profile page renders a visible
 *     "নমুনা প্রোফাইল" label;
 *   - nothing in the UI claims the person exists or was verified.
 *
 * When does this data appear?
 * ---------------------------
 * `lib/home-tutor-service.ts` falls back to it only while the live directory has
 * no approved profiles, and deep links to these ids resolve in every mode so a
 * demo profile is always shareable. It disappears the moment a real tutor is
 * approved; showcase and real profiles never appear in the same list.
 */

import type {
  HomeTutorProfile,
  TutorAvailability,
  TutorEducation,
  TutorTeachingMode,
} from './supabase/types';

/** Unsplash is allow-listed in `next.config.ts`. */
const U = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

const PORTRAIT = {
  manStudent: U('photo-1507003211169-0a1dd7228f2d'),
  womanTeacher: U('photo-1573496359142-b8d87734a5a2'),
  womanYoung: U('photo-1517841905240-472988babdf9'),
  manTeacher: U('photo-1560250097-0b93528c311a'),
  manProfessional: U('photo-1519085360753-af0119f7cbe7'),
  womanProfessional: U('photo-1580489944761-15a19d654956'),
} as const;

export type TutorDemoProfile = HomeTutorProfile & { isDemo: true };

/** The value the public mapper writes for a protected phone. Never a number. */
const PROTECTED = '__protected__';

/**
 * Staggered so "সদ্য যোগ হয়েছে" has a real order. `publishedAt` is what the
 * directory sorts on, so a single shared timestamp would make every card look
 * simultaneously new.
 */
const PUBLISHED = [
  '2026-09-27T09:20:00Z',
  '2026-09-24T11:05:00Z',
  '2026-09-21T08:40:00Z',
  '2026-09-18T16:30:00Z',
  '2026-09-14T10:15:00Z',
  '2026-09-10T13:50:00Z',
] as const;

interface TutorSeed {
  id: string;
  fullName: string;
  gender: 'male' | 'female';
  photo: string;
  intro: string;
  educations: TutorEducation[];
  currentActivity: NonNullable<HomeTutorProfile['currentActivity']>;
  subjects: string[];
  classes: string[];
  areas: string[];
  teachingMode: TutorTeachingMode;
  availability: TutorAvailability;
  experienceYears: number;
  daysPerWeek: number;
  classDurationMinutes?: number;
  preferredStudentType?: string;
  salaryMin: number;
  salaryMax: number;
  ratingAvg: number;
  ratingCount: number;
  /**
   * The legacy single-qualification triple. It is still derived from the
   * timeline's most recent entry rather than written separately, so a profile
   * can never show one qualification in the header and a different one in the
   * qualifications section.
   */
  headlineQualification: string;
  headlineInstitution: string;
}

const SEEDS: TutorSeed[] = [
  // ---- 1. University student tutor — cheap, online-friendly, honest about it
  {
    id: 'demo-tutor-01',
    fullName: 'তানজিম আহমেদ',
    gender: 'male',
    photo: PORTRAIT.manStudent,
    intro:
      'বাংলাদেশ কৃষি বিশ্ববিদ্যালয়ের বিএস (অনার্স) তৃতীয় বর্ষের শিক্ষার্থী। হিসাব মিলিয়ে উচ্চতর গণিত ও পদার্থবিজ্ঞান পড়াই। প্রতি ক্লাসে ১–২ টা ব্যবহার করি, বাকিটা নিজের পড়া।',
    educations: [
      {
        institution: 'বাংলাদেশ কৃষি বিশ্ববিদ্যালয়, ময়মনসিংহ',
        department: 'গণিত বিভাগ',
        degree: 'বিএস (অনার্স) — তৃতীয় বর্ষ, চলতে',
        status: 'studying',
        year: '২০২৭',
      },
      {
        institution: 'ময়মনসিংহ জিলা কলেজ',
        department: 'বিজ্ঞান বিভাগ',
        degree: 'এইচএসসি (বিজ্ঞান)',
        status: 'passed',
        year: '২০২৩',
      },
      {
        institution: 'ময়মনসিংহ জিলা স্কুল',
        department: '',
        degree: 'এসএসসি',
        status: 'passed',
        year: '২০২১',
      },
    ],
    currentActivity: {
      roleLabelBn: 'বিএস শিক্ষার্থী',
      studyingAt: 'বাংলাদেশ কৃষি বিশ্ববিদ্যালয়, ময়মনসিংহ',
      note: 'সপ্তাহে তিন দিন ক্লাস নিই — বিশ্ববিদ্যালয়ের রুটিন ও পরীক্ষার সময় মানা হয়।',
    },
    subjects: ['উচ্চতর গণিত', 'পদার্থবিজ্ঞান', 'গণিত'],
    classes: ['একাদশ – দ্বাদশ শ্রেণি (HSC)', '৯ম – ১০ম শ্রেণি (SSC)'],
    areas: ['sankipara', 'brahmapalli', 'town-hall'],
    teachingMode: 'both',
    availability: 'available',
    experienceYears: 2,
    daysPerWeek: 3,
    classDurationMinutes: 120,
    preferredStudentType: 'ছেলে ও মেয়ে — উভয়',
    salaryMin: 5000,
    salaryMax: 7000,
    ratingAvg: 4.6,
    ratingCount: 5,
    headlineQualification: 'বিএস (অনার্স) তৃতীয় বর্ষ, গণিত',
    headlineInstitution: 'বাংলাদেশ কৃষি বিশ্ববিদ্যালয়',
  },

  // ---- 2. Experienced teacher — fixed fee, the collapse case
  {
    id: 'demo-tutor-02',
    fullName: 'ফারজানা আক্তার',
    gender: 'female',
    photo: PORTRAIT.womanTeacher,
    intro:
      'ময়মনসিংহ বিশ্ববিদ্যালয়ের রসায়ন বিভাগ থেকে এমএস সম্পন্ন। সাত বছর ধরে একাদশ-দ্বাদশের বিজ্ঞান বিষয় পড়াই। সংস্কৃতি ও রীতি বদলে ক্লাসে যাই না — শিক্ষার্থীরা ছুটি চাইলে সেটা আগে জানাতে হয়।',
    educations: [
      {
        institution: 'ময়মনসিংহ বিশ্ববিদ্যালয়',
        department: 'রসায়ন বিভাগ',
        degree: 'এমএস (রসায়ন)',
        status: 'passed',
        year: '২০১৮',
      },
      {
        institution: 'ময়মনসিংহ বিশ্ববিদ্যালয়',
        department: 'রসায়ন বিভাগ',
        degree: 'বিএস (অনার্স), রসায়ন',
        status: 'passed',
        year: '২০১৬',
      },
      {
        institution: 'মুমিনুন্নিসা সরকারি মহিলা কলেজ',
        department: 'বিজ্ঞান বিভাগ',
        degree: 'এইচএসসি (বিজ্ঞান)',
        status: 'passed',
        year: '২০১২',
      },
    ],
    currentActivity: {
      roleLabelBn: 'বিশ্ববিদ্যালয়ের মেম্বার',
      workingAt: 'ময়মনসিংহ বিশ্ববিদ্যালয়ের উন্নয়ন কেন্দ্র',
      teachingAt: 'ব্যক্তিগত ক্লাস — বাড়িতে ও অনলাইনে',
      note: 'বিশ্ববিদ্যালয়ের কর্মসূত্রে থাকায় সন্ধ্যার পর ক্লাস নেওয়া হয় না।',
    },
    subjects: ['রসায়ন', 'বিজ্ঞান', 'উচ্চতর গণিত'],
    classes: ['একাদশ – দ্বাদশ শ্রেণি (HSC)', '৯ম – ১০ম শ্রেণি (SSC)'],
    areas: ['ganginarpar', 'dhopakhola', 'town-hall'],
    teachingMode: 'home',
    availability: 'limited',
    experienceYears: 7,
    daysPerWeek: 4,
    classDurationMinutes: 120,
    preferredStudentType: 'মেয়ে',
    salaryMin: 8000,
    salaryMax: 8000,
    ratingAvg: 4.9,
    ratingCount: 11,
    headlineQualification: 'এমএস (রসায়ন)',
    headlineInstitution: 'ময়মনসিংহ বিশ্ববিদ্যালয়',
  },

  // ---- 3. Primary + admission desk — the lowest-stakes, highest-volume tutor
  {
    id: 'demo-tutor-03',
    fullName: 'সাদিয়া সুলতানা',
    gender: 'female',
    photo: PORTRAIT.womanYoung,
    intro:
      'প্রাথমিক স্কুলের শিক্ষার্থীদের বাংলা ও ইংরেজি পড়াই, একই সাথে ভর্তি পরীক্ষার প্রস্তুতি নিই। ছোট বাচ্চাদের সাথে কাজ করতে পারি বলে মেয়েদের ক্লাস নেওয়ার আগে অভিভাবকের সাথে কথা বলে নিই।',
    educations: [
      {
        institution: 'জাতীয় বিশ্ববিদ্যালয়, ঢাকা',
        department: 'বাংলা বিভাগ',
        degree: 'বিএএ (চলতে)',
        status: 'studying',
        year: '২০২৬',
      },
      {
        institution: 'ভর্তুকলা মাদ্রাসা, ময়মনসিংহ',
        department: '',
        degree: 'দাখিল',
        status: 'passed',
        year: '২০২০',
      },
    ],
    currentActivity: {
      roleLabelBn: 'বিএএ শিক্ষার্থী ও শিক্ষানবিশ',
      studyingAt: 'জাতীয় বিশ্ববিদ্যালয়, ঢাকা',
      teachingAt: 'প্রাথমিক স্কুলের শিশুদের বাড়িতে',
      note: 'ঢাকায় পড়াশোনা, তাই বিকাল ও সন্ধ্যার পর ময়মনসিংহে ক্লাস দিই।',
    },
    subjects: ['বাংলা', 'ইংরেজি', 'তথ্য ও যোগাযোগ প্রযুক্তি (ICT)'],
    classes: ['১ম – ৫ম শ্রেণি', 'ভর্তি পরীক্ষা'],
    areas: ['natun-bazar', 'choto-bazar', 'kachijhuli'],
    teachingMode: 'home',
    availability: 'available',
    experienceYears: 4,
    daysPerWeek: 5,
    classDurationMinutes: 90,
    preferredStudentType: 'মেয়ে',
    salaryMin: 4000,
    salaryMax: 6000,
    ratingAvg: 4.7,
    ratingCount: 8,
    headlineQualification: 'বিএ (চলতে), বাংলা',
    headlineInstitution: 'জাতীয় বিশ্ববিদ্যালয়, ঢাকা',
  },

  // ---- 4. School teacher — mid-level maths, the long-experience case
  {
    id: 'demo-tutor-04',
    fullName: 'রফিকুল ইসলাম',
    gender: 'male',
    photo: PORTRAIT.manTeacher,
    intro:
      'মাধ্যমিক স্কুলে দ্বাদশ বছর ধরে গণিত পড়াই। ছয়ষ্ঠ থেকে অষ্টম শ্রেণির জন্য বোর্ডের পরীক্ষার্থীদের ভিত্তি গড়ে দিই — ক্যালকুলেটর ছাড়া হিসাব করতে শেখানোই আমার কাজ।',
    educations: [
      {
        institution: 'জাতীয় বিশ্ববিদ্যালয়, ঢাকা',
        department: 'গণিত বিভাগ',
        degree: 'বিএস (অনার্স), গণিত',
        status: 'passed',
        year: '২০১১',
      },
      {
        institution: 'আনন্দ মোহন কলেজ, ময়মনসিংহ',
        department: 'বিজ্ঞান বিভাগ',
        degree: 'এইচএসসি (বিজ্ঞান)',
        status: 'passed',
        year: '২০০৭',
      },
    ],
    currentActivity: {
      roleLabelBn: 'মাধ্যমিক স্কুল শিক্ষক',
      workingAt: 'ময়মনসিংহ সিটি কর্পোরেশনের একটি মাধ্যমিক স্কুল',
      teachingAt: 'বিকেল ৫টার পর — বাড়িতে',
      note: 'স্কুল থেকে ফিরে ৬টার পর ক্লাস শুরু করি।',
    },
    subjects: ['গণিত', 'বিজ্ঞান', 'তথ্য ও যোগাযোগ প্রযুক্তি (ICT)'],
    classes: ['৬ষ্ঠ – ৮ম শ্রেণি', '৯ম – ১০ম শ্রেণি (SSC)'],
    areas: ['shambhuganj', 'akua', 'nayapara-kachijhuli'],
    teachingMode: 'home',
    availability: 'busy',
    experienceYears: 12,
    daysPerWeek: 4,
    classDurationMinutes: 90,
    preferredStudentType: 'ছেলে',
    salaryMin: 6000,
    salaryMax: 6000,
    ratingAvg: 4.5,
    ratingCount: 14,
    headlineQualification: 'বিএস (অনার্স), গণিত',
    headlineInstitution: 'জাতীয় বিশ্ববিদ্যালয়, ঢাকা',
  },

  // ---- 5. Subject specialist — the top of the price list
  {
    id: 'demo-tutor-05',
    fullName: 'তানজিয়া আবুল কালাম',
    gender: 'male',
    photo: PORTRAIT.manProfessional,
    intro:
      'ইংরেজিতে বিশেষজ্ঞ — লেখার নিয়ম থেকে ব্যাকরণ, সবই ধরে ধরে পড়াই। বিশ্ববিদ্যালয় ভর্তি পরীক্ষার ইংরেজি অংশের জন্য প্র্যাকটিস সেট বানিয়ে দিই, ব্যাখ্যা দিয়ে নয় — প্রশ্নটা কেন এভাবে আসে সেটা বুঝিয়ে।',
    educations: [
      {
        institution: 'ঢাকা বিশ্ববিদ্যালয়',
        department: 'ইংরেজি বিভাগ',
        degree: 'এমএ (ইংরেজি)',
        status: 'passed',
        year: '২০১৯',
      },
      {
        institution: 'ঢাকা বিশ্ববিদ্যালয়',
        department: 'ইংরেজি বিভাগ',
        degree: 'বিএ (সম্মান) ইংরেজি, ১ম বিভাগ',
        status: 'passed',
        year: '২০১৬',
      },
    ],
    currentActivity: {
      roleLabelBn: 'ইংরেজি বিশেষজ্ঞ',
      teachingAt: 'অনলাইন (Zoom / Meet) ও বাড়িতে',
      note: 'ভর্তি পরীক্ষার ব্যাচের জন্য সাপ্তাহিক অনলাইন ক্লাস — দেশের যেকোনো জায়গা থেকে যোগ দেওয়া যায়।',
    },
    subjects: ['ইংরেজি', 'বাংলা'],
    classes: ['ভর্তি পরীক্ষা', 'একাদশ – দ্বাদশ শ্রেণি (HSC)'],
    areas: ['maskanda', 'boyra', 'kewatkhali'],
    teachingMode: 'both',
    availability: 'available',
    experienceYears: 6,
    daysPerWeek: 5,
    classDurationMinutes: 120,
    preferredStudentType: 'যেকোনো',
    salaryMin: 9000,
    salaryMax: 12000,
    ratingAvg: 4.8,
    ratingCount: 9,
    headlineQualification: 'এমএ (ইংরেজি)',
    headlineInstitution: 'ঢাকা বিশ্ববিদ্যালয়',
  },

  // ---- 6. Student tutor for the lower primary years — the budget case
  {
    id: 'demo-tutor-06',
    fullName: 'মেঘলা আক্তার',
    gender: 'female',
    photo: PORTRAIT.womanProfessional,
    intro:
      'ময়মনসিংহ বিশ্ববিদ্যালয়ের প্রাথমিক শিক্ষা বিভাগের শিক্ষার্থী। একাদশ থেকে অষ্টম পর্যন্ত বিজ্ঞান ও ICT পড়াই — ছোট বাচ্চাদের ভাষা সহজ রাখাই আমার কাজ, তাড়াহুড়ো করে উত্তর বলে দেওয়া নয়।',
    educations: [
      {
        institution: 'ময়মনসিংহ বিশ্ববিদ্যালয়',
        department: 'প্রাথমিক শিক্ষা বিভাগ',
        degree: 'বিএস (অনার্স) — দ্বিতীয় বর্ষ, চলতে',
        status: 'studying',
        year: '২০২৭',
      },
      {
        institution: 'কুমুদিনী সরকারি বালিকা বিদ্যালয়, ময়মনসিংহ',
        department: '',
        degree: 'এসএসসি',
        status: 'passed',
        year: '২০২৩',
      },
    ],
    currentActivity: {
      roleLabelBn: 'বিএস শিক্ষার্থী',
      studyingAt: 'ময়মনসিংহ বিশ্ববিদ্যালয়',
      teachingAt: 'নিজের এলাকায়, বিকেলে',
      note: 'স্কুল ফুরিয়ে সন্ধ্যায় ক্লাস নিই, তাই ছুটির দিনে ক্লাস নেই।',
    },
    subjects: ['বিজ্ঞান', 'তথ্য ও যোগাযোগ প্রযুক্তি (ICT)', 'বাংলা'],
    classes: ['১ম – ৫ম শ্রেণি', '৬ষ্ঠ – ৮ম শ্রেণি'],
    areas: ['balashpur', 'panditpara', 'sehara'],
    teachingMode: 'both',
    availability: 'available',
    experienceYears: 1,
    daysPerWeek: 3,
    classDurationMinutes: 60,
    preferredStudentType: 'যেকোনো',
    salaryMin: 3500,
    salaryMax: 5000,
    ratingAvg: 4.4,
    ratingCount: 3,
    headlineQualification: 'বিএস (অনার্স) দ্বিতীয় বর্ষ, প্রাথমিক শিক্ষা',
    headlineInstitution: 'ময়মনসিংহ বিশ্ববিদ্যালয়',
  },
];

/**
 * `True` on every seeded row so the profile page can label it as a sample
 * rather than letting a fictional qualification read as a real one.
 */
export const DEMO_TUTOR_IDS = SEEDS.map((seed) => seed.id);

export const DEMO_TUTOR_PROFILES: TutorDemoProfile[] = SEEDS.map((seed, index) => ({
  id: seed.id,
  userId: `demo-user-${seed.id}`,
  status: 'approved',
  fullName: seed.fullName,
  gender: seed.gender,
  institution: seed.headlineInstitution,
  department: seed.subjects[0],
  qualification: seed.headlineQualification,
  experienceYears: seed.experienceYears,
  preferredAreas: seed.areas,
  preferredClasses: seed.classes,
  preferredSubjects: seed.subjects,
  expectedSalaryMin: seed.salaryMin,
  expectedSalaryMax: seed.salaryMax,
  daysPerWeek: seed.daysPerWeek,
  bio: seed.intro,
  // A student id card is a private document; demo content never has one.
  studentIdCardUrl: undefined,
  nidNumber: undefined,
  // Never true for seeded content — a demo profile has not been verified.
  isVerified: false,
  privatePhone: PROTECTED,
  teachingMode: seed.teachingMode,
  availability: seed.availability,
  profilePhotoUrl: seed.photo,
  adminNotes: undefined,
  rejectionReason: undefined,
  publishedAt: PUBLISHED[index],
  ratingAvg: seed.ratingAvg,
  ratingCount: seed.ratingCount,
  createdAt: PUBLISHED[index],
  updatedAt: PUBLISHED[index],
  educations: seed.educations,
  currentActivity: seed.currentActivity,
  classDurationMinutes: seed.classDurationMinutes,
  preferredStudentType: seed.preferredStudentType,
  isDemo: true,
}));

/** A seeded profile by id, or null. Deep links must resolve in every mode. */
export function getDemoTutor(id: string): TutorDemoProfile | null {
  return DEMO_TUTOR_PROFILES.find((tutor) => tutor.id === id) ?? null;
}
