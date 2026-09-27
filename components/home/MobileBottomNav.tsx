'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, CalendarClock, UserRound, Plus } from 'lucide-react';

const ITEMS = [
  { name: 'হোম', href: '/', icon: Home },
  { name: 'সেবা', href: '/services', icon: LayoutGrid },
  { name: 'বুকিং', href: '/profile/requests', icon: CalendarClock },
  { name: 'প্রোফাইল', href: '/profile', icon: UserRound },
];

/**
 * Fixed mobile bottom navigation.
 * Five slots — the center slot is a raised gold "পোস্ট করুন" (+) action that
 * floats above the bar so posting is always one thumb-tap away on mobile.
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
      <div className="grid grid-cols-5">
        {ITEMS.slice(0, 2).map((item) => {
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

        {/* Center — raised post action */}
        <div className="relative flex items-start justify-center">
          <Link
            href="/register"
            aria-label="পোস্ট করুন"
            className="group -mt-4 flex w-full flex-col items-center gap-0.5"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-700 text-white shadow-lg shadow-brand-900/25 ring-4 ring-white transition-transform duration-150 group-active:scale-95 sm:h-[3.25rem] sm:w-[3.25rem]">
              <Plus className="h-6 w-6 sm:h-7 sm:w-7" />
            </span>
            <span className="text-[10px] font-bold text-brand-700">
              পোস্ট করুন
            </span>
          </Link>
        </div>

        {ITEMS.slice(2).map((item) => {
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