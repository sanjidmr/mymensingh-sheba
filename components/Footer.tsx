'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Phone, Mail, ShieldCheck, Facebook, MessageCircle } from 'lucide-react';
import { LAUNCH_SERVICES } from '@/lib/services-data';

export default function Footer() {
  const currentYear = 2026;

  const serviceLinks = LAUNCH_SERVICES.filter(
    (s) => ['tolet', 'kajer-bua', 'electrician', 'plumber', 'home-moving', 'home-tutor', 'blood-donor'].includes(s.slug)
  );

  const companyLinks = [
    { name: 'আমাদের সম্পর্কে', href: '/about' },
    { name: 'কিভাবে কাজ করে', href: '/#how-it-works' },
    { name: 'যোগাযোগ ও ফিডব্যাক', href: '/contact' },
    { name: 'নিরাপত্তা নীতি', href: '/safety' },
  ];

  const supportLinks = [
    { name: 'সাহায্য ও জিজ্ঞাসা', href: '/help' },
    { name: 'প্রাইভেসি পলিসি', href: '/safety' },
    { name: 'ব্যবহারের শর্তাবলী', href: '/safety' },
    { name: 'ইউজার প্রোফাইল', href: '/profile' },
    { name: 'আমার রিকোয়েস্ট', href: '/profile/requests' },
  ];

  return (
    <footer className="border-t border-brand-900 bg-brand-950 text-brand-100/80">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-12 lg:gap-x-8">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-4">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-white/10">
                <Image
                  src="/logo.png"
                  alt="Mymensingh Sheba লোগো"
                  width={230}
                  height={230}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-extrabold tracking-tight text-white">
                  Mymensingh Sheba
                </span>
                <span className="text-xs font-semibold text-brand-300">ময়মনসিংহ সেবা</span>
              </div>
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-brand-100/70">
              ময়মনসিংহ সিটি কর্পোরেশন এলাকার অধিবাসীদের জন্য একটি বিশ্বস্ত স্থানীয় সেবা প্ল্যাটফর্ম —
              বাসা ভাড়া, গৃহকর্মী, মেরামত, গৃহশিক্ষক ও জরুরি রক্তদান এক জায়গায়।
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-brand-100/90">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-300" />
              শুধুমাত্র ময়মনসিংহ সিটি কর্পোরেশনের ৩৩টি ওয়ার্ডে সক্রিয়
            </div>

            <div className="mt-6 space-y-2 text-sm">
              <a href="tel:+8801712345678" className="flex items-center gap-2.5 text-brand-100/70 transition-colors hover:text-white">
                <Phone className="h-4 w-4 text-brand-300" />
                +৮৮০ ১৭XX-XXXXXX
              </a>
              <a href="mailto:help@mymensinghsheba.com" className="flex items-center gap-2.5 text-brand-100/70 transition-colors hover:text-white">
                <Mail className="h-4 w-4 text-brand-300" />
                help@mymensinghsheba.com
              </a>
            </div>

            <div className="mt-6 flex items-center gap-2.5">
              <a
                href="/contact"
                aria-label="Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-brand-100/80 transition-colors hover:bg-brand-700 hover:text-white"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="/contact"
                aria-label="Messenger"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-brand-100/80 transition-colors hover:bg-brand-700 hover:text-white"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* সেবা */}
          <div className="lg:col-span-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white">সেবা</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              {serviceLinks.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/${s.slug}`}
                    className="text-brand-100/70 transition-colors hover:text-white"
                  >
                    {s.nameBn}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* কোম্পানি */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white">কোম্পানি</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              {companyLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-brand-100/70 transition-colors hover:text-white">
                    {l.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* সহায়তা */}
          <div className="col-span-2 lg:col-span-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white">সহায়তা ও অ্যাকাউন্ট</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              {supportLinks.map((l) => (
                <li key={l.name}>
                  <Link href={l.href} className="text-brand-100/70 transition-colors hover:text-white">
                    {l.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-brand-100/60 sm:flex-row">
          <p>© {currentYear} Mymensingh Sheba (ময়মনসিংহ সেবা)। সর্বস্বত্ব সংরক্ষিত।</p>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-brand-300" />
            অ্যাডমিন-যাচাইকৃত স্থানীয় প্ল্যাটফর্ম
          </span>
        </div>
      </div>
    </footer>
  );
}