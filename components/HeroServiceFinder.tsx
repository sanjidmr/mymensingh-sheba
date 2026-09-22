'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Home,
  Sparkles,
  Zap,
  Wrench,
  Truck,
  GraduationCap,
  HeartHandshake,
  Search,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import LocationSelectInput from '@/components/LocationSelectInput';

interface ServiceOption {
  id: string;
  nameBn: string;
  category: string;
  route: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SERVICE_OPTIONS: ServiceOption[] = [
  { id: 'tolet', nameBn: 'বাসা ভাড়া (To-Let)', category: 'আবাসন', route: '/tolet', icon: Home },
  { id: 'kajer-bua', nameBn: 'কাজের বুয়া', category: 'গৃহকর্মী', route: '/kajer-bua', icon: Sparkles },
  { id: 'electrician', nameBn: 'Electrician', category: 'মেরামত', route: '/electrician', icon: Zap },
  { id: 'plumber', nameBn: 'Plumber', category: 'মেরামত', route: '/plumber', icon: Wrench },
  { id: 'home-moving', nameBn: 'বাসা পাল্টানো', category: 'শিফটিং', route: '/home-moving', icon: Truck },
  { id: 'home-tutor', nameBn: 'গৃহশিক্ষক', category: 'শিক্ষা', route: '/home-tutor', icon: GraduationCap },
  { id: 'blood-donor', nameBn: 'রক্তদাতা', category: 'জরুরি', route: '/blood-donor', icon: HeartHandshake },
];

export default function HeroServiceFinder() {
  const router = useRouter();
  const [selectedService, setSelectedService] = useState<string>('tolet');
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const serviceObj = SERVICE_OPTIONS.find((s) => s.id === selectedService) || SERVICE_OPTIONS[0];

    // Construct target URL with clean query parameters
    const params = new URLSearchParams();
    if (selectedAreaId) {
      params.append('area', selectedAreaId);
    }
    if (searchQuery.trim()) {
      params.append('q', searchQuery.trim());
    }

    const queryString = params.toString();
    const targetUrl = queryString ? `${serviceObj.route}?${queryString}` : serviceObj.route;
    router.push(targetUrl);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/70 via-white to-white border-b border-slate-100 pt-8 pb-14 sm:pt-12 sm:pb-20">
      {/* Subtle organic background accent */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-0 -ml-16 w-80 h-80 bg-emerald-50/60 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Local Verification Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 text-emerald-900 text-xs sm:text-sm font-medium mb-5 shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          <span>শুধুমাত্র ময়মনসিংহ সিটি কর্পোরেশন এলাকার জন্য (৩৩টি ওয়ার্ড)</span>
        </div>

        {/* Primary Question Headline */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight sm:leading-tight mb-3">
          ময়মনসিংহে আপনার কোন সেবাটি প্রয়োজন?
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-8 font-normal leading-relaxed">
          বাসা ভাড়া, কাজের বুয়া, ইলেক্ট্রিশিয়ান, শিফটিং, গৃহশিক্ষক কিংবা জরুরি রক্তদাতা — সম্পূর্ণ সিটি কর্পোরেশন এলাকার ভেরিফাইড সেবা এক ঠিকানায়।
        </p>

        {/* Central Search Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 p-5 sm:p-7 text-left max-w-4xl mx-auto">
          {/* Step 1: Select Service Tabs */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700">
                ১. সেবা নির্বাচন করুন:
              </label>
              <span className="text-xs text-slate-400">৭টি সেবা উপলব্ধ</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {SERVICE_OPTIONS.map((service) => {
                const Icon = service.icon;
                const isSelected = selectedService === service.id;
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => setSelectedService(service.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-800 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-700/30 font-bold'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center mb-1.5 ${
                        isSelected
                          ? 'bg-emerald-800 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs leading-snug line-clamp-1">
                      {service.nameBn}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Select Area and Find */}
          <form onSubmit={handleSearch} className="pt-5 border-t border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
              {/* MCC Area Selector (Reusable LocationSelectInput) */}
              <div className="md:col-span-6">
                <LocationSelectInput
                  value={selectedAreaId}
                  onChange={(areaId) => setSelectedAreaId(areaId)}
                  label="২. আপনার এলাকা বেছে নিন (ময়মনসিংহ সিটি):"
                  placeholder="এলাকা নির্বাচন করুন (যেমন: চরপাড়া, সানকিপাড়া)..."
                  allowClear={true}
                  size="md"
                />
              </div>

              {/* Optional Keyword Input */}
              <div className="md:col-span-4">
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                  নির্দিষ্ট বিষয় বা নোট (ঐচ্ছিক):
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="যেমন: ২ বেড, ব্যাচেলর, রাত ৯টা..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-all"
                />
              </div>

              {/* Action Button */}
              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xs hover:shadow-sm transition-all active:scale-[0.98] cursor-pointer min-h-[44px]"
                >
                  <Search className="w-4 h-4" />
                  <span>খুঁজুন</span>
                </button>
              </div>
            </div>
          </form>

          {/* Guarantee Badges */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>৩৩টি সাধারণ ওয়ার্ডের কেন্দ্রীয় ডাটাবেজ</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>কোনো গোপন চার্জ নেই</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>নিরাপদ ও ব্যক্তিগত তথ্য সুরক্ষিত</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
