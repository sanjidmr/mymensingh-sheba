/**
 * Mymensingh City Corporation (MCC) Centralized Location System
 * 
 * =========================================================================
 * PRIMARY SOURCE OF TRUTH:
 * Bangladesh Gazette (Extraordinary), 28 February 2019 / Official Ward
 * Delimitation of Mymensingh City Corporation (33 General Wards).
 * 
 * CORE ARCHITECTURAL & BUSINESS RULES:
 * 1. Mymensingh Sheba operates EXCLUSIVELY inside Mymensingh City Corporation.
 * 2. Locations outside the City Corporation boundary are strictly rejected.
 * 3. Stable string IDs are used everywhere (never loose free-text strings).
 * 4. Recognizable locality/neighborhood names are customer-facing;
 *    ward numbers are available internally and for administrative mapping.
 * 5. Road names and English transliterations are preserved as search aliases.
 * 6. Public display formats separate general locality from private full addresses.
 * =========================================================================
 */

export interface MCCWard {
  wardNo: number; // 1 to 33
  nameBn: string; // e.g. '০১ নং ওয়ার্ড'
  nameEn: string; // e.g. 'Ward 01'
  headquarterBn: string; // Key locality or prominent junction
  areaCount?: number;
  descriptionBn: string;
  sourceGazette: string;
}

export interface MCCArea {
  id: string; // Stable unique identifier (kebab-case)
  nameBn: string; // Primary Bengali display name
  nameEn: string; // Primary English name
  wardNo: number; // Ward 1-33
  wardLabelBn: string; // e.g. '১৪ নং ওয়ার্ড'
  aliases: string[]; // Search aliases: English transliterations, alternate Bengali spellings, notable junctions
  prominentLandmarks: string[]; // Key landmarks to assist users
  popularFor: string; // Short localized description
  isPopular?: boolean; // Featured in top/quick selection chips
  isActive: boolean; // Managed by Admin
  sortOrder: number;
  sourceNote: string; // Gazette/Official reference
}

/**
 * Verified 33 General Wards of Mymensingh City Corporation
 */
export const MCC_WARDS: MCCWard[] = [
  {
    wardNo: 1,
    nameBn: '০১ নং ওয়ার্ড',
    nameEn: 'Ward 01',
    headquarterBn: 'খাগডহর',
    descriptionBn: 'খাগডহর, জেলখানা ঘাট, রঘুরামপুর ও পশ্চিম ব্রহ্মপুত্র নদী তীরবর্তী এলাকা।',
    sourceGazette: 'গেজেট অতিরিক্ত ২০১৯, ময়মনসিংহ সিটি কর্পোরেশন ওয়ার্ড পুনর্বিন্যাস',
  },
  {
    wardNo: 2,
    nameBn: '০২ নং ওয়ার্ড',
    nameEn: 'Ward 02',
    headquarterBn: 'নওমহল',
    descriptionBn: 'নওমহল, বাড়েরা, উজান বাড়েরা ও নাসিরাবাদ কলেজ সংলগ্ন এলাকা।',
    sourceGazette: 'গেজেট অতিরিক্ত ২০১৯, ময়মনসিংহ সিটি কর্পোরেশন ওয়ার্ড পুনর্বিন্যাস',
  },
  {
    wardNo: 3,
    nameBn: '০৩ নং ওয়ার্ড',
    nameEn: 'Ward 03',
    headquarterBn: 'বাঘমারা কড়ইতলা / চক রাঘবপুর',
    descriptionBn: 'চক রাঘবপুর, বাঘমারা কড়ইতলা ও দাপুনিয়া সংযোগ এলাকা।',
    sourceGazette: 'গেজেট অতিরিক্ত ২০১৯, ময়মনসিংহ সিটি কর্পোরেশন ওয়ার্ড পুনর্বিন্যাস',
  },
  {
    wardNo: 4,
    nameBn: '০৪ নং ওয়ার্ড',
    nameEn: 'Ward 04',
    headquarterBn: 'আকুয়া উত্তর পাড়া',
    descriptionBn: 'আকুয়া উত্তর পাড়া, চৌরঙ্গী মোড় ও হাউজিং কোয়ার্টার সংলগ্ন।',
    sourceGazette: 'গেজেট অতিরিক্ত ২০১৯, ময়মনসিংহ সিটি কর্পোরেশন ওয়ার্ড পুনর্বিন্যাস',
  },
  {
    wardNo: 5,
    nameBn: '০৫ নং ওয়ার্ড',
    nameEn: 'Ward 05',
    headquarterBn: 'শিকারীকান্দা',
    descriptionBn: 'শিকারীকান্দা, মেডিক্যাল কলেজ হাসপাতাল পশ্চিম পার্শ্ব ও চুরখাই সংযোগ।',
    sourceGazette: 'গেজেট অতিরিক্ত ২০১৯, ময়মনসিংহ সিটি কর্পোরেশন ওয়ার্ড পুনর্বিন্যাস',
  },
  {
    wardNo: 6,
    nameBn: '০৬ নং ওয়ার্ড',
    nameEn: 'Ward 06',
    headquarterBn: 'আকুয়া দক্ষিণ পাড়া',
    descriptionBn: 'আকুয়া দক্ষিণ পাড়া ও হাবুন বেপারী মোড় সংলগ্ন আবাসিক এলাকা।',
    sourceGazette: 'গেজেট অতিরিক্ত ২০১৯, ময়মনসিংহ সিটি কর্পোরেশন ওয়ার্ড পুনর্বিন্যাস',
  },
  {
    wardNo: 7,
    nameBn: '০৭ নং ওয়ার্ড',
    nameEn: 'Ward 07',
    headquarterBn: 'কালিবাড়ী',
    descriptionBn: 'কালিবাড়ী রোড, দুর্গাবাড়ী, বড় বাজার অংশ ও পুরাতন ব্রহ্মপুত্র নদ তীর।',
    sourceGazette: 'গেজেট অতিরিক্ত ২০১৯, ময়মনসিংহ সিটি কর্পোরেশন ওয়ার্ড পুনর্বিন্যাস',
  },
  {
    wardNo: 8,
    nameBn: '০৮ নং ওয়ার্ড',
    nameEn: 'Ward 08',
    headquarterBn: 'নতুন বাজার',
    descriptionBn: 'নতুন বাজার মোড়, মেছুয়া বাজার, জিলা পরিষদ ও গোলপুকুর পাড়।',
    sourceGazette: 'গেজেট অতিরিক্ত ২০১৯, ময়মনসিংহ সিটি কর্পোরেশন ওয়ার্ড পুনর্বিন্যাস',
  },
  {
    wardNo: 9,
    nameBn: '০৯ নং ওয়ার্ড',
    nameEn: 'Ward 09',
    headquarterBn: 'ছোট বাজার',
    descriptionBn: 'ছোট বাজার, গাঙ্গিনারপাড় উত্তর ও রেলওয়ে কলোনি উত্তর অংশ।',
    sourceGazette: 'গেজেট অতিরিক্ত ২০১৯, ময়মনসিংহ সিটি কর্পোরেশন ওয়ার্ড পুনর্বিন্যাস',
  },
  {
    wardNo: 10,
    nameBn: '১০ নং ওয়ার্ড',
    nameEn: 'Ward 10',
    headquarterBn: 'গাঙ্গিনারপাড় ও টাউন হল',
    descriptionBn: 'গাঙ্গিনারপাড়, টাউন হল, পন্ডিতপাড়া ও পৌর পার্ক সংলগ্ন শহরের কেন্দ্রস্থল।',
    sourceGazette: 'গেজেট অতিরিক্ত ২০১৯, ময়মনসিংহ সিটি কর্পোরেশন ওয়ার্ড পুনর্বিন্যাস',
  },
  {
    wardNo: 11,
    nameBn: '১১ নং ওয়ার্ড',
    nameEn: 'Ward 11',
    headquarterBn: 'কাঁচিঝুলি',
    descriptionBn: 'কাঁচিঝুলি, জিলা স্কুল রোড, নয়াপাড়া ও মীরবাড়ী আবাসিক এলাকা।',
    sourceGazette: 'গেজেট অতিরিক্ত ২০১৯, ময়মনসিংহ সিটি কর্পোরেশন ওয়ার্ড পুনর্বিন্যাস',
  },
  {
    wardNo: 12,
    nameBn: '১২ নং ওয়ার্ড',
    nameEn: 'Ward 12',
    headquarterBn: 'বাঘমারা ও কৃষ্টপুর',
    descriptionBn: 'বাঘমারা, কৃষ্টপুর দোখলা মোড় ও বিদ্যুৎ অফিস সংলগ্ন আবাসিক এলাকা।',
    sourceGazette: 'গেজেট অতিরিক্ত ২০১৯, ময়মনসিংহ সিটি কর্পোরেশন ওয়ার্ড পুনর্বিন্যাস',
  },
  {
    wardNo: 13,
    nameBn: '১৩ নং ওয়ার্ড',
    nameEn: 'Ward 13',
    headquarterBn: 'সানকিপাড়া ও ব্রাহ্মপল্লী',
    descriptionBn: 'সানকিপাড়া শেষ মোড়, ব্রাহ্মপল্লী ও আনন্দ মোহন কলেজ সংলগ্ন ছাত্রাবাস ও আবাসিক এলাকা।',
    sourceGazette: 'গেজেট অতিরিক্ত ২০১৯, ময়মনসিংহ সিটি কর্পোরেশন ওয়ার্ড পুনর্বিন্যাস',
  },
  {
    wardNo: 14,
    nameBn: '১৪ নং ওয়ার্ড',
    nameEn: 'Ward 14',
    headquarterBn: 'চরপাড়া',
    descriptionBn: 'চরপাড়া, ময়মনসিংহ মেডিকেল কলেজ হাসপাতাল, সেহারা ও ভাটিকাশর এলাকা।',
    sourceGazette: 'গেজেট অতিরিক্ত ২০১৯, ময়মনসিংহ সিটি কর্পোরেশন ওয়ার্ড পুনর্বিন্যাস',
  },
  {
    wardNo: 15,
    nameBn: '১৫ নং ওয়ার্ড',
    nameEn: 'Ward 15',
    headquarterBn: 'আকুয়া মোড়লপাড়া / বাইপাস',
    descriptionBn: 'আকুয়া মোড়লপাড়া, ফুলবাড়ীয়া রোড ও আনন্দ নিকেতন এলাকা।',
    sourceGazette: 'গেজেট অতিরিক্ত ২০১৯, ময়মনসিংহ সিটি কর্পোরেশন ওয়ার্ড পুনর্বিন্যাস',
  },
  {
    wardNo: 16,
    nameBn: '১৬ নং ওয়ার্ড',
    nameEn: 'Ward 16',
    headquarterBn: 'মাসকান্দা',
    descriptionBn: 'মাসকান্দা, বাস টার্মিনাল, পলিটেকনিক ইনস্টিটিউট ও গণসার মোড়।',
    sourceGazette: 'গেজেট অতিরিক্ত ২০১৯, ময়মনসিংহ সিটি কর্পোরেশন ওয়ার্ড পুনর্বিন্যাস',
  },
  {
    wardNo: 17,
    nameBn: '১৭ নং ওয়ার্ড',
    nameEn: 'Ward 17',
    headquarterBn: 'ধোপাখোলা ও কাঠগোলা',
    descriptionBn: 'ধোপাখোলা, কাঠগোলা ও বলাশপুর পশ্চিম সংলগ্ন আবাসিক এলাকা।',
    sourceGazette: 'গেজেট অতিরিক্ত ২০১৯, ময়মনসিংহ সিটি কর্পোরেশন ওয়ার্ড পুনর্বিন্যাস',
  },
  {
    wardNo: 18,
    nameBn: '১৮ নং ওয়ার্ড',
    nameEn: 'Ward 18',
    headquarterBn: 'কেওয়াটখালী',
    descriptionBn: 'কেওয়াটখালী, বিদ্যুৎ পাওয়ার হাউস ও বাংলাদেশ কৃষি বিশ্ববিদ্যালয় গেট সংলগ্ন এলাকা।',
    sourceGazette: 'গেজেট অতিরিক্ত ২০১৯, ময়মনসিংহ সিটি কর্পোরেশন ওয়ার্ড পুনর্বিন্যাস',
  },
  {
    wardNo: 19,
    nameBn: '১৯ নং ওয়ার্ড',
    nameEn: 'Ward 19',
    headquarterBn: 'বলাশপুর',
    descriptionBn: 'বলাশপুর ও মির্জাপুর সংলগ্ন সিটি কর্পোরেশন এলাকা।',
    sourceGazette: 'গেজেট অতিরিক্ত ২০১৯, ময়মনসিংহ সিটি কর্পোরেশন ওয়ার্ড পুনর্বিন্যাস',
  },
  {
    wardNo: 20,
    nameBn: '২০ নং ওয়ার্ড',
    nameEn: 'Ward 20',
    headquarterBn: 'বয়রা ও কাশর',
    descriptionBn: 'বয়রা, কাশর ও পুলিশ লাইন রোড সংলগ্ন আবাসিক এলাকা।',
    sourceGazette: 'গেজেট অতিরিক্ত ২০১৯, ময়মনসিংহ সিটি কর্পোরেশন ওয়ার্ড পুনর্বিন্যাস',
  },
  {
    wardNo: 21,
    nameBn: '২১ নং ওয়ার্ড',
    nameEn: 'Ward 21',
    headquarterBn: 'খাগডহর দক্ষিণ',
    descriptionBn: 'খাগডহর দক্ষিণ অংশ ও বিজিবি সেক্টর হেডকোয়ার্টার্স সংলগ্ন এলাকা।',
    sourceGazette: 'গেজেট অতিরিক্ত ২০১৯, ময়মনসিংহ সিটি কর্পোরেশন ওয়ার্ড পুনর্বিন্যাস',
  },
  {
    wardNo: 22,
    nameBn: '২২ নং ওয়ার্ড',
    nameEn: 'Ward 22',
    headquarterBn: 'সুতিয়াখালী',
    descriptionBn: 'সুতিয়াখালী ও ঢাকা-ময়মনসিংহ মহাসড়ক সংলগ্ন সিটি এলাকা।',
    sourceGazette: 'গেজেট অতিরিক্ত ২০১৯, ময়মনসিংহ সিটি কর্পোরেশন ওয়ার্ড পুনর্বিন্যাস',
  },
  {
    wardNo: 23,
    nameBn: '২৩ নং ওয়ার্ড',
    nameEn: 'Ward 23',
    headquarterBn: 'চুরখাই / সুতিয়াখালী দক্ষিণ',
    descriptionBn: 'চুরখাই বাজার ও সুতিয়াখালী দক্ষিণ বাইপাস সংলগ্ন এলাকা।',
    sourceGazette: 'গেজেট অতিরিক্ত ২০১৯, ময়মনসিংহ সিটি কর্পোরেশন ওয়ার্ড পুনর্বিন্যাস',
  },
  {
    wardNo: 24,
    nameBn: '২৪ নং ওয়ার্ড',
    nameEn: 'Ward 24',
    headquarterBn: 'বয়রা পশ্চিম',
    descriptionBn: 'বয়রা পশ্চিম ও বাঘমারা পূর্ব সীমানা সংলগ্ন এলাকা।',
    sourceGazette: 'গেজেট অতিরিক্ত ২০১৯, ময়মনসিংহ সিটি কর্পোরেশন ওয়ার্ড পুনর্বিন্যাস',
  },
  {
    wardNo: 25,
    nameBn: '২৫ নং ওয়ার্ড',
    nameEn: 'Ward 25',
    headquarterBn: 'দাপুনিয়া পূর্ব',
    descriptionBn: 'দাপুনিয়া বাজার সংলগ্ন পূর্ব অংশ ও বাইপাস মোড়।',
    sourceGazette: 'গেজেট অতিরিক্ত ২০১৯, ময়মনসিংহ সিটি কর্পোরেশন ওয়ার্ড পুনর্বিন্যাস',
  },
  {
    wardNo: 26,
    nameBn: '২৬ নং ওয়ার্ড',
    nameEn: 'Ward 26',
    headquarterBn: 'গণ্ডপা',
    descriptionBn: 'গণ্ডপা ও পরানগঞ্জ সংযোগ সড়ক এলাকা।',
    sourceGazette: 'গেজেট অতিরিক্ত ২০১৯, ময়মনসিংহ সিটি কর্পোরেশন ওয়ার্ড পুনর্বিন্যাস',
  },
  {
    wardNo: 27,
    nameBn: '২৭ নং ওয়ার্ড',
    nameEn: 'Ward 27',
    headquarterBn: 'গলগণ্ডা',
    descriptionBn: 'গলগণ্ডা ও পুরাতন নদীপাড় সীমানা এলাকা।',
    sourceGazette: 'গেজেট অতিরিক্ত ২০১৯, ময়মনসিংহ সিটি কর্পোরেশন ওয়ার্ড পুনর্বিন্যাস',
  },
  {
    wardNo: 28,
    nameBn: '২৮ নং ওয়ার্ড',
    nameEn: 'Ward 28',
    headquarterBn: 'চর ঈশ্বরদিয়া',
    descriptionBn: 'চর ঈশ্বরদিয়া ও শম্ভুগঞ্জ ব্রিজ পশ্চিম প্রান্ত সংলগ্ন নদী তীর।',
    sourceGazette: 'গেজেট অতিরিক্ত ২০১৯, ময়মনসিংহ সিটি কর্পোরেশন ওয়ার্ড পুনর্বিন্যাস',
  },
  {
    wardNo: 29,
    nameBn: '২৯ নং ওয়ার্ড',
    nameEn: 'Ward 29',
    headquarterBn: 'শম্ভুগঞ্জ বাজার',
    descriptionBn: 'শম্ভুগঞ্জ বাজার, রেলগেট ও নেত্রকোনা-কিশোরগঞ্জ সংযোগ মোড়।',
    sourceGazette: 'গেজেট অতিরিক্ত ২০১৯, ময়মনসিংহ সিটি কর্পোরেশন ওয়ার্ড পুনর্বিন্যাস',
  },
  {
    wardNo: 30,
    nameBn: '৩০ নং ওয়ার্ড',
    nameEn: 'Ward 30',
    headquarterBn: 'চর রঘুরামপুর',
    descriptionBn: 'চর রঘুরামপুর ও পূর্ব ব্রহ্মপুত্র নদী চর এলাকা।',
    sourceGazette: 'গেজেট অতিরিক্ত ২০১৯, ময়মনসিংহ সিটি কর্পোরেশন ওয়ার্ড পুনর্বিন্যাস',
  },
  {
    wardNo: 31,
    nameBn: '৩১ নং ওয়ার্ড',
    nameEn: 'Ward 31',
    headquarterBn: 'শম্ভুগঞ্জ উত্তর',
    descriptionBn: 'শম্ভুগঞ্জ উত্তর, জিকেপি হাই স্কুল রোড ও আলালপুর সংযোগ এলাকা।',
    sourceGazette: 'গেজেট অতিরিক্ত ২০১৯, ময়মনসিংহ সিটি কর্পোরেশন ওয়ার্ড পুনর্বিন্যাস',
  },
  {
    wardNo: 32,
    nameBn: '৩২ নং ওয়ার্ড',
    nameEn: 'Ward 32',
    headquarterBn: 'চর আনন্দীপুর',
    descriptionBn: 'চর আনন্দীপুর ও বোরোর চর সংলগ্ন সিটি কর্পোরেশন পূর্ব প্রান্ত।',
    sourceGazette: 'গেজেট অতিরিক্ত ২০১৯, ময়মনসিংহ সিটি কর্পোরেশন ওয়ার্ড পুনর্বিন্যাস',
  },
  {
    wardNo: 33,
    nameBn: '৩৩ নং ওয়ার্ড',
    nameEn: 'Ward 33',
    headquarterBn: 'চর গোবিন্দপুর ও চায়না মোড়',
    descriptionBn: 'চর গোবিন্দপুর, চায়না মোড় ও পাটগুদাম ব্রিজ সংলগ্ন পূর্বাঞ্চল।',
    sourceGazette: 'গেজেট অতিরিক্ত ২০১৯, ময়মনসিংহ সিটি কর্পোরেশন ওয়ার্ড পুনর্বিন্যাস',
  },
];

/**
 * Centralized Verified Localities / Areas of Mymensingh City Corporation
 * Strict Rule: Only verified localities inside the 33 General Wards.
 */
export const MCC_AREAS: MCCArea[] = [
  // Ward 14 - Medical & Central Residential Hub
  {
    id: 'charpara',
    nameBn: 'চরপাড়া',
    nameEn: 'Charpara',
    wardNo: 14,
    wardLabelBn: '১৪ নং ওয়ার্ড',
    aliases: ['charpara', 'chorpara', 'char para', 'medical', 'মেডিকেল', 'নাহার মেমোরিয়াল', 'হাসপাতাল'],
    prominentLandmarks: ['ময়মনসিংহ মেডিকেল কলেজ হাসপাতাল', 'নাহার মেমোরিয়াল রোড', 'চরপাড়া মোড়'],
    popularFor: 'মেডিকেল ও হাসপাতাল সংলগ্ন প্রধান আবাসিক ও মেস এলাকা',
    isPopular: true,
    isActive: true,
    sortOrder: 1,
    sourceNote: 'বাংলাদেশ গেজেট অতিরিক্ত ২০১৯ / ওয়ার্ড ১৪',
  },
  {
    id: 'sehara',
    nameBn: 'সেহারা',
    nameEn: 'Sehara',
    wardNo: 14,
    wardLabelBn: '১৪ নং ওয়ার্ড',
    aliases: ['sehara', 'sehora', 'ডিবি রোড', 'সেহারা মোড়'],
    prominentLandmarks: ['সেহারা ডিবি রোড', 'মেডিকেল পূর্ব গেট সংলগ্ন'],
    popularFor: 'মেডিকেল রোড সংলগ্ন শান্ত আবাসিক ও সাবলেট',
    isPopular: false,
    isActive: true,
    sortOrder: 2,
    sourceNote: 'বাংলাদেশ গেজেট অতিরিক্ত ২০১৯ / ওয়ার্ড ১৪',
  },
  {
    id: 'bhatikashor',
    nameBn: 'ভাটিকাশর',
    nameEn: 'Bhatikashor',
    wardNo: 14,
    wardLabelBn: '১৪ নং ওয়ার্ড',
    aliases: ['bhatikashor', 'vatikashor', 'bhati kashor', 'ভাটিকাশর কবরস্থান'],
    prominentLandmarks: ['ভাটিকাশর কবরস্থান রোড', 'পিপলস প্রাইমারি স্কুল'],
    popularFor: 'মেডিকেল দক্ষিণ সংলগ্ন আবাসিক এলাকা',
    isPopular: false,
    isActive: true,
    sortOrder: 3,
    sourceNote: 'বাংলাদেশ গেজেট অতিরিক্ত ২০১৯ / ওয়ার্ড ১৪',
  },

  // Ward 10 - City Core, Culture & Commerce
  {
    id: 'ganginarpar',
    nameBn: 'গাঙ্গিনারপাড়',
    nameEn: 'Ganginarpar',
    wardNo: 10,
    wardLabelBn: '১০ নং ওয়ার্ড',
    aliases: ['ganginarpar', 'ganginar par', 'গাঙ্গিনারপাড় মোড়', 'প্রেসক্লাব', 'স্টেশন রোড'],
    prominentLandmarks: ['গাঙ্গিনারপাড় ট্রাফিক মোড়', 'ময়মনসিংহ প্রেসক্লাব', 'শহীদ ফিরোজ-জাহাঙ্গীর চত্বর'],
    popularFor: 'শহরের প্রাণকেন্দ্র ও প্রধান বাণিজ্যিক এলাকা',
    isPopular: true,
    isActive: true,
    sortOrder: 4,
    sourceNote: 'বাংলাদেশ গেজেট অতিরিক্ত ২০১৯ / ওয়ার্ড ১০',
  },
  {
    id: 'town-hall',
    nameBn: 'টাউন হল',
    nameEn: 'Town Hall',
    wardNo: 10,
    wardLabelBn: '১০ নং ওয়ার্ড',
    aliases: ['town hall', 'townhall', 'টাউনহল', 'পৌর পার্ক', 'এডভোকেট তারেক স্মৃতি মিলনায়তন'],
    prominentLandmarks: ['পৌর পার্ক', 'মুসলিম হাই স্কুল', 'জেলা পরিষদ চত্বর'],
    popularFor: 'সাংস্কৃতিক কেন্দ্র ও ঐতিহ্যবাহী শান্ত আবাসিক এলাকা',
    isPopular: true,
    isActive: true,
    sortOrder: 5,
    sourceNote: 'বাংলাদেশ গেজেট অতিরিক্ত ২০১৯ / ওয়ার্ড ১০',
  },
  {
    id: 'panditpara',
    nameBn: 'পন্ডিতপাড়া',
    nameEn: 'Panditpara',
    wardNo: 10,
    wardLabelBn: '১০ নং ওয়ার্ড',
    aliases: ['panditpara', 'ponditpara', 'pandit para', 'মহিলা কলেজ'],
    prominentLandmarks: ['মুমুর্ষু মহিলা কলেজ সংলগ্ন', 'পন্ডিতপাড়া লেন'],
    popularFor: 'ঐতিহ্যবাহী শান্ত আবাসিক এলাকা ও শিক্ষক কোয়ার্টার',
    isPopular: false,
    isActive: true,
    sortOrder: 6,
    sourceNote: 'বাংলাদেশ গেজেট অতিরিক্ত ২০১৯ / ওয়ার্ড ১০',
  },

  // Ward 13 - Education Hub & Student Living
  {
    id: 'sankipara',
    nameBn: 'সানকিপাড়া',
    nameEn: 'Sankipara',
    wardNo: 13,
    wardLabelBn: '১৩ নং ওয়ার্ড',
    aliases: ['sankipara', 'shankipara', 'sanki para', 'সানকিপাড়া শেষ মোড়', 'রেলওয়ে কলোনি'],
    prominentLandmarks: ['সানকিপাড়া শেষ মোড়', 'রেলওয়ে অফিসার্স কলোনি', 'সানকিপাড়া বাজার'],
    popularFor: 'জনপ্রিয় আবাসিক এলাকা, সাশ্রয়ী বাসা ও শিক্ষার্থী মেস',
    isPopular: true,
    isActive: true,
    sortOrder: 7,
    sourceNote: 'বাংলাদেশ গেজেট অতিরিক্ত ২০১৯ / ওয়ার্ড ১৩',
  },
  {
    id: 'brahmapalli',
    nameBn: 'ব্রাহ্মপল্লী',
    nameEn: 'Brahmapalli',
    wardNo: 13,
    wardLabelBn: '১৩ নং ওয়ার্ড',
    aliases: ['brahmapalli', 'bromhopalli', 'ananda mohan', 'আনন্দ মোহন', 'কলেজ রোড'],
    prominentLandmarks: ['সরকারি আনন্দ মোহন কলেজ', 'ব্রাহ্মপল্লী মোড়', 'কলেজ ছাত্রাবাস'],
    popularFor: 'আনন্দ মোহন কলেজ সংলগ্ন শিক্ষার্থী ও শিক্ষক আবাসিক এলাকা',
    isPopular: true,
    isActive: true,
    sortOrder: 8,
    sourceNote: 'বাংলাদেশ গেজেট অতিরিক্ত ২০১৯ / ওয়ার্ড ১৩',
  },

  // Ward 11 - Premium Central Family Residential
  {
    id: 'kachijhuli',
    nameBn: 'কাঁচিঝুলি',
    nameEn: 'Kachijhuli',
    wardNo: 11,
    wardLabelBn: '১১ নং ওয়ার্ড',
    aliases: ['kachijhuli', 'kachijhuri', 'kachi jhuli', 'জিলা স্কুল রোড', 'জেলা স্কুল'],
    prominentLandmarks: ['ময়মনসিংহ জিলা স্কুল', 'কাঁচিঝুলি মোড়', 'সার্কিট হাউস সংলগ্ন'],
    popularFor: 'কেন্দ্রীয় অভিজাত আবাসিক ও ফ্যামিলি ফ্ল্যাট',
    isPopular: true,
    isActive: true,
    sortOrder: 9,
    sourceNote: 'বাংলাদেশ গেজেট অতিরিক্ত ২০১৯ / ওয়ার্ড ১১',
  },
  {
    id: 'nayapara-kachijhuli',
    nameBn: 'নয়াপাড়া (কাঁচিঝুলি)',
    nameEn: 'Nayapara (Kachijhuli)',
    wardNo: 11,
    wardLabelBn: '১১ নং ওয়ার্ড',
    aliases: ['nayapara', 'naya para kachijhuli', 'মীরবাড়ী'],
    prominentLandmarks: ['মীরবাড়ী লেন', 'কাঁচিঝুলি সংযোগ সড়ক'],
    popularFor: 'শান্ত নিরিবিলি পারিবারিক পরিবেশ',
    isPopular: false,
    isActive: true,
    sortOrder: 10,
    sourceNote: 'বাংলাদেশ গেজেট অতিরিক্ত ২০১৯ / ওয়ার্ড ১১',
  },

  // Ward 08 - Commerce & Central Junction
  {
    id: 'natun-bazar',
    nameBn: 'নতুন বাজার',
    nameEn: 'Natun Bazar',
    wardNo: 8,
    wardLabelBn: '০৮ নং ওয়ার্ড',
    aliases: ['natun bazar', 'notun bazar', 'new market', 'মেছুয়া বাজার', 'গোলপুকুর'],
    prominentLandmarks: ['নতুন বাজার ট্রাফিক মোড়', 'জিলা পরিষদ ভবন', 'গোলপুকুর পাড়'],
    popularFor: 'শহরের মূল কেন্দ্র, কেনাকাটা ও সার্বক্ষণিক যাতায়াত',
    isPopular: true,
    isActive: true,
    sortOrder: 11,
    sourceNote: 'বাংলাদেশ গেজেট অতিরিক্ত ২০১৯ / ওয়ার্ড ৮',
  },

  // Ward 16 - Transport Hub & Polytechnic
  {
    id: 'maskanda',
    nameBn: 'মাসকান্দা',
    nameEn: 'Maskanda',
    wardNo: 16,
    wardLabelBn: '১৬ নং ওয়ার্ড',
    aliases: ['maskanda', 'maskonda', 'mas kanda', 'bus terminal', 'বাস টার্মিনাল', 'পলিটেকনিক'],
    prominentLandmarks: ['মাসকান্দা কেন্দ্রীয় বাস টার্মিনাল', 'ময়মনসিংহ পলিটেকনিক ইনস্টিটিউট', 'গণসার মোড়'],
    popularFor: 'আন্তঃজেলা যোগাযোগ সংযোগস্থল ও আধুনিক আবাসিক এলাকা',
    isPopular: true,
    isActive: true,
    sortOrder: 12,
    sourceNote: 'বাংলাদেশ গেজেট অতিরিক্ত ২০১৯ / ওয়ার্ড ১৬',
  },

  // Ward 04 & 15 - Akua Greater Residential Area
  {
    id: 'akua',
    nameBn: 'আকুয়া',
    nameEn: 'Akua',
    wardNo: 4,
    wardLabelBn: '০৪ নং ওয়ার্ড',
    aliases: ['akua', 'akua chourangi', 'আকুয়া চৌরঙ্গী', 'আকুয়া বাইপাস'],
    prominentLandmarks: ['আকুয়া চৌরঙ্গী মোড়', 'মাদ্রাসা কোয়ার্টার', 'আকুয়া বাইপাস রোড'],
    popularFor: 'সুবিশাল আবাসিক এলাকা, খোলামেলা পরিবেশ ও সাশ্রয়ী ভাড়া',
    isPopular: true,
    isActive: true,
    sortOrder: 13,
    sourceNote: 'বাংলাদেশ গেজেট অতিরিক্ত ২০১৯ / ওয়ার্ড ৪ ও ১৫',
  },
  {
    id: 'akua-moralpara',
    nameBn: 'আকুয়া মোড়লপাড়া',
    nameEn: 'Akua Moralpara',
    wardNo: 15,
    wardLabelBn: '১৫ নং ওয়ার্ড',
    aliases: ['moralpara', 'akua moral para', 'ফুলবাড়ীয়া রোড'],
    prominentLandmarks: ['ফুলবাড়ীয়া রোড', 'আনন্দ নিকেতন'],
    popularFor: 'পারিবারিক আবাসিক ও সাশ্রয়ী বাসা',
    isPopular: false,
    isActive: true,
    sortOrder: 14,
    sourceNote: 'বাংলাদেশ গেজেট অতিরিক্ত ২০১৯ / ওয়ার্ড ১৫',
  },

  // Ward 02 - Nawmahal & Barera
  {
    id: 'nawmahal',
    nameBn: 'নওমহল',
    nameEn: 'Nawmahal',
    wardNo: 2,
    wardLabelBn: '০২ নং ওয়ার্ড',
    aliases: ['nawmahal', 'nowmohol', 'nawmohol', 'নাসিরাবাদ কলেজ', 'উজান বাড়েরা'],
    prominentLandmarks: ['নওমহল সরকারি প্রাথমিক বিদ্যালয়', 'নাসিরাবাদ কলেজ সংলগ্ন'],
    popularFor: 'শান্ত পারিবারিক পরিবেশ ও সাশ্রয়ী ফ্যামিলি ফ্ল্যাট',
    isPopular: true,
    isActive: true,
    sortOrder: 15,
    sourceNote: 'বাংলাদেশ গেজেট অতিরিক্ত ২০১৯ / ওয়ার্ড ২',
  },

  // Ward 12 - Baghmara & Krishtopur
  {
    id: 'baghmara',
    nameBn: 'বাঘমারা',
    nameEn: 'Baghmara',
    wardNo: 12,
    wardLabelBn: '১২ নং ওয়ার্ড',
    aliases: ['baghmara', 'bagmara', 'বাঘমারা রোড', 'বিদ্যুৎ অফিস'],
    prominentLandmarks: ['বাঘমারা মেডিকেল রোড', 'বিদ্যুৎ ভবন সংলগ্ন'],
    popularFor: 'মেডিকেল ও শহরের মাঝামাঝি আবাসিক এলাকা',
    isPopular: false,
    isActive: true,
    sortOrder: 16,
    sourceNote: 'বাংলাদেশ গেজেট অতিরিক্ত ২০১৯ / ওয়ার্ড ১২',
  },
  {
    id: 'krishtopur',
    nameBn: 'কৃষ্টপুর',
    nameEn: 'Krishtopur',
    wardNo: 12,
    wardLabelBn: '১২ নং ওয়ার্ড',
    aliases: ['krishtopur', 'krishtapur', 'dokhla mor', 'দোখলা মোড়'],
    prominentLandmarks: ['কৃষ্টপুর দোখলা মোড়', 'রেললাইন সংলগ্ন আবাসিক'],
    popularFor: 'ফ্যামিলি বাসা ও চাকরিজীবী মেস',
    isPopular: false,
    isActive: true,
    sortOrder: 17,
    sourceNote: 'বাংলাদেশ গেজেট অতিরিক্ত ২০১৯ / ওয়ার্ড ১২',
  },

  // Ward 18 - BAU Gate & Kewatkhali
  {
    id: 'kewatkhali',
    nameBn: 'কেওয়াটখালী',
    nameEn: 'Kewatkhali',
    wardNo: 18,
    wardLabelBn: '১৮ নং ওয়ার্ড',
    aliases: ['kewatkhali', 'kewat khali', 'bau gate', 'পাওয়ার হাউস', 'বাকৃবি গেট'],
    prominentLandmarks: ['বিদ্যুৎ পাওয়ার হাউস', 'বাংলাদেশ কৃষি বিশ্ববিদ্যালয় (বাকৃবি) প্রবেশ তোরণ'],
    popularFor: 'কৃষি বিশ্ববিদ্যালয় ও ইঞ্জিনিয়ারিং সংলগ্ন আবাসিক এলাকা',
    isPopular: true,
    isActive: true,
    sortOrder: 18,
    sourceNote: 'বাংলাদেশ গেজেট অতিরিক্ত ২০১৯ / ওয়ার্ড ১৮',
  },

  // Ward 07 & 09 - Riverbank & Old Market
  {
    id: 'kalibari',
    nameBn: 'কালিবাড়ী',
    nameEn: 'Kalibari',
    wardNo: 7,
    wardLabelBn: '০৭ নং ওয়ার্ড',
    aliases: ['kalibari', 'kali bari', 'কালিবাড়ী রোড', 'দুর্গাবাড়ী'],
    prominentLandmarks: ['কালিবাড়ী মন্দির মোড়', 'পুরাতন নদী বন্দর ঘাট'],
    popularFor: 'ঐতিহ্যবাহী প্রাচীন আবাসিক ও ব্যবসা কেন্দ্র',
    isPopular: false,
    isActive: true,
    sortOrder: 19,
    sourceNote: 'বাংলাদেশ গেজেট অতিরিক্ত ২০১৯ / ওয়ার্ড ৭',
  },
  {
    id: 'choto-bazar',
    nameBn: 'ছোট বাজার',
    nameEn: 'Choto Bazar',
    wardNo: 9,
    wardLabelBn: '০৯ নং ওয়ার্ড',
    aliases: ['choto bazar', 'choto bazaar', 'রেলওয়ে স্টেশন রোড'],
    prominentLandmarks: ['ময়মনসিংহ জংশন রেলওয়ে স্টেশন সংলগ্ন', 'বড় মসজিদ মোড়'],
    popularFor: 'বাণিজ্যিক এলাকা ও স্টেশন সংলগ্ন লজিং/বাসা',
    isPopular: false,
    isActive: true,
    sortOrder: 20,
    sourceNote: 'বাংলাদেশ গেজেট অতিরিক্ত ২০১৯ / ওয়ার্ড ৯',
  },

  // Ward 17 & 19 - Balashpur & Dhopakhola
  {
    id: 'dhopakhola',
    nameBn: 'ধোপাখোলা',
    nameEn: 'Dhopakhola',
    wardNo: 17,
    wardLabelBn: '১৭ নং ওয়ার্ড',
    aliases: ['dhopakhola', 'dhopa khola', 'কাঠগোলা'],
    prominentLandmarks: ['কাঠগোলা মোড়', 'বলাশপুর সংযোগ সড়ক'],
    popularFor: 'শান্ত ছায়াসুনিবিড় আবাসিক এলাকা',
    isPopular: false,
    isActive: true,
    sortOrder: 21,
    sourceNote: 'বাংলাদেশ গেজেট অতিরিক্ত ২০১৯ / ওয়ার্ড ১৭',
  },
  {
    id: 'balashpur',
    nameBn: 'বলাশপুর',
    nameEn: 'Balashpur',
    wardNo: 19,
    wardLabelBn: '১৯ নং ওয়ার্ড',
    aliases: ['balashpur', 'bolashpur', 'মির্জাপুর'],
    prominentLandmarks: ['বলাশপুর মোড়', 'মির্জাপুর সংযোগ'],
    popularFor: 'পূর্বাঞ্চলীয় আবাসিক এলাকা',
    isPopular: false,
    isActive: true,
    sortOrder: 22,
    sourceNote: 'বাংলাদেশ গেজেট অতিরিক্ত ২০১৯ / ওয়ার্ড ১৯',
  },

  // Ward 20 - Boyra & Police Line
  {
    id: 'boyra',
    nameBn: 'বয়রা',
    nameEn: 'Boyra',
    wardNo: 20,
    wardLabelBn: '২০ নং ওয়ার্ড',
    aliases: ['boyra', 'boira', 'পুলিশ লাইন', 'কাশর'],
    prominentLandmarks: ['পুলিশ লাইন গেট', 'বয়রা বাজার', 'কাশর মোড়'],
    popularFor: 'পুলিশ লাইন সংলগ্ন নিরাপদ ও শান্ত আবাসিক এলাকা',
    isPopular: false,
    isActive: true,
    sortOrder: 23,
    sourceNote: 'বাংলাদেশ গেজেট অতিরিক্ত ২০১৯ / ওয়ার্ড ২০',
  },

  // Ward 01 & 21 - Khagdahar & Raghurampur
  {
    id: 'khagdahar',
    nameBn: 'খাগডহর',
    nameEn: 'Khagdahar',
    wardNo: 1,
    wardLabelBn: '০১ নং ওয়ার্ড',
    aliases: ['khagdahar', 'khagdahor', 'বিজিবি ক্যাম্প', 'জেলখানা ঘাট'],
    prominentLandmarks: ['খাগডহর বিজিবি সেক্টর হেডকোয়ার্টার্স', 'জেলখানা ঘাট'],
    popularFor: 'পশ্চিম ময়মনসিংহের উন্মুক্ত ও সাশ্রয়ী আবাসিক এলাকা',
    isPopular: false,
    isActive: true,
    sortOrder: 24,
    sourceNote: 'বাংলাদেশ গেজেট অতিরিক্ত ২০১৯ / ওয়ার্ড ১',
  },

  // Ward 05 & 23 - Shikarikanda & Churkhai Bypass
  {
    id: 'shikarikanda',
    nameBn: 'শিকারীকান্দা',
    nameEn: 'Shikarikanda',
    wardNo: 5,
    wardLabelBn: '০৫ নং ওয়ার্ড',
    aliases: ['shikarikanda', 'shikar kanda', 'বাইপাস মোড়', 'চুরখাই সংযোগ'],
    prominentLandmarks: ['শিকারীকান্দা বাইপাস গোলচত্বর', 'মেডিকেল কলেজ পশ্চিম গেট সংলগ্ন'],
    popularFor: 'ঢাকা-ময়মনসিংহ মহাসড়ক সংলগ্ন উদীয়মান আবাসিক ও লজিস্টিকস',
    isPopular: false,
    isActive: true,
    sortOrder: 25,
    sourceNote: 'বাংলাদেশ গেজেট অতিরিক্ত ২০১৯ / ওয়ার্ড ৫',
  },

  // Ward 29 & 31 - Shambhuganj Eastern City Hub
  {
    id: 'shambhuganj',
    nameBn: 'শম্ভুগঞ্জ',
    nameEn: 'Shambhuganj',
    wardNo: 29,
    wardLabelBn: '২৯ নং ওয়ার্ড',
    aliases: ['shambhuganj', 'shombhuganj', 'shombhugonj', 'শম্ভুগঞ্জ ব্রিজ', 'রেলগেট'],
    prominentLandmarks: ['শম্ভুগঞ্জ ব্রিজ মোড়', 'শম্ভুগঞ্জ রেলগেট বাজার', 'জিকেপি হাই স্কুল'],
    popularFor: 'ব্রহ্মপুত্র নদীর পূর্ব পাড়ের প্রধান বাণিজ্যিক ও আবাসিক এলাকা',
    isPopular: true,
    isActive: true,
    sortOrder: 26,
    sourceNote: 'বাংলাদেশ গেজেট অতিরিক্ত ২০১৯ / ওয়ার্ড ২৯ ও ৩১',
  },

  // Ward 33 - Patgudam & China Mor (Bridge Junction)
  {
    id: 'patgudam-china-mor',
    nameBn: 'পাটগুদাম (চায়না মোড়)',
    nameEn: 'Patgudam (China Mor)',
    wardNo: 33,
    wardLabelBn: '৩৩ নং ওয়ার্ড',
    aliases: ['patgudam', 'china mor', 'চায়না মোড়', 'পাটগুদাম ব্রিজ', 'ব্রিজ মোড়'],
    prominentLandmarks: ['পাটগুদাম ব্রিজ চত্বর', 'চায়না মোড় ট্রাফিক পয়েন্ট'],
    popularFor: 'শহরের পূর্ব প্রবেশদ্বার ও যোগাযোগ কেন্দ্র',
    isPopular: false,
    isActive: true,
    sortOrder: 27,
    sourceNote: 'বাংলাদেশ গেজেট অতিরিক্ত ২০১৯ / ওয়ার্ড ৩৩',
  },

  // Ward 03 & 25 - Dapunia / Chok Raghabpur
  {
    id: 'dapunia-east',
    nameBn: 'দাপুনিয়া (সিটি কর্পোরেশন অংশ)',
    nameEn: 'Dapunia (City Corp Part)',
    wardNo: 25,
    wardLabelBn: '২৫ নং ওয়ার্ড',
    aliases: ['dapunia', 'dapuniya', 'চক রাঘবপুর'],
    prominentLandmarks: ['দাপুনিয়া বাজার সিটি সংযোগ', 'বাইপাস লিংক রোড'],
    popularFor: 'সাশ্রয়ী পারিবারিক বাসা ও মেস',
    isPopular: false,
    isActive: true,
    sortOrder: 28,
    sourceNote: 'বাংলাদেশ গেজেট অতিরিক্ত ২০১৯ / ওয়ার্ড ২৫',
  },

  // Ward 22 - Sutiakhali
  {
    id: 'sutiakhali',
    nameBn: 'সুতিয়াখালী',
    nameEn: 'Sutiakhali',
    wardNo: 22,
    wardLabelBn: '২২ নং ওয়ার্ড',
    aliases: ['sutiakhali', 'sutiakhali solar', 'সৌর বিদ্যুৎ কেন্দ্র'],
    prominentLandmarks: ['সুতিয়াখালী বাজার', 'সৌর বিদ্যুৎ কেন্দ্র সংলগ্ন'],
    popularFor: 'দক্ষিণ ময়মনসিংহের নিরিবিলি আবাসিক পরিবেশ',
    isPopular: false,
    isActive: true,
    sortOrder: 29,
    sourceNote: 'বাংলাদেশ গেজেট অতিরিক্ত ২০১৯ / ওয়ার্ড ২২',
  },

  // Ward 28 - Char Ishwardia
  {
    id: 'char-ishwardia',
    nameBn: 'চর ঈশ্বরদিয়া',
    nameEn: 'Char Ishwardia',
    wardNo: 28,
    wardLabelBn: '২৮ নং ওয়ার্ড',
    aliases: ['char ishwardia', 'ishwardia', 'চর ঈশ্বরদিয়া'],
    prominentLandmarks: ['শম্ভুগঞ্জ ব্রিজ পশ্চিম নদী তীর', 'চর ঈশ্বরদিয়া প্রাইমারি'],
    popularFor: 'পূর্ব নদী তীরবর্তী আবাসিক এলাকা',
    isPopular: false,
    isActive: true,
    sortOrder: 30,
    sourceNote: 'বাংলাদেশ গেজেট অতিরিক্ত ২০১৯ / ওয়ার্ড ২৮',
  },
];

// =========================================================================
// QUERY & HELPER UTILITIES
// =========================================================================

/**
 * Returns all 33 MCC Wards.
 */
export function getAllMCCWards(): MCCWard[] {
  return MCC_WARDS;
}

/**
 * Look up an MCC Ward by its number (1-33).
 */
export function getWardByNo(wardNo: number): MCCWard | undefined {
  return MCC_WARDS.find((w) => w.wardNo === wardNo);
}

/**
 * Returns all MCC areas. Optionally filters to active areas only.
 */
export function getAllMCCAreas(options?: { activeOnly?: boolean }): MCCArea[] {
  const activeOnly = options?.activeOnly ?? true;
  if (activeOnly) {
    return MCC_AREAS.filter((a) => a.isActive);
  }
  return MCC_AREAS;
}

/**
 * Returns popular MCC areas for quick chips.
 */
export function getPopularMCCAreas(): MCCArea[] {
  return MCC_AREAS.filter((a) => a.isActive && a.isPopular);
}

/**
 * Look up an MCC area by its unique identifier.
 */
export function getAreaById(id: string | null | undefined): MCCArea | undefined {
  if (!id) return undefined;
  return MCC_AREAS.find((area) => area.id === id);
}

/**
 * Returns all areas belonging to a specific Ward.
 */
export function getAreasByWard(wardNo: number): MCCArea[] {
  return MCC_AREAS.filter((area) => area.wardNo === wardNo && area.isActive);
}

/**
 * Smart search for MCC areas:
 * Supports:
 * - Bengali prefix or substring matching
 * - English transliterations
 * - Aliases (e.g. typing "medical" finds "চরপাড়া")
 * - Ward numbers (e.g. typing "14" or "১৪" finds Ward 14 areas)
 */
export function searchMCCAreas(query: string): MCCArea[] {
  if (!query || !query.trim()) {
    return getAllMCCAreas({ activeOnly: true });
  }

  const q = query.trim().toLowerCase();
  // Check for Bengali numerals converted to English
  const bnToEnMap: Record<string, string> = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
  };
  const normalizedQuery = q.replace(/[০-৯]/g, (ch) => bnToEnMap[ch] || ch);

  return MCC_AREAS.filter((area) => {
    if (!area.isActive) return false;

    // Direct Bengali name match
    if (area.nameBn.toLowerCase().includes(q)) return true;

    // English name match
    if (area.nameEn.toLowerCase().includes(q)) return true;

    // Aliases match
    if (area.aliases.some((alias) => alias.toLowerCase().includes(q))) return true;

    // Ward number match (e.g. "ward 14" or "14")
    const wardStr = area.wardNo.toString();
    if (normalizedQuery === wardStr || normalizedQuery === `ward ${wardStr}` || normalizedQuery === `${wardStr} no ward`) {
      return true;
    }
    if (area.wardLabelBn.includes(q)) return true;

    // Prominent landmarks match
    if (area.prominentLandmarks.some((lm) => lm.toLowerCase().includes(q))) return true;

    return false;
  });
}

/**
 * Validates whether an areaId is strictly a recognized Mymensingh City Corporation area.
 * Prevents outside-city locations from being silently stored or submitted.
 */
export function isInsideMCC(areaId: string | null | undefined): boolean {
  if (!areaId) return false;
  return MCC_AREAS.some((area) => area.id === areaId && area.isActive);
}

/**
 * Strict area validator returning error message if invalid.
 */
export function validateAreaId(areaId: string): { valid: boolean; area?: MCCArea; error?: string } {
  const area = getAreaById(areaId);
  if (!area) {
    return {
      valid: false,
      error: 'নির্বাচিত এলাকাটি ময়মনসিংহ সিটি কর্পোরেশনের অন্তর্ভুক্ত নয়। দয়া করে তালিকা থেকে সঠিক এলাকা বেছে নিন।',
    };
  }
  if (!area.isActive) {
    return {
      valid: false,
      error: 'এই এলাকাটি বর্তমানে সাময়িকভাবে নিষ্ক্রিয় আছে।',
    };
  }
  return { valid: true, area };
}

/**
 * Strict validator for Home Moving (বাসা পাল্টানো) which requires TWO verified MCC locations.
 */
export function validateMovingRoute(
  pickupAreaId: string,
  destinationAreaId: string
): { valid: boolean; pickup?: MCCArea; destination?: MCCArea; error?: string } {
  const pickup = getAreaById(pickupAreaId);
  const destination = getAreaById(destinationAreaId);

  if (!pickup) {
    return {
      valid: false,
      error: 'বর্তমান এলাকা (কোথা থেকে) ময়মনসিংহ সিটি কর্পোরেশনের ভেতরে হতে হবে।',
    };
  }

  if (!destination) {
    return {
      valid: false,
      error: 'নতুন এলাকা (কোথায়) ময়মনসিংহ সিটি কর্পোরেশনের ভেতরে হতে হবে।',
    };
  }

  return { valid: true, pickup, destination };
}

/**
 * Formats a public locality display string without exposing private street addresses.
 * Example: "চরপাড়া, ময়মনসিংহ"
 */
export function formatPublicArea(areaId: string | null | undefined): string {
  if (!areaId) return 'ময়মনসিংহ সিটি কর্পোরেশন';
  const area = getAreaById(areaId);
  if (!area) return 'ময়মনসিংহ সিটি কর্পোরেশন';
  return `${area.nameBn}, ময়মনসিংহ`;
}
