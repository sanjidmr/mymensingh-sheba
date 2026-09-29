import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  Zap,
  Car,
  Wind,
  GraduationCap,
  Sparkles,
  Move,
  Bus,
  ShoppingBag,
  Briefcase,
  Newspaper,
  Wifi,
  BookOpen,
  Stethoscope,
  ShieldCheck,
  Ambulance,
  Flame,
  Phone,
  HeartHandshake,
} from 'lucide-react';

/**
 * Homepage catalog — one editable source of service truth.
 *
 * `image` paths live here (not inside components) so replacing any card photo
 * later is a single-line change. Services are grouped: Electrician+Plumber and
 * Gari+Auto+CNG each live in ONE card (`chips` list the member services).
 * Emergency services intentionally have no `image` → the card renders a calm
 * forest-green glyph panel (icon + dial number) instead of a fake photo.
 */

export interface HomepageService {
  id: string;
  name: string;
  en?: string;
  text: string;
  href?: string;
  /** tel:555 style direct-dial target (emergency cards) */
  dial?: string;
  /** Man-readable number shown on the action / ghost watermark */
  number?: string;
  image?: string;
  alt?: string;
  /** object-position for the card photo (e.g. nudging a subject up/down in frame) */
  objectPosition?: string;
  chips?: string[];
  cta: string;
  pill?: string;
  /** Red text treatment for the card (blood-donor) */
  tone?: 'default' | 'red';
  featured?: boolean;
  icon: LucideIcon;
  /** Optional CSS utility for the grid cell (e.g. centering a lone last card) */
  layoutClass?: string;
}

export type CategoryTone = 'white' | 'mist' | 'dark';

export interface HomepageCategory {
  id: string;
  title: string;
  description: string;
  tone: CategoryTone;
  grid?: string;
  /** Compact cards (small square image + tight body) used when every card must sit in one desktop row */
  compact?: boolean;
  /** Dense cards — even tighter than compact (short image, tiny body) to take very little vertical space */
  dense?: boolean;
  viewAll?: { href: string; label: string };
  items: HomepageService[];
}

/* ------------------------------------------------------------------ */
/* ক্যাটাগরি ০১ — দৈনন্দিন সেবা                                          */
/* ------------------------------------------------------------------ */
export const DAILY_CATEGORY: HomepageCategory = {
  id: 'daily',
  title: 'জনপ্রিয় সেবা',
  description:
    'বাসা, মেরামত, যাতায়াত, পড়াশোনা, গৃহকর্মী — জীবন চলার কাজগুলো এখন এক পরিচিত জায়গায়।',
  tone: 'white',
  grid: 'grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7',
  compact: true,
  viewAll: { href: '/services', label: 'সব সেবা দেখুন' },
  items: [
    {
      id: 'tolet',
      name: 'বাসা ভাড়া',
      en: 'To-Let',
      text: 'ফ্ল্যাট, রুম, মেস ও হোস্টেল — এলাকা আর বাজেট অনুযায়ী যাচাইকৃত তালিকা।',
      href: '/services/toilet',
      image: '/home.jpg',
      chips: ['ফ্যামিলি ফ্ল্যাট', 'ব্যাচেলর', 'মেস সিট'],
      cta: 'বাসা দেখুন',
      pill: 'সবচেয়ে জনপ্রিয়',
      icon: Building2,
    },
    {
      id: 'electric-plumber',
      name: 'ইলেকট্রিক ও প্লাম্বিং',
      en: 'Electrician · Plumber',
      text: 'ওয়্যারিং, মোটর, প্লাম্বিং ও স্যানিটারি মেরামত — দুই কারিগরি সেবা এক কার্ডে।',
      href: '/services',
      image: '/e&p.jpg',
      chips: ['ইলেকট্রিশিয়ান', 'প্লাম্বার'],
      cta: 'সেবা দেখুন',
      pill: '২টি সেবা',
      icon: Zap,
    },
    {
      id: 'gari-auto-cng',
      name: 'গাড়ি, অটো ও CNG',
      en: 'Ride & Rent',
      text: 'স্থানীয় গাড়ি, অটো ও সিএনজি ভাড়া — শহরের ভেতরে সাশ্রয়ী যাতায়াত।',
      href: '/services',
      image: '/carrent.png',
      chips: ['গাড়ি', 'অটো', 'CNG'],
      cta: 'সেবা দেখুন',
      pill: '৩টি সেবা',
      icon: Car,
    },
    {
      id: 'ac-fridge',
      name: 'এসি ও ফ্রিজ মেরামত',
      en: 'Cooling Repair',
      text: 'এসি সার্ভিসিং থেকে ফ্রিজ মেরামত — ঘরের শীতলতা নিয়ে থাকুন নিশ্চিত।',
      href: '/services?q=এসি',
      image: '/ac.png',
      chips: ['এসি', 'ফ্রিজ'],
      cta: 'মেরামত দেখুন',
      icon: Wind,
    },
    {
      id: 'tutor',
      name: 'গৃহশিক্ষক',
      en: 'Tutoring',
      text: 'অভিজ্ঞ শিক্ষকদের কাছে স্কুল-কলেজ পড়াশোনা — এলাকাভিত্তিক, যাচাইকৃত।',
      href: '/services/tutor',
      image: '/tutor.jpg',
      chips: ['স্কুল-কলেজ', 'প্রাইভেট'],
      cta: 'শিক্ষক খুঁজুন',
      icon: GraduationCap,
    },
    {
      id: 'maid',
      name: 'কাজের বুয়া',
      en: 'গৃহকর্মী',
      text: 'বিশ্বস্ত, যাচাইকৃত গৃহকর্মী — গোপনীয়তা রক্ষা করে নিরাপদ বাছাই।',
      href: '/services/maid',
      image: '/kajerbua.jpg',
      chips: ['গৃহকর্মী'],
      cta: 'সেবা দেখুন',
      icon: Sparkles,
    },
    {
      id: 'home-moving',
      name: 'বাসা পাল্টানো',
      en: 'Shifting',
      text: 'পিকআপ, লেবার টিম আর গাড়ি — বাসা বদল এখন দুশ্চিন্তামুক্ত।',
      href: '/services/home-moving',
      image: '/homechange.jpg',
      chips: ['শিফটিং', 'লেবার'],
      cta: 'সেবা দেখুন',
      icon: Move,
    },
  ],
};

/* ------------------------------------------------------------------ */
/* ক্যাটাগরি ০২ — কেনাকাটা, যাতায়াত ও তথ্য                               */
/* ------------------------------------------------------------------ */
export const SHOP_TRAVEL_CATEGORY: HomepageCategory = {
  id: 'shop-travel',
  title: 'প্রয়োজনীয় সব সেবা',
  description:
    'শুধু সেবা নয় — জীবনযাপন আর জ্ঞানের জায়গাগুলোও যেন হাতের কাছেই থাকে।',
  tone: 'mist',
  grid: 'grid-cols-3 sm:grid-cols-3 lg:grid-cols-7',
  compact: true,
  viewAll: { href: '/services', label: 'সব সেবা দেখুন' },
  items: [
    {
      id: 'blood-donor',
      name: 'রক্তদাতা',
      en: 'Blood Donor',
      text: 'জরুরি প্রয়োজনে স্বেচ্ছাসেবী রক্তদাতা — গোপনীয়তা রক্ষা করে সরাসরি সমন্বয়।',
      href: '/blood-donor',
      image: '/doner.jpg',
      chips: ['রক্তের গ্রুপ', 'জরুরি'],
      cta: 'দাতা খুঁজুন',
      pill: 'জরুরি',
      tone: 'red',
      icon: HeartHandshake,
    },
    {
      id: 'bus-ticket',
      name: 'Bus Ticket',
      en: 'যাতায়াত',
      text: 'ঢাকা-ময়মনসিংহসহ আন্তঃজেলা বাসের টিকিট — ঘরে বসে সহজ বুকিং।',
      href: '/services',
      image: '/bus.jpg',
      chips: ['ঢাকা রুট', 'বুকিং'],
      cta: 'দেখুন',
      icon: Bus,
    },
    {
      id: 'buy-sell',
      name: 'কেনাবেচা',
      en: 'Marketplace',
      text: 'দ্বিতীয় হাতের জিনিস থেকে স্থানীয় কেনাবেচা — শহরের বাজার হাতের কাছে।',
      href: '/services',
      image: '/buysell.jpg',
      chips: ['স্থানীয় বাজার'],
      cta: 'দেখুন',
      icon: ShoppingBag,
    },
    {
      id: 'jobs',
      name: 'চাকরি',
      en: 'Jobs',
      text: 'শহরের নতুন চাকরির বিজ্ঞপ্তি — এক জায়গায় নিয়মিত আপডেট।',
      href: '/services',
      image: '/job.jpg',
      chips: ['নিয়োগ বিজ্ঞপ্তি'],
      cta: 'দেখুন',
      icon: Briefcase,
    },
    {
      id: 'news',
      name: 'News',
      en: 'স্থানীয় খবর',
      text: 'ময়মনসিংহের প্রয়োজনীয় খবর ও ঘোষণা, অবিলম্বে।',
      href: '/services',
      image: '/news.jpg',
      chips: ['স্থানীয় খবর'],
      cta: 'দেখুন',
      icon: Newspaper,
    },
    {
      id: 'wifi',
      name: 'WiFi',
      en: 'ইন্টারনেট',
      text: 'বাসা ও ব্যবসার জন্য ইন্টারনেট সংযোগ — এলাকাভিত্তিক সেবা।',
      href: '/services?q=wifi',
      image: '/wifi.jpg',
      chips: ['ব্রডব্যান্ড', 'অফিস'],
      cta: 'দেখুন',
      icon: Wifi,
    },
    {
      id: 'coaching',
      name: 'কোচিং',
      en: 'Coaching',
      text: 'শিক্ষার্থীদের জন্য মেন্টরিং ও কোচিং ক্লাস — গড়ে তুলুন আত্মবিশ্বাস।',
      href: '/services?q=coaching',
      image: '/coutching.jpg',
      chips: ['স্কুল-কলেজ', 'মেন্টরিং'],
      cta: 'দেখুন',
      icon: BookOpen,
    },
  ],
};

/* ------------------------------------------------------------------ */
/* ক্যাটাগরি ০৩ — জরুরি ও জনসেবা                                         */
/* ------------------------------------------------------------------ */
export const EMERGENCY_CATEGORY: HomepageCategory = {
  id: 'emergency',
  title: 'ইমার্জেন্সি সেবা',
  description:
    'জরুরি মুহূর্তে সঠিক নম্বরটা খুঁজতে গিয়ে সময় নষ্ট নয় — এক ট্যাপে সরাসরি সেবায়।',
  tone: 'white',
  grid: 'grid-cols-3 sm:grid-cols-3 lg:grid-cols-5',
  compact: true,
  dense: true,
  items: [
    {
      id: 'doctor',
      name: 'ডাক্তার',
      en: 'Health',
      text: '২৪/৭ ডাক্তারের স্বাস্থ্য পরামর্শ।',
      dial: 'tel:16263',
      number: '১৬২৬৩',
      image: '/doctor.jpg',
      cta: 'কল করুন',
      icon: Stethoscope,
    },
    {
      id: 'police',
      name: 'পুলিশ',
      en: 'Police',
      text: 'যেকোনো জরুরি বা নিরাপত্তা প্রয়োজনে।',
      dial: 'tel:999',
      number: '৯৯৯',
      image: '/police.jpg',
      objectPosition: 'center 70%',
      cta: 'কল করুন',
      featured: true,
      icon: ShieldCheck,
    },
    {
      id: 'ambulance',
      name: 'অ্যাম্বুলেন্স',
      en: 'Ambulance',
      text: 'জরুরি রোগী পরিবহনে দ্রুত সমন্বয়।',
      dial: 'tel:999',
      number: '৯৯৯',
      image: '/ambulence.jpg',
      cta: 'কল করুন',
      icon: Ambulance,
    },
    {
      id: 'fire',
      name: 'ফায়ার সার্ভিস',
      en: 'Fire Service',
      text: 'অগ্নিনির্বাপণ ও উদ্ধার কাজে সরাসরি।',
      dial: 'tel:102',
      number: '১০২',
      image: '/fireservice.jpg',
      cta: 'কল করুন',
      icon: Flame,
    },
    {
      id: 'helpline',
      name: 'Mymensingh Sheba',
      en: 'Helpline',
      text: 'সেবা সংক্রান্ত যেকোনো প্রশ্নে যোগাযোগ করুন।',
      href: '/contact',
      image: '/sheba1.png',
      cta: 'যোগাযোগ করুন',
      icon: Phone,
      layoutClass: 'sm:col-span-2 lg:col-span-1',
    },
  ],
};