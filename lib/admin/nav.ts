import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Globe,
  Images,
  Wrench,
  FileText,
  LayoutGrid,
  ClipboardList,
  Home,
  Car,
  MessageSquare,
  Flag,
  Users,
  ShieldCheck,
  Heart,
  Star,
  Bell,
  Activity,
  ImageIcon,
  Settings,
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
  | 'notifications'
  | 'bloodRequests';

export interface AdminNavGroup {
  title: string;
  items: AdminNavItem[];
}

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    title: 'সারসংক্ষেপ',
    items: [
      {
        href: '/admin',
        label: 'ড্যাশবোর্ড',
        icon: LayoutDashboard,
        description: 'পুরো ওয়েবসাইটের লাইভ পরিসংখ্যান ও সাম্প্রতিক কার্যক্রম',
      },
    ],
  },
  {
    title: 'ওয়েবসাইট',
    items: [
      {
        href: '/admin/website',
        label: 'ওয়েবসাইট ম্যানেজমেন্ট',
        icon: Globe,
        description: 'হোমপেজ সেকশন, সেবা কার্ড, ক্যাটাগরি ও সাইট সেটিংস',
      },
      {
        href: '/admin/hero',
        label: 'হিরো ম্যানেজমেন্ট',
        icon: Images,
        description: 'ব্যানার ছবি আপলোড, রিঅ্যারেঞ্জ, সাজানো ও বন্ধ/চালু',
      },
      {
        href: '/admin/services',
        label: 'সেবা ম্যানেজমেন্ট',
        icon: Wrench,
        description: 'কর্মী প্রোফাইল, সেবা চালু/বন্ধ ও বিজ্ঞাপন',
      },
      {
        href: '/admin/posts',
        label: 'সার্ভিস পোস্ট',
        icon: FileText,
        badgeKey: 'posts',
        description: 'খবর, চাকরি ও কেনাবেচা পোস্ট — অনুমোদন ও ফিচার',
      },
      {
        href: '/admin/catalog',
        label: 'ক্যাটালগ ও ইমার্জেন্সি',
        icon: LayoutGrid,
        description: 'কোচিং, WiFi, বাস ও জরুরি নম্বর তালিকা',
      },
    ],
  },
  {
    title: 'অপারেশন',
    items: [
      {
        href: '/admin/requests',
        label: 'রিকোয়েস্ট',
        icon: ClipboardList,
        badgeKey: 'requests',
        description: 'সব সেবা রিকোয়েস্ট এক জায়গায়',
      },
      {
        href: '/admin/tolet-requests',
        label: 'বাসা ভাড়া অনুসন্ধান',
        icon: Home,
        description: 'বাসা ভাড়ার বিজ্ঞাপনে আসা ইনকোয়ারি',
      },
      {
        href: '/admin/vehicle-requests',
        label: 'গাড়ি রিকোয়েস্ট',
        icon: Car,
        description: 'গাড়ি, অটো ও সিএনজি ভাড়ার অনুরোধ',
      },
      {
        href: '/admin/messages',
        label: 'মেসেজ',
        icon: MessageSquare,
        badgeKey: 'messages',
        description: 'যোগাযোগ ফর্মের সব বার্তা',
      },
      {
        href: '/admin/reports',
        label: 'রিপোর্ট',
        icon: Flag,
        badgeKey: 'reports',
        description: 'অভিযোগ রিভিউ ও সমাধান',
      },
    ],
  },
  {
    title: 'মানুষ ও যাচাই',
    items: [
      {
        href: '/admin/users',
        label: 'ইউজার',
        icon: Users,
        description: 'অ্যাকাউন্ট, স্ট্যাটাস ও ভূমিকা',
      },
      {
        href: '/admin/verifications',
        label: 'ভেরিফিকেশন',
        icon: ShieldCheck,
        badgeKey: 'verifications',
        description: 'গৃহশিক্ষক ও বাসা মালিক প্রোফাইল যাচাই',
      },
      {
        href: '/admin/blood',
        label: 'রক্ত সেবা',
        icon: Heart,
        badgeKey: 'bloodRequests',
        description: 'রক্তদাতা তালিকা ও জরুরি রক্ত রিকোয়েস্ট',
      },
      {
        href: '/admin/reviews',
        label: 'রিভিউ',
        icon: Star,
        description: 'গৃহশিক্ষক রিভিউ প্রকাশ/অপ্রকাশ',
      },
    ],
  },
  {
    title: 'সিস্টেম',
    items: [
      {
        href: '/admin/notifications',
        label: 'নোটিফিকেশন',
        icon: Bell,
        badgeKey: 'notifications',
        description: 'সিস্টেমের সব গুরুত্বপূর্ণ আপডেট',
      },
      {
        href: '/admin/activity',
        label: 'অডিট লগ',
        icon: Activity,
        description: 'অ্যাডমিনদের পরিবর্তনের ইতিহাস',
      },
      {
        href: '/admin/media',
        label: 'মিডিয়া',
        icon: ImageIcon,
        description: 'আপলোড করা ছবি ও ফাইল',
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