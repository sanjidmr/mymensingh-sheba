'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, Phone, Mail, ShieldCheck } from 'lucide-react';
import { LAUNCH_SERVICES } from '@/lib/services-data';

export default function Footer() {
  const currentYear = 2026;

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-slate-800 text-sm">
          {/* Brand & Purpose column */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-lg">
                ম
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-white text-lg tracking-tight">
                  Mymensingh Sheba
                </span>
                <span className="text-xs text-emerald-400">
                  ময়মনসিংহ সেবা
                </span>
              </div>
            </Link>

            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-sm">
              ময়মনসিংহ সিটি কর্পোরেশন এলাকার অধিবাসীদের দৈনন্দিন প্রয়োজনীয় সেবা সহজ, নির্ভরযোগ্য ও সুরক্ষিত উপায়ে খুঁজে নেওয়ার স্থানীয় প্ল্যাটফর্ম।
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-emerald-400 font-medium">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>শুধুমাত্র ময়মনসিংহ সিটি কর্পোরেশনের ৩৩টি ওয়ার্ডে সক্রিয়</span>
            </div>
          </div>

          {/* Launch Services links */}
          <div>
            <h4 className="text-xs uppercase tracking-wider font-semibold text-white mb-3">
              সেবাসমূহ
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              {LAUNCH_SERVICES.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/${s.slug}`}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    {s.nameBn}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* User & Provider Profile links */}
          <div>
            <h4 className="text-xs uppercase tracking-wider font-semibold text-white mb-3">
              অ্যাকাউন্ট ও প্রোফাইল
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/profile" className="text-slate-400 hover:text-white transition-colors">
                  ইউজার প্রোফাইল
                </Link>
              </li>
              <li>
                <Link href="/profile/requests" className="text-slate-400 hover:text-white transition-colors">
                  আমার রিকোয়েস্ট
                </Link>
              </li>
              <li>
                <Link href="/profile/saved" className="text-slate-400 hover:text-white transition-colors">
                  পছন্দের তালিকা
                </Link>
              </li>
              <li>
                <Link href="/profile/tolet/new" className="text-slate-400 hover:text-white transition-colors">
                  বাসা ভাড়া দিন (মালিক)
                </Link>
              </li>
              <li>
                <Link href="/profile/home-tutor/setup" className="text-slate-400 hover:text-white transition-colors">
                  গৃহশিক্ষক প্রোফাইল
                </Link>
              </li>
              <li>
                <Link href="/profile/blood-donor/setup" className="text-slate-400 hover:text-white transition-colors">
                  রক্তদাতা হিসেবে নিবন্ধন
                </Link>
              </li>
            </ul>
          </div>

          {/* Help & Safety links */}
          <div>
            <h4 className="text-xs uppercase tracking-wider font-semibold text-white mb-3">
              সহায়তা ও নিরাপত্তা
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/about" className="text-slate-400 hover:text-white transition-colors">
                  আমাদের সম্পর্কে
                </Link>
              </li>
              <li>
                <Link href="/safety" className="text-slate-400 hover:text-white transition-colors">
                  নিরাপত্তা ও প্রাইভেসি নীতি
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-slate-400 hover:text-white transition-colors">
                  সাহায্য ও জিজ্ঞাসা
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-slate-400 hover:text-white transition-colors">
                  যোগাযোগ ও ফিডব্যাক
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright & terms */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {currentYear} Mymensingh Sheba (ময়মনসিংহ সেবা)। সর্বস্বত্ব সংরক্ষিত।</p>
          <div className="flex items-center gap-4">
            <Link href="/safety" className="hover:text-slate-400 transition-colors">
              প্রাইভেসি পলিসি
            </Link>
            <span>•</span>
            <Link href="/safety" className="hover:text-slate-400 transition-colors">
              ব্যবহারের শর্তাবলী
            </Link>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              ভেরিফাইড স্থানীয় প্ল্যাটফর্ম
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
