'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  MapPin,
  User,
  Search,
  Home,
  Heart,
  Briefcase,
  Info,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, toletProfile, homeTutorProfile, bloodDonorProfile, isAdmin } = useAuth();

  const navLinks = [
    { name: 'সেবাসমূহ', href: '/services', icon: Briefcase },
    { name: 'বাসা ভাড়া', href: '/tolet', icon: Home },
    { name: 'রক্তদাতা', href: '/blood-donor', icon: Heart },
    { name: 'আমাদের সম্পর্কে', href: '/about', icon: Info },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-emerald-900/10 bg-white/95 backdrop-blur-md transition-all">
      {/* Top micro-bar showing local MCC coverage */}
      <div className="bg-emerald-950 text-emerald-100 text-[13px] py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-medium">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>শুধুমাত্র ময়মনসিংহ সিটি কর্পোরেশন এলাকার জন্য</span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-emerald-200/80 text-xs">
            <Link href="/safety" className="hover:text-white transition-colors">
              নিরাপত্তা নীতি
            </Link>
            <span>•</span>
            <Link href="/help" className="hover:text-white transition-colors">
              সহায়তা
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo & Local Identity */}
          <Link
            href="/"
            className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded-lg p-1"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold text-xl shadow-xs group-hover:bg-emerald-700 transition-colors">
              ম
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 text-lg sm:text-xl tracking-tight leading-tight">
                Mymensingh Sheba
              </span>
              <span className="text-xs text-emerald-800 font-medium">
                ময়মনসিংহ সেবা
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'text-emerald-800 bg-emerald-50 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Action & Profile CTA */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Link
                href="/profile"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-200/80 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-950 text-sm font-medium transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-800 text-white text-xs font-bold flex items-center justify-center">
                  {user.fullName.charAt(0)}
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-semibold text-xs leading-tight">
                    {user.fullName.split(' ')[0]}
                  </span>
                  <span className="text-[10px] text-emerald-800">
                    {isAdmin
                      ? 'অ্যাডমিন'
                      : toletProfile
                      ? 'বাসা মালিক'
                      : homeTutorProfile
                      ? 'গৃহশিক্ষক'
                      : bloodDonorProfile
                      ? 'রক্তদাতা'
                      : 'কাস্টমার'}
                  </span>
                </div>
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-slate-700 hover:text-emerald-800 hover:bg-slate-50 transition-colors"
              >
                <User className="w-4 h-4 text-slate-500" />
                <span>লগইন</span>
              </Link>
            )}

            <Link
              href="/services"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm transition-all shadow-xs active:scale-[0.98]"
            >
              <Search className="w-4 h-4" />
              <span>সেবা খুঁজুন</span>
            </Link>
          </div>

          {/* Mobile Menu Trigger Button */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/profile"
              className="p-1.5 text-slate-700 hover:text-emerald-800 rounded-lg hover:bg-slate-50 flex items-center gap-1.5"
              aria-label="Profile"
            >
              {user ? (
                <div className="w-7 h-7 rounded-lg bg-emerald-800 text-white text-xs font-bold flex items-center justify-center">
                  {user.fullName.charAt(0)}
                </div>
              ) : (
                <User className="w-5 h-5" />
              )}
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              aria-label={mobileMenuOpen ? 'মেনু বন্ধ করুন' : 'মেনু খুলুন'}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-1.5 mb-4">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-base font-medium transition-colors ${
                    active
                      ? 'bg-emerald-50 text-emerald-800 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-5 h-5 ${
                        active ? 'text-emerald-700' : 'text-slate-500'
                      }`}
                    />
                    <span>{link.name}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
            {user ? (
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between w-full py-3 px-4 rounded-xl border border-emerald-200 bg-emerald-50/50 text-emerald-950 font-medium text-base hover:bg-emerald-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white text-sm font-bold flex items-center justify-center">
                    {user.fullName.charAt(0)}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-sm leading-tight text-slate-900">
                      {user.fullName}
                    </span>
                    <span className="text-xs text-emerald-800 font-medium">
                      {isAdmin
                        ? 'অ্যাডমিন মডারেটর'
                        : toletProfile
                        ? 'বাসা মালিক প্রোফাইল'
                        : homeTutorProfile
                        ? 'গৃহশিক্ষক প্রোফাইল'
                        : bloodDonorProfile
                        ? 'রক্তদাতা প্রোফাইল'
                        : 'কাস্টমার অ্যাকাউন্ট'}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-emerald-700" />
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border border-slate-200 text-slate-800 font-medium text-base hover:bg-slate-50"
              >
                <User className="w-5 h-5 text-slate-500" />
                <span>লগইন / নতুন অ্যাকাউন্ট</span>
              </Link>
            )}

            <Link
              href="/services"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-emerald-700 text-white font-medium text-base hover:bg-emerald-800 active:scale-[0.99] transition-all shadow-xs"
            >
              <Search className="w-5 h-5" />
              <span>সেবা খুঁজুন</span>
            </Link>
          </div>

          {/* City Corporation Badge & Links */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1 text-emerald-800 font-medium">
              <MapPin className="w-3.5 h-3.5" />
              ময়মনসিংহ সিটি কর্পোরেশন
            </span>
            <div className="flex gap-3">
              <Link
                href="/safety"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:underline"
              >
                নিরাপত্তা
              </Link>
              <Link
                href="/help"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:underline"
              >
                সহায়তা
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
