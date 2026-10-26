'use client';

import React, { useEffect, useId, useState } from 'react';
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
            ? 'inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-accent-400 px-3 text-xs font-extrabold text-brand-950 shadow-sm transition-colors hover:bg-accent-500'
            : 'inline-flex min-h-10 items-center gap-2 rounded-xl bg-accent-400 px-4 text-sm font-bold text-brand-900 transition-colors hover:bg-accent-500'
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
          className="absolute right-0 top-full z-[70] mt-2 w-64 rounded-2xl border border-brand-100 bg-white p-2 shadow-xl"
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
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, toletProfile, homeTutorProfile, bloodDonorProfile, isAdmin, isLoading: authLoading } =
    useAuth();

  // The homepage navbar is transparent at the top and adapts to a soft cream
  // blur after scrolling so content never collides with the links.
  const onHome = pathname === '/';
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
      <MymensinghLiveBar />
      <header
        className={`sticky top-0 z-50 ${
          onHome
            ? scrolled
              ? 'border-b border-brand-100/80 bg-mist-50/90 shadow-sm shadow-brand-900/5 backdrop-blur-md'
              : 'border-b border-transparent bg-transparent'
            : 'border-b border-brand-100/80 bg-white shadow-sm shadow-brand-900/5'
        }`}
      >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3 sm:h-[4.5rem]">
          {/* Brand — the logo alone, filling the navbar height (no tile, no ring) */}
          <Link
            href="/"
            aria-label="Mymensingh Sheba হোম"
            className="group flex h-full shrink-0 items-center rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
          >
            <Image
              src="/logo.png"
              alt="Mymensingh Sheba লোগো"
              width={230}
              height={230}
              priority
              className="h-[52px] w-auto object-contain transition-transform duration-300 group-hover:scale-[1.03] sm:h-full"
            />
          </Link>

          {/* Desktop links */}
          <nav className="hidden items-center gap-1 lg:flex">
            {SITE_NAV_LINKS.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                    active ? navLinkActive : navLink
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right actions (desktop) — search / auth */}
          <div className="hidden items-center gap-2 lg:flex">
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

            {user ? (
              <>
              {!isAdmin && <PostMenuButton />}
              {!isAdmin && <NotificationBell />}
              <Link
                href={isAdmin ? '/admin' : '/profile'}
                aria-label={isAdmin ? 'অ্যাডমিন প্যানেল' : 'আমার প্রোফাইল'}
                className="flex items-center gap-2 rounded-xl border border-brand-200 bg-white py-1.5 pl-1.5 pr-3 transition-colors hover:bg-brand-100/40"
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
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold leading-tight text-brand-900">
                    {user.fullName.split(' ')[0]}
                  </span>
                  <span className="text-[10px] font-medium leading-tight text-brand-600">
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
                className="h-11 w-[260px] animate-pulse rounded-xl bg-brand-100/60 motion-reduce:animate-none"
              />
            ) : (
              <>
                <Link
                  href="/login"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-brand-300 px-4 py-2.5 text-sm font-semibold text-brand-800 transition-colors hover:bg-brand-100/60"
              >
                  লগইন
                </Link>
                <Link
                  href="/register"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-accent-400 px-4 py-2.5 text-sm font-bold text-brand-900 shadow-sm transition-all hover:bg-accent-500 active:scale-[0.98]"
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
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-brand-700 px-3 text-xs font-bold text-white"
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
                  className="inline-flex min-h-10 items-center rounded-lg border border-brand-300 px-2.5 text-[11px] font-bold text-brand-800 transition-colors hover:bg-brand-50"
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
              className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg bg-accent-400 px-3 text-sm font-bold text-brand-900 transition-colors hover:bg-accent-500"
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