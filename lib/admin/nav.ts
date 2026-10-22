import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  BarChart3,
  Globe,
  Images,
  Wrench,
  FileText,
  BusFront,
  Router,
  ClipboardList,
  ClipboardCheck,
  Home,
  Car,
  Coins,
  MessageSquare,
  Flag,
  Users,
  Star,
  Bell,
  Activity,
  ImageIcon,
  Settings,
  Building2,
  GraduationCap,
  Droplet,
  Siren,
  MousePointerClick,
  MailCheck,
} from 'lucide-react';

/**
 * The admin console's navigation, in one place.
 *
 * Every entry maps to a route that exists and does something real. There is
 * deliberately no "Orders" item: the platform has no order, payment or invoice
 * table anywhere in the schema, so an Orders screen would be a dead end. See
 * `docs/ADMIN_PANEL.md` for where to add one if that workflow ever ships.
 *
 * `badgeKey` lets a screen publish a live count into the sidebar. The counts
 * come from `AdminBadgeCounts`, which the layout fills from the database — the
 * nav never invents a number.
 */
export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Shown as a small pill next to the label when a count exists. */
  badgeKey?: AdminBadgeKey;
  description: string;
}

export type AdminBadgeKey =
  | 'messages'
  | 'posts'
  | 'reports'
  | 'requests'
  | 'verifications'
  | 'notifications';

export interface AdminNavGroup {
  title: string;
  items: AdminNavItem[];
}

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    title: 'Overview',
    items: [
      {
        href: '/admin',
        label: 'ড্যাশবোর্ড',
        icon: LayoutDashboard,
        description: 'লাইভ পরিসংখ্যান ও সাম্প্রতিক কার্যক্রম',
      },
    ],
  },
  {
    title: 'Marketplace Management',
    items: [
      {
        href: '/admin/approvals',
        label: 'সকল অনুমোদন',
        icon: ClipboardCheck,
        badgeKey: 'verifications',
        description: 'সব ধরনের অপেক্ষমাণ পোস্ট ও প্রোফাইল এক জায়গায় অনুমোদন করুন',
      },
      {
        href: '/admin/posts',
        label: 'পোস্ট ও অনুমোদন',
        icon: FileText,
        badgeKey: 'posts',
        description: 'খবর, চাকরি ও কেনাবেচার পোস্ট পর্যালোচনা',
      },
      {
        href: '/admin/tolet',
        label: 'বাসা ভাড়া',
        icon: Home,
        description: 'বাসা ভাড়ার তালিকা ও প্রকাশনা',
      },
      {
        href: '/admin/services',
        label: 'কর্মী ও সেবা',
        icon: Wrench,
        description: 'কর্মী প্রোফাইল ও সেবার তালিকা',
      },
      {
        href: '/admin/blood/donors',
        label: 'রক্তদাতা প্রোফাইল',
        icon: Droplet,
        description: 'প্রোফাইল, উপলভ্যতা ও মডারেশন',
      },
      {
        href: '/admin/verifications',
        label: 'গৃহ শিক্ষক প্রোফাইল',
        icon: GraduationCap,
        description: 'সব গৃহ শিক্ষক প্রোফাইল, তথ্য ও প্রকাশনার অবস্থা',
      },
      {
        href: '/admin/emergency-contacts',
        label: 'জরুরি সেবা ডিরেক্টরি',
        icon: Siren,
        description: 'চিকিৎসক, পুলিশ, অ্যাম্বুলেন্স ও ফায়ার সার্ভিস',
      },
      {
        href: '/admin/directories/bus',
        label: 'বাস টিকিট তথ্য',
        icon: BusFront,
        description: 'বাসের রুট, সময়সূচি, ভাড়া ও প্রকাশনা',
      },
      {
        href: '/admin/directories/wifi',
        label: 'WiFi প্রদানকারী',
        icon: Router,
        description: 'গ্রাহক-জমা WiFi তথ্য ও অফার অনুমোদন',
      },
      {
        href: '/admin/directories/coaching',
        label: 'কোচিং সেন্টার',
        icon: GraduationCap,
        description: 'গ্রাহক-জমা কোচিং তথ্য ও অনুমোদন',
      },
      {
        href: '/admin/directories/vehicle',
        label: 'যানবাহন',
        icon: Car,
        description: 'যানবাহন তালিকা, প্রকাশনা, সুবিধা ও ভাড়া পরিচালনা',
      },
    ],
  },
  {
    title: 'Business & Analytics',
    items: [
      {
        href: '/admin/requests',
        label: 'সেবা অনুরোধ',
        icon: ClipboardList,
        badgeKey: 'requests',
        description: 'সেবা গ্রহণের অনুরোধ পরিচালনা',
      },
      {
        href: '/admin/tutor-requests',
        label: 'টিউটর আবেদন',
        icon: GraduationCap,
        description: 'নির্দিষ্ট গৃহশিক্ষকের জন্য পাঠানো আবেদন পর্যালোচনা',
      },
      {
        href: '/admin/vehicle-requests',
        label: 'যানবাহন বুকিং অনুরোধ',
        icon: Car,
        description: 'গাড়ি, অটো ও CNG বুকিং অনুরোধ পর্যালোচনা ও পরিচালনা',
      },
      {
        href: '/admin/analytics',
        label: 'অ্যানালিটিক্স',
        icon: BarChart3,
        description: 'বাস্তব ডেটাভিত্তিক প্ল্যাটফর্ম পরিসংখ্যান',
      },
      {
        href: '/admin/analytics/website',
        label: 'ওয়েবসাইট অ্যানালিটিক্স',
        icon: MousePointerClick,
        description: 'পেজ ভিউ, ভিজিটর, ট্রাফিক সোর্স ও CTA ক্লিক',
      },
      {
        href: '/admin/finance',
        label: 'আর্থিক হিসাব',
        icon: Coins,
        description: 'সার্ভিসভিত্তিক আয়, বকেয়া ও হিসাবের রেকর্ড',
      },
    ],
  },
  {
    title: 'Communication & Trust',
    items: [
      {
        href: '/admin/messages',
        label: 'যোগাযোগ বার্তা',
        icon: MessageSquare,
        badgeKey: 'messages',
        description: 'যোগাযোগ ফর্মে পাঠানো বার্তা',
      },
      {
        href: '/admin/reports',
        label: 'অভিযোগ ও রিপোর্ট',
        icon: Flag,
        badgeKey: 'reports',
        description: 'অভিযোগ পর্যালোচনা ও সমাধান',
      },
      {
        href: '/admin/reviews',
        label: 'রিভিউ',
        icon: Star,
        description: 'গৃহশিক্ষক রিভিউ পর্যালোচনা',
      },
      {
        href: '/admin/site-reviews',
        label: 'হোমপেজ রিভিউ',
        icon: Star,
        description: 'হোমপেজে পাঠানো সাইট রিভিউ দেখা ও প্রকাশনা পরিচালনা',
      },
      {
        href: '/admin/notifications',
        label: 'নোটিফিকেশন',
        icon: Bell,
        badgeKey: 'notifications',
        description: 'অ্যাডমিনের গুরুত্বপূর্ণ আপডেট',
      },
      {
        href: '/admin/email-deliveries',
        label: 'ইমেইল ডেলিভারি',
        icon: MailCheck,
        description: 'Brevo ইমেইল queue, ব্যর্থতা ও delivery status',
      },
    ],
  },
  {
    title: 'Website Management',
    items: [
      {
        href: '/admin/website',
        label: 'ওয়েবসাইট CMS',
        icon: Globe,
        description: 'হোমপেজ সেকশন ও ওয়েবসাইট কনটেন্ট',
      },
      {
        href: '/admin/hero',
        label: 'হিরো ও ব্যানার',
        icon: Images,
        description: 'হোমপেজ ব্যানার ও প্রদর্শন',
      },
      {
        href: '/admin/media',
        label: 'মিডিয়া লাইব্রেরি',
        icon: ImageIcon,
        description: 'আপলোড করা ছবি ও ফাইল',
      },
    ],
  },
  {
    title: 'System & Settings',
    items: [
      {
        href: '/admin/users',
        label: 'ব্যবহারকারী ও ভূমিকা',
        icon: Users,
        description: 'অ্যাকাউন্ট, স্ট্যাটাস ও ভূমিকা',
      },
      {
        href: '/admin/activity',
        label: 'অডিট লগ',
        icon: Activity,
        description: 'অ্যাডমিনদের পরিবর্তনের ইতিহাস',
      },
      {
        href: '/admin/settings',
        label: 'সেটিংস',
        icon: Settings,
        description: 'ফি, সেবা উপলব্ধতা ও সিস্টেম পছন্দ',
      },
    ],
  },
];

/** Flat list, useful for breadcrumbs and "next/previous" style links. */
export const ADMIN_NAV_FLAT: AdminNavItem[] = ADMIN_NAV.flatMap((g) => g.items);

export function findAdminNavItem(pathname: string): AdminNavItem | null {
  // Longest href wins, so /admin/posts/[id] highlights "সার্ভিস পোস্ট" and not
  // a shorter prefix that happens to match.
  return (
    ADMIN_NAV_FLAT.filter(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
    ).sort((a, b) => b.href.length - a.href.length)[0] ?? null
  );
}

/**
 * Legacy URLs kept working so nothing that already links to /admin breaks.
 * These pages were duplicates of other admin screens; redirecting is more
 * honest than leaving three fakes side by side.
 */
export const ADMIN_REDIRECTS: Record<string, string> = {
  '/admin/home-moving': '/admin/requests',
  '/admin/kajer-bua': '/admin/services',
  '/admin/electrician': '/admin/services',
  '/admin/locations': '/admin/website',
};