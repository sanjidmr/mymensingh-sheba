'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, CalendarClock, UserRound } from 'lucide-react';

const ITEMS = [
  { name: 'হোম', href: '/', icon: Home },
  { name: 'সেবা', href: '/services', icon: LayoutGrid },
  { name: 'বুকিং', href: '/profile/requests', icon: CalendarClock },
  { name: 'প্রোফাইল', href: '/profile', icon: UserRound },
];

/**
 * Fixed mobile bottom navigation.
 * Only rendered on regular pages (the homepage and other public sections);
 * admin pages deliberately omit it via their own layout choice.
 */
export default function MobileBottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-brand-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      aria-label="মোবাইল মেনু"
    >
      <div className="grid grid-cols-4">
        {ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 border-b-2 px-1 py-1.5 transition-colors ${
                active ? 'border-brand-700 text-brand-700' : 'border-transparent text-ink-400 hover:text-ink-700'
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? 'text-brand-700' : ''}`} />
              <span className="text-[10px] font-semibold">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}