import type { HomePreviewCard } from '@/lib/home-preview';

/**
 * Static sample rows for homepage service bands that do not have live
 * listing data yet (গাড়ি ভাড়া / কেনাবেচা / News). These are content
 * placeholders — swapping the `cards` prop of a ServiceRowSection to a live
 * loader later is a one-line change. Never show photos (image policy).
 */

type SampleCard = Omit<HomePreviewCard, 'href'>;

const withHref =
  (href: string) =>
  (cards: SampleCard[]): HomePreviewCard[] =>
    cards.map((c) => ({ ...c, href }));

const GARI_ROW_HREF = '/services?q=%E0%A6%97%E0%A6%BE%E0%A6%A1%E0%A6%BC%E0%A6%BF';
const KENABECHA_ROW_HREF =
  '/services?q=%E0%A6%95%E0%A7%87%E0%A6%A8%E0%A6%BE%E0%A6%AC%E0%A7%87%E0%A6%9A%E0%A6%BE';
const NEWS_ROW_HREF = '/services?q=news';

const GARI_SAMPLES: SampleCard[] = [
  {
    id: 'car-ac-jha',
    title: 'সিএনজি চালনা — রেলগেট',
    subtitle: 'প্রাইভেট সিএনজি ভাড়া',
    location: 'রেলগেট, ময়মনসিংহ',
    avatarLabel: 'সি',
    metaChips: ['প্রতি কিমি ভাড়া', '২৪ ঘণ্টা'],
    availability: { label: 'চলমান', tone: 'green' },
    footer: 'সরাসরি যোগাযোগ',
    footerLabel: 'দেখুন',
  },
  {
    id: 'car-ac-kachijhuli',
    title: 'গাড়ি ভাড়া — কাঁচিঝুলি জিলা স্কুল মোড়',
    subtitle: 'ড্রাইভার সহ ফ্যামিলি কার',
    location: 'কাঁচিঝুলি, ময়মনসিংহ',
    avatarLabel: 'গা',
    metaChips: ['ফ্যামিলি ট্রিপ', 'লং-ড্রাইভ'],
    availability: { label: 'চলমান', tone: 'green' },
    footer: 'সরাসরি যোগাযোগ',
    footerLabel: 'দেখুন',
  },
  {
    id: 'car-ac-charpara',
    title: 'অটো রিকশা — চরপাড়া মেডিকেল ক্যাম্পাস',
    subtitle: 'অটো রিকশা ভাড়া',
    location: 'চরপাড়া, ময়মনসিংহ',
    avatarLabel: 'অ',
    metaChips: ['শর্ট রাইড', 'দরদামযোগ্য'],
    availability: { label: 'চলমান', tone: 'green' },
    footer: 'সরাসরি যোগাযোগ',
    footerLabel: 'দেখুন',
  },
  {
    id: 'car-ac-akua',
    title: 'মাইক্রোবাস — আকুয়া বাইপাস',
    subtitle: 'ইভেন্ট ও ডেইলি মাইক্রোবাস',
    location: 'আকুয়া, ময়মনসিংহ',
    avatarLabel: 'মা',
    metaChips: ['ইভেন্ট', 'গার্ডেন মিট'],
    availability: { label: 'অগ্রিম বুকিং', tone: 'amber' },
    footer: 'সরাসরি যোগাযোগ',
    footerLabel: 'দেখুন',
  },
  {
    id: 'car-ac-shahid',
    title: 'নগর গাড়ি — শহীদ স্মৃতিসৌধ',
    subtitle: 'শহরঘুরে হালকা গাড়ি',
    location: 'শহীদ স্মৃতিসৌধ, ময়মনসিংহ',
    avatarLabel: 'ন',
    metaChips: ['সিট ভিত্তিক', 'দৈনিক'],
    availability: { label: 'চলমান', tone: 'green' },
    footer: 'সরাসরি যোগাযোগ',
    footerLabel: 'দেখুন',
  },
];

const KENABECHA_SAMPLES: SampleCard[] = [
  {
    id: 'bs-1',
    title: 'স্মার্টফোন (Samsung)',
    subtitle: 'সেকেন্ড হ্যান্ড · ভালো অবস্থা',
    location: 'সানকিপাড়া, ময়মনসিংহ',
    avatarLabel: 'স',
    metaChips: ['মাত্র ৬ মাস পুরনো', 'বক্সসহ'],
    availability: { label: 'চলমান বিক্রয়', tone: 'green' },
    footer: '১৮,০০০ টাকা',
    footerLabel: 'দেখুন',
  },
  {
    id: 'bs-2',
    title: 'ফ্যামিলি ফ্ল্যাটের আসবাবপত্র',
    subtitle: 'সোফা, ডাইনিং সেট ও বেড',
    location: 'কাঁচিঝুলি, ময়মনসিংহ',
    avatarLabel: 'ফ',
    metaChips: ['হোম ডেলিভারি', 'পুরো সেট'],
    availability: { label: 'চলমান বিক্রয়', tone: 'green' },
    footer: 'দরদামযোগ্য',
    footerLabel: 'দেখুন',
  },
  {
    id: 'bs-3',
    title: 'বাইসাইকেল (মাউন্টেন)',
    subtitle: 'নিয়মিত সচল · ভালো ফিনিশিং',
    location: 'নতুন বাজার, ময়মনসিংহ',
    avatarLabel: 'ব',
    metaChips: ['সাজার সুযোগ', 'টেস্ট রাইড'],
    availability: { label: 'চলমান বিক্রয়', tone: 'green' },
    footer: '৭,৫০০ টাকা',
    footerLabel: 'দেখুন',
  },
  {
    id: 'bs-4',
    title: 'ল্যাপটপ (Core i5)',
    subtitle: 'পড়াশোনা ও অফিসের জন্য আদর্শ',
    location: 'চরপাড়া, ময়মনসিংহ',
    avatarLabel: 'লো',
    metaChips: ['৮ জিবি র‍্যাম', 'চারজারসহ'],
    availability: { label: 'চলমান বিক্রয়', tone: 'green' },
    footer: '৩২,০০০ টাকা',
    footerLabel: 'দেখুন',
  },
  {
    id: 'bs-5',
    title: 'মোটরসাইকেল (125CC)',
    subtitle: 'রেজিস্ট্রেশনসহ হালনাগাদ ফিটনেস',
    location: 'আকুয়া, ময়মনসিংহ',
    avatarLabel: 'ম',
    metaChips: ['পেপারস রেডি', 'টেস্ট ড্রাইভ'],
    availability: { label: 'চলমান বিক্রয়', tone: 'green' },
    footer: '১,১০,০০০ টাকা',
    footerLabel: 'দেখুন',
  },
];

const NEWS_SAMPLES: SampleCard[] = [
  {
    id: 'nw-1',
    title: 'শহরের নতুন ফুটওভারব্রিজ নির্মাণ শুরু',
    subtitle: 'নাগরিক সেবা ও যানজট কমাতে',
    location: 'রেলগেট, ময়মনসিংহ',
    avatarLabel: 'শ',
    metaChips: ['নির্মাণকাজ', 'সম্প্রতি'],
    availability: { label: 'নতুন খবর', tone: 'green' },
    footer: 'পূর্ণ খবর পড়ুন',
    footerLabel: 'পড়ুন',
  },
  {
    id: 'nw-2',
    title: 'ময়মনসিংহে শীতের প্রস্তুতি — কম্বল বিতরণ কর্মসূচি',
    subtitle: 'জেলা প্রশাসনের উদ্যোগ',
    location: 'সদর, ময়মনসিংহ',
    avatarLabel: 'ম',
    metaChips: ['সমাজসেবা', 'সম্প্রতি'],
    availability: { label: 'নতুন খবর', tone: 'green' },
    footer: 'পূর্ণ খবর পড়ুন',
    footerLabel: 'পড়ুন',
  },
  {
    id: 'nw-3',
    title: 'ব্রহ্মপুত্র নদে ঐতিহ্যবাহী নৌকা উৎসব',
    subtitle: 'শহরের সাংস্কৃতিক প্রাণকেন্দ্র',
    location: 'ব্রহ্মপুত্র নদ, ময়মনসিংহ',
    avatarLabel: 'ব',
    metaChips: ['উৎসব', 'ছবি'],
    availability: { label: 'নতুন খবর', tone: 'green' },
    footer: 'পূর্ণ খবর পড়ুন',
    footerLabel: 'পড়ুন',
  },
  {
    id: 'nw-4',
    title: 'নতুন নাগরিক সেবা সেন্টার চালু',
    subtitle: 'প্রয়োজনীয় সেবা এক ছাদের নিচে',
    location: 'টাউন হল, ময়মনসিংহ',
    avatarLabel: 'ন',
    metaChips: ['নাগরিক সেবা', 'সম্প্রতি'],
    availability: { label: 'নতুন খবর', tone: 'green' },
    footer: 'পূর্ণ খবর পড়ুন',
    footerLabel: 'পড়ুন',
  },
  {
    id: 'nw-5',
    title: 'স্থানীয় কৃষি মেলা অনুষ্ঠিত',
    subtitle: 'কৃষকের সঙ্গে নতুন সম্ভাবনা',
    location: 'কাঁচিঝুলি, ময়মনসিংহ',
    avatarLabel: 'ক',
    metaChips: ['মেলা', 'আপডেট'],
    availability: { label: 'নতুন খবর', tone: 'green' },
    footer: 'পূর্ণ খবর পড়ুন',
    footerLabel: 'পড়ুন',
  },
];

export const GARI_SAMPLE_CARDS: HomePreviewCard[] = withHref(GARI_ROW_HREF)(GARI_SAMPLES);
export const KENABECHA_SAMPLE_CARDS: HomePreviewCard[] = withHref(KENABECHA_ROW_HREF)(KENABECHA_SAMPLES);
export const NEWS_SAMPLE_CARDS: HomePreviewCard[] = withHref(NEWS_ROW_HREF)(NEWS_SAMPLES);