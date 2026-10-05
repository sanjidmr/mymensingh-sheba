/**
 * Kena Becha (কেনাবেচা) demo / showcase items.
 *
 * Purpose
 * -------
 * `/buy-sell` is a brand-new surface: a hero, a ten-tile category rail, a search
 * bar with a price-range facet, and an image-first grid. None of that can be
 * judged against an empty `community_posts` table, so this module seeds ten
 * items that between them exercise every part of it:
 *
 *   | # | id            | category     | price     | condition | area          |
 *   |---|---------------|--------------|-----------|-----------|---------------|
 *   | 1 | demo-market-01| mobile       | ৳18,000   | good      | নতুন বাজার    |
 *   | 2 | demo-market-02| laptop       | ৳38,000   | used      | আকুয়া         |
 *   | 3 | demo-market-03| electronics  | ৳32,000   | like-new  | টাউন হল       |
 *   | 4 | demo-market-04| furniture    | ৳12,000   | good      | ধোপাকলা       |
 *   | 5 | demo-market-05| bike         | ৳52,000   | used      | শম্ভুগঞ্জ      |
 *   | 6 | demo-market-06| car          | ৳11,50,000| good      | মাসকান্দা      |
 *   | 7 | demo-market-07| books        | ৳1,500    | good      | গণীনারপর      |
 *   | 8 | demo-market-08| clothing     | ৳1,200    | new       | ছোটবাজার     |
 *   | 9 | demo-market-09| household    | ৳16,000   | used      | চরপাড়া        |
 *   |10 | demo-market-10| other        | ৳850      | new       | সেহারা        |
 *
 * Ten items, ten categories, four conditions and every `MARKET_PRICE_BANDS`
 * band (m0 … m4) — so the price filter, the category rail and the condition
 * chips each have something to narrow, and the grid shows its aspect-ratio
 * fallback nowhere. Item 10 is deliberately the weakest band (rice by the
 * মণ): a real marketplace is not all electronics, and a demo grid that is
 * teaches the wrong shape.
 *
 * `tags` carries the taxonomy SLUGS, not the Bangla labels — `tagFacet` matches
 * a `multi` group with membership against `post.tags`, so a row tagged
 * `used` is what makes the "ব্যবহৃত" chip work. `tagLabel` turns the slug back
 * into a label for display, and the search index carries both.
 *
 * Privacy contract — the one thing this file must never do
 * -------------------------------------------------------
 * `authorPhone` and `whatsappNumber` are left undefined on all ten rows, and
 * that is not an oversight. A marketplace buyer genuinely has to be able to
 * call the seller, so unlike a blood donor's number this one is meant to be
 * public — but only after an admin approves the post, and only through the
 * `fetch_market_contact` RPC. A demo row is not in the database, so the RPC
 * returns zero rows for it and the detail page has nothing to dial.
 *
 * That means the demo detail page's call button is inert *by construction*, not
 * by a flag someone could flip: there is no number anywhere in this file to
 * leak, no plausible-looking fake one, and no real person's number anywhere in
 * the repo. A visitor reading a demo listing sees "ডেমো আইটেম — বিক্রেতার
 * নম্বর এখানে নেই" instead of a button that rings nobody.
 *
 * `authorName` is fictional and, like every name here, borrowed from the kind of
 * name Mymensingh residents actually have. None of these people exist.
 *
 * When does this data appear?
 * ---------------------------
 * `lib/catalog-service.ts` falls back to it only while the live directory has no
 * approved `buy_sell` rows, and deep links to these slugs resolve in every mode
 * so a demo item is always shareable.
 */

import type { CommunityPost } from './catalog-types';

export type MarketDemoPost = CommunityPost & { isDemo: true };

/** Unsplash is allow-listed in `next.config.ts`. */
function U(id: string) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1280&q=80`;
}

const PHOTO = {
  // 1 — mobile
  phoneFront: U('photo-1511707171634-5f897ff02aa9'),
  phoneBack: U('photo-1592899677977-9c10ca588bbd'),
  phoneBox: U('photo-1556656793-08538906a9f8'),
  // 2 — laptop
  laptopOpen: U('photo-1496181133206-80ce9b88a853'),
  laptopDesk: U('photo-1517336714731-489689fd1ca8'),
  laptopSide: U('photo-1541807084-5c52b6b3adef'),
  // 3 — electronics
  tvInRoom: U('photo-1593359677879-a4bb92f829d1'),
  tvPanel: U('photo-1461151304267-38535e780c79'),
  soundbar: U('photo-1545454675-3531b543be5d'),
  // 4 — furniture
  sofa: U('photo-1555041469-a586c61ea9bc'),
  armchair: U('photo-1567538096630-e0c55bd6374c'),
  woodenSet: U('photo-1586023492125-27b2c045efd7'),
  // 5 — bike
  bikeSide: U('photo-1558618047-3c8c76ca7d13'),
  bikeRoad: U('photo-1591637333184-19aa84b3e01f'),
  bikeDetail: U('photo-1558981806-ec527fa84c39'),
  // 6 — car
  carFront: U('photo-1502877338535-766e1452684a'),
  carInterior: U('photo-1449965408869-eaa3f722e40d'),
  carRoad: U('photo-1580651315530-69c8e0026377'),
  // 7 — books
  bookStack: U('photo-1512820790803-83ca734da794'),
  bookOpen: U('photo-1544947950-fa07a98d237f'),
  bookShelf: U('photo-1521587760476-6c12a4b040da'),
  // 8 — clothing
  shirtFlat: U('photo-1596755094514-f87e34085b2c'),
  shirtWorn: U('photo-1521572163474-6864f9cf17ab'),
  textile: U('photo-1602810318383-e386cc2a3ccf'),
  // 9 — household
  fridgeFront: U('photo-1571175443880-49e1d25b2bc5'),
  fridgeKitchen: U('photo-1584568694244-14fbdf83bd30'),
  kitchenCorner: U('photo-1556911220-bff31c812dba'),
  // 10 — other (rice / pith)
  riceSack: U('photo-1586201375761-83865001e31c'),
  grainsBowl: U('photo-1536304993881-ff6e9eefa2a6'),
  marketStall: U('photo-1573246123716-6b1782bfc499'),
} as const;

/** Staggered so "নতুন আগে" has a real order. */
const ADDED = [
  '2026-09-28T11:20:00Z',
  '2026-09-26T09:05:00Z',
  '2026-09-24T15:40:00Z',
  '2026-09-21T10:15:00Z',
  '2026-09-19T17:30:00Z',
  '2026-09-16T08:50:00Z',
  '2026-09-13T13:25:00Z',
  '2026-09-11T16:00:00Z',
  '2026-09-08T12:10:00Z',
  '2026-09-04T10:45:00Z',
] as const;

interface MarketSeed {
  id: string;
  slug: string;
  /** Taxonomy slug from MARKET_CATEGORIES — also what goes in `tags`. */
  category: string;
  /** Taxonomy slug from MARKET_CONDITIONS. */
  condition: string;
  areaId: string;
  title: string;
  summary: string;
  body: string;
  price: number;
  seller: string;
  photos: string[];
  tags?: string[];
  featured?: boolean;
}

const SEEDS: MarketSeed[] = [
  // ---- 1. mobile — the category most of a real marketplace is made of -----
  {
    id: 'demo-market-01',
    slug: 'samsung-galaxy-a25-8gb-128gb',
    category: 'mobile',
    condition: 'good',
    areaId: 'natun-bazar',
    title: 'স্যামসাং গ্যালাক্সি A২৫ (৮/১২৮ জিবি)',
    summary:
      'এক বছরের কম ব্যবহার, বক্স ও চার্জার সাথে আছে। স্ক্র্যাচ নেই।',
    body: 'স্যামসাং গ্যালাক্সি A২৫, ৮ জিবি র‍্যাম আর ১২৮ জিবি স্টোরেজ। গত বছর কিনেছিলাম, তারপর নতুন ফোনে চলে গেছে, সব কাজেই ব্যবহার হয়েছে।\n\nবক্স, চার্জার আর সিলকন কভার আসে। স্ক্রিনে কোনো স্ক্র্যাচ নেই, কিন্তু খুব ভালো অবস্থা না — সেটা সোজা বলে দিলাম।\n\nকার্ডে পেমেন্ট করা যাবে, চাইলে সরাসরি দেখে নিতে পারেন।',
    price: 18000,
    seller: 'তানভীর হাসান',
    photos: [PHOTO.phoneFront, PHOTO.phoneBack, PHOTO.phoneBox],
    tags: ['বক্স সহ'],
  },

  // ---- 2. laptop — the "used but works fine" case ------------------------
  {
    id: 'demo-market-02',
    slug: 'dell-latitude-5420-i5-8gb',
    category: 'laptop',
    condition: 'used',
    areaId: 'akua',
    title: 'ডেল ল্যাটিটিউড ৫৪২০ (i5, ৮ জিবি র‍্যাম)',
    summary:
      'অফিসের কাজের জন্য ব্যবহৃত, ব্যাটারি বদলে দেওয়া হয়েছে। ল্যাপটপ ব্যাগ ও চার্জার সাথে।',
    body: 'ডেল ল্যাটিটিউড ৫৪২০, ইন্টেল i5 প্রসেসর, ৮ জিবি র‍্যাম আর ২৫৬ জিবি এসএসডি।\n\nঅফিসের কাজ শেষ হয়ে গেলে বিক্রি করছি। ব্যাটারি গত মাসে বদলানো হয়েছে, তাই ব্যাটারির দিকে সমস্যা হবে না আশা করি। স্ক্রিনে একটা হালকা দাগ আছে, কাজে লাগে না।\n\nল্যাপটপ ব্যাগ, চার্জার আর বিল আসবে। ল্যাপটপটা দেখে কিনতে চাইলে আকুয়ায় এসে দেখুন।',
    price: 38000,
    seller: 'শামিম উল্লাহ',
    photos: [PHOTO.laptopOpen, PHOTO.laptopDesk, PHOTO.laptopSide],
    tags: ['ব্যাটারি নতুন', 'ব্যাগ সহ'],
  },

  // ---- 3. electronics — a big item that needs a pickup conversation -------
  {
    id: 'demo-market-03',
    slug: 'sony-bravia-43-inch-smart-tv',
    category: 'electronics',
    condition: 'like-new',
    areaId: 'town-hall',
    title: 'সনি ব্রাভিয়া ৪৩ ইঞ্চি স্মার্ট টিভি',
    summary:
      'দেওয়ালে লাগানো ছিল, সরানো হয়নি। বাক্স, স্ট্যান্ড আর রিমোট সব আছে।',
    body: 'সনি ব্রাভিয়া ৪৩ ইঞ্চি 4K স্মার্ট টিভি। মাত্র বছর দেড়েক চলেছে, দেওয়ালে লাগানো ছিল তাই স্ক্র্যাচ নেই।\n\nবাক্স, দুইটি স্ট্যান্ড, রিমোট আর ওয়াল মাউন্ট ব্র্যাকেট সব সাথে দেব। পুরানো টিভি সরিয়ে নতুন কেনার পরিকল্পনা করে বিক্রি করছি।\n\nগাড়ি লাগে বড় বাক্সটা, তাই উঠে এসে নিতে হবে।',
    price: 32000,
    seller: 'নাজিয়া সুলতানা',
    photos: [PHOTO.tvInRoom, PHOTO.tvPanel, PHOTO.soundbar],
  },

  // ---- 4. furniture — a set, so the price is a bundle not an item ---------
  {
    id: 'demo-market-04',
    slug: 'wooden-bed-and-almirah-set',
    category: 'furniture',
    condition: 'good',
    areaId: 'dhopakhola',
    title: 'কাঠের বেড সেট ও আলমারি (একসাথে)',
    summary:
      'এক বস্ত্রে কিনবেন। অ্যালমারিতে আয়নার দরজা, বেডে ম্যাট্রেস নেই।',
    body: 'কাঠের খাট, আলমারি আর রাতি — তিনটা একসাথে। আলমারিতে দুই দিকে আয়নার দরজা, ভেতরে হ্যাঙ্গার সাসেট আছে।\n\nবেডটা ৩ বছরের, ম্যাট্রেস নেই। আলমারির একটা দরজার হাতল একটু আলগা, মেরামত করে নেওয়া যাবে।\n\nএকসাথে কিনলে দাম ১২,০০০। আলাদা আলাদা নিতে চাইলে জানাবেন, আলাদা দাম দেব।',
    price: 12000,
    seller: 'মোঃ রফিকুল ইসলাম',
    photos: [PHOTO.sofa, PHOTO.armchair, PHOTO.woodenSet],
    tags: ['একসাথে বিক্রি'],
  },

  // ---- 5. bike — the second-highest realistic price in a local market ----
  {
    id: 'demo-market-05',
    slug: 'hero-splendor-2019-well-maintained',
    category: 'bike',
    condition: 'used',
    areaId: 'shambhuganj',
    title: 'হিরো স্প্লেন্ডর ২০১৯ (অরিজিনাল পেপার)',
    summary:
      'একরকম সার্ভিস করানো, ইঞ্জিন আর বডি সব অরিজিনাল। লাইসেন্স ও রেজিস্ট্রেশন হস্তান্তর হবে।',
    body: 'হিরো স্প্লেন্ডর, মডেল ২০১৯। কেনার পর প্রতি ৫ হাজার কিলোমিটারে সার্ভিস করিয়েছি, সব যন্ত্রাংশ অরিজিনাল।\n\nইঞ্জিনে কোনো ধোঁয়া বা শব্দ নেই। বডিতে একটু স্ক্র্যাচ আছে বাইকের তলায়, উপরে নয়।\n\nলাইসেন্স, রেজিস্ট্রেশন ও মূল কাগজপত্র আছে। সব নাম ট্রান্সফার হবে। লাইসেন্স নবায়নের ৪ মাস বাকি।',
    price: 52000,
    seller: 'সাইফুল ইসলাম',
    photos: [PHOTO.bikeSide, PHOTO.bikeRoad, PHOTO.bikeDetail],
    tags: ['কাগজপত্র আছে'],
  },

  // ---- 6. car — an outlier price that proves the bands are not linear -----
  {
    id: 'demo-market-06',
    slug: 'toyota-axio-2016-xy',
    category: 'car',
    condition: 'good',
    areaId: 'maskanda',
    title: 'টয়োটা অক্সিও ২০১৬ (X স্পেক)',
    summary:
      'এক বাড়িতে ব্যবহৃত, একমাত্র মালিক। সব কাগজপত্র অরিজিনাল, পরিবর্তন করা হয়নি।',
    body: 'টয়োটা অক্সিও ২০১৬ সালের X স্পেক। এক বাড়িতে ব্যবহার করেছি, সেই কারণে নষ্ট হওয়ার কিছু নেই।\n\nপ্রথম মালিক মানে প্রথম কেনার পর থেকে একই বাড়িতে ছিল। সব সার্ভিস রেকর্ড আছে, এখন পর্যন্ত কোনো ভাঙাচোরা হয়নি, কোনো রঙ পাল্টায়নি।\n\nএখন আর দরকার নেই, তাই বিক্রি করছি। লিগ্যাল কাগজপত্র দেখে নিতে পারেন, চাইলে যান্ত্রিক পরীক্ষা করাতে পারেন।',
    price: 1150000,
    seller: 'আব্দুল করিম',
    photos: [PHOTO.carFront, PHOTO.carInterior, PHOTO.carRoad],
    tags: ['প্রথম মালিক', 'কাগজপত্র আছে'],
    featured: true,
  },

  // ---- 7. books — the low band a filter would otherwise never show -------
  {
    id: 'demo-market-07',
    slug: 'hsc-ssc-guide-books-bundle',
    category: 'books',
    condition: 'good',
    areaId: 'ganginarpar',
    title: 'এইচএসসি-এসএসসি গাইড বই (৯টি একসাথে)',
    summary:
      'ছেলের পরীক্ষার পর বইগুলো বিক্রি করছি। অল্প কিছু লেখা আছে, মোড়ক ভালো।',
    body: 'এইচএসসি ও এসএসসির গাইড বই, মোট ৯টি। ছেলে পরীক্ষায় পাস করার পর এগুলো আর দরকার হয়নি।\n\nকয়েকটায় খুব অল্প লেখা আছে, পাতা মোড়ক ভাঙা নেই। যেটা পড়ে ফেলেছি সেগুলো বাদ দিতে চাইলে বলুন।\n\nএকসাথে নিলে ১,৫০০ টাকা। একেকটি করে নিতে চাইলে ২০০ টাকা করে।',
    price: 1500,
    seller: 'আবুল কালাম',
    photos: [PHOTO.bookStack, PHOTO.bookOpen, PHOTO.bookShelf],
  },

  // ---- 8. clothing — the only `new` item, so "নতুন" has a result --------
  {
    id: 'demo-market-08',
    slug: 'mens-cotton-panjabi-new',
    category: 'clothing',
    condition: 'new',
    areaId: 'choto-bazar',
    title: 'পুরুষের সুতির পাঞ্জাবি (একেকটি, নতুন)',
    summary:
      'পরা হয়নি, ব্র্যান্ডেট ও কাগজে আছে। মাপ বললে ভালোভাবে মিলে যাবে।',
    body: 'পুরুষের সুতির পাঞ্জাবি, একেকটি। কাজে ব্যবহার না হওয়ায় বিক্রি করছি, তাই পরা হয়নি এবং কোনো দাগ নেই।\n\nব্র্যান্ডেট ও কাগজের ব্যাগ সাথে আছে। মাপ একসাথে বলে দিচ্ছি: ৪০ ইঞ্চি, ৩৮ ইঞ্চি।\n\nআপনার মাপ চেয়ে বলে নিতে পারি, তবে তখন একেকটি আগেরটাই থাকে — নিশ্চিত করে নিতে হবে।',
    price: 1200,
    seller: 'মোছাঃ আবদুল্লাহ',
    photos: [PHOTO.shirtFlat, PHOTO.shirtWorn, PHOTO.textile],
    tags: ['ব্র্যান্ডেট সহ'],
  },

  // ---- 9. household — an appliance, sold with its honest flaws ------------
  {
    id: 'demo-market-09',
    slug: 'walton-refrigerator-250-liter',
    category: 'household',
    condition: 'used',
    areaId: 'charpara',
    title: 'ওয়ালটন ফ্রিজ ২৫০ লিটার',
    summary:
      'ঠান্ডা ঠান্ডা ঠিকই আছে, কিন্তু দরজার রাবার একটু আলগা হয়ে গেছে।',
    body: 'ওয়ালটন ফ্রিজ, ২৫০ লিটার। বাসায় আলাদা ফ্রিজ কেনার কারণে বিক্রি করছি।\n\nঠান্ডা ঠান্ডা ঠিকই আছে, কোনো গোটা বা রান্না করা যায় না। দরজার রাবার একটু আলগা হয়ে গেছে, নিচু দিকে — জানিয়ে রাখলাম যাতে পরে অভিযোগ না হয়।\n\nগ্যাস নেই, চালাতে হবে। রং উঠে যায়নি, ভেতরে কোনো ক্ষতি নেই। গাড়ি লাগবে, তাই আনার ব্যবস্থা করে নিতে হবে।',
    price: 16000,
    seller: 'রহিমা বেগম',
    photos: [PHOTO.fridgeFront, PHOTO.fridgeKitchen, PHOTO.kitchenCorner],
  },

  // ---- 10. other — the lowest band, and a non-electronics item -----------
  {
    id: 'demo-market-10',
    slug: 'amani-rice-50kg-per-man',
    category: 'other',
    condition: 'new',
    areaId: 'sehara',
    title: 'আমনি চাল (প্রতি মণ ৮৫০ টাকা)',
    summary:
      'ফসল এখনো মিলে আসেনি, মে মাসে কাটব। আগে থেকে অর্ডার নিতে চাইলে বলুন।',
    body: 'এবারের আমনি চাল বিক্রি করছি। ফসল এখনো মিলে আসেনি, আগামী মাসে কাটবে।\n\nপ্রতি মণ ৮৫০ টাকা। ন্যূনতম এক মণ নিতে হবে, তবে দুই মণ নিলে এক মণ পর্যন্ত বাহন খরচ বাদে।\n\nপুরো মণ কিনবেন না জানালে দাম একটু বেশি হবে — সেটা সোজাই বলে রাখলাম।',
    price: 850,
    seller: 'মোঃ আবুল কুদ্দুস',
    photos: [PHOTO.riceSack, PHOTO.grainsBowl, PHOTO.marketStall],
    tags: ['পাইকারি', 'ফসল আসবে'],
  },
];

export const DEMO_MARKET_POSTS: MarketDemoPost[] = SEEDS.map((seed, index) => {
  const createdAt = ADDED[index];
  return {
    id: seed.id,
    kind: 'buy_sell',
    slug: seed.slug,
    // A demo row has no user behind it. Using a per-row id (rather than one
    // shared string) keeps the demo items from being mistaken for one
    // person's listings if anything ever groups by author.
    authorId: `demo-seller-${index + 1}`,
    authorName: seed.seller,
    // Deliberately undefined — see the privacy contract at the top of this file.
    authorPhone: undefined,
    whatsappNumber: undefined,
    titleBn: seed.title,
    summaryBn: seed.summary,
    bodyBn: seed.body,
    coverImageUrl: seed.photos[0],
    gallery: seed.photos,
    category: seed.category,
    areaId: seed.areaId,
    // Category slug first so `tagLabel`/the facet matcher both hit on the first
    // entry; the condition slug follows because it is a facet too.
    tags: [seed.category, seed.condition, ...(seed.tags ?? [])],
    salaryMin: undefined,
    salaryMax: undefined,
    price: seed.price,
    jobType: undefined,
    deadline: undefined,
    conditionLabel: seed.condition,
    status: 'approved',
    isFeatured: Boolean(seed.featured),
    publishedAt: createdAt,
    createdAt,
    updatedAt: createdAt,
    isDemo: true,
  };
});

export function getDemoMarketPost(slug: string): MarketDemoPost | null {
  return DEMO_MARKET_POSTS.find((post) => post.slug === slug) ?? null;
}