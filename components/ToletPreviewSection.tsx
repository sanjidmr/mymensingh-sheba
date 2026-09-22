'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin,
  Bed,
  Bath,
  Calendar,
  Heart,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Info,
} from 'lucide-react';
import { SAMPLE_TOLET_LISTINGS, SampleToletListing } from '@/lib/services-data';

export default function ToletPreviewSection() {
  const [filterType, setFilterType] = useState<string>('all');
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredListings = SAMPLE_TOLET_LISTINGS.filter((item) => {
    if (filterType === 'all') return true;
    if (filterType === 'family') return item.propertyType === 'family' || item.propertyType === 'flat';
    if (filterType === 'bachelor') return item.propertyType === 'seat' || item.propertyType === 'mess';
    if (filterType === 'sublet') return item.propertyType === 'sublet';
    return true;
  });

  return (
    <section className="py-14 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with badge and filters */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              <span>মূল সেবা</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              বাসা ভাড়া (To-Let)
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-xl">
              ময়মনসিংহ শহরের চরপাড়া, কাঁচিঝুলি, সানকিপাড়া, নতুন বাজার সহ বিভিন্ন এলাকার ভেরিফাইড ফ্ল্যাট, মেস ও সিট।
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'সকল বাসা' },
              { id: 'family', label: 'ফ্যামিলি ফ্ল্যাট' },
              { id: 'bachelor', label: 'মেস / সিট' },
              { id: 'sublet', label: 'সাবলেট' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                  filterType === tab.id
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.slice(0, 6).map((listing: SampleToletListing) => {
            const isFav = !!favorites[listing.id];

            return (
              <Link
                key={listing.id}
                href={`/tolet/${listing.id}`}
                className="group flex flex-col bg-white rounded-2xl border border-slate-200 hover:border-emerald-700/40 hover:shadow-lg transition-all duration-200 overflow-hidden cursor-pointer"
              >
                {/* Image Container with Badges */}
                <div className="relative aspect-16/10 w-full bg-slate-100 overflow-hidden">
                  <Image
                    src={listing.imageUrl}
                    alt={listing.titleBn}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover group-hover:scale-103 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />

                  {/* Gradient Overlay for text contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                  {/* Top Tags */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                    <span className="px-2.5 py-1 rounded-md bg-white/90 backdrop-blur-xs text-slate-900 text-xs font-semibold shadow-2xs">
                      {listing.propertyTypeLabelBn}
                    </span>
                    {listing.featuredBadge && (
                      <span className="px-2 py-1 rounded-md bg-emerald-800 text-white text-xs font-medium shadow-2xs">
                        {listing.featuredBadge}
                      </span>
                    )}
                  </div>

                  {/* Favorite Button */}
                  <button
                    type="button"
                    onClick={(e) => toggleFavorite(listing.id, e)}
                    className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-xs hover:bg-white text-slate-700 transition-colors shadow-2xs z-10 cursor-pointer"
                    aria-label={isFav ? 'পছন্দ তালিকা থেকে সরান' : 'পছন্দ তালিকায় যুক্ত করুন'}
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        isFav ? 'fill-rose-600 text-rose-600' : 'text-slate-600'
                      }`}
                    />
                  </button>

                  {/* Area Badge bottom-left */}
                  <div className="absolute bottom-3 left-3 text-white flex items-center gap-1.5 text-xs font-medium drop-shadow-sm">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{listing.areaNameBn}</span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Title */}
                    <h3 className="font-bold text-slate-900 text-base sm:text-lg group-hover:text-emerald-800 transition-colors line-clamp-2 leading-snug">
                      {listing.titleBn}
                    </h3>

                    {/* Basic Specifications */}
                    <div className="mt-3 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <Bed className="w-3.5 h-3.5 text-slate-500" />
                        <span>{listing.bedrooms} বেডরুম</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Bath className="w-3.5 h-3.5 text-slate-500" />
                        <span>{listing.bathrooms} বাথ</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{listing.availableFromBn}</span>
                      </div>
                    </div>

                    {/* Facilities pill tags */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {listing.facilitiesBn.slice(0, 3).map((facility, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-normal"
                        >
                          {facility}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Business Rule Price Presentation */}
                  <div className="mt-5 pt-3.5 border-t border-slate-100">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <div className="text-xs text-slate-500">মাসিক ভাড়া:</div>
                        <div className="text-lg sm:text-xl font-bold text-emerald-800">
                          ৳{listing.rentAmount.toLocaleString('bn-BD')}{' '}
                          <span className="text-xs font-normal text-slate-500">/মাস</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                          <span>প্ল্যাটফর্ম ফি:</span>
                          <span className="font-semibold text-slate-700">৳{listing.platformFee}</span>
                        </div>
                        <div className="text-xs font-semibold text-slate-800">
                          মোট: ৳{listing.totalAmount.toLocaleString('bn-BD')}
                        </div>
                      </div>
                    </div>

                    {/* Privacy notice - phone not exposed */}
                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 py-1.5 px-2.5 rounded-lg">
                      <span className="flex items-center gap-1 text-emerald-700 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        মালিকের ফোন নম্বর সুরক্ষিত
                      </span>
                      <span className="text-emerald-800 font-medium group-hover:underline flex items-center gap-0.5">
                        বিস্তারিত দেখুন <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Bottom Call to Action */}
        <div className="mt-10 text-center">
          <Link
            href="/tolet"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm sm:text-base transition-colors shadow-xs"
          >
            <span>সকল বাসা ভাড়া দেখুন (ময়মনসিংহ সিটি)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
