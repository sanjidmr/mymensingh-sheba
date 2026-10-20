'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bookmark,
  CircleAlert,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Mail,
  Settings,
  UserRound,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { cn } from '@/lib/utils';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';

const ACCOUNT_LINKS = [
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

/**
 * Shared shell for the signed-in customer account.
 *
 * The dashboard routes and the standalone account routes (`/profile/saved`,
 * `/profile/requests`) both render inside this shell so the sidebar and
 * notification menu stay visible throughout the account area. The site bottom
 * navigation is mounted by the root layout; this shell uses a readable mobile
 * grid and a desktop sidebar. Each route group keeps its own auth gate; this
 * component only paints the chrome.
 */
export default function AccountShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();
  const [logoutError, setLogoutError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut || !window.confirm('আপনি কি লগআউট করতে চান?')) return;
    setLoggingOut(true);
    setLogoutError('');
    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : 'লগআউট করা যায়নি।');
      setLoggingOut(false);
    }
  };

  const isActive = (href: string) => {
    const route = href.split('?')[0];
    return route === '/dashboard'
      ? pathname === route
      : pathname === route || pathname.startsWith(`${route}/`);
  };

  return (
    <div data-dashboard-shell className="min-h-screen overflow-x-clip bg-[#faf9f6]">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-3 py-4 pb-24 max-sm:px-2.5 max-sm:py-3 sm:px-5 sm:py-6 sm:pb-24 lg:flex lg:gap-6 lg:px-7 lg:pb-8">
        <aside className="hidden w-60 shrink-0 lg:block">
          <nav
            aria-label="অ্যাকাউন্ট মেনু"
            className="sticky top-24 border-r border-ink-900/[0.06] pr-4"
          >
            <p className="px-3 pb-3 pt-2 text-[11.5px] font-medium text-ink-500">
              আপনার অ্যাকাউন্ট
            </p>
            <div className="space-y-0.5">
              {ACCOUNT_LINKS.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'group flex min-h-11 items-center gap-3 rounded-lg px-3 text-[13px] font-semibold transition-colors',
                      active
                        ? 'bg-ink-900 text-white'
                        : 'text-ink-600 hover:bg-white hover:text-ink-900',
                      LIGHT_FOCUS
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-[17px] w-[17px] shrink-0',
                        active ? 'text-white' : 'text-ink-400 group-hover:text-ink-600'
                      )}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 break-words">{item.label}</span>
                    {active && (
                      <span
                        aria-hidden="true"
                        className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400"
                      />
                    )}
                  </Link>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={loggingOut}
              className={cn(
                'mt-4 flex min-h-11 w-full items-center gap-3 rounded-lg border-t border-ink-900/[0.06] px-3 pt-3 text-left text-[13px] font-semibold text-rose-700 transition-colors hover:bg-rose-50 disabled:opacity-60',
                LIGHT_FOCUS
              )}
            >
              <LogOut className="h-[17px] w-[17px] shrink-0" aria-hidden="true" />
              {loggingOut ? 'লগআউট হচ্ছে…' : 'লগআউট'}
            </button>
            {logoutError && (
              <p role="alert" className="px-3 pt-2 text-xs text-rose-700">
                {logoutError}
              </p>
            )}
          </nav>
        </aside>

        <div className="min-w-0 flex-1 lg:max-w-5xl">
          <nav className="mb-4 lg:hidden" aria-label="অ্যাকাউন্ট মেনু">
            <p className="mb-2 text-[11.5px] font-medium text-ink-500">আপনার অ্যাকাউন্ট</p>
            <div className="grid grid-cols-3 gap-1 sm:grid-cols-4">
              {ACCOUNT_LINKS.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'relative flex min-h-10 min-w-0 flex-col items-center justify-center gap-1 rounded-lg border px-1 py-1.5 text-center text-[10px] font-semibold leading-tight transition-colors sm:min-h-12 sm:flex-row sm:gap-2 sm:px-2.5 sm:py-2 sm:text-left sm:text-[12px] sm:leading-snug',
                      active
                        ? 'border-ink-900 bg-white text-ink-900 shadow-[0_1px_2px_rgba(16,24,20,0.06)]'
                        : 'border-ink-900/[0.07] bg-white text-ink-600 hover:border-ink-900/15 hover:bg-mist-50 hover:text-ink-900',
                      LIGHT_FOCUS
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4',
                        active ? 'text-ink-800' : 'text-ink-400'
                      )}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 break-words sm:text-left">{item.shortLabel}</span>
                    {active && (
                      <span
                        aria-hidden="true"
                        className="absolute right-1.5 top-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500 sm:static"
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}
