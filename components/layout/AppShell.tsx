'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { AppShellContentContext } from '@/components/layout/AppShellContext';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import MobileBottomNav from '@/components/home/MobileBottomNav';

const ROOT_TABS = ['/', '/services', '/profile/requests', '/profile'];
const BARE_ROUTES = [
  '/admin',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/onboarding',
  '/welcome',
  '/design-preview',
  '/gari-auto-cng/book',
  '/checkout',
];

const PAGE_TITLES: Record<string, string> = {
  '/': 'Mymensingh Sheba',
  '/services': 'সেবাসমূহ',
  '/profile/requests': 'আমার অর্ডার',
  '/profile': 'প্রোফাইল',
  '/about': 'আমাদের সম্পর্কে',
  '/contact': 'যোগাযোগ',
  '/help': 'সহায়তা',
  '/news': 'ময়মনসিংহ নিউজ',
  '/posts': 'কমিউনিটি পোস্ট',
  '/tolet': 'বাসা ভাড়া',
  '/jobs': 'চাকরি',
  '/buy-sell': 'কেনাবেচা',
};

function isBareRoute(pathname: string): boolean {
  return BARE_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function titleForPath(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  const match = Object.keys(PAGE_TITLES).find((route) => route !== '/' && pathname.startsWith(`${route}/`));
  if (match) return PAGE_TITLES[match];
  return 'Mymensingh Sheba';
}

function MobileTopBar({ pathname }: { pathname: string }) {
  const router = useRouter();
  const isRootTab = ROOT_TABS.includes(pathname);

  return (
    <header className="ui-app-topbar safe-x sticky top-0 z-40 border-b md:hidden">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2">
        {isRootTab ? (
          <Link href="/" className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg focus-visible:outline-none">
            <Image src="/logo.png" alt="" width={36} height={36} priority className="h-9 w-9 shrink-0 object-contain" />
            <span className="truncate text-sm font-bold leading-tight">Mymensingh Sheba</span>
          </Link>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-1">
            <button
              type="button"
              onClick={() => (window.history.length > 1 ? router.back() : router.push('/'))}
              className="ui-pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              aria-label="পেছনে যান"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <span className="truncate text-base font-bold">{titleForPath(pathname)}</span>
          </div>
        )}
        {!isBareRoute(pathname) && (
          <div className="ui-chrome flex shrink-0 items-center">
            <Link
              href="/services"
              className="ui-pressable flex h-10 w-10 items-center justify-center rounded-xl"
              aria-label="সেবা খুঁজুন"
            >
              <Search className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/';
  const bare = isBareRoute(pathname);
  const admin = pathname === '/admin' || pathname.startsWith('/admin/');

  if (admin) {
    return (
      <AppShellContentContext.Provider value>
        <div className="ui-app-shell" data-app-shell-bare="">
          {children}
        </div>
      </AppShellContentContext.Provider>
    );
  }

  return (
    <div className="ui-app-shell" data-app-shell-bare={bare ? '' : undefined}>
      {!bare && (
        <>
          <MobileTopBar pathname={pathname} />
          <div className="hidden md:block">
            <Navbar />
          </div>
        </>
      )}
      <AppShellContentContext.Provider value>
        <div className="ui-app-main">{children}</div>
      </AppShellContentContext.Provider>
      {!bare && (
        <>
          <MobileBottomNav />
          <div className="ui-app-footer">
            <Footer />
          </div>
        </>
      )}
    </div>
  );
}
