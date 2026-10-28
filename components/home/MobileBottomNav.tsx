'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  Briefcase,
  ChevronRight,
  Home,
  LayoutGrid,
  LogOut,
  Menu,
  Newspaper,
  ShoppingBag,
  UserRound,
  X,
} from 'lucide-react';
import { SITE_NAV_LINKS } from '@/lib/site-navigation';
import { useAuth } from '@/lib/auth-context';

const PRIMARY_ITEMS = [
  { name: 'হোম', href: '/', icon: Home },
  { name: 'সেবা', href: '/services', icon: LayoutGrid },
];

const POST_ROUTES = [
  {
    name: 'ময়মনসিংহ নিউজ',
    description: 'স্থানীয় সংবাদ ও প্রতিবেদন',
    href: '/news',
    icon: Newspaper,
  },
  {
    name: 'চাকরি',
    description: 'চাকরির খবর ও নিয়োগ',
    href: '/jobs',
    icon: Briefcase,
  },
  {
    name: 'কেনাবেচা',
    description: 'কেনা-বেচার পণ্য ও বিজ্ঞাপন',
    href: '/buy-sell',
    icon: ShoppingBag,
  },
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
 *
 * Five slots: হোম, সেবা, the centre navigation drawer, পোস্ট, প্রোফাইল.
 *
 * The পোস্ট slot is deliberately a button, not a link. It opens a compact
 * bottom sheet with exactly the three destinations the community publishes to
 * — news, jobs and buy-sell — so a thumb-tap can never land on the wrong
 * surface. Every destination is the existing public route; no page is forked
 * and no auth gate is bypassed.
 *
 * Mounted once from the root layout, so it survives client-side navigation.
 * `--mms-bottom-nav-h` in globals.css reserves its height in the document.
 */
export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading: authLoading, logout } = useAuth();
  const [sheet, setSheet] = useState<{ type: 'menu' | 'post'; path: string } | null>(null);
  const [logoutError, setLogoutError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const postTriggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  /*
    The open sheet remembers the route it was opened on. A navigation changes
    the pathname, which makes the sheet false without a second render pass —
    no effect needed to reset state after the route has already changed.
  */
  const menuOpen = sheet?.type === 'menu' && sheet.path === pathname;
  const postOpen = sheet?.type === 'post' && sheet.path === pathname;

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSheet(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);

  useEffect(() => {
    if (!postOpen) return;
    const trigger = postTriggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSheet(null);
    };
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 40);
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', closeOnEscape);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [postOpen]);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href === '/profile') {
      return pathname.startsWith('/profile') || pathname.startsWith('/dashboard');
    }
    return pathname.startsWith(href);
  };

  const postSectionActive =
    pathname.startsWith('/news') ||
    pathname.startsWith('/jobs') ||
    pathname.startsWith('/buy-sell') ||
    pathname.startsWith('/posts');

  const openMenu = () => {
    setSheet({ type: 'menu', path: pathname });
  };

  const openPostSheet = () => {
    setSheet((current) =>
      current?.type === 'post' && current.path === pathname
        ? null
        : { type: 'post', path: pathname }
    );
  };

  const handleLogout = async () => {
    setLogoutError('');
    setLoggingOut(true);
    try {
      await logout();
      setSheet(null);
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
      {/* Full navigation drawer — unchanged behaviour. */}
      <div
        aria-hidden={!menuOpen}
        onClick={() => setSheet(null)}
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
              onClick={() => setSheet(null)}
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
                  onClick={() => setSheet(null)}
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
            <Link href="/safety" onClick={() => setSheet(null)} className="flex min-h-11 items-center justify-center rounded-xl border border-brand-200 text-sm font-semibold text-brand-800">
              নিরাপত্তা
            </Link>
            <Link href="/help" onClick={() => setSheet(null)} className="flex min-h-11 items-center justify-center rounded-xl border border-brand-200 text-sm font-semibold text-brand-800">
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

      {/* Post destination sheet — exactly three existing public routes. */}
      <div
        aria-hidden={!postOpen}
        onClick={() => setSheet(null)}
        className={`fixed inset-0 z-[70] bg-brand-950/35 transition-opacity duration-300 lg:hidden ${
          postOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <section
          id="mobile-post-menu"
          role="dialog"
          aria-modal={postOpen ? true : undefined}
          aria-hidden={!postOpen}
          aria-label="পোস্ট কোথায় দেখতে চান"
          inert={!postOpen}
          onClick={(event) => event.stopPropagation()}
          className={`absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-brand-100 bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-2.5 shadow-2xl transition-transform duration-300 ease-out ${
            postOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div aria-hidden="true" className="mx-auto mb-2 h-1 w-10 rounded-full bg-brand-100" />
          <div className="flex items-start justify-between gap-3 border-b border-brand-100 pb-3">
            <div>
              <h2 className="text-base font-extrabold text-brand-950">পোস্ট</h2>
              <p className="mt-0.5 text-xs text-ink-500">কোন পোস্টগুলো দেখতে চান?</p>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => setSheet(null)}
              aria-label="পোস্ট মেনু বন্ধ করুন"
              className="-mr-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-ink-600 transition-colors hover:bg-mist-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <nav aria-label="পোস্টের ধরন" className="mt-2 space-y-2">
            {POST_ROUTES.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSheet(null)}
                  className={`flex min-h-[68px] items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 ${
                    active
                      ? 'border-brand-200 bg-brand-50'
                      : 'border-brand-100 bg-white hover:border-brand-200 hover:bg-mist-50'
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      active ? 'bg-brand-700 text-white' : 'bg-brand-50 text-brand-700'
                    }`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm font-bold ${active ? 'text-brand-800' : 'text-ink-900'}`}>
                      {item.name}
                    </span>
                    <span className="mt-0.5 block truncate text-[11.5px] text-ink-500">
                      {item.description}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
                </Link>
              );
            })}
          </nav>
        </section>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-brand-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
        aria-label="মোবাইল মেনু"
      >
        <div className="grid grid-cols-5">
          {PRIMARY_ITEMS.map((item) => {
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
            onClick={() => (menuOpen ? setSheet(null) : openMenu())}
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

          <button
            ref={postTriggerRef}
            type="button"
            onClick={openPostSheet}
            aria-label={postOpen ? 'পোস্ট মেনু বন্ধ করুন' : 'পোস্ট মেনু খুলুন'}
            aria-expanded={postOpen}
            aria-controls="mobile-post-menu"
            className={`flex min-h-14 flex-col items-center justify-center gap-1 border-b-2 px-1 py-1.5 transition-colors ${
              postOpen || postSectionActive
                ? 'border-brand-700 text-brand-700'
                : 'border-transparent text-ink-400 hover:text-ink-700'
            }`}
          >
            <Newspaper className={`h-5 w-5 ${postOpen || postSectionActive ? 'text-brand-700' : ''}`} />
            <span className="text-[10px] font-semibold">পোস্ট</span>
          </button>

          <Link
            href="/profile"
            aria-current={isActive('/profile') ? 'page' : undefined}
            className={`flex min-h-14 flex-col items-center justify-center gap-1 border-b-2 px-1 py-1.5 transition-colors ${
              isActive('/profile')
                ? 'border-brand-700 text-brand-700'
                : 'border-transparent text-ink-400 hover:text-ink-700'
            }`}
          >
            <UserRound className={`h-5 w-5 ${isActive('/profile') ? 'text-brand-700' : ''}`} />
            <span className="text-[10px] font-semibold">প্রোফাইল</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
