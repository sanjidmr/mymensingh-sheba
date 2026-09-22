'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Share2,
  Heart,
  MapPin,
  ShieldCheck,
  PhoneCall,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

export interface DetailMetric {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}

export interface DetailPageLayoutProps {
  categoryName: string;
  categoryHref: string;
  title: string;
  areaBn: string;
  wardNo?: string;
  addressDetail?: string;
  isVerified?: boolean;
  metrics?: DetailMetric[];
  mediaGallery?: React.ReactNode;
  description: React.ReactNode;
  features?: string[];
  providerSection?: React.ReactNode;
  safetyNotice?: React.ReactNode;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  primaryActionHref?: string;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  secondaryActionHref?: string;
  isFavorite?: boolean;
  onFavoriteToggle?: () => void;
  relatedItems?: React.ReactNode;
  children?: React.ReactNode;
}

export function DetailPageLayout({
  categoryName,
  categoryHref,
  title,
  areaBn,
  wardNo,
  addressDetail,
  isVerified = true,
  metrics = [],
  mediaGallery,
  description,
  features,
  providerSection,
  safetyNotice,
  primaryActionLabel = 'Request করুন',
  onPrimaryAction,
  primaryActionHref,
  secondaryActionLabel,
  onSecondaryAction,
  secondaryActionHref,
  isFavorite,
  onFavoriteToggle,
  relatedItems,
  children,
}: DetailPageLayoutProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#FBFDFB] pb-24 md:pb-12 text-slate-900">
      {/* Top Breadcrumbs & Back Nav Bar */}
      <div className="bg-white border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="p-2 -ml-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1 text-xs font-semibold"
              aria-label="পূর্ববর্তী পৃষ্ঠায় ফিরে যান"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">ফিরে যান</span>
            </button>

            <span className="text-slate-300">/</span>

            <Link
              href={categoryHref}
              className="text-xs font-semibold text-emerald-800 hover:underline truncate max-w-[140px] sm:max-w-none"
            >
              {categoryName}
            </Link>
          </div>

          <div className="flex items-center gap-1.5">
            {onFavoriteToggle && (
              <button
                type="button"
                onClick={onFavoriteToggle}
                className={cn(
                  'p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors',
                  isFavorite ? 'text-rose-600 bg-rose-50 border-rose-200' : ''
                )}
                aria-label="সেভ করুন"
              >
                <Heart
                  className={cn(
                    'w-4 h-4',
                    isFavorite ? 'fill-rose-600 text-rose-600' : ''
                  )}
                />
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title, url: window.location.href });
                }
              }}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              aria-label="শেয়ার করুন"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left Column (Details, Gallery, Description) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Media Gallery Area */}
            {mediaGallery && (
              <div className="rounded-3xl overflow-hidden border border-slate-200/90 shadow-2xs bg-white">
                {mediaGallery}
              </div>
            )}

            {/* Title & Location Header */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{areaBn}</span>
                  {wardNo && <span>(ওয়ার্ড {wardNo})</span>}
                </span>

                {isVerified && (
                  <Badge variant="verified" size="md">
                    সিটি কর্পোরেশন অনুমোদিত
                  </Badge>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                {title}
              </h1>

              {addressDetail && (
                <p className="text-xs sm:text-sm text-slate-600 flex items-center gap-1.5">
                  <span>ঠিকানা: {addressDetail}</span>
                </p>
              )}

              {/* Metrics Grid */}
              {metrics.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-4 border-t border-slate-100">
                  {metrics.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100"
                    >
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-0.5">
                        {m.icon}
                        <span>{m.label}</span>
                      </div>
                      <div className="text-sm sm:text-base font-bold text-slate-900 truncate">
                        {m.value}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Description Card */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                বিস্তারিত বিবরণ
              </h2>
              <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2">
                {description}
              </div>

              {/* Features Chips */}
              {features && features.length > 0 && (
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    সুবিধাসমূহ / বৈশিষ্ট্য
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {features.map((f, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-900 text-xs font-medium border border-emerald-100"
                      >
                        ✓ {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Extra Injected Children */}
            {children}

            {/* Safety & Local Community Note */}
            <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-3xl p-5 sm:p-6 text-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-800 shrink-0" />
                <span>ময়মনসিংহ সেবা নিরাপত্তা ও সুরক্ষা নিশ্চয়তা</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {safetyNotice ||
                  'এই প্ল্যাটফর্মের প্রতিটি সেবা শুধুমাত্র ময়মনসিংহ সিটি কর্পোরেশন এলাকার মধ্যে কার্যকর। কোনো অগ্রিম অর্থ লেনদেন করার পূর্বে সেবা প্রদানকারী বা বাড়িওয়ালার পরিচয় নিশ্চিত করুন।'}
              </p>
            </div>
          </div>

          {/* Right Column: Desktop Action & Provider Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Desktop Action Box */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
              <h3 className="font-bold text-slate-900 text-base">
                সেবার বুকিং ও যোগাযোগ
              </h3>

              <div className="space-y-2.5">
                {primaryActionHref ? (
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={() => router.push(primaryActionHref)}
                  >
                    {primaryActionLabel}
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={onPrimaryAction}
                  >
                    {primaryActionLabel}
                  </Button>
                )}

                {secondaryActionLabel &&
                  (secondaryActionHref ? (
                    <Button
                      variant="outline"
                      size="md"
                      fullWidth
                      onClick={() => router.push(secondaryActionHref)}
                    >
                      {secondaryActionLabel}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="md"
                      fullWidth
                      onClick={onSecondaryAction}
                    >
                      {secondaryActionLabel}
                    </Button>
                  ))}
              </div>

              <div className="text-[11px] text-slate-400 text-center leading-relaxed">
                🔒 আপনার ব্যক্তিগত মোবাইল নম্বর ও তথ্য সম্পূর্ণ সুরক্ষিত
              </div>
            </div>

            {/* Provider Section */}
            {providerSection && (
              <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs">
                {providerSection}
              </div>
            )}
          </div>
        </div>

        {/* Related Items */}
        {relatedItems && (
          <div className="mt-10 sm:mt-12 pt-8 border-t border-slate-200">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4">
              একই এলাকার আরও সেবা
            </h2>
            {relatedItems}
          </div>
        )}
      </main>

      {/* Mobile Sticky Bottom Action Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 sm:p-4 shadow-lg safe-area-pb">
        <div className="flex items-center gap-2.5 max-w-lg mx-auto">
          {onFavoriteToggle && (
            <button
              type="button"
              onClick={onFavoriteToggle}
              className={cn(
                'h-11 w-11 rounded-xl border border-slate-200 flex items-center justify-center shrink-0 text-slate-700 hover:bg-slate-50',
                isFavorite ? 'text-rose-600 bg-rose-50 border-rose-200' : ''
              )}
              aria-label="সেভ"
            >
              <Heart
                className={cn('w-5 h-5', isFavorite ? 'fill-rose-600' : '')}
              />
            </button>
          )}

          {secondaryActionLabel && (
            <Button
              variant="outline"
              size="md"
              className="flex-1"
              onClick={
                secondaryActionHref
                  ? () => router.push(secondaryActionHref)
                  : onSecondaryAction
              }
            >
              {secondaryActionLabel}
            </Button>
          )}

          <Button
            variant="primary"
            size="md"
            className="flex-2"
            onClick={
              primaryActionHref
                ? () => router.push(primaryActionHref)
                : onPrimaryAction
            }
          >
            {primaryActionLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
