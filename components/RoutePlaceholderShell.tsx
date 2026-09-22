'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, ChevronRight, Sparkles } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface RoutePlaceholderShellProps {
  title: string;
  subtitle?: string;
  categoryBadge?: string;
  breadcrumbs: BreadcrumbItem[];
  children?: React.ReactNode;
}

export default function RoutePlaceholderShell({
  title,
  subtitle,
  categoryBadge,
  breadcrumbs,
  children,
}: RoutePlaceholderShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#FBFDFB]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 mb-6">
          <Link href="/" className="hover:text-emerald-800 transition-colors">
            হোম
          </Link>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="hover:text-emerald-800 transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-medium text-slate-800">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>

        {/* Page Header */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 mb-8 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
            {categoryBadge && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                <span>{categoryBadge}</span>
              </span>
            )}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>ময়মনসিংহ সিটি কর্পোরেশন</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {/* Custom Body or Foundation Placeholder */}
        {children ? (
          children
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 sm:p-12 text-center max-w-2xl mx-auto">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto mb-4 font-bold text-lg">
              ম
            </div>
<h3 className="text-lg font-bold text-slate-900 mb-2">
              এই পরিষেবাটি শীঘ্রই চালু হচ্ছে
            </h3>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              রাউট ও পেজের কাঠামো প্রস্তুত। পরবর্তী ধাপে সুনির্দিষ্ট ডেটাবেজ ও ফাংশনালিটি যুক্ত করা হবে।
            </p>
            <div className="flex justify-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-800 text-white text-sm font-medium hover:bg-emerald-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>হোমপেজে ফিরুন</span>
              </Link>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
