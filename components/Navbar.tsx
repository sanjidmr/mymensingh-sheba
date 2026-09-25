'use client';

import React, { useState } from 'react';
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

/**
 * Solid sticky nav bar — same on every page (homepage included).
 * It never overlays the hero: the bar occupies its own height in normal flow
 * and the hero section starts cleanly below it. Mobile keeps a compact bar:
 * logo/name on the left, hamburger on the right (44px targets).
 */
export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, toletProfile, homeTutorProfile, bloodDonorProfile, isAdmin } = useAuth();

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

  const navLink =
    'text-ink-500 hover:bg-mist-50 hover:text-ink-900';
  const navLinkActive = 'bg-brand-50 font-semibold text-brand-800';
  const iconBtn = 'text-ink-500 hover:bg-mist-50 hover:text-brand-700';

  return (
    <header className="sticky top-0 z-50 border-b border-brand-100 bg-white/95 shadow-sm shadow-brand-900/5 backdrop-blur-md">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3 sm:h-[4.5rem]">
          {/* Logo — image at its natural wide ratio, no background box */}
          <Link
            href="/"
            className="group flex shrink-0 items-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
          >
            <Image
              src="/logo.png"
              alt="Mymensingh Sheba লোগো"
              width={1536}
              height={1024}
              priority
              className="h-9 w-auto transition-transform duration-300 group-hover:scale-105 sm:h-12"
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

          {/* Right actions (desktop) — search / user / primary CTA */}
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

          {/* Mobile — hamburger only (search lives in the hero) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-ink-700 transition-colors hover:bg-mist-50 lg:hidden"
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
          className="relative z-10 max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-brand-100 bg-white px-4 pb-8 pt-3 shadow-lg animate-in slide-in-from-top-2 fade-in duration-200 lg:hidden"
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
              সেবা নিন
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2 border-t border-brand-100 pt-4 text-xs text-ink-500">
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