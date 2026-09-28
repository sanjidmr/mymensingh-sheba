'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  User,
  Home,
  LayoutGrid,
  Workflow,
  Info,
  Phone,
  ChevronRight,
  ArrowRight,
  Search,
  Landmark,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import MymensinghLiveBar from '@/components/MymensinghLiveBar';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { user, toletProfile, homeTutorProfile, bloodDonorProfile, isAdmin } = useAuth();

  // The homepage navbar is transparent at the top and adapts to a soft cream
  // blur after scrolling so content never collides with the links.
  const onHome = pathname === '/';
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { name: 'হোম', href: '/', icon: Home },
    { name: 'সেবা সমূহ', href: '/services', icon: LayoutGrid },
    { name: 'কিভাবে কাজ করে', href: '/how-it-works', icon: Workflow },
    { name: 'আমাদের সম্পর্কে', href: '/about', icon: Info },
    { name: 'ময়মনসিংহ পরিচিতি', href: '/mymensingh', icon: Landmark },
    { name: 'যোগাযোগ', href: '/contact', icon: Phone },
  ];

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
            {navLinks.map((link) => {
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
            <Link
              href="/services"
              aria-label="সেবা খোঁজ"
              className={`flex h-10 w-10 items-center justify-center ${iconBtn}`}
            >
              <Search className="h-5 w-5" />
            </Link>

            {user ? (
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-xl border border-brand-200 bg-white py-1.5 pl-1.5 pr-3 transition-colors hover:bg-brand-100/40"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-400 text-xs font-bold text-brand-900">
                  {user.fullName.charAt(0)}
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

          {/* Mobile — hamburger only (search lives in the hero) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-brand-900 transition-colors hover:bg-brand-100/60 lg:hidden"
            aria-label={mobileMenuOpen ? 'মেনু বন্ধ করুন' : 'মেনু খুলুন'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu"
          className="relative z-10 max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-brand-700/70 bg-white px-4 pb-8 pt-3 shadow-xl lg:hidden"
        >
          <nav className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between rounded-xl px-3.5 py-3 text-[15px] font-medium transition-colors ${
                    active
                      ? 'bg-brand-50 font-semibold text-brand-800'
                      : 'text-ink-700 hover:bg-mist-50'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${active ? 'text-brand-700' : 'text-ink-400'}`} />
                    {link.name}
                  </span>
                  <ChevronRight className="h-4 w-4 text-ink-400" />
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 flex flex-col gap-2.5 border-t border-brand-100 pt-4">
            {!user && (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-brand-200 bg-white px-4 py-3 text-[15px] font-semibold text-brand-800 hover:bg-brand-50"
              >
                <User className="h-5 w-5" />
                লগইন / রেজিস্ট্রেশন
              </Link>
            )}
            <Link
              href="/services"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-3 text-[15px] font-bold text-white shadow-sm hover:bg-brand-800"
            >
              সেবা সমূহ দেখুন
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-4 flex items-center justify-center gap-4 border-t border-brand-100 pt-3.5 text-xs font-semibold text-ink-500">
            <div className="flex gap-4">
              <Link href="/safety" onClick={() => setMobileMenuOpen(false)} className="text-brand-800 hover:underline">
                নিরাপত্তা
              </Link>
              <Link href="/help" onClick={() => setMobileMenuOpen(false)} className="text-brand-800 hover:underline">
                সহায়তা
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
    </>
  );
}