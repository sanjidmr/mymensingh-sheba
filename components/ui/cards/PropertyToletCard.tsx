'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Heart,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { calculateToletFee } from '@/lib/services-data';
import { cn } from '@/lib/utils';

export interface PropertyToletCardProps {
  id: string;
  title: string;
  propertyType: 'seat' | 'mess' | 'hostel' | 'flat' | 'sublet' | 'family';
  areaBn: string;
  addressLine?: string;
  rentPrice: number;
  bedrooms?: number;
  bathrooms?: number;
  sizeSqft?: number;
  availableFrom?: string;
  imageUrl?: string;
  isVerified?: boolean;
  isFeatured?: boolean;
  isFavoriteInitial?: boolean;
  onFavoriteToggle?: (id: string, isFav: boolean) => void;
  className?: string;
}

export function PropertyToletCard({
  id,
  title,
  propertyType,
  areaBn,
  addressLine,
  rentPrice,
  bedrooms,
  bathrooms,
  sizeSqft,
  availableFrom,
  imageUrl,
  isVerified = true,
  isFeatured = false,
  isFavoriteInitial = false,
  onFavoriteToggle,
  className,
}: PropertyToletCardProps) {
  const [isFavorite, setIsFavorite] = useState(isFavoriteInitial);
  const platformFee = calculateToletFee(rentPrice, propertyType);
  const totalRent = rentPrice + platformFee;

  const handleHeartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !isFavorite;
    setIsFavorite(next);
    onFavoriteToggle?.(id, next);
  };

  return (
    <div
      className={cn(
        'group bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs hover:border-emerald-700/60 hover:shadow-md transition-all duration-150 flex flex-col',
        className
      )}
    >
      {/* Media & Badges */}
      <div className="relative aspect-16/10 w-full bg-slate-100 overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-102 transition-transform duration-200"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-emerald-950/5 text-emerald-800">
            <span className="text-xs font-semibold">Mymensingh Sheba</span>
          </div>
        )}

        {/* Favorite Button */}
        <button
          type="button"
          onClick={handleHeartClick}
          className="absolute top-2.5 right-2.5 w-9 h-9 rounded-full bg-white/95 backdrop-blur-xs text-slate-700 hover:text-rose-600 flex items-center justify-center shadow-xs transition-colors z-10"
          aria-label={isFavorite ? 'সংরক্ষণ তালিকা থেকে সরান' : 'সংরক্ষণ করুন'}
        >
          <Heart
            className={cn(
              'w-4 h-4 transition-colors',
              isFavorite ? 'fill-rose-600 text-rose-600' : ''
            )}
          />
        </button>


      </div>

      {/* Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Location & Title */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="font-semibold text-slate-700">{areaBn}</span>
          </div>

          <Link href={`/tolet/${id}`} className="block group-hover:text-emerald-900 transition-colors">
            <h3 className="font-bold text-slate-900 text-base line-clamp-1">
              {title}
            </h3>
          </Link>

          {addressLine && (
            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
              {addressLine}
            </p>
          )}

          {/* Features Row */}
          <div className="flex items-center gap-3 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100">
            {bedrooms !== undefined && (
              <span className="inline-flex items-center gap-1">
                <Bed className="w-3.5 h-3.5 text-slate-400" />
                <span>{bedrooms} বেড</span>
              </span>
            )}
            {bathrooms !== undefined && (
              <span className="inline-flex items-center gap-1">
                <Bath className="w-3.5 h-3.5 text-slate-400" />
                <span>{bathrooms} বাথ</span>
              </span>
            )}
            {sizeSqft && (
              <span className="inline-flex items-center gap-1">
                <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{sizeSqft} বর্গফুট</span>
              </span>
            )}
          </div>
        </div>

        {/* Transparent Price & Fee Breakdown */}
        <div className="mt-4 pt-3 border-t border-slate-100 bg-slate-50/70 -mx-4 sm:-mx-5 -mb-4 sm:-mb-5 p-3.5 sm:p-4 rounded-b-2xl">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>ভাড়া: ৳{rentPrice.toLocaleString('bn-BD')}</span>
            <span>ফি: +৳{platformFee}</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-500 block">মোট ভাড়া:</span>
              <span className="text-base sm:text-lg font-black text-slate-900">
                ৳{totalRent.toLocaleString('bn-BD')}
              </span>
              <span className="text-[11px] text-slate-500"> /মাস</span>
            </div>

            <Link
              href={`/tolet/${id}`}
              className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-2xs transition-colors"
            >
              বিস্তারিত
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
