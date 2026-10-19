import {
  Home,
  LayoutGrid,
  Workflow,
  Info,
  Phone,
  Landmark,
  Newspaper,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type SiteNavLink = {
  name: string;
  href: string;
  icon: LucideIcon;
  desktopOnly?: boolean;
};

export const SITE_NAV_LINKS: SiteNavLink[] = [
  { name: 'হোম', href: '/', icon: Home },
  { name: 'সেবা সমূহ', href: '/services', icon: LayoutGrid },
  { name: 'পোস্ট', href: '/posts', icon: Newspaper, desktopOnly: true },
  { name: 'কিভাবে কাজ করে', href: '/how-it-works', icon: Workflow },
  { name: 'আমাদের সম্পর্কে', href: '/about', icon: Info },
  { name: 'ময়মনসিংহ পরিচিতি', href: '/mymensingh', icon: Landmark },
  { name: 'যোগাযোগ', href: '/contact', icon: Phone },
];
