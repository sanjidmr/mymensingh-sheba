'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChevronRight, Home, LayoutGrid, LogOut, Menu, Newspaper, UserRound, X } from 'lucide-react';
import { SITE_NAV_LINKS } from '@/lib/site-navigation';
import { useAuth } from '@/lib/auth-context';

const ITEMS = [
  { name: 'হোম', href: '/', icon: Home },
  { name: 'সেবা', href: '/services', icon: LayoutGrid },
  // The community feed. This slot used to be "বুকিং" (/profile/requests); the
  // requests list still lives behind the profile screen, but the bar now puts
  // one thumb-tap between the reader and everything the community published.
  { name: 'পোস্ট', href: '/posts', icon: Newspaper },
  { name: 'প্রোফাইল', href: '/profile', icon: UserRound },
];

/**
 * Routes that own the whole screen and should not carry site navigation —
 * the admin console and the auth screens. Everything else keeps the bar.
 */
const BARE_ROUTES = ['/admin', '/login', '/register', '/forgot-password', '/onboarding', '/welcome', '/design-system'];

function isBareRoute(pathname: string): boolean {
  return BARE_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

/**
 * Fixed mobile bottom navigation.
 * Five slots — the center slot opens the mobile navigation drawer.
 *
 * Mounted once from the root layout rather than per page, so it survives every
 * client-side route change instead of vanishing on any page that forgot to
 * render it. The document reserves matching bottom padding via
 * `--mms-bottom-nav-h` in globals.css, so the last row of content is never
 * hidden underneath.
 */
export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading: authLoading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href === '/profile') {
      return pathname.startsWith('/profile') || pathname.startsWith('/dashboard');
    }
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    setLogoutError('');
    setLoggingOut(true);
    try {
      await logout();
      setMenuOpen(false);
      router.replace('/');
      router.refresh();
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : 'লগআউট করা যায়নি। আবার চেষ্টা করুন।');
    } finally {
      setLoggingOut(false);
    }
  };

  if (isBareRoute(pathname)) return null;

  return (
    <>
      <div
        aria-hidden={!menuOpen}
        onClick={() => setMenuOpen(false)}
        className={`fixed inset-0 z-[60] bg-brand-950/35 transition-opacity duration-300 lg:hidden ${
          menuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <section
          id="mobile-menu"
          role="dialog"
          aria-modal={menuOpen ? true : undefined}
          aria-hidden={!menuOpen}
          aria-label="মোবাইল নেভিগেশন"
          inert={!menuOpen}
          onClick={(event) => event.stopPropagation()}
          className={`absolute inset-x-0 bottom-0 max-h-[82dvh] overflow-y-auto rounded-t-3xl border-t border-brand-100 bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 shadow-2xl transition-transform duration-300 ease-out ${
            menuOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="mb-3 flex items-center justify-between border-b border-brand-100 pb-3">
            <h2 className="text-base font-extrabold text-brand-950">মেনু</h2>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="মেনু বন্ধ করুন"
              className="flex h-11 w-11 items-center justify-center rounded-xl text-ink-600 hover:bg-mist-50"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <nav aria-label="প্রধান নেভিগেশন" className="space-y-1">
            {SITE_NAV_LINKS.filter((item) => !item.desktopOnly).map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex min-h-12 items-center justify-between rounded-xl px-3 text-sm font-semibold ${
                    active ? 'bg-brand-50 text-brand-800' : 'text-ink-700 hover:bg-mist-50'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${active ? 'text-brand-700' : 'text-ink-400'}`} />
                    {item.name}
                  </span>
                  <ChevronRight className="h-4 w-4 text-ink-400" aria-hidden="true" />
                </Link>
              );
            })}
          </nav>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-brand-100 pt-3">
            <Link href="/safety" onClick={() => setMenuOpen(false)} className="flex min-h-11 items-center justify-center rounded-xl border border-brand-200 text-sm font-semibold text-brand-800">
              নিরাপত্তা
            </Link>
            <Link href="/help" onClick={() => setMenuOpen(false)} className="flex min-h-11 items-center justify-center rounded-xl border border-brand-200 text-sm font-semibold text-brand-800">
              সহায়তা
            </Link>
            {!authLoading && user && (
              <div className="col-span-2">
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  disabled={loggingOut}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 text-sm font-bold text-rose-800 transition-colors hover:bg-rose-100 disabled:cursor-wait disabled:opacity-60"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  {loggingOut ? 'লগআউট হচ্ছে…' : 'লগআউট'}
                </button>
                {logoutError && <p role="alert" className="mt-2 text-center text-xs font-semibold text-rose-700">{logoutError}</p>}
              </div>
            )}
          </div>
        </section>
      </div>

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
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'মেনু বন্ধ করুন' : 'মেনু খুলুন'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className={`flex min-h-14 flex-col items-center justify-center gap-1 border-b-2 px-1 py-1.5 ${
              menuOpen ? 'border-brand-700 text-brand-700' : 'border-transparent text-ink-500'
            }`}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="text-[10px] font-semibold">মেনু</span>
          </button>
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
    </>
  );
}