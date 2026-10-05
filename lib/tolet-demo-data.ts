/**
 * To-Let demo / showcase inventory.
 *
 * Purpose
 * -------
 * The listing detail page is a design-heavy surface, and a detail page with
 * nothing behind it teaches you nothing. This module is the seed that makes
 * `/tolet` and `/tolet/[id]` fully renderable on a fresh checkout, and it
 * deliberately spans every property type and every fee slab so the layout,
 * the rent card and the contact flow can all be reviewed honestly:
 *
 *   | # | id                  | type     | area         | rent    | fee |
 *   |---|---------------------|----------|--------------|---------|-----|
 *   | 1 | tl-101              | family   | চরপাড়া        | 14,000  | 200 |
 *   | 2 | tl-102              | family   | সানকিপাড়া      |  9,500  | 100 |
 *   | 3 | tl-103              | flat     | কাঁচিঝুলি      | 22,000  | 400 |
 *   | 4 | tl-104              | seat     | নতুন বাজার     |  2,800  |  50 |
 *   | 5 | tl-105              | family   | আকুয়া         |  8,500  | 100 |
 *   | 6 | tl-106              | sublet   | নওমহল         |  4,500  | 100 |
 *   | 7 | demo-bachelor-01    | bachelor | ব্রাহ্মপল্লী    |  7,000  | 100 |
 *   | 8 | demo-mess-01        | mess     | গাঙ্গিনারপাড়   |  5,200  |  50 |
 *   | 9 | demo-hostel-01      | hostel   | ভাটিকাশর       |  3,800  |  50 |
 *   |10 | demo-luxury-01      | flat     | টাউন হল        | 32,000  | 400 |
 *
 * The first six keep the ids and the copy that earlier revisions of this app
 * shipped (`SAMPLE_TOLET_LISTINGS` in `lib/services-data.ts`, still used by the
 * homepage preview section), so every existing bookmark and preview link keeps
 * resolving. They are upgraded here with multiple photos, an explicit
 * "যা নেই" list and corrected fee slabs.
 *
 * Privacy contract
 * ----------------
 * Everything here is invented. No listing carries a phone number, email or the
 * photo of a person, the owner labels are role- or placeholder-names rather
 * than a real individual's details, and the addresses are neighbourhood-level
 * (never a house number). `isVerified` is `false` on all of them — demo content
 * must never render a verification badge it did not earn. The map marker is an
 * area centroid, never a specific plot (see `lib/mymensingh-geo.ts`).
 *
 * When does this data appear?
 * ---------------------------
 * `lib/tolet-service.ts` only falls back to it while the live marketplace has
 * no approved listings, so it disappears the moment real inventory exists.
 */

import type { ToletListing, ToletOwnerMeta } from './tolet-types';

/** Base query string for every demo photo — Unsplash is allow-listed in next.config. */
const U = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1280&q=80`;

/** Preview thumbnails reuse the same photo at a smaller width. */
export const DEMO_PHOTO_PARAMS = { auto: 'format', fit: 'crop', q: '80' as const };

const PHOTO = {
  livingWarm: U('photo-1502672260266-1c1ef2d93688'),
  livingBright: U('photo-1522708323590-d24dbb6b0267'),
  livingModern: U('photo-1560448204-e02f11c3d0e2'),
  livingOpen: U('photo-1600210492486-724fe5c67fb0'),
  flatExterior: U('photo-1600585154340-be6161a56a0c'),
  houseExterior: U('photo-1512917774080-9991f1c4c750'),
  buildingExterior: U('photo-1600585152220-90363fe7e115'),
  apartmentFacade: U('photo-1560185007-cde436f6a4d0'),
  bedroomWood: U('photo-1600121848594-d8644e57abab'),
  bedroomSoft: U('photo-1600489000022-c2086d79f9d4'),
  bedroomClassic: U('photo-1505693416388-ac5ce068fe85'),
  bedroomLight: U('photo-1600566753086-00f18fb6b3ea'),
  kitchenModern: U('photo-1600573472550-8090b5e0745e'),
  kitchenSimple: U('photo-1416331108676-a22ccb276e35'),
  kitchenDining: U('photo-1605276374104-dee2a0ed3cd6'),
  bathModern: U('photo-1595526114035-0d45ed16cfbf'),
  bathClean: U('photo-1554995207-c18c203602cb'),
  diningWarm: U('photo-1556228720-195a672e8a03'),
  dormBunk: U('photo-1571003123894-1f0594d2b5d9'),
  hostelRoom: U('photo-1555854877-bab0e564b8d5'),
  sharedRoom: U('photo-1616486338812-3dadae4b4ace'),
  compactRoom: U('photo-1513694203232-719a280e022f'),
  interiorCorner: U('photo-1586023492125-27b2c045efd7'),
  interiorCalm: U('photo-1616594039964-ae9021a400a0'),
  balconyOpen: U('photo-1507089947368-19c1da9775ae'),
} as const;

export type ToletDemoListing = ToletListing & {
  /** Marks seeded content so the UI can label it honestly as a sample. */
  isDemo: true;
};

/**
 * Demo content is stamped with fixed, staggered dates so the "নতুন আগে" sort
 * has a meaningful order. `publishedAt` is what the directory sorts on.
 */
const PUBLISHED = [
  '2026-09-28T09:10:00Z',
  '2026-09-26T11:35:00Z',
  '2026-09-24T08:05:00Z',
  '2026-09-22T15:20:00Z',
  '2026-09-21T10:00:00Z',
  '2026-09-19T12:45:00Z',
  '2026-09-17T09:30:00Z',
  '2026-09-15T17:10:00Z',
  '2026-09-12T08:50:00Z',
  '2026-09-09T13:15:00Z',
] as const;

interface DemoSeed {
  id: string;
  ownerId: string;
  ownerMeta: ToletOwnerMeta;
  title: string;
  propertyType: ToletListing['propertyType'];
  areaId: string;
  specificAddress: string;
  rentPrice: number;
  bedrooms: number;
  bathrooms: number;
  balconies: number;
  floor: string;
  totalRooms?: number;
  availableFrom: string;
  facilities: string[];
  unavailableFacilities?: string[];
  description: string;
  photos: string[];
}

const SEEDS: DemoSeed[] = [
  // ---- 1. ফ্যামিলি বাসা (10k–20k slab → ৳200) ---------------------------
  {
    id: 'tl-101',
    ownerId: 'demo-owner-tl101',
    ownerMeta: {
      initials: 'সা',
      roleLabelBn: 'বিল্ডিং মালিক',
      memberSinceBn: '২০২৪ সাল থেকে',
      isDemo: true,
    },
    title: 'চরপাড়া মেডিকেল কলেজ সংলগ্ন আলো-বাতাসপূর্ণ ফ্যামিলি ফ্ল্যাট',
    propertyType: 'family',
    areaId: 'charpara',
    specificAddress: 'চরপাড়া নাহার মেমোরিয়াল রোড, ময়মনসিংহ',
    rentPrice: 14000,
    bedrooms: 3,
    bathrooms: 2,
    balconies: 2,
    floor: '৪র্থ তলা',
    availableFrom: 'আগামী মাসের ১লা তারিখ থেকে',
    facilities: ['lift', 'cylinder', 'generator', 'cctv', 'water', 'water_purifier'],
    unavailableFacilities: ['parking'],
    description:
      'ময়মনসিংহ মেডিকেল কলেজ হাসপাতাল ও আনন্দ মোহন কলেজের নিকটবর্তী, শান্ত নিরিবিলি পরিবেশে দক্ষিণমুখী আলো-বাতাসপূর্ণ বাসা। মেডিকেল কলেজ, নাহার মেমোরিয়াল ও বাজার সবই হাঁটার দূরত্বে।\n\nতিনটি বেডরুম, দুইটি বাথরুম ও দুইটি বারান্দা। বিল্ডিংে লিফট, জেনারেটর ব্যাকআপ ও নিরাপত্তা ক্যামেরা আছে। রাস্তার ওপরে গাড়ি রাখার সুবিধা নেই — এজন্য মোটরসাইকেলের জন্য নির্দিষ্ট স্ট্যান্ড আছে।\n\nশুধুমাত্র পরিবারের জন্য প্রযোজ্য। ইজারা দিতে হবে ১ মাসের অগ্রিম হিসেবে।',
    photos: [
      PHOTO.livingBright,
      PHOTO.bedroomWood,
      PHOTO.kitchenModern,
      PHOTO.flatExterior,
    ],
  },

  // ---- 2. সাশ্রয়ী ফ্যামিলি বাসা (≤10k slab → ৳100) ----------------------
  {
    id: 'tl-102',
    ownerId: 'demo-owner-tl102',
    ownerMeta: {
      initials: 'আ',
      roleLabelBn: 'বাসা মালিক',
      memberSinceBn: '২০২৫ সাল থেকে',
      isDemo: true,
    },
    title: 'সানকিপাড়া শেষ মোড়ে নিরিবিলি পরিবেশে সাশ্রয়ী ২ বেডের বাসা',
    propertyType: 'family',
    areaId: 'sankipara',
    specificAddress: 'সানকিপাড়া শেষ মোড়, রেলওয়ে কলোনি সংলগ্ন',
    rentPrice: 9500,
    bedrooms: 2,
    bathrooms: 1,
    balconies: 1,
    floor: '২য় তলা',
    availableFrom: 'চলতি মাস থেকেই',
    facilities: ['gas', 'water', 'rooftop', 'private_bath'],
    unavailableFacilities: ['lift', 'generator', 'parking'],
    description:
      'সানকিপাড়া শেষ মোড়ের শান্ত আবাসিক পরিবেশে দুই বেডরুমের বাসা। তিতাস লাইন গ্যাস সংযোগ আছে, তাই সিলিন্ডারের খরচ বাঁচে।\n\nছাদ খোলা, উপরে দোয়া হলেও উপরের দিকে বাড়ি নেই। বিল্ডিং দুই তলার, লিফট নেই — তবে দ্বিতীয় তলা হওয়ায় সিঁড়ি দিয়ে ওঠা সহজ।\n\nনিরিবিলি ছোট পরিবারের জন্য চমৎকার। এক-দুই সন্তানের পরিবারেই ভালো চলবে।',
    photos: [
      PHOTO.compactRoom,
      PHOTO.bedroomClassic,
      PHOTO.kitchenSimple,
      PHOTO.houseExterior,
    ],
  },

  // ---- 3. প্রিমিয়াম ফ্ল্যাট (20k+ slab → ৳400) -------------------------
  {
    id: 'tl-103',
    ownerId: 'demo-owner-tl103',
    ownerMeta: {
      initials: 'জা',
      roleLabelBn: 'রেজিস্ট্রেস ম্যানেজার',
      memberSinceBn: '২০২৩ সাল থেকে',
      isDemo: true,
    },
    title: 'কাঁচিঝুলি জিলা স্কুল রোডে আধুনিক ও পার্কিংসহ ৩ বেডরুম ফ্ল্যাট',
    propertyType: 'flat',
    areaId: 'kachijhuli',
    specificAddress: 'কাঁচিঝুলি মোড়, ময়মনসিংহ জিলা স্কুল সংলগ্ন',
    rentPrice: 22000,
    bedrooms: 3,
    bathrooms: 3,
    balconies: 3,
    floor: '৫ম তলা',
    availableFrom: 'আগামী মাসের ১লা তারিখ থেকে',
    facilities: [
      'lift',
      'generator',
      'cctv',
      'parking',
      'gas',
      'power_backup',
      'water',
    ],
    description:
      'শহরের সবচেয়ে সুবিধাজনক কাঁচিঝুলি জিলা স্কুল মোড়ে আধুনিক সুবিধাসম্পন্ন ফ্ল্যাট। তিনটি বেডরুম, তিনটি বাথরুম, তিনটি বারান্দা এবং একটি বড় বারান্দা-ডাইনিং।\n\nভবনে লিফট, জেনারেটর, ইন্টারকম, লিংকড ওয়াটার সিস্টেম, ২৪ ঘণ্টা সিকিউরিটি গার্ড এবং বাড়ির নিচে নির্দিষ্ট কার পার্কিং রয়েছে।\n\nসার্কিট হাউস, সরকারি দপ্তর ও বাণিজ্যিক এলাকা হাঁটার দূরত্বে — চাকরিজীবী ও প্রতিষ্ঠানের কর্মকর্তাদের জন্য আদর্শ।',
    photos: [
      PHOTO.livingModern,
      PHOTO.bedroomSoft,
      PHOTO.bathModern,
      PHOTO.apartmentFacade,
    ],
  },

  // ---- 4. মেস সিট (mess-like → ৳50) ----------------------------------
  {
    id: 'tl-104',
    ownerId: 'demo-owner-tl104',
    ownerMeta: {
      initials: 'র',
      roleLabelBn: 'মেস ম্যানেজার',
      memberSinceBn: '২০২৪ সাল থেকে',
      isDemo: true,
    },
    title: 'নতুন বাজার ও টাউন হল সংলগ্ন চাকরিজীবী ও শিক্ষার্থী মেস সিট',
    propertyType: 'seat',
    areaId: 'natun-bazar',
    specificAddress: 'নতুন বাজার পোস্ট অফিস রোড, টাউন হলের পাশে',
    rentPrice: 2800,
    bedrooms: 1,
    bathrooms: 1,
    balconies: 1,
    floor: '৩য় তলা',
    totalRooms: 6,
    availableFrom: 'এখনই ঢুকতে পারবেন',
    facilities: [
      'wifi',
      'mill',
      'water_purifier',
      'service',
      'shared_kitchen',
      'water',
      'balcony',
    ],
    unavailableFacilities: ['lift', 'parking', 'private_bath'],
    description:
      'পড়াশোনা ও চাকরির জন্য আদর্শ নিরিবিলি পরিবেশ। বড় রুম, ভালো আলো-বাতাস, আলাদা ছয়টি সিট।\n\nভাড়ার সাথে খাবার, ফিল্টারড পানি, ওয়াইফাই ও বুয়া সুবিধা চালু আছে — মাসে ২,৮০০ টাকার বেশি কিছু লাগে না।\n\nছেলে-মেয়ে অতিথির জন্য আলাদা বাথরুম নেই, সবাই একই বাথরুম ব্যবহার করবেন। রাত ১০টার পর শব্দ নিষিদ্ধ। প্রতি মাসের ৫ তারিখের মধ্যে ভাড়া দিতে হবে।',
    photos: [
      PHOTO.hostelRoom,
      PHOTO.dormBunk,
      PHOTO.kitchenDining,
      PHOTO.sharedRoom,
    ],
  },

  // ---- 5. ছোট বাজেটের ফ্যামিলি বাসা (≤10k slab → ৳100) ---------------
  {
    id: 'tl-105',
    ownerId: 'demo-owner-tl105',
    ownerMeta: {
      initials: 'ই',
      roleLabelBn: 'বাসা মালিক',
      memberSinceBn: '২০২৫ সাল থেকে',
      isDemo: true,
    },
    title: 'আকুয়া চৌরঙ্গী মোড়ে খোলামেলা ২ বেডরুম বাসা',
    propertyType: 'family',
    areaId: 'akua',
    specificAddress: 'আকুয়া চৌরঙ্গী মোড়, ফুলবাড়ীয়া রোডের মোড়',
    rentPrice: 8500,
    bedrooms: 2,
    bathrooms: 2,
    balconies: 1,
    floor: '১ম তলা',
    availableFrom: 'চলতি মাসের ১৫ তারিখ থেকে',
    facilities: ['water', 'balcony', 'parking', 'gas'],
    unavailableFacilities: ['lift', 'generator', 'cctv'],
    description:
      'কম খরচে সুন্দর ও খোলামেলা বাসা। আকুয়া চৌরঙ্গী মোড়ের প্রধান সড়কের কাছে, তাই যাতায়াত অত্যন্ত সহজ।\n\nপ্রথম তলায় হওয়ায় বৃদ্ধ ছোট ভাই-বোনদের জন্য উপচে ওঠার সমস্যা নেই। বাড়ির সামনে মোটরসাইকেল রাখার জায়গা আছে।\n\nদুই বেডরুম, দুই বাথরুম, একটি বারান্দা। লিফট ও জেনারেটর নেই — স্বল্প বাজেটের সীমার মধ্যে রাখতে এগুলো দেওয়া হয়নি।',
    photos: [
      PHOTO.livingWarm,
      PHOTO.bedroomLight,
      PHOTO.bathClean,
      PHOTO.balconyOpen,
    ],
  },

  // ---- 6. সাবলেট রুম (≤10k slab → ৳100; সাবলেট mess-like নয়) ---------
  {
    id: 'tl-106',
    ownerId: 'demo-owner-tl106',
    ownerMeta: {
      initials: 'সে',
      roleLabelBn: 'বাসা মালিক',
      memberSinceBn: '২০২৫ সাল থেকে',
      isDemo: true,
    },
    title: 'নওমহল সরকারি প্রাথমিক বিদ্যালয় সংলগ্ন নিরিবিলি সাবলেট রুম',
    propertyType: 'sublet',
    areaId: 'nawmahal',
    specificAddress: 'নওমহল লেন-৩, নাসিরাবাদ কলেজের পাশে',
    rentPrice: 4500,
    bedrooms: 1,
    bathrooms: 1,
    balconies: 1,
    floor: '২য় তলা',
    availableFrom: 'চলতি মাস থেকে',
    facilities: ['private_bath', 'balcony', 'shared_kitchen', 'gas'],
    unavailableFacilities: ['wifi', 'lift', 'generator'],
    description:
      'ছোট চাকরিজীবী পরিবার বা মেয়ে-শিক্ষার্থীদের জন্য নিরাপদ সাবলেট রুম। চমৎকার পারিবারিক পরিবেশ, প্রথম তলার উপরে তাই মোটরসাইকেল রাখা যায়।\n\nআলাদা বাথরুম, আলাদা বারান্দা আর রান্নাঘর শেয়ার করতে হবে। ওয়াইফাই সুবিধা নেই, ফলে মাসে কোনো ইন্টারনেট বিলও যোগ হবে না।\n\nচাকরিজীবী ছেলে-মেয়ে বা একা থাকা পড়ুয়া ছাত্রী — এই ধরনের ভাড়াটিয়ের জন্য তৈরি।',
    photos: [
      PHOTO.interiorCorner,
      PHOTO.bedroomWood,
      PHOTO.kitchenSimple,
      PHOTO.houseExterior,
    ],
  },

  // ---- 7. ব্যাচেলর বাসা (≤10k slab → ৳100) --------------------------
  {
    id: 'demo-bachelor-01',
    ownerId: 'demo-owner-bachelor',
    ownerMeta: {
      initials: 'ফা',
      roleLabelBn: 'বাসা মালিক',
      memberSinceBn: '২০২৪ সাল থেকে',
      isDemo: true,
    },
    title: 'ব্রাহ্মপল্লী আনন্দ মোহন কলেজ রোডে ব্যাচেলরদের জন্য ২ বেডরুম ফ্ল্যাট',
    propertyType: 'bachelor',
    areaId: 'brahmapalli',
    specificAddress: 'ব্রাহ্মপল্লী মোড়, আনন্দ মোহন কলেজ রোড',
    rentPrice: 7000,
    bedrooms: 2,
    bathrooms: 1,
    balconies: 1,
    floor: '৩য় তলা',
    availableFrom: 'আগামী মাস থেকে',
    facilities: ['wifi', 'lift', 'water', 'gas', 'service', 'private_bath', 'balcony'],
    unavailableFacilities: ['generator'],
    description:
      'আনন্দ মোহন কলেজ ও ময়মনসিংহ বিশ্ববিদ্যালয়ের শিক্ষার্থীদের জন্য বিশেষভাবে সাজানো ব্যাচেলর ফ্ল্যাট। ক্যাম্পাস হাঁটার দূরত্বে, কলেজ বাসের স্টপেজও কাছে।\n\nদুইটি বেডরুম হওয়ায় চারজন পর্যন্ত ব্যাচেলর থাকতে পারবে — ছেলে-মেয়ে একসাথে থাকার অনুমতি নেই। বিলের মধ্যে ওয়াইফাই ও ওয়াটার চার্জ অন্তর্ভুক্ত।\n\nএকা থাকা চাকরিজীবী বা পরীক্ষার্থীর জন্য আদর্শ। শিক্ষার্থী মেয়েরা যোগাযোগ করতে পারবেন না।',
    photos: [
      PHOTO.livingOpen,
      PHOTO.bedroomSoft,
      PHOTO.kitchenModern,
      PHOTO.buildingExterior,
    ],
  },

  // ---- 8. ফ্যামিলি মেস (mess-like → ৳50) -----------------------------
  {
    id: 'demo-mess-01',
    ownerId: 'demo-owner-mess',
    ownerMeta: {
      initials: 'গা',
      roleLabelBn: 'মেস ম্যানেজার',
      memberSinceBn: '২০২৩ সাল থেকে',
      isDemo: true,
    },
    title: 'গাঙ্গিনারপাড় স্টেশন রোডে চাকরিজীবীদের জন্য ফ্যামিলি মেস — ৮ সিট',
    propertyType: 'mess',
    areaId: 'ganginarpar',
    specificAddress: 'গাঙ্গিনারপাড় ট্রাফিক মোড়, স্টেশন রোড',
    rentPrice: 5200,
    bedrooms: 2,
    bathrooms: 2,
    balconies: 1,
    floor: '৪র্থ তলা',
    totalRooms: 8,
    availableFrom: 'এই সপ্তাহেই',
    facilities: [
      'wifi',
      'mill',
      'service',
      'water_purifier',
      'shared_kitchen',
      'water',
      'balcony',
    ],
    unavailableFacilities: ['lift', 'parking', 'generator'],
    description:
      'গাঙ্গিনারপাড় ট্রাফিক মোড়ের পাশে শহরের একমাত্র ফ্যামিলি টাইপের মেস। মোট আটটি সিট, দুইটি বড় রুমে সাজানো।\n\nপ্রতিদিন তিনবেলা খাবার, চা ও নাশতা, সপ্তাহে দুই দিন বাজার করা হয়। রান্নাঘর ও ফ্রিজ সবার ব্যবহারের জন্য।\n\nছাত্র ও চাকরিজীবী — যারা শান্ত পরিবেশ চান, তাদের জন্য। বিড়ি মশা, মশার কয়েল ও পানির খরচ ভাড়ার সাথে আলাদা।',
    photos: [
      PHOTO.hostelRoom,
      PHOTO.diningWarm,
      PHOTO.sharedRoom,
      PHOTO.apartmentFacade,
    ],
  },

  // ---- 9. হোস্টেল (mess-like → ৳50) ---------------------------------
  {
    id: 'demo-hostel-01',
    ownerId: 'demo-owner-hostel',
    ownerMeta: {
      initials: 'ভা',
      roleLabelBn: 'হোস্টেল ম্যানেজার',
      memberSinceBn: '২০২৩ সাল থেকে',
      isDemo: true,
    },
    title: 'ভাটিকাশর মেডিকেল রোডে ছাত্রদের জন্য হোস্টেল — ১২ সিট',
    propertyType: 'hostel',
    areaId: 'bhatikashor',
    specificAddress: 'ভাটিকাশর কবরস্থান রোড, পিপলস প্রাইমারি স্কুলের পাশে',
    rentPrice: 3800,
    bedrooms: 3,
    bathrooms: 2,
    balconies: 1,
    floor: '২য় তলা',
    totalRooms: 12,
    availableFrom: 'এখনই সিট আছে',
    facilities: ['wifi', 'shared_kitchen', 'water', 'service', 'water_purifier'],
    unavailableFacilities: ['lift', 'parking', 'generator', 'private_bath'],
    description:
      'মেডিকেল কলেজ ও আনন্দ মোহন কলেজের শিক্ষার্থীদের জন্য তৈরি হোস্টেল। মোট ১২টি সিট, ছয়জন এক বা দুই জন এক বাথরুমে ভাগ করে থাকেন।\n\nভাড়ার সাথেই দিনে তিনবেলা খাবার, ফিল্টার পানি, ওয়াইফাই, কমন রুম ও প্রাথমিক সেবতা। প্রতি মাসের ৫ তারিখের মধ্যে ভাড়া দিতে হবে।\n\nলেডার্স এবং মেডিকেলের শিক্ষার্থীদের জন্য আলাদা সেকশন রাখা হয়। লিফট নেই, তবে দ্বিতীয় তলা হওয়ায় সিঁড়ি সহজ।',
    photos: [
      PHOTO.dormBunk,
      PHOTO.hostelRoom,
      PHOTO.kitchenDining,
      PHOTO.compactRoom,
    ],
  },

  // ---- 10. প্রিমিয়াম বড় বাসা (20k+ slab → ৳400) ---------------------
  {
    id: 'demo-luxury-01',
    ownerId: 'demo-owner-luxury',
    ownerMeta: {
      initials: 'রে',
      roleLabelBn: 'রেজিস্ট্রেস ম্যানেজার',
      memberSinceBn: '২০২২ সাল থেকে',
      isDemo: true,
    },
    title: 'টাউন হল পৌর পার্কের পাশে ফার্নিশড ৪ বেডরুম প্রিমিয়াম ফ্ল্যাট',
    propertyType: 'flat',
    areaId: 'town-hall',
    specificAddress: 'টাউন হল পৌর পার্কের পশ্চিম পাশ, জেলা পরিষদ চত্বরের সামনে',
    rentPrice: 32000,
    bedrooms: 4,
    bathrooms: 4,
    balconies: 3,
    floor: '৭ম তলা',
    availableFrom: 'পরের মাসের ১লা তারিখ থেকে',
    facilities: [
      'lift',
      'generator',
      'cctv',
      'parking',
      'power_backup',
      'gas',
      'water',
      'water_purifier',
      'balcony',
      'rooftop',
    ],
    description:
      'পৌর পার্কের পাশে শহরের সবচেয়ে সুবিশাল ও আধুনিক ফ্ল্যাটগুলোর একটি। চারটি বেডরুম, চারটি বাথরুম, ড্রেসিং রুম, স্টাডি রুম ও দুটি লাভিং স্পেস।\n\nফার্নিশড — ইটালিয়ান মার্বেল ফ্লোর, ভেন্টিলেটেড সিলিং, আমদানি করা কিচেন ফিটিং। দুইটি বারান্দা, একটিতে বসার ব্যবস্থা।\n\nভবনে দুটি লিফট, সিঙ্গেল ও ডাবল কার পার্কিং, জেনারেটার, ইন্টারকম, সিসিটিভি, ২৪ ঘণ্টা গার্ড এবং ছাদে কমন ছাদ বারান্দা।\n\nপরিবারের সাথে বড় উপহার বা বড় পরিবারের সাথে থাকতে চাইলে এই বাসাটি উপযুক্ত। এক বছরের চুক্তিতে ভাড়া ২ মাসের অগ্রিম, সেবা চার্জ মাসে ৪,০০০ টাকা আলাদা।',
    photos: [
      PHOTO.livingModern,
      PHOTO.diningWarm,
      PHOTO.bedroomLight,
      PHOTO.flatExterior,
    ],
  },
];

/** Staggered publish dates keep "নতুন আগে" sorting meaningful. */
export const DEMO_TOLET_LISTINGS: ToletDemoListing[] = SEEDS.map((seed, idx) => {
  const publishedAt = PUBLISHED[idx] ?? PUBLISHED[PUBLISHED.length - 1];
  return {
    id: seed.id,
    ownerId: seed.ownerId,
    ownerName: seed.ownerMeta.roleLabelBn,
    ownerPhone: undefined,
    ownerVerified: false,
    ownerMeta: seed.ownerMeta,
    title: seed.title,
    propertyType: seed.propertyType,
    areaId: seed.areaId,
    specificAddress: seed.specificAddress,
    rentPrice: seed.rentPrice,
    bedrooms: seed.bedrooms,
    bathrooms: seed.bathrooms,
    balconies: seed.balconies,
    floor: seed.floor,
    totalRooms: seed.totalRooms,
    availableFrom: seed.availableFrom,
    facilities: seed.facilities,
    unavailableFacilities: seed.unavailableFacilities,
    description: seed.description,
    photos: seed.photos,
    // Demo content must never render a verification badge it did not earn.
    isVerified: false,
    status: 'approved' as const,
    rejectionReason: undefined,
    createdAt: publishedAt,
    updatedAt: publishedAt,
    publishedAt,
    isDemo: true,
  };
});

/** Demo lookup by id — lets `/tolet/<demo-id>` deep-link resolve in any mode. */
export function getDemoListing(id: string): ToletDemoListing | undefined {
  return DEMO_TOLET_LISTINGS.find((l) => l.id === id);
}

/** True when an id belongs to the seeded showcase inventory. */
export function isDemoListingId(id: string | null | undefined): boolean {
  return Boolean(id && DEMO_TOLET_LISTINGS.some((l) => l.id === id));
}