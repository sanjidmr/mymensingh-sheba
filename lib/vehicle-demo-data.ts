/**
 * Vehicle (গাড়ী, অটো ও CNG) demo / showcase listings.
 *
 * Purpose
 * -------
 * `/gari-auto-cng/[slug]` is a spec sheet and a request form in one page, and
 * neither half can be reviewed against an empty table. This module seeds six
 * listings that between them cover every field the page can print and every
 * shape the data can take — including the shapes where a field is absent,
 * because "not recorded" has to render differently from "no":
 *
 *   | # | id                | kind | model        | year | AC    | driver | pricing          |
 *   |---|-------------------|------|--------------|------|-------|--------|------------------|
 *   | 1 | demo-vehicle-01   | গাড়ি  | Toyota Axio  | 2019 | হ্যাঁ   | হ্যাঁ    | ৳2,200 / কিমি      |
 *   | 2 | demo-vehicle-02   | গাড়ি  | Hiace মাইক্রো | 2014 | নেই   | হ্যাঁ    | ৳4,500 / দিন        |
 *   | 3 | demo-vehicle-03   | CNG   | Axio CNG    | 2018 | হ্যাঁ   | নেই     | ৳1,800 / কিমি      |
 *   | 4 | demo-vehicle-04   | অটো   | Bajaj RE    | 2021 | বাং নেই | নেই     | ৳৮০ / সর্বোচ্চ ৫ কিমি |
 *   | 5 | demo-vehicle-05   | গাড়ি  | Toyota Noah  | 2017 | হ্যাঁ   | হ্যাঁ    | ৳3,200 / দিন        |
 *   | 6 | demo-vehicle-06   | গাড়ি  | Pajero Sport| 2016 | হ্যাঁ   | হ্যাঁ    | ৳5,500 / দিন        |
 *
 * Listings 3, 4 and 6 deliberately differ in how much they state. Listing 3
 * leaves `hasAc` and `driverIncluded` NULL — nobody typed them — so the page
 * has to say "জানা নেই" rather than "নেই", which would be a claim about a real
 * vehicle. Listing 4 is an auto-rickshaw, where air-conditioning and a driver
 * are not questions anyone asks, so those rows stay empty on purpose. Listing 6
 * quotes an all-in day hire with the driver's allowance inside the number.
 *
 * `price_note_bn` exists because the unit is a local convention, not an enum:
 * "প্রতি কিলোমিটার" and "পুরো দিনের ভাড়া (চালকসহ)" are both correct and neither
 * can be derived from the number.
 *
 * Privacy contract
 * ----------------
 * `contact_phone_private` is left undefined on every row. The public column list
 * in `lib/catalog-service.ts` does not include that column at all, and an
 * admin-gated read is the only path that fills it, so a demo listing has no
 * number to leak. The page's CTA is "সেবা নিন", which opens the tracked request
 * form — which is the intended flow for a listing without a published number.
 *
 * When does this data appear?
 * ---------------------------
 * `lib/catalog-service.ts` falls back to it only while the live `vehicle`
 * category has no active listings, and deep links to these slugs resolve in
 * every mode so a demo listing is always shareable.
 */

import type { ServiceListing } from './catalog-types';

/** Unsplash is allow-listed in `next.config.ts`. */
function U(id: string) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1280&q=80`;
}

const PHOTO = {
  sedanSide: U('photo-1503376780353-7e6692767b70'),
  sedanFront: U('photo-1494976388531-d1058494cdd8'),
  sedanInterior: U('photo-1541899481282-d53bffe3c35d'),
  suvSide: U('photo-1519641471654-76ce0107ad1b'),
  suvFront: U('photo-1533473359331-0135ef1b58bf'),
  suvInterior: U('photo-1606664515524-ed2f786a0bd6'),
  vanSide: U('photo-1600661653561-629509216228'),
  vanFront: U('photo-1620149675978-714e6d0d5e0e'),
  vanInterior: U('photo-1570125909232-eb263c188f7e'),
  taxiSide: U('photo-1592840496694-26d035b52b48'),
  taxiFront: U('photo-1550355291-bbee04a92027'),
  dashboard: U('photo-1449965408869-eaa3f722e40d'),
  roadTrip: U('photo-1533900298318-6b8da08a523e'),
  cityTraffic: U('photo-1494522358652-f30e61a60313'),
  wheelDetail: U('photo-1486262715619-67b85e0b08d3'),
} as const;

export type VehicleDemoListing = ServiceListing & { isDemo: true };

/**
 * Staggered so "নতুন আগে" has a real order. `createdAt` is what the directory
 * sorts on after `is_featured`.
 */
const ADDED = [
  '2026-09-25T09:30:00Z',
  '2026-09-21T14:10:00Z',
  '2026-09-16T10:45:00Z',
  '2026-09-12T16:20:00Z',
  '2026-09-06T08:15:00Z',
  '2026-08-30T12:05:00Z',
] as const;

interface VehicleSeed {
  id: string;
  slug: string;
  kind: ServiceListing['tags'][number];
  title: string;
  subtitle: string;
  summary: string;
  description: string;
  model: string;
  modelYear?: number;
  seats?: number;
  hasAc?: boolean;
  driverIncluded?: boolean;
  availableTime: string;
  priceNote: string;
  priceMin: number;
  priceMax?: number;
  areas: string[];
  tags: string[];
  photos: string[];
  featured?: boolean;
}

const SEEDS: VehicleSeed[] = [
  // ---- 1. Private car — the everyday hire, per kilometre -------------------
  {
    id: 'demo-vehicle-01',
    slug: 'toyota-axio-2019-corporate',
    kind: 'গাড়ি',
    title: 'টয়োটা অক্সিও (২০১৯) — কর্পোরেট ভাড়া',
    subtitle: 'এসি সেডান · ৪ সিট · চালকসহ',
    summary:
      'শহর ও আশপাশ জেলায় দৈনন্দিন কাজের জন্য ভাড়ায় পাওয়া যায়। ফোনে নম্বর জানালেই চালক পাঠানো হয়।',
    description:
      'ময়মনসিংহ শহর ও আশপাশ জেলায় দৈনন্দিন ভাড়ার জন্য টয়োটা অক্সিও। গাড়িটি নিয়মিত সার্ভিস করানো, ভেতরে স্পটলেস।\n\nভাড়া কিলোমিটার অনুযায়ী দেওয়া হয়। শহরের ভেতরে সর্বনিম্ন ১৫ কিলোমিটার ধরা হয়, এর বেশি পথিলে প্রতি কিলোমিটার ২২০ টাকা।\n\nরাত ১১টার পরের যাত্রা ও বাইরে যাওয়া আলাদা করে আলোচনা করতে হয়। উপলব্ধতা আগের দিনে জানাতে হবে।',
    model: 'Toyota Axio',
    modelYear: 2019,
    seats: 4,
    hasAc: true,
    driverIncluded: true,
    availableTime: 'সকাল ৭টা – রাত ১১টা',
    priceNote: 'প্রতি কিলোমিটার (চালকসহ), সর্বনিম্ন ১৫ কিমি',
    priceMin: 2200,
    areas: ['town-hall', 'dhopakhola', 'natun-bazar', 'balashpur'],
    tags: ['গাড়ি', 'এসি', 'চালকসহ'],
    photos: [PHOTO.sedanSide, PHOTO.sedanInterior, PHOTO.sedanFront, PHOTO.dashboard],
  },

  // ---- 2. Microbus — group travel, non-AC, day rate -----------------------
  {
    id: 'demo-vehicle-02',
    slug: 'hiace-microbus-14-nonac',
    kind: 'গাড়ি',
    title: 'টয়োটা হাইস মাইক্রোবাস (২০১৪) — ১৫ সিট',
    subtitle: 'নন-এসি · ১৫ সিট · চালকসহ',
    summary:
      'বিয়ে, কোম্পানির ভ্রমণ বা পরিবারের যাত্রার জন্য পুরো দিনের ভাড়া। লাগেজ রাখার জায়গা আছে।',
    description:
      'পারিবারিক বা দলীয়ভাবে ঘুরতে যাওয়ার জন্য মাইক্রোবাস। আটান্নটি আসন, লাগেজ রাখার সুবিধা আছে, এসি নেই।\n\nভাড়া পুরো দিনের (সকাল ৮টা থেকে রাত ৮টা)। জেলার বাইরে গেলে রাস্তা ও জ্বালানির খরচ আলাদা।\n\nউপলব্ধতা আগের দিনে জানালেই নিশ্চিত করা হয়। বিয়ের মতো অনুষ্ঠানে চাইলে আগে একবার ঘুরে দেখে নিতে পারেন।',
    model: 'Toyota Hiace',
    modelYear: 2014,
    seats: 15,
    hasAc: false,
    driverIncluded: true,
    availableTime: 'সকাল ৮টা – রাত ৮টা',
    priceNote: 'পুরো দিনের ভাড়া (চালকসহ), জেলার বাইরে খরচ আলাদা',
    priceMin: 4500,
    areas: ['shambhuganj', 'maskanda', 'boyra', 'kewatkhali'],
    tags: ['গাড়ি', 'নন-এসি', 'মাইক্রোবাস'],
    photos: [PHOTO.vanSide, PHOTO.vanInterior, PHOTO.vanFront, PHOTO.roadTrip],
    featured: true,
  },

  // ---- 3. CNG hire — per kilometre, self-drive, specs deliberately blank --
  {
    id: 'demo-vehicle-03',
    slug: 'axio-cng-2018-selfdrive',
    kind: 'CNG',
    title: 'টয়োটা অক্সিও CNG (২০১৮) — সেলফ ড্রাইভ',
    subtitle: 'CNG · চালক ছাড়া',
    summary:
      'নিজে চালাতে চাইলে এই গাড়িটি। জ্বালানি খরচ কম, কিন্তু সিটিং ক্যাপাসিটি আগে জেনে নিতে হবে।',
    description:
      'সিটিং ভাড়ার জন্য অক্সিও CNG। চালক ছাড়া দেওয়া হয়, তাই লাইসেন্স ও চালকের বয়স সীমা মানতে হবে।\n\nভাড়া কিলোমিটার অনুযায়ী। সিটিং উপলব্ধতা সপ্তাহে একদিন পরিবর্তন হয়, তাই আগে থেকে জেনে নেওয়া দরকার।\n\nএই লিস্টিংয়ে এসি ও চালকসংক্রান্ত তথ্য কেউ পূরণ করেনি — জানার প্রয়োজনে সরাসরি জিজ্ঞাসা করুন।',
    model: 'Toyota Axio CNG',
    modelYear: 2018,
    seats: 4,
    // NULL, not false: nobody recorded these. The page must print
    // "জানা নেই" rather than assert that there is no air-con.
    hasAc: undefined,
    driverIncluded: false,
    availableTime: 'সকাল ৭টা – সন্ধ্যা ৬টা',
    priceNote: 'প্রতি কিলোমিটার (চালক ছাড়া)',
    priceMin: 1800,
    areas: ['charpara', 'sehara', 'sankipara'],
    tags: ['CNG', 'সেলফ ড্রাইভ'],
    photos: [PHOTO.sedanFront, PHOTO.wheelDetail, PHOTO.cityTraffic],
  },

  // ---- 4. Auto-rickshaw — short hop, capped distance ----------------------
  {
    id: 'demo-vehicle-04',
    slug: 'bajaj-re-auto-cng-2021',
    kind: 'অটো',
    title: 'বাজাজ RE অটো-রিকশা (সিএনজি) — স্বল্প দূরত্বে',
    subtitle: 'CNG অটো · সর্বোচ্চ ৫ কিলোমিটার',
    summary:
      'ছোট পর্যক্ত ভাড়া, স্টেশন বা বাজার পর্যন্ত যাওয়ার জন্য। সিটিং উপলব্ধতা আগের দিনে জানাতে হয়।',
    description:
      'শহরের ভেতরে ছোট পথে যাওয়ার জন্য সিএনজি অটো। পাশাপাশি ২–৩ জন যাত্রী বসতে পারে।\n\nসর্বোচ্চ ৫ কিলোমিটার পর্যন্ত ভাড়া নেওয়া হয়। এর বেশি দূরত্বে গাড়ি লাগবে।\n\nএসি বা চালকসংক্রান্ত কোনো তথ্য এখানে প্রযোজ্য নয় — অটোতে সেটি থাকে না।',
    model: 'Bajaj RE (CNG)',
    modelYear: 2021,
    seats: 3,
    hasAc: undefined,
    driverIncluded: false,
    availableTime: 'সকাল ৬টা – রাত ১০টা',
    priceNote: 'সর্বোচ্চ ৫ কিলোমিটার পর্যন্ত একবারে',
    priceMin: 80,
    areas: ['town-hall', 'dhopakhola', 'ganginarpar', 'choto-bazar'],
    tags: ['অটো', 'সিএনজি'],
    photos: [PHOTO.taxiSide, PHOTO.taxiFront, PHOTO.cityTraffic],
  },

  // ---- 5. Family vehicle — the "not a taxi, it is our car" case -----------
  {
    id: 'demo-vehicle-05',
    slug: 'toyota-noah-2017-family',
    kind: 'গাড়ি',
    title: 'টয়োটা নোহা (২০১৭) — পরিবারের গাড়ি',
    subtitle: 'এসি · ৭ সিট · চালকসহ',
    summary:
      'একসাথে বেশি জন যেতে হলে। শিশু আছে বা বয়োজ্যেষ্ঠ সদস্য থাকলে বেশি আরাম।',
    description:
      'পরিবারের ব্যবহারের জন্য রাখা মাইক্রো-ভ্যান। সাতটি আসন, তৃতীয় সারিতে এসি বাতাস ও পাখা আছে।\n\nভাড়া পুরো দিনের। জেলার বাইরে গেলে জ্বালানি ও রাস্তার চার্জ আলাদা যোগ হবে।\n\nগাড়ির ভেতরে শিশুর সিট বেল্ট আছে, চাইলে বসিয়ে দেওয়া হবে।',
    model: 'Toyota Noah',
    modelYear: 2017,
    seats: 7,
    hasAc: true,
    driverIncluded: true,
    availableTime: 'সকাল ৭টা – রাত ৯টা',
    priceNote: 'পুরো দিনের ভাড়া (চালক ও জ্বালানি ভিতরে)',
    priceMin: 3200,
    areas: ['akua', 'nayapara-kachijhuli', 'nawmahal', 'krishtopur'],
    tags: ['গাড়ি', 'এসি', 'চালকসহ', 'পরিবারের গাড়ি'],
    photos: [PHOTO.vanFront, PHOTO.vanInterior, PHOTO.vanSide, PHOTO.suvInterior],
  },

  // ---- 6. Long distance — all-in day hire, biggest number on the page ------
  {
    id: 'demo-vehicle-06',
    slug: 'pajero-sport-2016-longdistance',
    kind: 'গাড়ি',
    title: 'মিটসুবিশি পাজেরো স্পোর্ট (২০১৬) — দূরপাল্লা ভাড়া',
    subtitle: 'এসি SUV · ৭ সিট · চালকসহ',
    summary:
      'ঢাকা, সিলেট বা রাজশাহী পর্যন্ত দূরপাল্লার ভ্রমণের জন্য। জ্বালানি ও চালকের খরচ একসাথে বলা হয়।',
    description:
      'দূরপাল্লার যাত্রার জন্য SUV। একটানা ছয় ঘণ্টার বেশি পথে গেলে চালকের বিশ্রামের ব্যবস্থা করতে হয়।\n\nদামটি পুরো ভাড়া — জ্বালানি ও চালকের জেলার রেট সহ — তাই আলাদা করে কিছু যোগ হবে না। বাইরের জেলায় টোল ও পার্কিং খরচ আপনাকেই দিতে হবে।\n\nযাত্রার দূরত্ব ও দিন সংখ্যা অনুরোধের ফর্মে লিখে দিন, সেই অনুযায়ী দাম জানানো হবে।',
    model: 'Mitsubishi Pajero Sport',
    modelYear: 2016,
    seats: 7,
    hasAc: true,
    driverIncluded: true,
    availableTime: 'গাড়ি ছাড়ার ৪ ঘণ্টা আগে জানালে',
    priceNote: 'পুরো ভাড়া (জ্বালানি ও চালকসহ) — টোল ও পার্কিং বাদে',
    priceMin: 5500,
    areas: ['maskanda', 'shambhuganj', 'boyra', 'kewatkhali'],
    tags: ['গাড়ি', 'এসি', 'চালকসহ', 'দূরপাল্লা'],
    photos: [PHOTO.suvSide, PHOTO.suvInterior, PHOTO.suvFront, PHOTO.roadTrip],
  },
];

export const DEMO_VEHICLE_LISTINGS: VehicleDemoListing[] = SEEDS.map((seed, index) => ({
  id: seed.id,
  category: 'vehicle',
  slug: seed.slug,
  titleBn: seed.title,
  subtitleBn: seed.subtitle,
  summaryBn: seed.summary,
  descriptionBn: seed.description,
  imageUrl: seed.photos[0],
  logoUrl: undefined,
  areaIds: seed.areas,
  // `kind` leads the tag list: the directory's "যানের ধরন" facet matches the
  // first VehicleKind it finds, so it has to be present and first.
  tags: [seed.kind, ...seed.tags.filter((tag) => tag !== seed.kind)],
  // Vehicles quote per-kilometre or per-day, never a monthly fee, so the
  // coaching/wifi numeric fields stay empty and price_min/max carries it.
  monthlyFeeMin: undefined,
  monthlyFeeMax: undefined,
  priceMin: seed.priceMin,
  priceMax: seed.priceMax,
  speedMbps: undefined,
  fareMin: undefined,
  fareMax: undefined,
  originBn: undefined,
  destinationBn: undefined,
  seatCount: seed.seats,
  contactPhonePrivate: undefined,
  isActive: true,
  isFeatured: Boolean(seed.featured),
  createdAt: ADDED[index],
  updatedAt: ADDED[index],
  photos: seed.photos,
  modelNameBn: seed.model,
  modelYear: seed.modelYear,
  hasAc: seed.hasAc,
  driverIncluded: seed.driverIncluded,
  availableTimeBn: seed.availableTime,
  priceNoteBn: seed.priceNote,
  isDemo: true,
}));

export function getDemoVehicleListing(slug: string): VehicleDemoListing | null {
  return DEMO_VEHICLE_LISTINGS.find((listing) => listing.slug === slug) ?? null;
}
