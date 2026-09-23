'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  User,
  Search,
  Home,
  LayoutGrid,
  Workflow,
  Info,
  Phone,
  MapPin,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

/** Below this many viewport-pixels the hero is gone and the bar turns solid. */
const HERO_CLEAR = 44;

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [heroBottom, setHeroBottom] = useState(1000);
  const pathname = usePathname();
  const { user, toletProfile, homeTutorProfile, bloodDonorProfile, isAdmin } = useAuth();

  useEffect(() => {
    const measure = () => {
      setScrollY(window.scrollY);
      if (pathname !== '/') return;
      // Pick whichever hero stage is currently visible (mobile vs desktop) —
      // hidden ones report zero height.
      let bottom = 0;
      document.querySelectorAll('[data-hero]').forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.height > 4) bottom = Math.max(bottom, rect.top + rect.height);
      });
      setHeroBottom(bottom);
    };
    measure();
    window.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    const interval = window.setInterval(measure, 1200); // catch late image/font layout shifts
    return () => {
      window.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
      window.clearInterval(interval);
    };
  }, [pathname]);

  // Homepage: the navbar floats transparently over the full-bleed hero image
  // (top never "cut"), then turns into a solid white bar once the hero has
  // scrolled past. On other pages it stays a solid sticky bar.
  const isHome = pathname === '/';
  const navSolid = isHome ? heroBottom <= HERO_CLEAR : true;
  const overHero = isHome && !navSolid;

  const navLinks = [
    { name: 'হোম', href: '/', icon: Home },
    { name: 'সেবা সমূহ', href: '/services', icon: LayoutGrid },
    { name: 'কিভাবে কাজ করে', href: '/#how-it-works', icon: Workflow },
    { name: 'আমাদের সম্পর্কে', href: '/about', icon: Info },
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

  // Over the hero: light text on a dark scrim. Scrolled / other pages: dark text.
  const logoTitle = overHero ? 'text-white' : 'text-ink-900';
  const logoSub = overHero ? 'text-brand-100' : 'text-brand-700';
  const navLink =
    overHero
      ? 'text-white/85 hover:bg-white/10 hover:text-white'
      : 'text-ink-500 hover:bg-mist-50 hover:text-ink-900';
  const navLinkActive =
    overHero ? 'bg-white/20 font-semibold text-white' : 'bg-brand-50 font-semibold text-brand-800';
  const iconBtn =
    overHero ? 'text-white hover:bg-white/10' : 'text-ink-500 hover:bg-mist-50 hover:text-brand-700';
  const materialBtn = overHero
    ? 'text-white hover:bg-white/10'
    : 'text-ink-700 hover:bg-mist-50';

  return (
    <header
      className={
        isHome
          ? `fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
              navSolid ? 'border-b border-brand-100 bg-white/95 shadow-md shadow-brand-900/5 backdrop-blur-md' : 'border-b border-transparent'
            }`
          : 'sticky top-0 z-50 border-b border-brand-100 bg-white/95 shadow-sm shadow-brand-900/5 backdrop-blur-md'
      }
    >
      {/* Legibility scrim over the hero image (homepage only, bar height) */}
      {isHome && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-16 overflow-hidden transition-opacity duration-300 sm:h-[4.5rem]"
          style={{ opacity: overHero ? 1 : 0 }}
        >
          <div className="h-full w-full bg-gradient-to-b from-black/45 via-black/15 to-transparent" />
        </div>
      )}

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3 sm:h-[4.5rem]">
          {/* Logo — compact word mark on small screens (no layout squeeze at 320px) */}
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-2 rounded-lg p-1 pr-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
          >
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-brand-100 transition-transform duration-300 group-hover:scale-105 sm:h-10 sm:w-10">
              <Image
                src="/logo.png"
                alt="Mymensingh Sheba লোগো"
                width={230}
                height={230}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex min-w-0 flex-col">
              <span
                className={`truncate text-[15px] font-extrabold leading-tight tracking-tight transition-colors sm:text-lg ${logoTitle}`}
              >
                Mymensingh Sheba
              </span>
              <span
                className={`hidden text-[11px] font-semibold transition-colors min-[400px]:block ${logoSub}`}
              >
                ময়মনসিংহ সেবা
              </span>
            </div>
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

          {/* Right actions (desktop) */}
          <div className="hidden items-center gap-2 lg:flex">
            <Link
              href="/services"
              aria-label="সেবা খোঁজ"
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${iconBtn}`}
            >
              <Search className="h-5 w-5" />
            </Link>

            {user ? (
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-xl border border-brand-100 bg-mist-50/60 py-1.5 pl-1.5 pr-3 transition-colors hover:bg-brand-50"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-700 text-xs font-bold text-white">
                  {user.fullName.charAt(0)}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold leading-tight text-ink-900">
                    {user.fullName.split(' ')[0]}
                  </span>
                  <span className="text-[10px] font-medium leading-tight text-brand-700">
                    {roleLabel}
                  </span>
                </div>
              </Link>
            ) : (
              <Link
                href="/login"
                aria-label="লগইন"
                className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${iconBtn}`}
              >
                <User className="h-5 w-5" />
              </Link>
            )}

            <Link
              href="/services"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-800 active:scale-[0.98]"
            >
              সেবা নিন
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Mobile actions — compact: logo + search + hamburger (44px targets) */}
          <div className="flex items-center gap-1 lg:hidden">
            <Link
              href="/services"
              aria-label="সেবা খোঁজ"
              className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${materialBtn}`}
            >
              <Search className="h-5 w-5" />
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${materialBtn}`}
              aria-label={mobileMenuOpen ? 'মেনু বন্ধ করুন' : 'মেনু খুলুন'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu"
          className="relative z-10 max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-slate-200 bg-white px-4 pb-8 pt-3 shadow-xl animate-in slide-in-from-top-2 fade-in duration-200 lg:hidden"
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

            <div className="mt-4 flex flex-col gap-2.5 border-t border-slate-100 pt-4">
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
                সেবা নিন
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-4 text-xs text-ink-500">
              <span className="flex items-center gap-1 font-semibold text-brand-800">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                ময়মনসিংহ সিটি কর্পোরেশন
              </span>
              <div className="flex gap-3">
                <Link href="/safety" onClick={() => setMobileMenuOpen(false)} className="hover:underline">
                  নিরাপত্তা
                </Link>
                <Link href="/help" onClick={() => setMobileMenuOpen(false)} className="hover:underline">
                  সহায়তা
                </Link>
              </div>
            </div>
        </div>
      )}
    </header>
  );
}