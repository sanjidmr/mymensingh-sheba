'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  Bookmark,
  ClipboardList,
  CircleAlert,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Mail,
  PlusCircle,
  Settings,
  UserRound,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const MOBILE_LINKS = [
  { href: '/dashboard', label: 'হোম', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/posts', label: 'পোস্ট', icon: FileText, exact: false },
  { href: '/dashboard/new', label: 'নতুন', icon: PlusCircle, exact: false },
  { href: '/profile/saved', label: 'সংরক্ষিত', icon: Bookmark, exact: false },
  { href: '/dashboard/profile', label: 'প্রোফাইল', icon: UserRound, exact: false },
] as const;

const ACCOUNT_LINKS = [
  { href: '/dashboard', label: 'ওভারভিউ', icon: LayoutDashboard },
  { href: '/dashboard/posts', label: 'আমার পোস্ট', icon: FileText },
  { href: '/dashboard/new', label: 'নতুন পোস্ট', icon: PlusCircle },
  { href: '/profile/saved', label: 'সংরক্ষিত পোস্ট', icon: Bookmark },
  { href: '/dashboard/notifications', label: 'নোটিফিকেশন', icon: Bell },
  { href: '/dashboard/messages', label: 'বার্তা', icon: Mail },
  { href: '/dashboard/messages?subject=complaint#complaint-form', label: 'অভিযোগ', icon: CircleAlert },
  { href: '/profile/requests', label: 'আমার রিকোয়েস্ট', icon: ClipboardList },
  { href: '/dashboard/profile', label: 'প্রোফাইল সেটিংস', icon: Settings },
  { href: '/help', label: 'সাহায্য কেন্দ্র', icon: LifeBuoy },
] as const;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, logout, notifications } = useAuth();
  const [logoutError, setLogoutError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(`/login?redirect=${encodeURIComponent('/dashboard')}`);
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mist-50 text-sm text-slate-500">
        লোড হচ্ছে...
      </div>
    );
  }

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

      <main className="mx-auto flex w-full max-w-7xl gap-6 px-3 py-4 pb-24 sm:px-5 sm:py-6 sm:pb-24 lg:px-7 lg:pb-8">
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
          <div className="mb-2 flex justify-end">
            <Link
              href="/dashboard/notifications"
              aria-label={`নোটিফিকেশন${notifications.some((notification) => !notification.isRead) ? `, ${notifications.filter((notification) => !notification.isRead).length}টি অপঠিত` : ''}`}
              className="relative flex h-10 w-10 items-center justify-center border border-brand-100 bg-white text-ink-700 hover:bg-brand-50"
            >
              <Bell className="h-5 w-5" />
              {notifications.some((notification) => !notification.isRead) && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-black text-white">
                  {notifications.filter((notification) => !notification.isRead).length > 9
                    ? '9+'
                    : notifications.filter((notification) => !notification.isRead).length}
                </span>
              )}
            </Link>
          </div>
          {children}
        </div>
      </main>

      <Footer />
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-brand-100 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(40,48,35,0.06)] backdrop-blur lg:hidden"
        aria-label="প্রধান নেভিগেশন"
      >
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {MOBILE_LINKS.map((tab) => {
            const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-[60px] min-w-0 flex-col items-center justify-center gap-1 px-1 py-2 ${
                  active ? 'text-brand-800' : 'text-ink-400'
                }`}
              >
                <Icon className={`h-[19px] w-[19px] ${active ? 'stroke-[2.4]' : ''}`} aria-hidden="true" />
                <span className="max-w-full truncate text-[10px] font-bold leading-none">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
