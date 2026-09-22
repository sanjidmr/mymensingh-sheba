/**
 * Centralized Filter Architecture for Mymensingh Sheba
 * 
 * Rules:
 * 1. Only show relevant filters for each service.
 * 2. All location filters use the centralized MCC location system.
 * 3. Mobile-first design with URL search params serialization.
 */

export type ServiceType =
  | 'tolet'
  | 'kajer-bua'
  | 'electrician'
  | 'plumber'
  | 'home-moving'
  | 'home-tutor'
  | 'blood-donor';

export interface SortOption {
  id: string;
  labelBn: string;
}

export const COMMON_SORT_OPTIONS: Record<string, SortOption> = {
  newest: { id: 'newest', labelBn: 'নতুন বিজ্ঞাপন' },
  recent: { id: 'recent', labelBn: 'সাম্প্রতিক সক্রিয়' },
  priceAsc: { id: 'price_asc', labelBn: 'কম ভাড়া / খরচ' },
  priceDesc: { id: 'price_desc', labelBn: 'বেশি ভাড়া / খরচ' },
  ratingDesc: { id: 'rating_desc', labelBn: 'সর্বোচ্চ রেটিং' },
  availability: { id: 'availability', labelBn: 'তাৎক্ষণিক প্রস্তুত' },
};

// =========================================================================
// 1. TO-LET FILTER DEFINITIONS
// =========================================================================
export interface ToletFilterValues {
  areaId?: string;
  propertyType?: string; // all, flat, family, bachelor, sublet, mess, hostel, seat
  minRent?: number;
  maxRent?: number;
  bedrooms?: string; // all, 1, 2, 3, 4+
  bathrooms?: string;
  facilities?: string[]; // gas, lift, generator, cctv, parking
  availability?: string;
  sortBy?: string;
}

export const TOLET_PROPERTY_TYPES = [
  { id: 'all', labelBn: 'সকল ধরন' },
  { id: 'family', labelBn: 'ফ্যামিলি ফ্ল্যাট' },
  { id: 'flat', labelBn: 'স্ট্যান্ডার্ড ফ্ল্যাট' },
  { id: 'sublet', labelBn: 'সাবলেট রুম' },
  { id: 'bachelor', labelBn: 'ব্যাচেলর বাসা' },
  { id: 'mess', labelBn: 'মেস বাসা' },
  { id: 'seat', labelBn: 'সিট ভাড়া' },
  { id: 'hostel', labelBn: 'হোস্টেল' },
];

export const TOLET_BEDROOM_OPTIONS = [
  { id: 'all', labelBn: 'যে কোনো' },
  { id: '1', labelBn: '১ বেড' },
  { id: '2', labelBn: '২ বেড' },
  { id: '3', labelBn: '৩ বেড' },
  { id: '4', labelBn: '৪+ বেড' },
];

export const TOLET_BATHROOM_OPTIONS = [
  { id: 'all', labelBn: 'যে কোনো' },
  { id: '1', labelBn: '১+ বাথ' },
  { id: '2', labelBn: '২+ বাথ' },
  { id: '3', labelBn: '৩+ বাথ' },
];

export const TOLET_AVAILABILITY_OPTIONS = [
  { id: 'all', labelBn: 'সব সময়' },
  { id: 'now', labelBn: 'তাৎক্ষণিক প্রস্তুত' },
];

export const TOLET_RENT_PRESETS = [
  { id: 'all', labelBn: 'সকল বাজেট', min: undefined, max: undefined },
  { id: 'under5k', labelBn: '৫,০০০ ৳ এর নিচে', min: 0, max: 5000 },
  { id: '5k-10k', labelBn: '৫,০০০ – ১০,০০০ ৳', min: 5000, max: 10000 },
  { id: '10k-20k', labelBn: '১০,০০০ – ২০,০০০ ৳', min: 10000, max: 20000 },
  { id: 'above20k', labelBn: '২০,০০০ ৳ এর বেশি', min: 20000, max: undefined },
];

export const TOLET_FACILITY_OPTIONS = [
  { id: 'gas', labelBn: 'তিতাস গ্যাস' },
  { id: 'cylinder', labelBn: 'সিলিন্ডার গ্যাস' },
  { id: 'lift', labelBn: 'লিফট সুবিধা' },
  { id: 'generator', labelBn: 'জেনারেটর ব্যাকআপ' },
  { id: 'cctv', labelBn: 'সিসিটিভি নিরাপত্তা' },
  { id: 'parking', labelBn: 'পার্কিং স্পেস' },
  { id: 'wifi', labelBn: 'ওয়াইফাই ইন্টারনেট' },
  { id: 'water', labelBn: '২৪ ঘণ্টা পানি' },
  { id: 'power_backup', labelBn: 'বিদ্যুৎ ব্যাকআপ' },
  { id: 'balcony', labelBn: 'খোলা বারান্দা' },
  { id: 'rooftop', labelBn: 'খোলামেলা ছাদ' },
  { id: 'mill', labelBn: 'মিল সিস্টেম' },
  { id: 'service', labelBn: 'বুয়া সুবিধা' },
  { id: 'water_purifier', labelBn: 'ফিল্টার পানি' },
  { id: 'private_bath', labelBn: 'আলাদা বাথরুম' },
  { id: 'shared_kitchen', labelBn: 'কিচেন শেয়ারিং' },
];

// =========================================================================
// 2. কাজের বুয়া FILTER DEFINITIONS
// =========================================================================
export interface KajerBuaFilterValues {
  areaId?: string;
  workType?: string; // all, cooking, cleaning, laundry, babysitting, all_round
  workTime?: string; // all, morning, afternoon, full_time, live_in
  experienceYears?: string; // all, 1+, 3+, 5+
  sortBy?: string;
}

export const KAJER_BUA_WORK_TYPES = [
  { id: 'all', labelBn: 'সকল কাজের ধরন' },
  { id: 'cooking', labelBn: 'রান্না করা' },
  { id: 'cleaning', labelBn: 'ঘর মোছা ও পরিষ্কার' },
  { id: 'laundry', labelBn: 'কাপড় ধোয়া ও বাসন মাজা' },
  { id: 'babysitting', labelBn: 'বাচ্চা দেখাশোনা' },
  { id: 'all_round', labelBn: 'সার্বিক গৃহস্থালি কাজ' },
];

export const KAJER_BUA_TIME_SLOTS = [
  { id: 'all', labelBn: 'যে কোনো সময়' },
  { id: 'morning', labelBn: 'সকাল শিফট (৭টা - ১০টা)' },
  { id: 'afternoon', labelBn: 'দুপুর শিফট (১০টা - ২টা)' },
  { id: 'full_time', labelBn: 'ফুল-টাইম (৮টা - ৫টা)' },
  { id: 'live_in', labelBn: 'বাসায় থেকে কাজ (২৪ ঘণ্টা)' },
];

// =========================================================================
// 3. ELECTRICIAN FILTER DEFINITIONS
// =========================================================================
export interface ElectricianFilterValues {
  areaId?: string;
  serviceType?: string; // all, wiring, fan, light, switch, geyser, ips, other
  isEmergency?: boolean;
  minRating?: number;
  sortBy?: string;
}

export const ELECTRICIAN_SERVICE_TYPES = [
  { id: 'all', labelBn: 'সকল ধরনের কাজ' },
  { id: 'short_circuit', labelBn: 'শর্ট সার্কিট ও বিদ্যুৎ ত্রুটি' },
  { id: 'fan_light', labelBn: 'ফ্যান ও লাইট মেরামত' },
  { id: 'wiring', labelBn: 'নতুন ওয়্যারিং ও মেরামত' },
  { id: 'switch_socket', labelBn: 'সুইচ-বোর্ড ও সকেট' },
  { id: 'geyser_ips', labelBn: 'গিজার ও আইপিএস কানেকশন' },
  { id: 'emergency', labelBn: 'জরুরি অন-কল সার্ভিস' },
];

// =========================================================================
// 4. PLUMBER FILTER DEFINITIONS
// =========================================================================
export interface PlumbingFilterValues {
  areaId?: string;
  serviceType?: string; // all, pipe_leak, motor_pump, sanitary, blockage, installation
  isEmergency?: boolean;
  minRating?: number;
  sortBy?: string;
}

export const PLUMBING_SERVICE_TYPES = [
  { id: 'all', labelBn: 'সকল প্লাম্বিং কাজ' },
  { id: 'leakage', labelBn: 'পানির পাইপ লিক মেরামত' },
  { id: 'motor_pump', labelBn: 'মোটর ও ওয়াটার পাম্প মেরামত' },
  { id: 'bathroom_fitting', labelBn: 'বেসিন ও বাথরুম ফিটিংস' },
  { id: 'drain_cleaning', labelBn: 'ড্রেন ও পাইপ ব্লকেজ দূর' },
  { id: 'tank_cleaning', labelBn: 'পানির ট্যাংক পরিষ্কার ও ফিটিং' },
];

// =========================================================================
// SHARED FILTER OPTIONS FOR STAFF SERVICES (কাজের বুয়া / Electrician / Plumber)
// =========================================================================

// Full-time / Part-time / Live-in / Day-based (কাজের বুয়া)
export const KAJER_BUA_WORK_MODES = [
  { id: 'all', labelBn: 'যে কোনো ধরন' },
  { id: 'full_time', labelBn: 'ফুল-টাইম (৮টা - ৫টা)' },
  { id: 'part_time', labelBn: 'পার্ট-টাইম' },
  { id: 'live_in', labelBn: 'বাসায় থেকে (লাইভ-ইন)' },
  { id: 'day_based', labelBn: 'দিন ভিত্তিক কাজ' },
];

// Experience bands (কাজের বুয়া, Electrician, Plumber)
export const STAFF_EXPERIENCE_OPTIONS = [
  { id: 'all', labelBn: 'যে কোনো অভিজ্ঞতা' },
  { id: 'lt1', labelBn: '১ বছরের কম', min: 0, max: 1 },
  { id: '1_3', labelBn: '১ – ৩ বছর', min: 1, max: 3 },
  { id: '3_5', labelBn: '৩ – ৫ বছর', min: 3, max: 5 },
  { id: '5plus', labelBn: '৫+ বছর', min: 5, max: 100 },
];

// Availability (কাজের বুয়া, Electrician, Plumber)
export const STAFF_AVAILABILITY_OPTIONS = [
  { id: 'all', labelBn: 'সকল প্রাপ্যতা' },
  { id: 'available', labelBn: 'ফ্রি / প্রস্তুত' },
  { id: 'limited', labelBn: 'সীমিত সময়ে' },
];

// Expected monthly salary / rate presets (কাজের বুয়া)
export const KAJER_BUA_SALARY_PRESETS = [
  { id: 'all', labelBn: 'যে কোনো সম্মানী', min: undefined, max: undefined },
  { id: 'under_3000', labelBn: '৩,০০০৳ এর নিচে', min: 0, max: 3000 },
  { id: '3000_5000', labelBn: '৩,০০০ – ৫,০০০৳', min: 3000, max: 5000 },
  { id: '5000_8000', labelBn: '৫,০০০ – ৮,০০০৳', min: 5000, max: 8000 },
  { id: 'above_8000', labelBn: '৮,০০০৳ এর বেশি', min: 8000, max: undefined },
];

// =========================================================================
// 5. বাসা পাল্টানো (HOME MOVING) FILTER DEFINITIONS
// =========================================================================
export interface HomeMovingFilterValues {
  pickupAreaId?: string; // MUST BE VERIFIED MCC AREA
  destinationAreaId?: string; // MUST BE VERIFIED MCC AREA
  packageType?: string; // all, small_pickup, medium_truck, large_truck, labor_only
  sortBy?: string;
}

export const HOME_MOVING_PACKAGES = [
  { id: 'all', labelBn: 'সকল প্যাকেজ' },
  { id: 'small_pickup', labelBn: 'ছোট বাসা / মেস (ছোট পিকআপ)' },
  { id: 'medium_truck', labelBn: '২-৩ রুমের বাসা (কাভার্ড ভ্যান + শ্রমিক)' },
  { id: 'large_truck', labelBn: 'বড় বাসা / অফিস (বড় ট্রাক + ৪+ শ্রমিক)' },
  { id: 'labor_only', labelBn: 'শুধুমাত্র অভিজ্ঞ লোডিং-আনলোডিং শ্রমিক' },
];

// =========================================================================
// 6. গৃহশিক্ষক (HOME TUTOR) FILTER DEFINITIONS
// =========================================================================
export interface HomeTutorFilterValues {
  areaId?: string;
  classLevel?: string;
  subject?: string;
  mode?: string; // all, home, online, both
  gender?: string; // all, male, female
  experienceYears?: string; // all, lt1, 1_3, 3_5, 5plus
  education?: string; // all, medical, university, honours_masters, hsc, other
  salaryPreset?: string; // all, under_3000, 3000_6000, 6000_10000, above_10000
  availability?: string; // all, available, limited, busy
  ratedOnly?: boolean; // only tutors with genuine published reviews
  maxSalary?: number;
  sortBy?: string;
}

export const TUTOR_CLASSES = [
  { id: 'all', labelBn: 'সকল শ্রেণি' },
  { id: 'primary', labelBn: '১ম – ৫ম শ্রেণি (প্রাইমারি)' },
  { id: 'middle', labelBn: '৬ষ্ঠ – ৮ম শ্রেণি' },
  { id: 'ssc', labelBn: '৯ম – ১০ম শ্রেণি (SSC)' },
  { id: 'hsc', labelBn: '১১শ – ১২শ শ্রেণি (HSC)' },
  { id: 'admission', labelBn: 'বিশ্ববিদ্যালয় / মেডিকেল ভর্তি' },
];

export const TUTOR_SUBJECTS = [
  { id: 'all', labelBn: 'সকল বিষয়' },
  { id: 'all_primary', labelBn: 'সকল বিষয় (প্রাইমারি)' },
  { id: 'math', labelBn: 'সাধারণ ও উচ্চতর গণিত' },
  { id: 'english', labelBn: 'ইংরেজি (English)' },
  { id: 'physics', labelBn: 'পদার্থবিজ্ঞান' },
  { id: 'chemistry', labelBn: 'রসায়ন' },
  { id: 'biology', labelBn: 'জীববিজ্ঞান' },
  { id: 'ict', labelBn: 'আইসিটি (ICT)' },
  { id: 'bangla', labelBn: 'বাংলা' },
];

export const TUTOR_TEACHING_MODES = [
  { id: 'all', labelBn: 'যে কোনো মাধ্যম' },
  { id: 'home', labelBn: 'বাসায় পড়াবেন' },
  { id: 'online', labelBn: 'অনলাইনে পড়াবেন' },
  { id: 'both', labelBn: 'দুটোই সম্ভব' },
];

export const TUTOR_GENDERS = [
  { id: 'all', labelBn: 'উভয় টিউটর' },
  { id: 'male', labelBn: 'ছাত্র / পুরুষ টিউটর' },
  { id: 'female', labelBn: 'ছাত্রী / মহিলা টিউটর' },
];

// Tutor experience bands for filtering
export const TUTOR_EXPERIENCE_OPTIONS = [
  { id: 'all', labelBn: 'যে কোনো অভিজ্ঞতা' },
  { id: 'lt1', labelBn: '১ বছরের কম', min: 0, max: 1 },
  { id: '1_3', labelBn: '১ – ৩ বছর', min: 1, max: 3 },
  { id: '3_5', labelBn: '৩ – ৫ বছর', min: 3, max: 5 },
  { id: '5plus', labelBn: '৫+ বছর', min: 5, max: 100 },
];

// Tutor education level filter
export const TUTOR_EDUCATION_OPTIONS = [
  { id: 'all', labelBn: 'যে কোনো শিক্ষাগত যোগ্যতা' },
  { id: 'medical', labelBn: 'মেডিকেল / MBBS' },
  { id: 'university', labelBn: 'বিশ্ববিদ্যালয় (অনার্স/মাস্টার্স)' },
  { id: 'honours_masters', labelBn: 'কলেজ (অনার্স/মাস্টার্স)' },
  { id: 'hsc', labelBn: 'HSC / কলেজ ছাত্র' },
  { id: 'other', labelBn: 'অন্যান্য' },
];

// Expected monthly fee presets for tuition
export const TUTOR_FEE_PRESETS = [
  { id: 'all', labelBn: 'যে কোনো বেতন', min: undefined, max: undefined },
  { id: 'under_3000', labelBn: '৩,০০০৳ এর নিচে', min: 0, max: 3000 },
  { id: '3000_6000', labelBn: '৩,০০০ – ৬,০০০৳', min: 3000, max: 6000 },
  { id: '6000_10000', labelBn: '৬,০০০ – ১০,০০০৳', min: 6000, max: 10000 },
  { id: 'above_10000', labelBn: '১০,০০০৳ এর বেশি', min: 10000, max: undefined },
];

export const TUTOR_AVAILABILITY_OPTIONS = [
  { id: 'all', labelBn: 'সকল প্রাপ্যতা' },
  { id: 'available', labelBn: 'প্রস্তুত / ফ্রি' },
  { id: 'limited', labelBn: 'সীমিত সময়ে' },
  { id: 'busy', labelBn: 'ব্যস্ত' },
];

// =========================================================================
// 7. রক্তদাতা (BLOOD DONOR) FILTER DEFINITIONS
// Strictly Private: No price filters. Phone numbers never exposed.
// =========================================================================
export interface BloodDonorFilterValues {
  bloodGroup?: string; // all, A+, A-, B+, B-, AB+, AB-, O+, O-
  areaId?: string;
  isAvailableNow?: boolean;
}

export const BLOOD_GROUPS = [
  { id: 'all', labelBn: 'সকল গ্রুপ' },
  { id: 'A+', labelBn: 'A+' },
  { id: 'A-', labelBn: 'A-' },
  { id: 'B+', labelBn: 'B+' },
  { id: 'B-', labelBn: 'B-' },
  { id: 'AB+', labelBn: 'AB+' },
  { id: 'AB-', labelBn: 'AB-' },
  { id: 'O+', labelBn: 'O+' },
  { id: 'O-', labelBn: 'O-' },
];
