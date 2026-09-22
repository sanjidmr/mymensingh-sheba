'use client';

import React from 'react';
import Link from 'next/link';
import { Bookmark, ArrowLeft, Trash2, ExternalLink, Home, GraduationCap, Briefcase } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function SavedPage() {
  const { savedListings, toggleSaveItem } = useAuth();

  const getIcon = (type: string) => {
    switch (type) {
      case 'tolet':
        return <Home className="w-5 h-5 text-emerald-800" />;
      case 'tutor':
        return <GraduationCap className="w-5 h-5 text-emerald-800" />;
      default:
        return <Briefcase className="w-5 h-5 text-emerald-800" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFDFB]">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 sm:py-12">
        <div className="mb-4 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/profile" className="hover:text-emerald-800 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>প্রোফাইলে ফিরে যান</span>
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">পছন্দের বাসা ও সেবা</span>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            পছন্দের তালিকা ({savedListings.length}টি সংরক্ষিত)
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            পরবর্তীতে সহজে পাওয়ার জন্য যে বাসা ও সেবাগুলো আপনি বুকমার্ক করে রেখেছেন
          </p>
        </div>

        {savedListings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Bookmark className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">
              কোনো পছন্দের বাসা বা সেবা সংরক্ষিত নেই
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto mb-5">
              বাসা ভাড়া বা গৃহশিক্ষকের তালিকা দেখার সময় বুকমার্ক বাটনে ক্লিক করে পছন্দ করে রাখুন।
            </p>
            <div className="flex justify-center gap-3">
              <Link
                href="/tolet"
                className="px-4 py-2 rounded-xl bg-emerald-800 text-white text-xs font-semibold hover:bg-emerald-900"
              >
                বাসা ভাড়া দেখুন
              </Link>
              <Link
                href="/home-tutor"
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50"
              >
                শিক্ষক দেখুন
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {savedListings.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                      {getIcon(item.itemType)}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        toggleSaveItem({
                          itemType: item.itemType,
                          title: item.title,
                          areaName: item.areaName,
                          priceOrRate: item.priceOrRate,
                          linkHref: item.linkHref,
                        })
                      }
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    এলাকা: {item.areaName}
                  </p>
                  {item.priceOrRate && (
                    <p className="text-xs font-bold text-emerald-800 mt-1">
                      {item.priceOrRate}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <Link
                    href={item.linkHref}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-50 text-emerald-900 text-xs font-semibold hover:bg-emerald-100 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>বিস্তারিত দেখুন</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
