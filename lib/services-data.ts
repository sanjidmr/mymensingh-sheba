/**
 * Mymensingh Sheba Services Catalog & Business Rules
 */

export interface ServiceCategory {
  id: string;
  slug: string;
  nameBn: string;
  nameEn: string;
  shortDesc: string;
  iconName: string;
  categoryType: 'user_profile' | 'admin_managed' | 'community';
  tagBadge?: string;
  searchPlaceholder?: string;
}

export const LAUNCH_SERVICES: ServiceCategory[] = [
  {
    id: 'tolet',
    slug: 'tolet',
    nameBn: 'বাসা ভাড়া (To-Let)',
    nameEn: 'To-Let',
    shortDesc: 'ফ্যামিলি ফ্ল্যাট, ব্যাচেলর মেস, সাবলেট ও সিট ভাড়া সরাসরি ভেরিফাইড পোস্ট থেকে',
    iconName: 'Home',
    categoryType: 'user_profile',
    tagBadge: 'জনপ্রিয়',
    searchPlaceholder: 'ফ্ল্যাট, মেস বা সিট খুঁজুন...',
  },
  {
    id: 'kajer-bua',
    slug: 'kajer-bua',
    nameBn: 'কাজের বুয়া',
    nameEn: 'Domestic Helper',
    shortDesc: 'বাসার রান্না, কাপড় ধোয়া ও ঘর মোছার নির্ভরযোগ্য পার্ট-টাইম বা ফুল-টাইম গৃহকর্মী',
    iconName: 'Sparkles',
    categoryType: 'admin_managed',
    tagBadge: 'ভেরিফাইড কর্মী',
    searchPlaceholder: 'কাজের সময় ও এলাকা বেছে নিন...',
  },
  {
    id: 'electrician',
    slug: 'electrician',
    nameBn: 'Electrician',
    nameEn: 'Electrician',
    shortDesc: 'বাসা-বাড়ির শর্টসার্কিট, ফ্যান-লাইট, ওয়্যারিং ও গিজার দ্রুত মেরামতে অভিজ্ঞ টেকনিশিয়ান',
    iconName: 'Zap',
    categoryType: 'admin_managed',
    tagBadge: 'দ্রুত সেবা',
    searchPlaceholder: 'সমস্যা বা কাজ উল্লেখ করুন...',
  },
  {
    id: 'plumber',
    slug: 'plumber',
    nameBn: 'Plumber',
    nameEn: 'Plumber',
    shortDesc: 'পানির পাইপ লিক, মোটর-পাম্প মেরামত, বেসিন ও বাথরুমের স্যানিটারি ফিটিংস সার্ভিস',
    iconName: 'Wrench',
    categoryType: 'admin_managed',
    tagBadge: 'দক্ষ মিস্ত্রি',
    searchPlaceholder: 'প্লাম্বিং সমস্যার বিবরণ দিন...',
  },
  {
    id: 'home-moving',
    slug: 'home-moving',
    nameBn: 'বাসা পাল্টানো',
    nameEn: 'Home Moving',
    shortDesc: 'পিকআপ/মিনি ট্রাক ও অভিজ্ঞ লোডিং-আনলোডিং শ্রমিক নিয়ে নিরাপদ ও ঝামেলাহীন শিফটিং',
    iconName: 'Truck',
    categoryType: 'admin_managed',
    tagBadge: 'নিরাপদ শিফটিং',
    searchPlaceholder: 'বর্তমান ও নতুন এলাকা নির্বাচন করুন...',
  },
  {
    id: 'home-tutor',
    slug: 'home-tutor',
    nameBn: 'গৃহশিক্ষক',
    nameEn: 'Home Tutor',
    shortDesc: 'ময়মনসিংহ শহরের আনন্দ মোহন, মেডিকেল ও কৃষি বিশ্ববিদ্যালয়ের অভিজ্ঞ টিউটর',
    iconName: 'GraduationCap',
    categoryType: 'user_profile',
    tagBadge: 'অভিজ্ঞ টিউটর',
    searchPlaceholder: 'ক্লাস, মাধ্যম বা বিষয় খুঁজুন...',
  },
  {
    id: 'blood-donor',
    slug: 'blood-donor',
    nameBn: 'রক্তদাতা',
    nameEn: 'Blood Donor',
    shortDesc: 'জরুরি প্রয়োজনে স্বেচ্ছাসেবী রক্তদাতা। সম্পূর্ণ গোপনীয়তা রক্ষা করে সরাসরি সমন্বয়',
    iconName: 'HeartHandshake',
    categoryType: 'community',
    tagBadge: 'জরুরি সেবা',
    searchPlaceholder: 'রক্তের গ্রুপ ও এলাকা নির্বাচন করুন...',
  },
];

/**
 * Platform fee engine now lives in lib/tolet-fees.ts (single source of truth).
 * Re-exported here for backward compatibility with existing pages/components.
 */
export {
  type ToletFeeRules,
  DEFAULT_TOLET_FEE_RULES,
  calculateToletFee,
  calculateToletTotal,
  getToletFeeRules,
  setToletFeeRules,
} from './tolet-fees';

export interface SampleToletListing {
  id: string;
  titleBn: string;
  propertyType: 'family' | 'flat' | 'sublet' | 'seat' | 'mess';
  propertyTypeLabelBn: string;
  areaId: string;
  areaNameBn: string;
  specificAddressBn: string;
  rentAmount: number;
  platformFee: number;
  totalAmount: number;
  bedrooms: number;
  bathrooms: number;
  balconies: number;
  floor: string;
  availableFromBn: string;
  facilitiesBn: string[];
  imageUrl: string;
  isVerified: boolean;
  featuredBadge?: string;
  descriptionBn: string;
}

export const SAMPLE_TOLET_LISTINGS: SampleToletListing[] = [
  {
    id: 'tl-101',
    titleBn: 'চরপাড়া মেডিকেল কলেজ সংলগ্ন আলো-বাতাসপূর্ণ ফ্যামিলি ফ্ল্যাট',
    propertyType: 'family',
    propertyTypeLabelBn: 'ফ্যামিলি ফ্ল্যাট',
    areaId: 'charpara',
    areaNameBn: 'চরপাড়া',
    specificAddressBn: 'চরপাড়া নাহার মেমোরিয়াল রোড, ময়মনসিংহ',
    rentAmount: 14000,
    platformFee: 200,
    totalAmount: 14200,
    bedrooms: 3,
    bathrooms: 2,
    balconies: 2,
    floor: '৪র্থ তলা (লিফট আছে)',
    availableFromBn: '১লা অক্টোবর থেকে',
    facilitiesBn: ['লিফট', 'সিলিন্ডার গ্যাস', 'জেনারেটর ব্যাকআপ', 'সিসিটিভি নিরাপত্তা'],
    imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80',
    isVerified: true,
    featuredBadge: 'ভেরিফাইড প্রপার্টি',
    descriptionBn: 'ময়মনসিংহ মেডিকেল কলেজ হাসপাতাল ও আনন্দ মোহন কলেজের নিকটবর্তী শান্ত নিরিবিলি পরিবেশে দক্ষিণমুখী আলো-বাতাসপূর্ণ বাসা। শুধুমাত্র ফ্যামিলির জন্য প্রযোজ্য।',
  },
  {
    id: 'tl-102',
    titleBn: 'সানকিপাড়া শেষ মোড়ে শান্ত পরিবেশে সাশ্রয়ী ২ বেডের বাসা',
    propertyType: 'family',
    propertyTypeLabelBn: 'ফ্যামিলি বাসা',
    areaId: 'sankipara',
    areaNameBn: 'সানকিপাড়া',
    specificAddressBn: 'সানকিপাড়া শেষ মোড়, রেলওয়ে কলোনি সংলগ্ন',
    rentAmount: 9500,
    platformFee: 100,
    totalAmount: 9600,
    bedrooms: 2,
    bathrooms: 1,
    balconies: 1,
    floor: '২য় তলা',
    availableFromBn: 'চলতি মাস থেকেই',
    facilitiesBn: ['তিতাস লাইন গ্যাস', '২৪ ঘণ্টা পানি', 'খোলামেলা ছাদ'],
    imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80',
    isVerified: true,
    featuredBadge: 'লাইন গ্যাস সুবিধা',
    descriptionBn: 'সানকিপাড়ার শান্ত আবাসিক পরিবেশ। তিতাস গ্যাস সংযোগ রয়েছে। নিরিবিলি ছোট পরিবারের জন্য চমৎকার বাসা।',
  },
  {
    id: 'tl-103',
    titleBn: 'কাঁচিঝুলি জিলা স্কুল রোডে আধুনিক ৩ বেডরুম ফ্ল্যাট',
    propertyType: 'flat',
    propertyTypeLabelBn: 'লাক্সারি ফ্ল্যাট',
    areaId: 'kachijhuli',
    areaNameBn: 'কাঁচিঝুলি',
    specificAddressBn: 'কাঁচিঝুলি মোড়, ময়মনসিংহ জিলা স্কুল সংলগ্ন',
    rentAmount: 22000,
    platformFee: 400,
    totalAmount: 22400,
    bedrooms: 3,
    bathrooms: 3,
    balconies: 3,
    floor: '৫ম তলা (লিফট ও পার্কিং)',
    availableFromBn: '১লা নভেম্বর থেকে',
    facilitiesBn: ['লিফট ও জেনারেটর', 'কার পার্কিং', 'সার্বক্ষণিক সিকিউরিটি গার্ড', 'গ্যাস সংযোগ'],
    imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=80',
    isVerified: true,
    featuredBadge: 'প্রাইম লোকেশন',
    descriptionBn: 'শহরের সবচেয়ে সুবিধাজনক কাঁচিঝুলি জিলা স্কুল মোড়ে আধুনিক সুযোগ-সুবিধা সম্পন্ন সুবিশাল ফ্ল্যাট। ২৪ ঘণ্টা নিরাপত্তা ব্যবস্থা।',
  },
  {
    id: 'tl-104',
    titleBn: 'নতুন বাজার ও টাউন হল সংলগ্ন চাকরিজীবী/শিক্ষার্থী মেস সিট',
    propertyType: 'seat',
    propertyTypeLabelBn: 'মেস সিট ভাড়া',
    areaId: 'natun-bazar',
    areaNameBn: 'নতুন বাজার',
    specificAddressBn: 'নতুন বাজার পোস্ট অফিস রোড',
    rentAmount: 2800,
    platformFee: 50,
    totalAmount: 2850,
    bedrooms: 1,
    bathrooms: 1,
    balconies: 1,
    floor: '৩য় তলা',
    availableFromBn: 'তাৎক্ষণিক ওঠা যাবে',
    facilitiesBn: ['ওয়াইফাই ইন্টারনেট', 'মিল সিস্টেম', 'ফিল্টার খাওয়ার পানি', 'বুয়া সুবিধা'],
    imageUrl: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&auto=format&fit=crop&q=80',
    isVerified: true,
    featuredBadge: 'সাশ্রয়ী সিট',
    descriptionBn: 'পড়াশোনা ও চাকরির জন্য আদর্শ নিরিবিলি পরিবেশ। বড় রুমের সুন্দর আলো-বাতাস। মিল সিস্টেম চালু আছে।',
  },
  {
    id: 'tl-105',
    titleBn: 'আকুয়া বাইপাস মোড় সংলগ্ন খোলামেলা ২ বেডরুম বাসা',
    propertyType: 'family',
    propertyTypeLabelBn: 'ফ্যামিলি ফ্ল্যাট',
    areaId: 'akua',
    areaNameBn: 'আকুয়া',
    specificAddressBn: 'আকুয়া চৌরঙ্গী মোড়, ময়মনসিংহ',
    rentAmount: 8500,
    platformFee: 100,
    totalAmount: 8600,
    bedrooms: 2,
    bathrooms: 2,
    balconies: 1,
    floor: '১ম তলা',
    availableFromBn: '১লা অক্টোবর থেকে',
    facilitiesBn: ['মোটর পানি সুবিধা', 'খোলা বারান্দা', 'মোটরসাইকেল পার্কিং'],
    imageUrl: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&auto=format&fit=crop&q=80',
    isVerified: true,
    descriptionBn: 'কম খরচে সুন্দর ও খোলামেলা বাসা। প্রধান সড়কের কাছে থাকায় যাতায়াত অত্যন্ত সহজ।',
  },
  {
    id: 'tl-106',
    titleBn: 'নওমহল সরকারি স্কুল সংলগ্ন নিরিবিলি সাবলেট রুম',
    propertyType: 'sublet',
    propertyTypeLabelBn: 'সাবলেট রুম',
    areaId: 'nawmahal',
    areaNameBn: 'নওমহল',
    specificAddressBn: 'নওমহল লেন-৩, ময়মনসিংহ',
    rentAmount: 4500,
    platformFee: 50,
    totalAmount: 4550,
    bedrooms: 1,
    bathrooms: 1,
    balconies: 1,
    floor: '২য় তলা',
    availableFromBn: 'চলতি মাস থেকে',
    facilitiesBn: ['আলাদা বাথরুম', 'বারান্দা', 'কিচেন শেয়ারিং', 'গ্যাস সুবিধা'],
    imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80',
    isVerified: true,
    descriptionBn: 'ছোট চাকরিজীবী ফ্যামিলি বা ছাত্রীদের জন্য নিরাপদ সাবলেট রুম। চমৎকার পারিবারিক পরিবেশ।',
  },
];
