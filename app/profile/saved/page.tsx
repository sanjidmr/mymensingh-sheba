'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bookmark, ArrowLeft, Trash2, ExternalLink, Home, GraduationCap, Briefcase } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function SavedPage() {
  const { savedListings, savedListingsLoading, savedListingsError, toggleSaveItem } = useAuth();
  const [removingId, setRemovingId] = useState('');
  const [actionError, setActionError] = useState('');

  const categoryLabel = (type: string) => {
    switch (type) {
      case 'tolet': return 'বাসাভাড়ার পোস্ট';
      case 'tutor': return 'গৃহশিক্ষক পোস্ট';
      case 'market': return 'কেনাবেচার পোস্ট';
      case 'service': return 'সেবার পোস্ট';
      default: return 'সংরক্ষিত পোস্ট';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'tolet':
        return <Home className="w-5 h-5 text-brand-700" />;
      case 'tutor':
        return <GraduationCap className="w-5 h-5 text-brand-700" />;
      default:
        return <Briefcase className="w-5 h-5 text-brand-700" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-mist-50">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 sm:py-12">
        <div className="mb-4 flex items-center gap-2 text-xs text-ink-400">
          <Link href="/profile" className="hover:text-brand-700 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>প্রোফাইলে ফিরে যান</span>
          </Link>
          <span>/</span>
          <span className="text-ink-800 font-semibold">পছন্দের বাসা ও সেবা</span>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-ink-900">
            পছন্দের তালিকা ({savedListings.length}টি সংরক্ষিত)
          </h1>
          <p className="text-xs sm:text-sm text-ink-500 mt-0.5">
            পরবর্তীতে সহজে পাওয়ার জন্য যে বাসা ও সেবাগুলো আপনি বুকমার্ক করে রেখেছেন
          </p>
        </div>

        {savedListingsLoading ? (
          <div role="status" className="rounded-2xl border border-brand-100 bg-white p-10 text-center text-sm font-semibold text-ink-600">
            সংরক্ষিত পোস্ট লোড হচ্ছে...
          </div>
        ) : savedListingsError ? (
          <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm font-semibold text-rose-800">
            {savedListingsError}
          </div>
        ) : savedListings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-brand-100 p-12 text-center">
            <Bookmark className="w-12 h-12 text-brand-200 mx-auto mb-3" />
            <h3 className="text-base font-bold text-ink-900">
              কোনো পছন্দের বাসা বা সেবা সংরক্ষিত নেই
            </h3>
            <p className="text-xs text-ink-400 mt-1 max-w-xs mx-auto mb-5">
              বাসা ভাড়া বা গৃহশিক্ষকের তালিকা দেখার সময় বুকমার্ক বাটনে ক্লিক করে পছন্দ করে রাখুন।
            </p>
            <div className="flex justify-center gap-3">
              <Link
                href="/tolet"
                className="px-4 py-2 rounded-xl bg-brand-700 text-white text-xs font-semibold hover:bg-brand-800"
              >
                বাসা ভাড়া দেখুন
              </Link>
              <Link
                href="/home-tutor"
                className="px-4 py-2 rounded-xl border border-brand-100 text-ink-700 text-xs font-medium hover:bg-mist-50"
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
                className="bg-white rounded-2xl border border-brand-100 p-5  hover:border-brand-200 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
                      {getIcon(item.itemType)}
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          setRemovingId(item.id);
                          setActionError('');
                          const result = await toggleSaveItem({
                            itemId: item.itemId,
                            itemType: item.itemType,
                            title: item.title,
                            areaName: item.areaName,
                            priceOrRate: item.priceOrRate,
                            linkHref: item.linkHref,
                          });
                          if (!result.success) setActionError(result.error || 'পোস্ট সরানো যায়নি।');
                        } catch (error) {
                          setActionError(error instanceof Error ? error.message : 'পোস্ট সরানো যায়নি।');
                        } finally {
                          setRemovingId('');
                        }
                      }}
                      disabled={removingId === item.id}
                      className="min-h-10 min-w-10 rounded-lg text-rose-500 hover:bg-rose-50 disabled:opacity-50"
                      title="মুছে ফেলুন"
                      aria-label={`${categoryLabel(item.itemType)} সংরক্ষিত তালিকা থেকে সরান`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-ink-900 line-clamp-2">
                    {item.title || categoryLabel(item.itemType)}
                  </h3>
                  {item.areaName && <p className="text-xs text-ink-400 mt-1">এলাকা: {item.areaName}</p>}
                  {!item.title && item.itemId && <p className="mt-1 text-[11px] text-ink-400">পোস্ট আইডি: {item.itemId}</p>}
                  {item.priceOrRate && (
                    <p className="text-xs font-bold text-brand-700 mt-1">
                      {item.priceOrRate}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-brand-100">
                  <Link
                    href={item.linkHref}
                    className="w-full py-2 px-3 rounded-xl bg-brand-50 text-brand-800 text-xs font-semibold hover:bg-brand-100 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>বিস্তারিত দেখুন</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
        {actionError && <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{actionError}</p>}
      </main>

      <Footer />
    </div>
  );
}
