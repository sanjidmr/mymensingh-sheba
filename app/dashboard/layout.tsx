'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FileText, LayoutDashboard, PlusCircle, UserRound } from 'lucide-react';
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
      </nav>

      <main className="mx-auto w-full max-w-5xl flex-1 px-3 py-4 sm:px-4 sm:py-6">
        {children}
      </main>

      <Footer />
    </div>
  );
}
