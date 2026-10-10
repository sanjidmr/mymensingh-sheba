'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  Bookmark,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  Mail,
  PlusCircle,
  UserRound,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

/**
 * Shell for the customer dashboard: auth gate + Navbar + a four-tab strip +
 * Footer, so every dashboard page renders inside one consistent frame instead
 * of repeating the chrome (the way `/profile/*` pages each carry their own).
 *
 * The tab strip is a grid, never a horizontal scroller — four short labels fit
 * a 360px phone without forcing the page sideways, which is the mobile-first
 * rule this dashboard has to keep.
 */
const TABS = [
  { href: '/dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/posts', label: 'আমার পোস্ট', icon: FileText, exact: false },
  { href: '/dashboard/new', label: 'নতুন পোস্ট', icon: PlusCircle, exact: false },
  { href: '/dashboard/profile', label: 'প্রোফাইল', icon: UserRound, exact: false },
] as const;

const SIDE_LINKS = [
  { href: '/profile/requests', label: 'আমার রিকোয়েস্ট', icon: ClipboardList },
  { href: '/profile/saved', label: 'পছন্দের তালিকা', icon: Bookmark },
  { href: '/dashboard/messages', label: 'সাপোর্ট বার্তা', icon: Mail },
  { href: '/dashboard/notifications', label: 'নোটিফিকেশন', icon: Bell },
  { href: '/help', label: 'সাহায্য কেন্দ্র', icon: LifeBuoy },
] as const;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

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

  const isActive = (tab: (typeof TABS)[number]) =>
    tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);

  return (
    <div className="min-h-screen flex flex-col bg-mist-50">
      <Navbar />

      {/* Sticky tab bar, parked right under the sticky Navbar (h-16 / 4.5rem). */}
      <nav
        className="sticky top-16 sm:top-[4.5rem] z-40 border-b border-brand-100 bg-white/95 backdrop-blur-md"
        aria-label="ড্যাশবোর্ড মেনু"
      >
        <div className="mx-auto grid w-full max-w-5xl grid-cols-4 px-2 sm:px-4">
          {TABS.map((tab) => {
            const active = isActive(tab);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-[52px] flex-col items-center justify-center gap-0.5 border-b-2 px-1 py-2 transition-colors ${
                  active
                    ? 'border-brand-700 text-brand-700'
                    : 'border-transparent text-ink-400 hover:text-ink-700'
                }`}
              >
                <Icon className={`h-[18px] w-[18px] ${active ? 'text-brand-700' : ''}`} />
                <span
                  className={`text-[10.5px] leading-tight ${active ? 'font-extrabold' : 'font-semibold'}`}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
        <details className="group border-t border-brand-100/70 px-3 py-1.5 lg:hidden">
          <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between text-[11px] font-bold text-ink-600 [&::-webkit-details-marker]:hidden">
            <span>আরও অ্যাকাউন্ট অপশন</span>
            <span aria-hidden="true" className="transition-transform group-open:rotate-180">⌄</span>
          </summary>
          <div className="grid grid-cols-2 gap-1 pb-2 pt-1 sm:grid-cols-3">
            {SIDE_LINKS.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex min-h-10 items-center gap-2 rounded-lg px-2 text-[11px] font-bold ${
                    active ? 'bg-brand-50 text-brand-800' : 'text-ink-600 hover:bg-mist-50'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </details>
      </nav>

      <main className="mx-auto flex w-full max-w-7xl flex-1 gap-5 px-3 py-4 sm:px-4 sm:py-6 lg:px-6">
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav aria-label="অ্যাকাউন্ট মেনু" className="sticky top-36 space-y-1 rounded-2xl border border-brand-100 bg-white p-2">
            <p className="px-3 pb-2 pt-1 text-[11px] font-extrabold uppercase tracking-wide text-ink-400">
              আপনার অ্যাকাউন্ট
            </p>
            {[...TABS, ...SIDE_LINKS].map((item) => {
              const Icon = item.icon;
              const active = item.href === '/dashboard'
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex min-h-10 items-center gap-2.5 rounded-xl px-3 text-[12px] font-bold transition-colors ${
                    active ? 'bg-brand-50 text-brand-800' : 'text-ink-600 hover:bg-mist-50'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="min-w-0 flex-1 lg:max-w-5xl">
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}
