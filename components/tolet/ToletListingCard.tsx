'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Bed, Bath, Calendar, Heart, ShieldCheck } from 'lucide-react';
import { calculateToletFee } from '@/lib/tolet-fees';
import type { ToletListing } from '@/lib/tolet-types';
import { TOLET_PROPERTY_TYPE_INFO } from '@/lib/tolet-types';
import { getAreaById } from '@/lib/locations';
import { ListingStatusBadge } from '@/components/tolet/ListingStatusBadge';
import { cn } from '@/lib/utils';

interface ToletListingCardProps {
  listing: ToletListing;
  isFavorite?: boolean;
  onFavoriteToggle?: (id: string, isFav: boolean) => void;
  showStatus?: boolean;
  className?: string;
  compact?: boolean;
}

export function ToletListingCard({
  listing,
  isFavorite = false,
  onFavoriteToggle,
  showStatus = false,
  className,
  compact = false,
}: ToletListingCardProps) {
  const area = getAreaById(listing.areaId);
  const typeInfo = TOLET_PROPERTY_TYPE_INFO[listing.propertyType];
  const coverPhoto = listing.photos[0] || '';
  const isMessLike = typeInfo?.isMessLike ?? false;
  const platformFee = calculateToletFee(listing.rentPrice, listing.propertyType);
  const totalRent = listing.rentPrice + platformFee;

  const handleHeartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFavoriteToggle?.(listing.id, !isFavorite);
  };

  const showVerified = listing.isVerified && listing.status === 'approved';

  return (
    <div
      className={cn(
        'group bg-white rounded-2xl border border-slate-200/90 overflow-hidden hover:border-emerald-700/60 hover:shadow-md transition-all duration-150 flex flex-col',
        className
      )}
    >
      {/* Media */}
      <div className="relative aspect-16/10 w-full bg-slate-100 overflow-hidden">
        {coverPhoto ? (
          <Image
            src={coverPhoto}
            alt={listing.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-102 transition-transform duration-200"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-emerald-950/5 text-emerald-800">
            <span className="text-xs font-semibold">{typeInfo?.labelBn || 'বাসা ভাড়া'}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleHeartClick}
          className="absolute top-2.5 right-2.5 w-9 h-9 rounded-full bg-white/95 backdrop-blur-xs text-slate-700 hover:text-rose-600 flex items-center justify-center shadow-xs transition-colors z-10"
          aria-label={isFavorite ? 'সংরক্ষণ তালিকা থেকে সরান' : 'সংরক্ষণ করুন'}
        >
          <Heart
            className={cn('w-4 h-4 transition-colors', isFavorite && 'fill-rose-600 text-rose-600')}
          />
        </button>

        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1 z-10">
          <span className="px-2 py-0.5 rounded-md bg-white/95 backdrop-blur-xs text-slate-800 text-[11px] font-bold shadow-2xs">
            {typeInfo?.labelBn || listing.propertyType}
          </span>
          {showStatus && listing.status !== 'approved' && (
            <ListingStatusBadge status={listing.status} />
          )}
          {showVerified && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-800 text-white text-[10px] font-semibold">
              <ShieldCheck className="w-3 h-3" />
              যাচাইকৃত
            </span>
          )}
        </div>

        {listing.availableFrom && (
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-900/80 text-white text-[11px] font-medium backdrop-blur-xs">
            উপলব্ধ: {listing.availableFrom}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="font-semibold text-slate-700">{area?.nameBn || listing.areaId}</span>
            {area?.wardNo && <span>• ওয়ার্ড {area.wardNo}</span>}
          </div>

          <Link
            href={`/tolet/${listing.id}`}
            className="block group-hover:text-emerald-900 transition-colors"
          >
            <h3 className={cn('font-bold text-slate-900 leading-snug', compact ? 'text-sm line-clamp-1' : 'text-base line-clamp-2')}>
              {listing.title}
            </h3>
          </Link>

          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{listing.specificAddress}</p>

          <div className="flex items-center gap-3 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100">
            {!isMessLike && (
              <span className="inline-flex items-center gap-1">
                <Bed className="w-3.5 h-3.5 text-slate-400" />
                <span>{listing.bedrooms} বেড</span>
              </span>
            )}
            {listing.bathrooms > 0 && !isMessLike && (
              <span className="inline-flex items-center gap-1">
                <Bath className="w-3.5 h-3.5 text-slate-400" />
                <span>{listing.bathrooms} বাথ</span>
              </span>
            )}
            {isMessLike && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{listing.availableFrom || 'যেকোনো সময়'}</span>
              </span>
            )}
          </div>
        </div>

        {/* Transparent Price & Fee Breakdown */}
        <div className="mt-4 pt-3 border-t border-slate-100 bg-slate-50/70 -mx-4 -mb-4 p-3.5 rounded-b-2xl">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>ভাড়া: ৳{listing.rentPrice.toLocaleString('bn-BD')}</span>
            <span>ফি: +৳{platformFee}</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-500 block">মোট ভাড়া:</span>
              <span className="text-base font-black text-slate-900">
                ৳{totalRent.toLocaleString('bn-BD')}
              </span>
              <span className="text-[11px] text-slate-500"> /মাস</span>
            </div>

            <Link
              href={`/tolet/${listing.id}`}
              className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-2xs transition-colors"
            >
              বিস্তারিত দেখুন
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}