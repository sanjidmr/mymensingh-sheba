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

const ACCOUNT_LINKS = [
  { href: '/dashboard', label: 'ওভারভিউ', icon: LayoutDashboard },
  { href: '/dashboard/posts', label: 'আমার পোস্ট', icon: FileText },
  { href: '/dashboard/profiles', label: 'সেবা প্রোফাইল খুলুন', icon: UserRound },
  { href: '/profile/saved', label: 'সংরক্ষিত পোস্ট', icon: Bookmark },
  { href: '/dashboard/messages', label: 'বার্তা', icon: Mail },
  { href: '/dashboard/complaints', label: 'অভিযোগ', icon: CircleAlert },
  { href: '/profile/requests', label: 'আমার রিকোয়েস্ট', icon: ClipboardList },
  { href: '/dashboard/profile', label: 'প্রোফাইল সেটিংস', icon: Settings },
] as const;

/**
 * Shared shell for the signed-in customer account.
 *
 * The dashboard routes and the standalone account routes (`/profile/saved`,
 * `/profile/requests`) both render inside this shell so the sidebar and
 * notification menu stay visible throughout the account area. The site bottom
 * navigation is mounted by the root layout; this shell uses a mobile
 * horizontal quick-nav and a desktop sidebar. Each route group keeps its own
 * auth gate; this component only paints the chrome.
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

  return (
    <div data-dashboard-shell className="min-h-screen overflow-x-clip bg-[#faf9f6]">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-3 py-4 pb-24 max-sm:px-2.5 max-sm:py-3 sm:px-5 sm:py-6 sm:pb-24 lg:flex lg:gap-6 lg:px-7 lg:pb-8">
        <aside className="hidden w-60 shrink-0 lg:block">
          <nav aria-label="অ্যাকাউন্ট মেনু" className="sticky top-24 border-r border-brand-100 pr-4">
            <p className="px-3 pb-3 pt-2 text-[11px] font-extrabold tracking-wide text-ink-400">
              আপনার অ্যাকাউন্ট
            </p>
            <div className="space-y-1">
              {ACCOUNT_LINKS.map((item) => {
                const Icon = item.icon;
                const route = item.href.split('?')[0];
                const active = route === '/dashboard'
                  ? pathname === route
                  : pathname === route || pathname.startsWith(`${route}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`flex min-h-11 items-center gap-3 border-l-2 px-3 text-[13px] font-semibold transition-colors ${
                      active
                        ? 'border-brand-700 bg-brand-50/70 text-brand-800'
                        : 'border-transparent text-ink-600 hover:bg-white'
                    }`}
                  >
                    <Icon className="h-[17px] w-[17px] shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={loggingOut}
              className="mt-4 flex min-h-11 w-full items-center gap-3 border-t border-brand-100 px-3 pt-3 text-left text-[13px] font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
            >
              <LogOut className="h-[17px] w-[17px] shrink-0" />
              {loggingOut ? 'লগআউট হচ্ছে…' : 'লগআউট'}
            </button>
            {logoutError && <p role="alert" className="px-3 pt-2 text-xs text-rose-700">{logoutError}</p>}
          </nav>
        </aside>
        <div className="min-w-0 flex-1 lg:max-w-5xl">
          <nav className="mb-4 overflow-x-auto lg:hidden max-sm:mb-3 max-sm:overflow-visible" aria-label="অ্যাকাউন্ট মেনু">
            <div className="flex w-max min-w-full gap-1 border-b border-brand-100 max-sm:grid max-sm:w-full max-sm:grid-cols-4 max-sm:gap-1 max-sm:border-0">
              {ACCOUNT_LINKS.map((item) => {
                const Icon = item.icon;
                const active = item.href === '/dashboard'
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-xs font-semibold transition-colors max-sm:min-w-0 max-sm:flex-col max-sm:justify-center max-sm:gap-1 max-sm:rounded-lg max-sm:border max-sm:px-1 max-sm:py-2 max-sm:text-center max-sm:text-[10px] ${
                      active
                        ? 'border-brand-700 bg-brand-50/70 text-brand-800'
                        : 'border-transparent text-ink-600 hover:bg-white'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {item.label}
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
