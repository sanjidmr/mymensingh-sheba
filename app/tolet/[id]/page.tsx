'use client';

import React, { useState, use, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  MapPin,
  Bed,
  Bath,
  Calendar,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Heart,
  Lock,
  Loader2,
  AlertTriangle,
  UserRound,
} from 'lucide-react';
import RoutePlaceholderShell from '@/components/RoutePlaceholderShell';
import { fetchListingById } from '@/lib/tolet-service';
import { calculateToletFee, getToletFeeDescription } from '@/lib/tolet-fees';
import { TOLET_PROPERTY_TYPE_INFO, type ToletListing } from '@/lib/tolet-types';
import { getAreaById } from '@/lib/locations';
import { TOLET_FACILITY_OPTIONS } from '@/lib/filter-definitions';
import { useAuth } from '@/lib/auth-context';
import { RequestSection } from '@/components/tolet/RequestSection';
import { ReportSheet } from '@/components/tolet/ReportSheet';
import { cn } from '@/lib/utils';

interface ToletDetailPageProps {
  params: Promise<{ id: string }>;
}

const facilityLabelMap: Record<string, string> = {};
for (const f of TOLET_FACILITY_OPTIONS) facilityLabelMap[f.id] = f.labelBn;

export default function ToletDetailPage({ params }: ToletDetailPageProps) {
  const resolvedParams = use(params);
  const listingId = resolvedParams.id;
  const { user, isAdmin, savedListings, toggleSaveItem } = useAuth();

  const [listing, setListing] = useState<ToletListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);
  const [guestFav, setGuestFav] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const data = await fetchListingById(listingId);
      if (!active) return;
      setListing(data);
      setLoading(false);
    })().catch(() => {
      if (!active) return;
      setLoading(false);
      setLoadError(true);
    });
    return () => {
      active = false;
    };
  }, [listingId]);

  if (!loading && !loadError) {
    const typed = listing;
    if (!typed) {
      notFound();
    }
    const allowed =
      typed.status === 'approved' || isAdmin || (user && user.id === typed.ownerId);
    if (!allowed) {
      notFound();
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center gap-3 text-slate-500 text-sm">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
        <span>বিজ্ঞাপনের বিবরণ লোড হচ্ছে...</span>
      </div>
    );
  }

  if (loadError || !listing) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-sm text-rose-600 flex flex-col items-center gap-2">
        <AlertTriangle className="w-6 h-6" />
        <span>বিজ্ঞাপন লোড করতে সমস্যা হয়েছে।</span>
        <Link href="/tolet" className="text-emerald-800 font-semibold underline mt-2">
          সব বিজ্ঞাপনে ফিরে যান
        </Link>
      </div>
    );
  }

  const area = getAreaById(listing.areaId);
  const typeInfo = TOLET_PROPERTY_TYPE_INFO[listing.propertyType];
  const photos = listing.photos || [];
  const currentPhoto = photos[activePhoto] || '';
  const isMessLike = typeInfo?.isMessLike ?? false;
  const fee = calculateToletFee(listing.rentPrice, listing.propertyType);
  const total = listing.rentPrice + fee;

  const isFavorite = user
    ? savedListings.some((item) => item.itemType === 'tolet' && item.linkHref === `/tolet/${listing.id}`)
    : guestFav;

  const toggleFavorite = () => {
    const next = !isFavorite;
    if (user) {
      void toggleSaveItem({
        itemType: 'tolet',
        title: listing.title,
        areaName: area?.nameBn || listing.areaId,
        priceOrRate: `৳${listing.rentPrice.toLocaleString('bn-BD')}/মাস`,
        linkHref: `/tolet/${listing.id}`,
      });
    } else {
      setGuestFav(next);
    }
  };

  return (
    <RoutePlaceholderShell
      title={listing.title}
      subtitle={`${area?.nameBn || ''}, ময়মনসিংহ সিটি কর্পোরেশন • ${typeInfo?.labelBn || ''}`}
      categoryBadge="বাসা ভাড়া বিবরণ"
      breadcrumbs={[
        { label: 'বাসা ভাড়া', href: '/tolet' },
        { label: listing.title.slice(0, 24) + '...' },
      ]}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT: Gallery & Details */}
        <div className="lg:col-span-8 space-y-6">
          {/* Gallery */}
          <div className="relative aspect-16/10 w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
            {currentPhoto ? (
              <Image
                src={currentPhoto}
                alt={listing.title}
                fill
                priority
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-emerald-800 text-sm font-semibold">
                ছবি যোগ করা হয়নি
              </div>
            )}
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="px-3 py-1 rounded-lg bg-emerald-800 text-white text-xs font-semibold shadow-xs">
                {typeInfo?.labelBn || listing.propertyType}
              </span>
              {listing.isVerified && listing.status === 'approved' && (
                <span className="px-3 py-1 rounded-lg bg-white/95 text-emerald-900 text-xs font-semibold shadow-xs flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  যাচাইকৃত
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={toggleFavorite}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-white/95 hover:bg-white text-slate-700 transition-colors shadow-xs"
              aria-label="পছন্দ"
            >
              <Heart className={cn('w-5 h-5', isFavorite && 'fill-rose-600 text-rose-600')} />
            </button>
            {photos.length > 1 && (
              <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-slate-900/70 text-white text-[11px] font-medium">
                {activePhoto + 1}/{photos.length}
              </span>
            )}
          </div>

          {photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {photos.map((photo, idx) => (
                <button
                  key={`${photo}-${idx}`}
                  type="button"
                  onClick={() => setActivePhoto(idx)}
                  className={cn(
                    'relative w-20 h-20 shrink-0 rounded-xl overflow-hidden border-2 transition-colors',
                    idx === activePhoto ? 'border-emerald-700' : 'border-transparent opacity-80'
                  )}
                >
                  <Image src={photo} alt={`ছবি ${idx + 1}`} fill sizes="80px" className="object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          )}

          {/* Key Specs */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {isMessLike ? (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 col-span-2">
                <Bed className="w-5 h-5 text-emerald-800 mx-auto mb-1" />
                <div className="text-xs text-slate-500">মোট সিট/শয্যা</div>
                <div className="text-sm font-bold text-slate-900">
                  {listing.totalRooms ?? listing.bedrooms} টি
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <Bed className="w-5 h-5 text-emerald-800 mx-auto mb-1" />
                <div className="text-xs text-slate-500">বেডরুম</div>
                <div className="text-sm font-bold text-slate-900">{listing.bedrooms} টি</div>
              </div>
            )}
            {!isMessLike && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <Bath className="w-5 h-5 text-emerald-800 mx-auto mb-1" />
                <div className="text-xs text-slate-500">বাথরুম</div>
                <div className="text-sm font-bold text-slate-900">{listing.bathrooms} টি</div>
              </div>
            )}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <Layers className="w-5 h-5 text-emerald-800 mx-auto mb-1" />
              <div className="text-xs text-slate-500">তলা</div>
              <div className="text-sm font-bold text-slate-900">{listing.floor || '—'}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <Calendar className="w-5 h-5 text-emerald-800 mx-auto mb-1" />
              <div className="text-xs text-slate-500">প্রাপ্যতা</div>
              <div className="text-sm font-bold text-slate-900">{listing.availableFrom || '—'}</div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-3">বাসার বিস্তারিত বিবরণ</h3>
            <p className="text-slate-600 leading-relaxed text-sm sm:text-base whitespace-pre-line">
              {listing.description}
            </p>

            {listing.facilities.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <h4 className="text-sm font-bold text-slate-900 mb-3">সুযোগ-সুবিধাসমূহ:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {listing.facilities.map((fac, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>{facilityLabelMap[fac] || fac}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 mb-2">অবস্থান ও এলাকা:</h4>
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  {listing.specificAddress} ({area?.nameBn || ''} — ময়মনসিংহ সিটি কর্পোরেশন)
                </span>
              </div>
            </div>

            {(user?.id === listing.ownerId || isAdmin) && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <h4 className="text-sm font-bold text-slate-900 mb-2">সর্বশেষ অবস্থা:</h4>
                <p className="text-xs text-slate-600">
                  {listing.status === 'approved' && 'এই বিজ্ঞাপনটি প্রকাশিত এবং সবার জন্য দৃশ্যমান।'}
                  {listing.status === 'pending_review' && 'এই বিজ্ঞাপনটি যাচাইয়ের অপেক্ষায় রয়েছে।'}
                  {listing.status === 'draft' && 'এই বিজ্ঞাপনটি খসড়া হিসেবে সংরক্ষিত; এখনো প্রকাশ হয়নি।'}
                  {listing.status === 'rejected' && 'এই বিজ্ঞাপনটি প্রত্যাখ্যাত হয়েছে।'}
                  {listing.status === 'suspended' && 'এই বিজ্ঞাপনটি স্থগিত করা হয়েছে।'}
                  {listing.status === 'unavailable' && 'এই বাসা বর্তমানে অনুপলব্ধ।'}
                  {listing.status === 'archived' && 'এই বিজ্ঞাপনটি আর্কাইভ করা হয়েছে।'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Price + Request */}
        <div className="lg:col-span-4 space-y-6">
          {/* Price Breakdown */}
          <div className="bg-white rounded-2xl border border-emerald-800/30 p-6 shadow-xs">
            <div className="text-xs uppercase tracking-wider font-semibold text-emerald-900 mb-1">
              স্বচ্ছ ভাড়া নির্ধারণ হিসাব
            </div>
            <div className="space-y-3 pt-3 border-t border-slate-100 text-sm">
              <div className="flex items-center justify-between text-slate-600">
                <span>মাসিক মূল ভাড়া:</span>
                <span className="font-semibold text-slate-900">৳{listing.rentPrice.toLocaleString('bn-BD')}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>প্ল্যাটফর্ম ফি ({typeInfo?.labelBn || ''}):</span>
                <span className="font-semibold text-slate-900">+ ৳{fee}</span>
              </div>
              <div className="pt-3 border-t border-slate-200 flex items-baseline justify-between">
                <span className="font-bold text-slate-900">সর্বমোট প্রদেয়:</span>
                <span className="text-2xl font-black text-emerald-800">৳{total.toLocaleString('bn-BD')}</span>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-slate-500 leading-normal">{getToletFeeDescription()}।</p>
          </div>

          {/* Safe Contact & Request */}
          <RequestSection listingId={listing.id} user={user} />

          {/* Report */}
          <button
            type="button"
            onClick={() => setReportOpen(true)}
            className="w-full p-3 rounded-xl border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-center gap-1.5 bg-white hover:bg-rose-50 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            এই বিজ্ঞাপনটি রিপোর্ট করুন
          </button>

          {!listing.ownerId.startsWith('demo-') && listing.ownerName && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3">
              <span className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-800 inline-flex items-center justify-center shrink-0">
                <UserRound className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">{listing.ownerName}</div>
                <div className="text-[11px] text-slate-500">
                  {listing.isVerified ? 'যাচাইকৃত বিজ্ঞাপনদাতা' : 'বিজ্ঞাপনদাতা'} • নিরাপদ যোগাযোগ
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ReportSheet
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        listingId={listing.id}
        user={user}
      />
    </RoutePlaceholderShell>
  );
}