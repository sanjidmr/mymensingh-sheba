/**
 * Mymensingh Sheba — Centralized Area System
 *
 * =========================================================================
 * SINGLE SOURCE OF TRUTH for every area/locality used on the platform.
 *
 * RULES:
 * 1. Only neighbourhoods / junctions inside Mymensingh City Corporation.
 * 2. Stable kebab-case string ids are stored in the database (never Bengali
 *    free text), so the display name can change without touching rows.
 * 3. Search must work in Bangla AND English (transliteration, spelling
 *    variants and partial matches), e.g. "Charpara" -> "চরপাড়া".
 * 4. Areas removed from the active list are kept in `LEGACY_MCC_AREAS` so
 *    existing posts/profiles that still reference the old id keep resolving
 *    to a human-readable name — nothing is silently deleted.
 * =========================================================================
 */

export interface MCCArea {
  id: string; // Stable unique identifier (kebab-case)
  nameBn: string; // Primary Bengali display name (customer facing)
  nameEn: string; // Primary English name
  aliases: string[]; // English transliterations, Bangla spellings, landmarks
  prominentLandmarks: string[]; // Nearby landmarks that help users recognise it
  popularFor: string; // Short localized description
  isPopular?: boolean; // Featured in the quick-selection chips
  isActive: boolean; // Managed by admin; only active areas are selectable
  sortOrder: number;
  sourceNote: string; // Provenance note
}

const SOURCE_NOTE = 'ময়মনসিংহ সিটি কর্পোরেশন এলাকা তালিকা';

/**
 * The complete, active area list used across the whole website.
 * Order here is the order shown in pickers (roughly city-centre outward).
 */
export const MCC_AREAS: MCCArea[] = [
  {
    id: 'ghunti-bazar',
    nameBn: 'ঘুন্টি বাজার',
    nameEn: 'Ghunti Bazar',
    aliases: ['ghunti bazar', 'ghunti', 'ghunty bazar', 'ghunti bazaar', 'ghunti mor', 'ঘুন্টি', 'ঘুন্টীবাজার'],
    prominentLandmarks: ['ঘুন্টি বাজার মোড়', 'কেওয়াটখালী সংযোগ সড়ক'],
    popularFor: 'কেওয়াটখালী সংলগ্ন ব্যস্ত বাজার ও আবাসিক এলাকা',
    isActive: true,
    sortOrder: 1,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'khagdahar',
    nameBn: 'খাকডোহর',
    nameEn: 'Khagdohor',
    aliases: [
      'khagdohor', 'khagdahar', 'khakdohor', 'khag dohor', 'khagdohar',
      'খাগডহর', 'খাকডহর', 'খাকডোহর', 'বিজিবি ক্যাম্প', 'জেলখানা ঘাট',
    ],
    prominentLandmarks: ['খাকডোহর বিজিবি ক্যাম্প', 'জেলখানা ঘাট'],
    popularFor: 'পশ্চিম ময়মনসিংহের উন্মুক্ত ও সাশ্রয়ী আবাসিক এলাকা',
    isPopular: true,
    isActive: true,
    sortOrder: 2,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'taltala',
    nameBn: 'তালতলা',
    nameEn: 'Taltala',
    aliases: ['taltala', 'tal tala', 'taltola', 'তালতলা', 'তাল তলা'],
    prominentLandmarks: ['তালতলা মোড়', 'খাকডোহর সংযোগ'],
    popularFor: 'খাকডোহর সংলগ্ন শান্ত আবাসিক এলাকা',
    isActive: true,
    sortOrder: 3,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'galgonda',
    nameBn: 'গলগন্ডা',
    nameEn: 'Galgonda',
    aliases: ['galgonda', 'galganda', 'golagonda', 'গলগণ্ডা', 'গলগন্ডা', 'গলগন্ড'],
    prominentLandmarks: ['গলগন্ডা বাজার', 'পুরাতন নদীপাড়'],
    popularFor: 'নদীপাড় সংলগ্ন ঐতিহ্যবাহী আবাসিক এলাকা',
    isActive: true,
    sortOrder: 4,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'amin-bazar',
    nameBn: 'আমিন বাজার',
    nameEn: 'Amin Bazar',
    aliases: ['amin bazar', 'aminbazar', 'amin bazaar', 'আমিন বাজার', 'আমিনবাজার'],
    prominentLandmarks: ['আমিন বাজার মোড়', 'সাংকিপাড়া সংযোগ'],
    popularFor: 'কেনাকাটা ও নিত্যপ্রয়োজনীয় বাজারের এলাকা',
    isActive: true,
    sortOrder: 5,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'at-bola',
    nameBn: 'কাঠগোলা',
    nameEn: 'Kathgola',
    aliases: [
      'kathgola', 'kath gola', 'কাঠগোলা', 'কাঠ গোলা',
      'at bola', 'atbola', 'aat bola', 'att bola', 'আট বোলা', 'আটবোলা',
    ],
    prominentLandmarks: ['কাঠগোলা মোড়', 'টাঙ্গাইল রোড সংযোগ'],
    popularFor: 'টাঙ্গাইল বাস স্ট্যান্ড সংলগ্ন আবাসিক এলাকা',
    isActive: true,
    sortOrder: 6,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'bagher-kanda',
    nameBn: 'বাঘের কান্দা',
    nameEn: 'Bagher Kanda',
    aliases: ['bagher kanda', 'bagherkanda', 'bagherkunda', 'bagher kunda', 'বাঘের কান্দা', 'বাঘেরকান্দা'],
    prominentLandmarks: ['বাঘের কান্দা মোড়', 'টাঙ্গাইল রোড'],
    popularFor: 'টাঙ্গাইল বাস স্ট্যান্ড সংলগ্ন শান্ত আবাসিক এলাকা',
    isActive: true,
    sortOrder: 7,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'police-line',
    nameBn: 'পুলিশ লাইন',
    nameEn: 'Police Line',
    aliases: ['police line', 'policeline', 'police lines', 'পুলিশ লাইন', 'পুলিশলাইন'],
    prominentLandmarks: ['ময়মনসিংহ পুলিশ লাইন', 'কাশোর সংযোগ সড়ক'],
    popularFor: 'নিরাপদ ও সুশৃঙ্খল সরকারি আবাসিক এলাকা',
    isActive: true,
    sortOrder: 8,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'kasor',
    nameBn: 'কাশোর',
    nameEn: 'Kasor',
    aliases: ['kasor', 'kashor', 'kasore', 'kashore', 'কাশর', 'কাশোর', 'কাশোর মোড়'],
    prominentLandmarks: ['কাশোর মোড়', 'পুলিশ লাইন গেট'],
    popularFor: 'পুলিশ লাইন সংলগ্ন আবাসিক এলাকা',
    isActive: true,
    sortOrder: 9,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'tangail-bus-stand',
    nameBn: 'টাঙ্গাইল বাস স্ট্যান্ড',
    nameEn: 'Tangail Bus Stand',
    aliases: [
      'tangail bus stand', 'tangail busstand', 'tangail bus station', 'tangail',
      'টাঙ্গাইল বাস স্ট্যান্ড', 'টাঙ্গাইল বাসস্ট্যান্ড',
    ],
    prominentLandmarks: ['টাঙ্গাইল বাস স্ট্যান্ড', 'বাঘের কান্দা সংযোগ'],
    popularFor: 'আন্তঃজেলা বাস যোগাযোগের গুরুত্বপূর্ণ স্ট্যান্ড',
    isActive: true,
    sortOrder: 10,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'jamtala',
    nameBn: 'জমতলা',
    nameEn: 'Jamtala',
    aliases: ['jamtala', 'jam tala', 'jamtola', 'জমতলা', 'জম তলা'],
    prominentLandmarks: ['জমতলা মোড়', 'সাংকিপাড়া রোড'],
    popularFor: 'শিক্ষার্থী ও চাকরিজীবী মেস সংলগ্ন এলাকা',
    isActive: true,
    sortOrder: 11,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'kachijhuli',
    nameBn: 'কাচিঝুলী',
    nameEn: 'Kachijhuli',
    aliases: [
      'kachijhuli', 'kachijhuri', 'kachi jhuli', 'kachijuli', 'kachijhuli mor',
      'কাঁচিঝুলি', 'কাচিঝুলী', 'কাচিঝুলি', 'জিলা স্কুল রোড', 'মীরবাড়ী',
    ],
    prominentLandmarks: ['ময়মনসিংহ জিলা স্কুল', 'কাচিঝুলী মোড়', 'সার্কিট হাউস'],
    popularFor: 'কেন্দ্রীয় অভিজাত আবাসিক ও ফ্যামিলি ফ্ল্যাট এলাকা',
    isPopular: true,
    isActive: true,
    sortOrder: 12,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'town-hall',
    nameBn: 'টাউন হল',
    nameEn: 'Town Hall',
    aliases: ['town hall', 'townhall', 'town-hall', 'taun hol', 'টাউন হল', 'টাউনহল', 'পৌর পার্ক'],
    prominentLandmarks: ['ময়মনসিংহ টাউন হল', 'পৌর পার্ক', 'জেলা পরিষদ চত্বর'],
    popularFor: 'সাংস্কৃতিক কেন্দ্র ও ঐতিহ্যবাহী শান্ত আবাসিক এলাকা',
    isPopular: true,
    isActive: true,
    sortOrder: 13,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'college-road',
    nameBn: 'কলেজ রোড',
    nameEn: 'College Road',
    aliases: ['college road', 'collegeroad', 'college rd', 'college mor', 'কলেজ রোড', 'কলেজরোড', 'আনন্দ মোহন কলেজ'],
    prominentLandmarks: ['সরকারি আনন্দ মোহন কলেজ', 'কলেজ ছাত্রাবাস'],
    popularFor: 'শিক্ষার্থী ও শিক্ষক আবাসিক এলাকা',
    isActive: true,
    sortOrder: 14,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'goelkandi',
    nameBn: 'গোয়েলকান্দি',
    nameEn: 'Goelkandi',
    aliases: ['goelkandi', 'goel kandi', 'goyelkandi', 'goilkandi', 'গোয়েলকান্দি', 'গোয়েল কান্দি'],
    prominentLandmarks: ['গোয়েলকান্দি মোড়', 'গাংগিনারপার সংযোগ'],
    popularFor: 'শহরের কেন্দ্র সংলগ্ন পরিবারভিত্তিক আবাসিক এলাকা',
    isActive: true,
    sortOrder: 15,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'sankipara',
    nameBn: 'সাংকিপাড়া',
    nameEn: 'Sankipara',
    aliases: [
      'sankipara', 'shankipara', 'shankhipara', 'sankhi para', 'shankhi para', 'shankhipara mor',
      'সাংকিপাড়া', 'সাংকিপাড়া শেষ মোড়', 'শাঁখিপাড়া', 'সানকিপাড়া', 'সানকিপাড়া শেষ মোড়', 'রেলওয়ে কলোনি',
    ],
    prominentLandmarks: ['সাংকিপাড়া শেষ মোড়', 'রেলওয়ে অফিসার্স কলোনি', 'সাংকিপাড়া বাজার'],
    popularFor: 'জনপ্রিয় আবাসিক এলাকা, সাশ্রয়ী বাসা ও শিক্ষার্থী মেস',
    isPopular: true,
    isActive: true,
    sortOrder: 16,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'zilla-school',
    nameBn: 'জেলা স্কুল',
    nameEn: 'Zilla School',
    aliases: [
      'zilla school', 'zila school', 'jilla school', 'jela school', 'district school',
      'জেলা স্কুল', 'জিলা স্কুল', 'ময়মনসিংহ জিলা স্কুল',
    ],
    prominentLandmarks: ['ময়মনসিংহ জিলা স্কুল', 'কাচিঝুলী সংযোগ'],
    popularFor: 'ঐতিহ্যবাহী শিক্ষা প্রতিষ্ঠান সংলগ্ন আবাসিক এলাকা',
    isActive: true,
    sortOrder: 17,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'chorangi-mor',
    nameBn: 'চোরঙ্গি মোড়',
    nameEn: 'Chorangi Mor',
    aliases: [
      'chorangi mor', 'chourangi mor', 'chowrangi mor', 'chorongi mor', 'chourangi',
      'চোরঙ্গি মোড়', 'চৌরঙ্গী মোড়', 'চৌরঙ্গি মোড়', 'আকুয়া চৌরঙ্গী',
    ],
    prominentLandmarks: ['আকুয়া চৌরঙ্গী মোড়', 'মাদ্রাসা কোয়ার্টার'],
    popularFor: 'আকুয়া সংলগ্ন প্রধান চৌরাস্তা ও আবাসিক এলাকা',
    isActive: true,
    sortOrder: 18,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'akua',
    nameBn: 'আকুয়া',
    nameEn: 'Akua',
    aliases: ['akua', 'akua mor', 'akua chourangi', 'আকুয়া', 'আকুয়া মোড়'],
    prominentLandmarks: ['আকুয়া মোড়', 'মাদ্রাসা কোয়ার্টার'],
    popularFor: 'সুবিশাল আবাসিক এলাকা, খোলামেলা পরিবেশ ও সাশ্রয়ী ভাড়া',
    isPopular: true,
    isActive: true,
    sortOrder: 19,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'gorokhor-mor',
    nameBn: 'গোরোখর মোড়',
    nameEn: 'Gorokhor Mor',
    aliases: ['gorokhor mor', 'gorokhar mor', 'gorokhor', 'gorkhor', 'গোরোখর মোড়', 'গোরখর মোড়'],
    prominentLandmarks: ['গোরোখর মোড়', 'ফুলবাড়ীয়া রোড'],
    popularFor: 'আকুয়া বাইপাস সংলগ্ন আবাসিক এলাকা',
    isActive: true,
    sortOrder: 20,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'akua-wilds-mor',
    nameBn: 'আকুয়া ওয়াইল্ডেস মোড়',
    nameEn: 'Akua Wilds Mor',
    aliases: [
      'akua wilds mor', 'akua wilds', 'wilds mor', 'akua waildes mor', 'wilds',
      'আকুয়া ওয়াইল্ডেস মোড়', 'ওয়াইল্ডেস মোড়', 'ওয়াইল্ডস মোড়',
    ],
    prominentLandmarks: ['আকুয়া ওয়াইল্ডেস মোড়', 'বাইপাস সংযোগ'],
    popularFor: 'নতুন আবাসিক প্রকল্প ও ফ্ল্যাটের এলাকা',
    isActive: true,
    sortOrder: 21,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'akua-bypass',
    nameBn: 'আকুয়া বাইপাস',
    nameEn: 'Akua Bypass',
    aliases: ['akua bypass', 'akuabypass', 'akua bypass mor', 'আকুয়া বাইপাস', 'আকুয়া বাইপাস মোড়'],
    prominentLandmarks: ['আকুয়া বাইপাস রোড', 'ফুলবাড়ীয়া রোড'],
    popularFor: 'মহাসড়ক সংলগ্ন আধুনিক আবাসিক এলাকা',
    isPopular: true,
    isActive: true,
    sortOrder: 22,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'akua-moralpara',
    nameBn: 'আকুয়া মড়ল বাড়ি',
    nameEn: 'Akua Mordol Bari',
    aliases: [
      'akua mordol bari', 'akua mordolbari', 'akua mordolpara', 'akua mordol para', 'mordol bari', 'mordolpara',
      'akua moral bari', 'akua moralbari', 'akua moralpara', 'akua moral para', 'moral bari', 'moralpara',
      'আকুয়া মড়ল বাড়ি', 'আকুয়া মড়লপাড়া', 'মড়লপাড়া', 'আকুয়া মোরোল বাড়ি', 'আকুয়া মোড়লপাড়া', 'মোড়লপাড়া', 'ফুলবাড়ীয়া রোড',
    ],
    prominentLandmarks: ['আকুয়া মড়ল বাড়ি', 'আনন্দ নিকেতন', 'ফুলবাড়ীয়া রোড'],
    popularFor: 'পারিবারিক আবাসিক ও সাশ্রয়ী বাসা',
    isActive: true,
    sortOrder: 23,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'natun-bazar',
    nameBn: 'নতুন বাজার',
    nameEn: 'Natun Bazar',
    aliases: ['natun bazar', 'notun bazar', 'new market', 'natunbazar', 'নতুন বাজার', 'মেছুয়া বাজার', 'গোলপুকুর'],
    prominentLandmarks: ['নতুন বাজার ট্রাফিক মোড়', 'জিলা পরিষদ ভবন', 'গোলপুকুর পাড়'],
    popularFor: 'শহরের মূল কেন্দ্র, কেনাকাটা ও সার্বক্ষণিক যাতায়াত',
    isPopular: true,
    isActive: true,
    sortOrder: 24,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'zero-point',
    nameBn: 'জিরো পয়েন্ট',
    nameEn: 'Zero Point',
    aliases: ['zero point', 'zeropoint', 'zero mor', 'জিরো পয়েন্ট', 'জিরোপয়েন্ট', 'জিরো পয়েন্ট মোড়'],
    prominentLandmarks: ['জিরো পয়েন্ট মোড়', 'গাংগিনারপার সংযোগ'],
    popularFor: 'শহরের কেন্দ্রীয় মোড় ও বাণিজ্যিক এলাকা',
    isActive: true,
    sortOrder: 25,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'durgabari',
    nameBn: 'দুর্গাবাড়ি',
    nameEn: 'Durgabari',
    aliases: ['durgabari', 'durga bari', 'durga bari road', 'দুর্গাবাড়ি', 'দুর্গা বাড়ি'],
    prominentLandmarks: ['দুর্গাবাড়ি মোড়', 'কালিবাড়ি রোড'],
    popularFor: 'পুরাতন শহরের ঐতিহ্যবাহী আবাসিক এলাকা',
    isActive: true,
    sortOrder: 26,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'ganginarpar',
    nameBn: 'গাংগিনারপার',
    nameEn: 'Ganginarpar',
    aliases: [
      'ganginarpar', 'ganginar par', 'ganginar', 'gonginarpar', 'gandhinapar', 'gandhi napar',
      'গাংগিনারপার', 'গাংগিনার পার', 'গান্ধীনাপার', 'গাঙ্গিনারপাড়', 'গাঙ্গিনার পাড়', 'প্রেসক্লাব', 'স্টেশন রোড',
    ],
    prominentLandmarks: ['গাংগিনারপার ট্রাফিক মোড়', 'ময়মনসিংহ প্রেসক্লাব', 'শহীদ ফিরোজ-জাহাঙ্গীর চত্বর'],
    popularFor: 'শহরের প্রাণকেন্দ্র ও প্রধান বাণিজ্যিক এলাকা',
    isPopular: true,
    isActive: true,
    sortOrder: 27,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'maharaja-road',
    nameBn: 'মহারাজা রোড',
    nameEn: 'Maharaja Road',
    aliases: ['maharaja road', 'maharajaroad', 'maharaja rd', 'maharaja', 'মহারাজা রোড', 'মহারাজারোড'],
    prominentLandmarks: ['মহারাজা রোড মোড়', 'দুর্গাবাড়ি সংযোগ'],
    popularFor: 'শহরের বাণিজ্যিক ও আবাসিক মিশ্র এলাকা',
    isActive: true,
    sortOrder: 28,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'kalibari',
    nameBn: 'কালিবাড়ি',
    nameEn: 'Kalibari',
    aliases: ['kalibari', 'kali bari', 'kalibari road', 'কালিবাড়ি', 'কালীবাড়ি', 'কালিবাড়ী', 'কালিবাড়ি রোড'],
    prominentLandmarks: ['কালিবাড়ি মন্দির মোড়', 'পুরাতন নদী বন্দর ঘাট'],
    popularFor: 'ঐতিহ্যবাহী প্রাচীন আবাসিক ও ব্যবসা কেন্দ্র',
    isActive: true,
    sortOrder: 29,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'ck-ghosh-road',
    nameBn: 'সি.কে. ঘোষ রোড',
    nameEn: 'C.K. Ghosh Road',
    aliases: [
      'ck ghosh road', 'c k ghosh road', 'ckghoshroad', 'ck ghosh', 'sik ghosh road',
      'সি কে ঘোষ রোড', 'সি.কে. ঘোষ রোড', 'সিকে ঘোষ রোড',
    ],
    prominentLandmarks: ['সি.কে. ঘোষ রোড মোড়', 'কালিবাড়ি সংযোগ'],
    popularFor: 'পুরাতন শহরের ঘনবসতিপূর্ণ আবাসিক এলাকা',
    isActive: true,
    sortOrder: 30,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'tajmahal-mor',
    nameBn: 'তাজমহল মোড়',
    nameEn: 'Tajmahal Mor',
    aliases: ['tajmahal mor', 'taj mahal mor', 'tajmahal', 'taj mahal', 'তাজমহল মোড়', 'তাজমহল'],
    prominentLandmarks: ['তাজমহল মোড়', 'সি.কে. ঘোষ রোড সংযোগ'],
    popularFor: 'পুরাতন শহরের ব্যস্ত মোড় ও আবাসিক এলাকা',
    isActive: true,
    sortOrder: 31,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'dhopakhola',
    nameBn: 'ধোপাখোলা',
    nameEn: 'Dhopakhola',
    aliases: ['dhopakhola', 'dhopa khola', 'ধোপাখোলা', 'ধোপা খোলা'],
    prominentLandmarks: ['কাঠগোলা মোড়', 'বলাশপুর সংযোগ সড়ক'],
    popularFor: 'শান্ত ছায়াসুনিবিড় আবাসিক এলাকা',
    isActive: true,
    sortOrder: 32,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'charpara',
    nameBn: 'চরপাড়া',
    nameEn: 'Charpara',
    aliases: [
      'charpara', 'chorpara', 'char para', 'charpada', 'charpada', 'medical',
      'চরপাড়া', 'চর পাড়া', 'মেডিকেল', 'হাসপাতাল', 'নাহার মেমোরিয়াল',
    ],
    prominentLandmarks: ['ময়মনসিংহ মেডিকেল কলেজ হাসপাতাল', 'নাহার মেমোরিয়াল রোড', 'চরপাড়া মোড়'],
    popularFor: 'মেডিকেল ও হাসপাতাল সংলগ্ন প্রধান আবাসিক ও মেস এলাকা',
    isPopular: true,
    isActive: true,
    sortOrder: 33,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'baghmara',
    nameBn: 'বাঘমারা',
    nameEn: 'Baghmara',
    aliases: ['baghmara', 'bagmara', 'বাঘমারা', 'বাঘমাড়া', 'বাঘমারা রোড', 'বিদ্যুৎ অফিস'],
    prominentLandmarks: ['বাঘমারা মেডিকেল রোড', 'বিদ্যুৎ ভবন'],
    popularFor: 'মেডিকেল ও শহরের মাঝামাঝি আবাসিক এলাকা',
    isActive: true,
    sortOrder: 34,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'trisht-pul',
    nameBn: 'কৃষ্টপুর',
    nameEn: 'Krishtopur',
    aliases: [
      'krishtopur', 'krishtapur', 'কৃষ্টপুর',
      'trisht pul', 'trishtpul', 'trishot pul', 'thirty pul', 'ত্রিশট পুল', 'ত্রিশটপুল', 'ত্রিশ পুল', 'ত্রিশট পুর',
    ],
    prominentLandmarks: ['কৃষ্টপুর', 'বাঘমারা সংযোগ'],
    popularFor: 'শহরের পশ্চিমাংশের আবাসিক এলাকা',
    isActive: true,
    sortOrder: 35,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'reli-mor',
    nameBn: 'রেলি মোড়',
    nameEn: 'Reli Mor',
    aliases: ['reli mor', 'relimor', 'rally mor', 'reli', 'রেলি মোড়', 'রেলী মোড়', 'র‍্যালি মোড়', 'র্যালি মোড়'],
    prominentLandmarks: ['রেলি মোড়', 'ঢাকা বাইপাস সংযোগ'],
    popularFor: 'বাইপাস সংলগ্ন আবাসিক ও যোগাযোগ কেন্দ্র',
    isActive: true,
    sortOrder: 36,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'patgudam-china-mor',
    nameBn: 'ব্রিজ মোড়',
    nameEn: 'Bridge Mor',
    aliases: [
      'bridge mor', 'bridgemor', 'brij mor', 'bridge', 'patgudam', 'china mor',
      'ব্রিজ মোড়', 'পাটগুদাম', 'চায়না মোড়', 'পাটগুদাম ব্রিজ',
    ],
    prominentLandmarks: ['পাটগুদাম ব্রিজ চত্বর', 'চায়না মোড় ট্রাফিক পয়েন্ট'],
    popularFor: 'শহরের পূর্ব প্রবেশদ্বার ও যোগাযোগ কেন্দ্র',
    isActive: true,
    sortOrder: 37,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'maskanda',
    nameBn: 'মাসকান্দা',
    nameEn: 'Maskanda',
    aliases: [
      'maskanda', 'machkanda', 'mas kanda', 'mach kanda', 'maskonda',
      'মাসকান্দা', 'মাছকান্দা', 'মাছ কান্দা', 'বাস টার্মিনাল', 'পলিটেকনিক',
    ],
    prominentLandmarks: ['মাসকান্দা কেন্দ্রীয় বাস টার্মিনাল', 'ময়মনসিংহ পলিটেকনিক ইনস্টিটিউট', 'গণসার মোড়'],
    popularFor: 'আন্তঃজেলা যোগাযোগ সংযোগস্থল ও আধুনিক আবাসিক এলাকা',
    isPopular: true,
    isActive: true,
    sortOrder: 38,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'bhatikashor',
    nameBn: 'ভাটিকাসর',
    nameEn: 'Bhatikashor',
    aliases: [
      'bhatikashor', 'bhati kashor', 'vatikashor', 'bhategashor', 'bhategasor',
      'ভাটিকাসর', 'ভাটিকাশর', 'ভাটেগাশর', 'ভাটেগাসর', 'ভাটিকাশর কবরস্থান',
    ],
    prominentLandmarks: ['ভাটিকাসর কবরস্থান রোড', 'পিপলস প্রাইমারি স্কুল'],
    popularFor: 'মেডিকেল দক্ষিণ সংলগ্ন আবাসিক এলাকা',
    isActive: true,
    sortOrder: 39,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'balashpur',
    nameBn: 'বলাশপুর',
    nameEn: 'Balashpur',
    aliases: [
      'balashpur', 'bolashpur', 'balashkur', 'balash kuro', 'ballashkur',
      'বলাশপুর', 'বলাশপুর মোড়', 'বলাশকুর', 'মির্জাপুর',
    ],
    prominentLandmarks: ['বলাশপুর মোড়', 'মির্জাপুর সংযোগ'],
    popularFor: 'পূর্বাঞ্চলীয় আবাসিক এলাকা',
    isActive: true,
    sortOrder: 40,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'shantinagar',
    nameBn: 'শান্তিনগর',
    nameEn: 'Shantinagar',
    aliases: ['shantinagar', 'santinagar', 'shanti nagar', 'শান্তিনগর', 'শান্তি নগর'],
    prominentLandmarks: ['শান্তিনগর মোড়', 'আকুয়া সংযোগ'],
    popularFor: 'শান্ত পরিবেশের পারিবারিক আবাসিক এলাকা',
    isActive: true,
    sortOrder: 41,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'dhaka-bypass',
    nameBn: 'ঢাকা বাইপাস',
    nameEn: 'Dhaka Bypass',
    aliases: ['dhaka bypass', 'dhakabypass', 'dhaka bypass mor', 'ঢাকা বাইপাস', 'ঢাকা বাইপাস মোড়'],
    prominentLandmarks: ['ঢাকা বাইপাস', 'রেলি মোড় সংযোগ'],
    popularFor: 'মহাসড়ক সংলগ্ন আবাসিক ও যাতায়াত এলাকা',
    isActive: true,
    sortOrder: 42,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'stan-bypass',
    nameBn: 'স্টান বাইপাস',
    nameEn: 'Stan Bypass',
    aliases: ['stan bypass', 'stanbypass', 'station bypass', 'stan bypass mor', 'স্টান বাইপাস', 'স্টানবাইপাস', 'স্টেশন বাইপাস'],
    prominentLandmarks: ['স্টান বাইপাস', 'ঢাকা বাইপাস সংযোগ'],
    popularFor: 'বাইপাস সংলগ্ন দ্রুত বর্ধনশীল আবাসিক এলাকা',
    isActive: true,
    sortOrder: 43,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'maskanda-notun-bazar',
    nameBn: 'মাসকান্দা নতুন বাজার',
    nameEn: 'Maskanda Natun Bazar',
    aliases: [
      'maskanda natun bazar', 'machkanda notun bazar', 'maskanda new market', 'maskanda bazar',
      'মাসকান্দা নতুন বাজার', 'মাসকান্দা বাজার', 'মাছকান্দা নতুন বাজার', 'মাছকান্দা বাজার',
    ],
    prominentLandmarks: ['মাসকান্দা নতুন বাজার', 'পলিটেকনিক সংযোগ'],
    popularFor: 'মাসকান্দা সংলগ্ন বাজার ও আবাসিক এলাকা',
    isActive: true,
    sortOrder: 44,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'dighar-kanda',
    nameBn: 'দিঘার কান্দা',
    nameEn: 'Dighar Kanda',
    aliases: ['dighar kanda', 'digharkanda', 'digha kanda', 'দিঘার কান্দা', 'দিঘারকান্দা'],
    prominentLandmarks: ['দিঘার কান্দা মোড়', 'কেওয়াটখালী সংযোগ'],
    popularFor: 'কেওয়াটখালী সংলগ্ন আবাসিক এলাকা',
    isActive: true,
    sortOrder: 45,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'kewatkhali',
    nameBn: 'কেওয়াটখালি',
    nameEn: 'Kewatkhali',
    aliases: [
      'kewatkhali', 'kewat khali', 'kewatkhali road', 'bau gate', 'পাওয়ার হাউস', 'বাকৃবি গেট',
      'কেওয়াটখালি', 'কেওয়াটখালী',
    ],
    prominentLandmarks: ['বিদ্যুৎ পাওয়ার হাউস', 'বাংলাদেশ কৃষি বিশ্ববিদ্যালয় (বাকৃবি) প্রবেশ তোরণ'],
    popularFor: 'কৃষি বিশ্ববিদ্যালয় ও ইঞ্জিনিয়ারিং সংলগ্ন আবাসিক এলাকা',
    isPopular: true,
    isActive: true,
    sortOrder: 46,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'krishi-bishwabidyalay',
    nameBn: 'কৃষি বিশ্ববিদ্যালয়',
    nameEn: 'Krishi Bishwabidyalay',
    aliases: [
      'krishi bishwabidyalay', 'krisi bishwabidyalay', 'bangladesh agricultural university', 'bau', 'varsity',
      'কৃষি বিশ্ববিদ্যালয়', 'বাকৃবি', 'বাংলাদেশ কৃষি বিশ্ববিদ্যালয়',
    ],
    prominentLandmarks: ['বাংলাদেশ কৃষি বিশ্ববিদ্যালয় (বাকৃবি)', 'বাকৃবি গেট'],
    popularFor: 'কৃষি বিশ্ববিদ্যালয় ক্যাম্পাস ও এর আশপাশের এলাকা',
    isActive: true,
    sortOrder: 47,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'bishwabidyalay-shesh-mor',
    nameBn: 'বিশ্ববিদ্যালয় শেষ মোড়',
    nameEn: 'Bishwabidyalay Shesh Mor',
    aliases: [
      'bishwabidyalay shesh mor', 'bishwabidyalay sheshmor', 'varsity shesh mor', 'university shesh mor',
      'বিশ্ববিদ্যালয় শেষ মোড়', 'বিশ্ববিদ্যালয় শেষমোড়',
    ],
    prominentLandmarks: ['বিশ্ববিদ্যালয় শেষ মোড়', 'কেওয়াটখালী সংযোগ'],
    popularFor: 'কৃষি বিশ্ববিদ্যালয় সংলগ্ন শেষ মোড় ও আবাসিক এলাকা',
    isActive: true,
    sortOrder: 48,
    sourceNote: SOURCE_NOTE,
  },
];

/**
 * Areas that were part of the previous list but are no longer selectable.
 * Kept ONLY so existing rows (posts, profiles, requests) that still store an
 * old id can be resolved to a readable name. They never appear in any picker,
 * filter or validation path.
 */
const LEGACY_MCC_AREAS: MCCArea[] = [
  {
    id: 'sehara',
    nameBn: 'সেহারা',
    nameEn: 'Sehara',
    aliases: ['sehara', 'sehora'],
    prominentLandmarks: ['সেহারা ডিবি রোড'],
    popularFor: 'পুরাতন এলাকা',
    isActive: false,
    sortOrder: 901,
    sourceNote: 'পুরাতন এলাকা (শুধু রেফারেন্স)',
  },
  {
    id: 'panditpara',
    nameBn: 'পন্ডিতপাড়া',
    nameEn: 'Panditpara',
    aliases: ['panditpara', 'ponditpara'],
    prominentLandmarks: ['পন্ডিতপাড়া লেন'],
    popularFor: 'পুরাতন এলাকা',
    isActive: false,
    sortOrder: 902,
    sourceNote: 'পুরাতন এলাকা (শুধু রেফারেন্স)',
  },
  {
    id: 'brahmapalli',
    nameBn: 'ব্রাহ্মপল্লী',
    nameEn: 'Brahmapalli',
    aliases: ['brahmapalli', 'bromhopalli'],
    prominentLandmarks: ['ব্রাহ্মপল্লী মোড়'],
    popularFor: 'পুরাতন এলাকা',
    isActive: false,
    sortOrder: 903,
    sourceNote: 'পুরাতন এলাকা (শুধু রেফারেন্স)',
  },
  {
    id: 'nayapara-kachijhuli',
    nameBn: 'নয়াপাড়া (কাঁচিঝুলি)',
    nameEn: 'Nayapara (Kachijhuli)',
    aliases: ['nayapara', 'naya para'],
    prominentLandmarks: ['মীরবাড়ী লেন'],
    popularFor: 'পুরাতন এলাকা',
    isActive: false,
    sortOrder: 904,
    sourceNote: 'পুরাতন এলাকা (শুধু রেফারেন্স)',
  },
  {
    id: 'nawmahal',
    nameBn: 'নওমহল',
    nameEn: 'Nawmahal',
    aliases: ['nawmahal', 'nowmohol', 'naomahal'],
    prominentLandmarks: ['নওমহল প্রাথমিক বিদ্যালয়'],
    popularFor: 'পুরাতন এলাকা',
    isActive: false,
    sortOrder: 905,
    sourceNote: 'পুরাতন এলাকা (শুধু রেফারেন্স)',
  },
  {
    id: 'krishtopur',
    nameBn: 'কৃষ্টপুর',
    nameEn: 'Krishtopur',
    aliases: ['krishtopur', 'krishtapur'],
    prominentLandmarks: ['কৃষ্টপুর দোখলা মোড়'],
    popularFor: 'পুরাতন এলাকা',
    isActive: false,
    sortOrder: 906,
    sourceNote: 'পুরাতন এলাকা (শুধু রেফারেন্স)',
  },
  {
    id: 'choto-bazar',
    nameBn: 'ছোট বাজার',
    nameEn: 'Choto Bazar',
    aliases: ['choto bazar', 'choto bazaar'],
    prominentLandmarks: ['রেলওয়ে স্টেশন রোড'],
    popularFor: 'পুরাতন এলাকা',
    isActive: false,
    sortOrder: 907,
    sourceNote: 'পুরাতন এলাকা (শুধু রেফারেন্স)',
  },
  {
    id: 'boyra',
    nameBn: 'বয়রা',
    nameEn: 'Boyra',
    aliases: ['boyra', 'boira'],
    prominentLandmarks: ['বয়রা বাজার'],
    popularFor: 'পুরাতন এলাকা',
    isActive: false,
    sortOrder: 908,
    sourceNote: 'পুরাতন এলাকা (শুধু রেফারেন্স)',
  },
  {
    id: 'shikarikanda',
    nameBn: 'শিকারীকান্দা',
    nameEn: 'Shikarikanda',
    aliases: ['shikarikanda', 'shikar kanda'],
    prominentLandmarks: ['শিকারীকান্দা বাইপাস'],
    popularFor: 'পুরাতন এলাকা',
    isActive: false,
    sortOrder: 909,
    sourceNote: 'পুরাতন এলাকা (শুধু রেফারেন্স)',
  },
  {
    id: 'shambhuganj',
    nameBn: 'শম্ভুগঞ্জ',
    nameEn: 'Shambhuganj',
    aliases: ['shambhuganj', 'shombhuganj', 'shombhugonj'],
    prominentLandmarks: ['শম্ভুগঞ্জ ব্রিজ মোড়'],
    popularFor: 'পুরাতন এলাকা',
    isActive: false,
    sortOrder: 910,
    sourceNote: 'পুরাতন এলাকা (শুধু রেফারেন্স)',
  },
  {
    id: 'dapunia-east',
    nameBn: 'দাপুনিয়া',
    nameEn: 'Dapunia',
    aliases: ['dapunia', 'dapuniya'],
    prominentLandmarks: ['দাপুনিয়া বাজার'],
    popularFor: 'পুরাতন এলাকা',
    isActive: false,
    sortOrder: 911,
    sourceNote: 'পুরাতন এলাকা (শুধু রেফারেন্স)',
  },
  {
    id: 'sutiakhali',
    nameBn: 'সুতিয়াখালী',
    nameEn: 'Sutiakhali',
    aliases: ['sutiakhali', 'sutiakhali solar'],
    prominentLandmarks: ['সুতিয়াখালী বাজার'],
    popularFor: 'পুরাতন এলাকা',
    isActive: false,
    sortOrder: 912,
    sourceNote: 'পুরাতন এলাকা (শুধু রেফারেন্স)',
  },
  {
    id: 'char-ishwardia',
    nameBn: 'চর ঈশ্বরদিয়া',
    nameEn: 'Char Ishwardia',
    aliases: ['char ishwardia', 'ishwardia'],
    prominentLandmarks: ['শম্ভুগঞ্জ ব্রিজ পশ্চিম নদী তীর'],
    popularFor: 'পুরাতন এলাকা',
    isActive: false,
    sortOrder: 913,
    sourceNote: 'পুরাতন এলাকা (শুধু রেফারেন্স)',
  },
];

/** Fast id lookup across active + legacy areas. */
const AREA_BY_ID: Map<string, MCCArea> = new Map(
  [...MCC_AREAS, ...LEGACY_MCC_AREAS].map((area) => [area.id, area])
);

/**
 * Stable instance of the selectable MCC list. Kept as a single array so the
 * search-index WeakMap in this module (and in `lib/tolet-areas.ts`) can cache
 * against its identity instead of rebuilding on every keystroke.
 */
const ACTIVE_MCC_AREAS: MCCArea[] = MCC_AREAS.filter((area) => area.isActive);

/**
 * The four operations every area picker/filter needs. A "source" lets a UI
 * component be pointed at either the global MCC list (default) or a scoped
 * list such as To-Let's, without the component importing area data directly.
 */
export interface AreaSource {
  /** All selectable areas, in display order. */
  all: () => MCCArea[];
  /** Popular areas for the quick-selection chips. */
  popular: () => MCCArea[];
  /** Bangla/English search across this source's list. */
  search: (query: string) => MCCArea[];
  /** Resolve an id (active or legacy) to a display area. */
  byId: (id: string | null | undefined) => MCCArea | undefined;
}

export function createAreaSource(areas: MCCArea[]): AreaSource {
  return {
    all: () => areas,
    popular: () => getPopularMCCAreas().filter((area) => areas.some((item) => item.id === area.id)),
    search: (query) => searchAreaList(query, areas),
    byId: (id) => areas.find((area) => area.id === id) ?? getAreaById(id),
  };
}

/** The default, site-wide area source (48 active MCC areas + legacy lookup). */
export const MCC_AREA_SOURCE: AreaSource = {
  all: () => getAllMCCAreas({ activeOnly: true }),
  popular: () => getPopularMCCAreas(),
  search: (query) => searchMCCAreas(query),
  byId: (id) => getAreaById(id),
};

// =========================================================================
// SEARCH — Bangla <-> English transliteration, spelling variants, partial
// =========================================================================

const BN_TO_LATIN: Record<string, string> = {
  'অ': 'o', 'আ': 'a', 'ই': 'i', 'ঈ': 'i', 'উ': 'u', 'ঊ': 'u', 'ঋ': 'ri', 'এ': 'e', 'ঐ': 'oi', 'ও': 'o', 'ঔ': 'ou',
  'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'ng',
  'চ': 'ch', 'ছ': 'chh', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'n',
  'ট': 't', 'ঠ': 'th', 'ড': 'd', 'ঢ': 'dh', 'ণ': 'n',
  'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
  'প': 'p', 'ফ': 'ph', 'ব': 'b', 'ভ': 'bh', 'ম': 'm',
  'য': 'j', 'র': 'r', 'ল': 'l', 'শ': 'sh', 'ষ': 'sh', 'স': 's', 'হ': 'h',
  'ড়': 'r', 'ঢ়': 'rh', 'য়': 'y', 'ৎ': 't', 'ং': 'ng', 'ঁ': '', 'ঃ': 'h',
  'া': 'a', 'ি': 'i', 'ী': 'i', 'ু': 'u', 'ূ': 'u', 'ৃ': 'ri', 'ে': 'e', 'ৈ': 'oi', 'ো': 'o', 'ৌ': 'ou',
  '্': '',
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
};

/** Convert Bangla (and dotted Bengali letters) to a Latin approximation. */
export function transliterateBn(input: string): string {
  if (!input) return '';
  let out = '';
  for (const ch of input) out += BN_TO_LATIN[ch] ?? ch;
  return out.toLowerCase();
}

/**
 * A loose phonetic key that ignores vowels and common transliteration
 * digraphs, so "Charpara", "Chorpara" and "চরপাড়া" collapse together.
 */
export function phoneticKey(input: string): string {
  if (!input) return '';
  let s = transliterateBn(input)
    .replace(/chh/g, 'c')
    .replace(/ch/g, 'c')
    .replace(/sh/g, 's')
    .replace(/ss/g, 's')
    .replace(/kh/g, 'k')
    .replace(/gh/g, 'g')
    .replace(/th/g, 't')
    .replace(/dh/g, 'd')
    .replace(/ph/g, 'f')
    .replace(/bh/g, 'b')
    .replace(/jh/g, 'j')
    .replace(/rh/g, 'r')
    .replace(/ng/g, 'n')
    .replace(/[^a-z0-9]/g, '');
  s = s.replace(/[aeiou]/g, '');
  s = s.replace(/(.)\1+/g, '$1');
  return s;
}

/** Lowercase, trim and drop punctuation/extra spacing. */
function normalize(input: string): string {
  return transliterateBn(input.trim().toLowerCase())
    .replace(/[^a-z0-9\u0980-\u09ff]/g, '')
    .trim();
}

interface AreaSearchIndex {
  area: MCCArea;
  /** Primary searchable strings: name + transliterations + aliases. */
  keys: string[];
  /** Landmark strings, matched with a lower weight than the names. */
  landmarks: string[];
  phonetic: string[];
}

function buildSearchIndex(areas: MCCArea[]): AreaSearchIndex[] {
  return areas.map((area) => {
    const keys = [area.nameBn, area.nameEn, ...area.aliases]
      .map((value) => normalize(value))
      .filter(Boolean);
    const landmarks = area.prominentLandmarks
      .map((value) => normalize(value))
      .filter(Boolean);
    return {
      area,
      keys,
      landmarks,
      phonetic: [phoneticKey(area.nameBn), phoneticKey(area.nameEn), ...area.aliases.map(phoneticKey)].filter(
        (key) => key.length >= 2
      ),
    };
  });
}

/**
 * The MCC list and the To-Let list are stable module constants, so each list's
 * index is built once and reused on every keystroke instead of being rebuilt
 * inside `searchAreaList`. Keyed by array reference, which is why the exported
 * list helpers always hand back the same array instance.
 */
const SEARCH_INDEX_CACHE = new WeakMap<MCCArea[], AreaSearchIndex[]>();

function searchIndexFor(areas: MCCArea[]): AreaSearchIndex[] {
  let index = SEARCH_INDEX_CACHE.get(areas);
  if (!index) {
    index = buildSearchIndex(areas);
    SEARCH_INDEX_CACHE.set(areas, index);
  }
  return index;
}

/**
 * Search ANY provided area list (Bangla or English). Handles partial matches,
 * transliteration variants and spelling differences. Returns the list unchanged
 * (in display order) when the query is empty.
 *
 * This is the shared engine behind `searchMCCAreas` and the To-Let-only
 * search, so both behave identically without duplicating the scoring rules.
 */
export function searchAreaList(query: string, areas: MCCArea[]): MCCArea[] {
  if (!query || !query.trim()) {
    return areas;
  }

  const q = normalize(query);
  const qPhonetic = phoneticKey(query);

  const scored = searchIndexFor(areas).map((entry) => {
    let score = 0;

    // Names / aliases carry the most weight.
    for (const key of entry.keys) {
      if (!key) continue;
      if (key === q) {
        score = Math.max(score, 100);
      } else if (key.startsWith(q)) {
        score = Math.max(score, 85);
      } else if (key.includes(q)) {
        score = Math.max(score, 65);
      }
    }

    // Bengali name may contain characters we stripped while building keys.
    if (entry.area.nameBn.toLowerCase().includes(query.trim().toLowerCase())) {
      score = Math.max(score, 90);
    }

    // Landmarks help discovery but should never outrank a name match.
    for (const key of entry.landmarks) {
      if (key && key.includes(q)) {
        score = Math.max(score, 25);
      }
    }

    if (qPhonetic.length >= 2) {
      for (const key of entry.phonetic) {
        if (key === qPhonetic) {
          score = Math.max(score, 55);
        } else if (key.includes(qPhonetic) || qPhonetic.includes(key)) {
          score = Math.max(score, 40);
        }
      }
    }

    return { area: entry.area, score };
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => (b.score - a.score) || (a.area.sortOrder - b.area.sortOrder));

  return scored.map((item) => item.area);
}

/**
 * Search the active MCC area list (Bangla or English). Handles partial
 * matches, transliteration variants and spelling differences. Returns the full
 * list (in display order) when the query is empty.
 *
 * To-Let-only areas live in `lib/tolet-areas.ts` and are deliberately NOT
 * reachable from here — this function stays the global marketplace source.
 */
export function searchMCCAreas(query: string): MCCArea[] {
  return searchAreaList(query, getAllMCCAreas({ activeOnly: true }));
}

// =========================================================================
// QUERY & HELPER UTILITIES
// =========================================================================

/** Returns all active MCC areas (the picker/filter list). */
export function getAllMCCAreas(options?: { activeOnly?: boolean }): MCCArea[] {
  const activeOnly = options?.activeOnly ?? true;
  if (activeOnly) return ACTIVE_MCC_AREAS;
  return MCC_AREAS;
}

/** Returns popular active areas for quick-selection chips. */
export function getPopularMCCAreas(): MCCArea[] {
  return MCC_AREAS.filter((area) => area.isActive && area.isPopular);
}

/**
 * Look up an area by id, including legacy ids so historical records keep
 * rendering a name. Use `isInsideMCC` to check whether it is still selectable.
 */
export function getAreaById(id: string | null | undefined): MCCArea | undefined {
  if (!id) return undefined;
  return AREA_BY_ID.get(id);
}

/** Whether an area id is an active, currently selectable MCC area. */
export function isInsideMCC(areaId: string | null | undefined): boolean {
  if (!areaId) return false;
  const area = AREA_BY_ID.get(areaId);
  return Boolean(area && area.isActive);
}

/** Strict validator returning a Bengali error message when invalid. */
export function validateAreaId(areaId: string): { valid: boolean; area?: MCCArea; error?: string } {
  const area = getAreaById(areaId);
  if (!area || !area.isActive) {
    return {
      valid: false,
      error: 'নির্বাচিত এলাকাটি ময়মনসিংহ সিটি কর্পোরেশনের সক্রিয় তালিকায় নেই। দয়া করে তালিকা থেকে সঠিক এলাকা বেছে নিন।',
    };
  }
  return { valid: true, area };
}

/** Strict validator for Home Moving (বাসা পাল্টানো) which needs TWO areas. */
export function validateMovingRoute(
  pickupAreaId: string,
  destinationAreaId: string
): { valid: boolean; pickup?: MCCArea; destination?: MCCArea; error?: string } {
  const pickup = getAreaById(pickupAreaId);
  const destination = getAreaById(destinationAreaId);

  if (!pickup || !pickup.isActive) {
    return {
      valid: false,
      error: 'বর্তমান এলাকা (কোথা থেকে) ময়মনসিংহ সিটি কর্পোরেশনের সক্রিয় এলাকা হতে হবে।',
    };
  }

  if (!destination || !destination.isActive) {
    return {
      valid: false,
      error: 'নতুন এলাকা (কোথায়) ময়মনসিংহ সিটি কর্পোরেশনের সক্রিয় এলাকা হতে হবে।',
    };
  }

  return { valid: true, pickup, destination };
}

/** Formats a public locality string, e.g. "চরপাড়া, ময়মনসিংহ". */
export function formatPublicArea(areaId: string | null | undefined): string {
  if (!areaId) return 'ময়মনসিংহ সিটি কর্পোরেশন';
  const area = getAreaById(areaId);
  if (!area) return 'ময়মনসিংহ সিটি কর্পোরেশন';
  return `${area.nameBn}, ময়মনসিংহ`;
}
