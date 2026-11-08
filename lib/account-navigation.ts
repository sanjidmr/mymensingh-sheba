import {
  Bookmark,
  CircleAlert,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Mail,
  Settings,
  UserRound,
} from 'lucide-react';

export const ACCOUNT_LINKS = [
  { href: '/dashboard', label: 'ওভারভিউ', shortLabel: 'ওভারভিউ', icon: LayoutDashboard },
  { href: '/dashboard/posts', label: 'আমার পোস্ট', shortLabel: 'আমার পোস্ট', icon: FileText },
  {
    href: '/dashboard/profiles',
    label: 'সেবা প্রোফাইল খুলুন',
    shortLabel: 'সেবা প্রোফাইল',
    icon: UserRound,
  },
  { href: '/profile/saved', label: 'সংরক্ষিত পোস্ট', shortLabel: 'সংরক্ষিত পোস্ট', icon: Bookmark },
  { href: '/dashboard/messages', label: 'বার্তা', shortLabel: 'বার্তা', icon: Mail },
  { href: '/dashboard/complaints', label: 'অভিযোগ', shortLabel: 'অভিযোগ', icon: CircleAlert },
  {
    href: '/profile/requests',
    label: 'আমার রিকোয়েস্ট',
    shortLabel: 'আমার রিকোয়েস্ট',
    icon: ClipboardList,
  },
  { href: '/dashboard/profile', label: 'প্রোফাইল সেটিংস', shortLabel: 'প্রোফাইল সেটিংস', icon: Settings },
] as const;
