'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Plus, UserRound, X, FilePlus2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import MymensinghLiveBar from '@/components/MymensinghLiveBar';
import NotificationBell from '@/components/account/NotificationBell';
import { ListingMedia } from '@/components/catalog/CatalogCards';
import { SITE_NAV_LINKS } from '@/lib/site-navigation';

function PostMenuButton({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [open]);

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
        className={
          compact
            ? 'inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-accent-400 px-2.5 text-[11px] font-extrabold text-brand-950 shadow-sm transition-colors hover:bg-accent-500'
            : 'inline-flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-xl bg-accent-400 px-2.5 text-xs font-bold text-brand-900 transition-colors hover:bg-accent-500 xl:min-h-10 xl:gap-2 xl:px-4 xl:text-sm'
        }
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        পোস্ট করুন
      </button>
      {open && (
        <div
          id={menuId}
          role="group"
          aria-label="পোস্ট বা প্রোফাইল তৈরি"
          className="absolute right-0 top-full z-[70] mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-2xl border border-brand-100 bg-white p-2 shadow-xl"
        >
          <p className="px-3 py-2 text-xs font-bold text-ink-500">কী করতে চান?</p>
          <Link
            href="/dashboard/new"
            onClick={() => setOpen(false)}
            className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-ink-800 transition-colors hover:bg-brand-50"
          >
            <FilePlus2 className="h-4 w-4 shrink-0 text-brand-700" aria-hidden="true" />
            পোস্ট করুন
          </Link>
          <Link
            href="/dashboard/profiles"
            onClick={() => setOpen(false)}
            className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-ink-800 transition-colors hover:bg-brand-50"
          >
            <UserRound className="h-4 w-4 shrink-0 text-brand-700" aria-hidden="true" />
            সেবা প্রোফাইল খুলুন
          </Link>
        </div>
      )}
    </div>
  );
}

/**
 * Premium navbar, same on every page.
 *
 * On the homepage the bar sits transparently above the page so it feels part of
 * the hero composition (it turns into a soft cream blur once you scroll). Every
 * other page keeps a clean solid white bar with the same light link styling.
 * The brand is the logo alone — noticeably larger, no wordmark. The nav carries
 * area links plus the "ময়মনসিংহ পরিচিতি" page. Mobile keeps the compact bar
 * (logo + hamburger, 44px targets) with a polished drawer.
 */
export default function Navbar({ hideOnScroll = false }: { hideOnScroll?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const lastScrollY = useRef(0);
  const pathname = usePathname();
  const router = useRouter();
  const { user, toletProfile, homeTutorProfile, bloodDonorProfile, isAdmin, isLoading: authLoading } =
    useAuth();

  // The homepage navbar is transparent at the top and adapts to a soft cream
  // blur after scrolling so content never collides with the links.
  const onHome = pathname === '/';
  const showInfoBar = new Set([
    '/',
    '/services',
    '/posts',
    '/how-it-works',
    '/about',
    '/mymensingh',
    '/contact',
  ]).has(pathname);
  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;
      setScrolled(currentY > 12);
      if (hideOnScroll) {
        if (currentY <= 12) {
          setNavHidden(false);
        } else if (currentY > lastScrollY.current + 4) {
          setNavHidden(true);
        } else if (currentY < lastScrollY.current - 4) {
          setNavHidden(false);
        }
      }
      lastScrollY.current = currentY;
    };
    lastScrollY.current = window.scrollY;
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [hideOnScroll]);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href.startsWith('/#')) return pathname === '/';
    return pathname.startsWith(href);
  };

  const roleLabel = isAdmin
    ? 'অ্যাডমিন'
    : toletProfile
      ? 'বাসা মালিক'
      : homeTutorProfile
        ? 'গৃহশিক্ষক'
        : bloodDonorProfile
          ? 'রক্তদাতা'
          : 'কাস্টমার';

  const navLink = 'text-ink-700 hover:bg-brand-100/60 hover:text-brand-900';
  const navLinkActive = 'bg-brand-100 font-semibold text-brand-800';
  const iconBtn =
    'rounded-lg text-ink-600 transition-colors hover:bg-brand-100/60 hover:text-brand-900';

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    setSearchOpen(false);
    router.push(query ? `/services?q=${encodeURIComponent(query)}` : '/services');
  };

  return (
    <>
      {showInfoBar && <MymensinghLiveBar />}
      <header
        className={`sticky top-[env(safe-area-inset-top)] z-50 ${
          hideOnScroll
            ? `transition-transform duration-300 ease-in-out ${navHidden ? '-translate-y-full' : 'translate-y-0'}`
            : ''
        } ${
          onHome
            ? scrolled
              ? 'border-b border-brand-100/80 bg-mist-50/90 shadow-sm shadow-brand-900/5 backdrop-blur-md'
              : 'border-b border-transparent bg-transparent'
            : 'border-b border-brand-100/80 bg-white shadow-sm shadow-brand-900/5'
        }`}
      >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-2 sm:h-[4.5rem] sm:gap-3">
          {/* Brand — the logo alone, filling the navbar height (no tile, no ring) */}
          <Link
            href="/"
            aria-label="Mymensingh Sheba হোম"
            className="group flex h-full shrink-0 items-center rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
          >
            <Image
              src="/logo.webp"
              alt="Mymensingh Sheba লোগো"
              width={230}
              height={230}
              className="h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-[1.03] sm:h-full lg:h-14"
            />
          </Link>

          {/* Desktop links */}
          <nav className="hidden min-w-0 flex-nowrap items-center gap-0.5 lg:flex xl:gap-1">
            {SITE_NAV_LINKS.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`whitespace-nowrap rounded-lg px-2 py-2 text-xs font-medium transition-colors xl:px-2.5 xl:text-sm 2xl:px-3.5 ${
                    active ? navLinkActive : navLink
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right actions (desktop) — search / auth */}
          <div className="hidden shrink-0 items-center gap-1 lg:flex xl:gap-2">
            <button
              type="button"
              aria-label={searchOpen ? 'সার্চ বন্ধ করুন' : 'সেবা খুঁজুন'}
              aria-expanded={searchOpen}
              aria-controls="navbar-search"
              onClick={() => setSearchOpen((current) => !current)}
              className={`flex h-9 w-9 items-center justify-center xl:h-10 xl:w-10 ${iconBtn}`}
            >
              {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
            </button>

            {user ? (
              <>
              {!isAdmin && <PostMenuButton />}
              {!isAdmin && <NotificationBell />}
              <Link
                href={isAdmin ? '/admin' : '/profile'}
                aria-label={isAdmin ? 'অ্যাডমিন প্যানেল' : 'আমার প্রোফাইল'}
                className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border border-brand-200 bg-white py-1.5 pl-1.5 pr-2 transition-colors hover:bg-brand-100/40 xl:gap-2 xl:pr-3"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-accent-400 text-xs font-bold text-brand-900">
                  {user.avatarUrl ? (
                    <ListingMedia
                      src={user.avatarUrl}
                      alt={user.fullName}
                      label={user.fullName}
                      imgClassName="h-full w-full object-cover"
                    />
                  ) : (
                    user.fullName.charAt(0)
                  )}
                </div>
                <div className="min-w-0 max-w-14 text-left xl:max-w-none">
                  <span className="block truncate text-xs font-bold leading-tight text-brand-900">
                    {user.fullName.split(' ')[0]}
                  </span>
                  <span className="block truncate text-[10px] font-medium leading-tight text-brand-600">
                    {roleLabel}
                  </span>
                </div>
              </Link>
              </>
            ) : authLoading ? (
              // The stored session is still being restored (page refresh), so a
              // signed-in visitor would otherwise see লগইন / রেজিস্ট্রেশন flash
              // for a moment before their avatar resolves. This placeholder
              // holds the same footprint until `isLoading` clears, which keeps
              // the swap flicker-free in both directions.
              <div
                aria-hidden="true"
                className="h-10 w-32 animate-pulse rounded-xl bg-brand-100/60 motion-reduce:animate-none xl:h-11 xl:w-[260px]"
              />
            ) : (
              <>
                <Link
                  href="/login"
                className="inline-flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-xl border border-brand-300 px-2.5 py-2 text-xs font-semibold text-brand-800 transition-colors hover:bg-brand-100/60 xl:min-h-[44px] xl:gap-2 xl:px-4 xl:py-2.5 xl:text-sm"
              >
                  লগইন
                </Link>
                <Link
                  href="/register"
                  className="inline-flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-xl bg-accent-400 px-2.5 py-2 text-xs font-bold text-brand-900 shadow-sm transition-all hover:bg-accent-500 active:scale-[0.98] xl:min-h-[44px] xl:gap-2 xl:px-4 xl:py-2.5 xl:text-sm"
                >
                  রেজিস্ট্রেশন
                </Link>
              </>
            )}
          </div>

          {/* Mobile account action — navigation opens from the bottom bar. */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              aria-label={searchOpen ? 'সার্চ বন্ধ করুন' : 'সেবা খুঁজুন'}
              aria-expanded={searchOpen}
              aria-controls="navbar-search"
              onClick={() => setSearchOpen((current) => !current)}
              className={`flex h-10 w-10 items-center justify-center ${iconBtn}`}
            >
              {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
            </button>
            {user && !isAdmin ? (
              <>
                <NotificationBell />
                <PostMenuButton compact />
              </>
            ) : user && isAdmin ? (
              <Link
                href="/admin"
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-brand-700 px-2.5 text-[11px] font-bold text-white"
              >
                <UserRound className="h-4 w-4" aria-hidden="true" />
                অ্যাডমিন
              </Link>
            ) : authLoading ? (
              <span aria-hidden="true" className="h-10 w-20 animate-pulse rounded-lg bg-brand-100/60" />
            ) : (
              <div className="flex items-center gap-1.5">
                <Link
                  href="/login"
                  className="inline-flex min-h-10 items-center rounded-lg border border-brand-700 bg-brand-700 px-2.5 text-[11px] font-bold text-white transition-colors hover:bg-brand-800"
                >
                  লগইন
                </Link>
                <Link
                  href="/register"
                  className="inline-flex min-h-10 items-center rounded-lg bg-accent-400 px-2.5 text-[11px] font-bold text-brand-900 transition-colors hover:bg-accent-500"
                >
                  রেজিস্ট্রেশন
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      {searchOpen && (
        <div id="navbar-search" className="border-t border-brand-100/70 px-4 py-2.5 sm:px-6 lg:px-8">
          <form
            role="search"
            onSubmit={submitSearch}
            className="mx-auto flex h-11 w-full max-w-7xl items-center gap-2 rounded-xl border border-brand-100 bg-white px-3 shadow-sm focus-within:border-brand-400"
          >
            <Search className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
            <input
              type="search"
              autoFocus
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="সেবা খুঁজুন"
              aria-label="সেবা খুঁজুন"
              className="h-full min-w-0 flex-1 bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400"
            />
            <button
              type="submit"
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-accent-400 px-3 text-sm font-bold text-brand-900 transition-colors hover:bg-accent-500 sm:min-h-8"
            >
              খুঁজুন
            </button>
          </form>
        </div>
      )}

    </header>
    </>
  );
}