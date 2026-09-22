'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Home,
  SlidersHorizontal,
  Bell,
  Sparkles,
  Phone,
  CheckCircle2,
  Trash2,
  Send,
  Eye,
  Zap,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { RadioGroup } from '@/components/ui/Radio';
import { FileUpload } from '@/components/ui/FileUpload';
import { LocationSelector } from '@/components/ui/LocationSelector';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterDrawer } from '@/components/ui/FilterDrawer';
import { Modal } from '@/components/ui/Modal';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Toast } from '@/components/ui/Toast';
import { ServiceCategoryCard } from '@/components/ui/cards/ServiceCategoryCard';
import { PropertyToletCard } from '@/components/ui/cards/PropertyToletCard';
import { ProviderPersonCard } from '@/components/ui/cards/ProviderPersonCard';
import { ServiceRequestCard } from '@/components/ui/cards/ServiceRequestCard';
import { MCCArea } from '@/lib/locations';

export default function DesignSystemShowcasePage() {
  if (process.env.NODE_ENV !== 'development') {
    notFound();
  }
  // Interactive state tests
  const [btnLoading, setBtnLoading] = useState(false);
  const [selectedArea, setSelectedArea] = useState<MCCArea | null>(null);
  const [searchVal, setSearchVal] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(
    'আপনার Request সফলভাবে পাঠানো হয়েছে'
  );
  const [radioVal, setRadioVal] = useState('flat');
  const [checkboxVal, setCheckboxVal] = useState(true);

  return (
    <div className="min-h-screen bg-[#FBFDFB] text-slate-900 pb-20">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 -ml-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>হোমপেইজে যান</span>
            </Link>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-700" />
              <h1 className="text-sm sm:text-base font-bold text-slate-900">
                Mymensingh Sheba — Design System
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 hidden sm:inline">
              মোবাইল-ফার্স্ট প্রিভিউ
            </span>
            <Badge variant="verified" size="sm">
              v1.0 Ready
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-12">
        {/* Intro */}
        <section className="bg-emerald-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="max-w-2xl space-y-3">
            <span className="px-3 py-1 rounded-full bg-emerald-800 text-emerald-100 text-xs font-semibold inline-block">
              UI/UX আর্কিটেকচার ও ডিজাইন টোকেন
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              ময়মনসিংহ সেবা — শেয়ার্ড ইউজার ইন্টারফেস কম্পোনেন্ট
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
              স্বচ্ছ গ্রিন ও হোয়াইট ব্র্যান্ড আইডেন্টিটি, ময়মনসিংহ সিটি কর্পোরেশন এলাকা কেন্দ্রীক লোকেশন ডাটা এবং সহজবোধ্য বাংলা কপির সমন্বয়ে তৈরি রিউজেবল কম্পোনেন্ট লাইব্রেরি।
            </p>
          </div>
        </section>

        {/* 1. Buttons System */}
        <section className="space-y-4">
          <div className="border-b border-slate-200 pb-2">
            <h3 className="text-lg font-bold text-slate-900">
              ১. বাটন সিস্টেম (Button Variants & States)
            </h3>
            <p className="text-xs text-slate-500">
              টাচ টার্গেট নিয়মাবলী: মোবাইলে সর্বনিম্ন ৪৪px উচ্চতা, দৃশ্যমান ফোকাস রিং ও অ্যাক্টিভ প্রেস স্টেট।
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5">
            <div>
              <span className="text-xs font-semibold text-slate-500 block mb-2">
                ভ্যারিয়েন্টসমূহ (Variants):
              </span>
              <div className="flex flex-wrap gap-3 items-center">
                <Button variant="primary">Primary (দেখুন)</Button>
                <Button variant="secondary">Secondary (ফিল্টার)</Button>
                <Button variant="outline">Outline (ফিরে যান)</Button>
                <Button variant="ghost">Ghost বাটন</Button>
                <Button variant="success">Success (অনুমোদিত)</Button>
                <Button variant="danger">Danger (বাতিল)</Button>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-500 block mb-2">
                আকার (Sizes):
              </span>
              <div className="flex flex-wrap gap-3 items-center">
                <Button size="sm">Small (sm)</Button>
                <Button size="md">Medium (md, 44px)</Button>
                <Button size="lg">Large (lg, 48px)</Button>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-500 block mb-2">
                স্টেট ও আইকন (States & Icons):
              </span>
              <div className="flex flex-wrap gap-3 items-center">
                <Button
                  leftIcon={<Send className="w-4 h-4" />}
                  onClick={() => {
                    setBtnLoading(true);
                    setTimeout(() => setBtnLoading(false), 2000);
                  }}
                  isLoading={btnLoading}
                >
                  Request পাঠান (ক্লিক করুন)
                </Button>
                <Button disabled>Disabled বাটন</Button>
                <Button variant="outline" rightIcon={<ArrowLeft className="w-4 h-4 rotate-180" />}>
                  পরবর্তী ধাপ
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Badges & Avatars */}
        <section className="space-y-4">
          <div className="border-b border-slate-200 pb-2">
            <h3 className="text-lg font-bold text-slate-900">
              ২. ব্যাজ ও প্রোফাইল এভাটার (Badges & Avatars)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Badges */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <h4 className="text-sm font-bold text-slate-800 mb-2">ব্যাজ ভ্যারিয়েন্ট:</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="verified">✓ ভেরিফাইড</Badge>
                <Badge variant="available">অন ডিউটি / উপলব্ধ</Badge>
                <Badge variant="new">নতুন সেবা</Badge>
                <Badge variant="featured">পছন্দসই</Badge>
                <Badge variant="pending">অপেক্ষমান</Badge>
                <Badge variant="completed">সম্পন্ন</Badge>
                <Badge variant="closed">বুকড / বন্ধ</Badge>
                <Badge variant="emergency">জরুরি রক্ত প্রয়োজন</Badge>
              </div>
            </div>

            {/* Avatars */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <h4 className="text-sm font-bold text-slate-800 mb-2">এভাটার ও ভেরিফিকেশন টিক:</h4>
              <div className="flex items-center gap-3 flex-wrap">
                <Avatar name="তানভীর আহমেদ" size="sm" isVerified />
                <Avatar name="সাদিয়া তাসনিম" size="md" isVerified />
                <Avatar name="মো. রফিকুল ইসলাম" size="lg" isVerified isAvailable />
                <Avatar name="ডাক্তার শাহেদ" size="xl" isVerified />
              </div>
              <p className="text-xs text-slate-500">
                ছবি না থাকলে স্বয়ংক্রিয়ভাবে বাংলা/ইংরেজি নামের আদ্যক্ষর (Initials) জেনারেট করে।
              </p>
            </div>
          </div>
        </section>

        {/* 3. Form System */}
        <section className="space-y-4">
          <div className="border-b border-slate-200 pb-2">
            <h3 className="text-lg font-bold text-slate-900">
              ৩. ফর্ম সিস্টেম (Form Inputs & Validation)
            </h3>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="আপনার পুরো নাম"
                placeholder="যেমন: মুশফিকুর রহমান"
                required
                helperText="জাতীয় পরিচয়পত্র অনুযায়ী নাম লিখুন"
              />

              <Input
                label="মোবাইল নম্বর"
                placeholder="017XX-XXXXXX"
                type="tel"
                required
                leftIcon={<Phone className="w-4 h-4" />}
              />

              <Input
                label="ভ্যালিডেশন এরর স্টেট"
                defaultValue="ভুল তথ্য"
                error="মোবাইল নম্বরটি সঠিক নয়, ১১ সংখ্যার সঠিক নম্বর দিন"
              />

              <Select
                label="সেবার ধরন"
                placeholder="সেবা বাছাই করুন"
                options={[
                  { value: 'tolet', label: 'বাসা ভাড়া / To-Let' },
                  { value: 'bua', label: 'কাজের বুয়া' },
                  { value: 'electrician', label: 'ইলেক্ট্রিশিয়ান' },
                  { value: 'tutor', label: 'গৃহশিক্ষক' },
                  { value: 'moving', label: 'বাসা পাল্টানো' },
                ]}
              />
            </div>

            <Textarea
              label="বিস্তারিত তথ্য / বিশেষ অনুরোধ"
              placeholder="আপনার সমস্যার বিবরণ বা অতিরিক্ত চাহিদা বিস্তারিত লিখুন..."
              rows={3}
              helperText="সর্বোচ্চ ৫০০ অক্ষর"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <RadioGroup
                label="বাসার ধরণ (To-Let ক্যাটাগরি)"
                name="property_type"
                value={radioVal}
                onChange={setRadioVal}
                options={[
                  { value: 'flat', label: 'ফ্যামিলি ফ্ল্যাট', description: 'সম্পূর্ণ ফ্ল্যাট পরিবারের জন্য' },
                  { value: 'mess', label: 'মেস / ব্যাচেলর রুম', description: 'শিক্ষার্থী বা চাকরিজীবীদের জন্য' },
                  { value: 'seat', label: 'সিট ভাড়া', description: 'শেয়ারিং রুমের সিট' },
                ]}
              />

              <div className="space-y-4">
                <Checkbox
                  label="জরুরি ভিত্তিতে প্রয়োজন (২৪ ঘণ্টার মধ্যে)"
                  description="অ্যাডমিন টিম দ্রুততম সময়ে আপনার সাথে যোগাযোগ করবে"
                  checked={checkboxVal}
                  onChange={(e) => setCheckboxVal(e.target.checked)}
                />

                <FileUpload
                  label="প্রেসক্রিপশন বা প্রয়োজনীয় ডকুমেন্টের ছবি"
                  helperText="ডাক্তারের সিলযুক্ত প্রেসক্রিপশন আপলোড করুন (JPG, PNG বা PDF)"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 4. Location Selector & Search Combo */}
        <section className="space-y-4">
          <div className="border-b border-slate-200 pb-2">
            <h3 className="text-lg font-bold text-slate-900">
              ৪. লোকেশন সিলেক্টর ও সার্চ বার (MCC Central Area Picker)
            </h3>
            <p className="text-xs text-slate-500">
              ময়মনসিংহ সিটি কর্পোরেশনের ৩৩টি ওয়ার্ড ও প্রধান এলাকা সমূহের সেন্ট্রাল ম্যাপ ডাটা।
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <LocationSelector
                selectedAreaId={selectedArea?.id}
                onSelectArea={setSelectedArea}
              />

              <div>
                <span className="block text-xs font-semibold text-slate-800 mb-1.5">
                  সার্চ বার (Search Input Component)
                </span>
                <SearchInput
                  value={searchVal}
                  onChange={setSearchVal}
                  selectedLocationName={selectedArea?.nameBn}
                  onLocationClick={() => {}}
                  onSubmit={() => alert(`খোঁজা হচ্ছে: ${searchVal || 'সব সেবা'}`)}
                />
              </div>
            </div>

            {selectedArea && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-center justify-between">
                <div>
                  <strong>নির্বাচিত এলাকা:</strong> {selectedArea.nameBn} (ওয়ার্ড {selectedArea.wardNo}) — {selectedArea.popularFor}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedArea(null)}
                  className="font-bold underline text-emerald-800"
                >
                  মুছুন
                </button>
              </div>
            )}
          </div>
        </section>

        {/* 5. Service Card System */}
        <section className="space-y-4">
          <div className="border-b border-slate-200 pb-2">
            <h3 className="text-lg font-bold text-slate-900">
              ৫. সার্ভিস কার্ড সিস্টেম (Variants A, B, C, D)
            </h3>
          </div>

          <div className="space-y-6">
            {/* Variant A: Category Card */}
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-3">
                Variant A: সেবা ক্যাটাগরি কার্ড (Service Category Card)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <ServiceCategoryCard
                  id="tolet"
                  title="বাসা ভাড়া / To-Let"
                  subtitle="ফ্ল্যাট, মেস, হোস্টেল ও ব্যাচেলর সিট"
                  href="/tolet"
                  icon={<Home className="w-6 h-6" />}
                  badgeText="সক্রিয় বাসা"
                />
                <ServiceCategoryCard
                  id="electrician"
                  title="Electrician"
                  subtitle="শর্ট সার্কিট, ওয়্যারিং ও মোটর মেরামত"
                  href="/electrician"
                  icon={<Zap className="w-6 h-6" />}
                  managedByAdmin
                />
              </div>
            </div>

            {/* Variant B: Property Card */}
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-3">
                Variant B: To-Let প্রোপার্টি কার্ড (স্বচ্ছ ফি হিসাব সহ)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <PropertyToletCard
                  id="sample-1"
                  title="চরপাড়ায় দক্ষিণমুখী ৩ রুমের সুপরিসর ফ্ল্যাট"
                  propertyType="flat"
                  areaBn="চরপাড়া"
                  wardNo="১৪"
                  rentPrice={15000}
                  bedrooms={3}
                  bathrooms={2}
                  sizeSqft={1150}
                  availableFrom="১ মে ২০২৪"
                  imageUrl="https://picsum.photos/seed/tolet1/600/400"
                  isVerified
                />
                <PropertyToletCard
                  id="sample-2"
                  title="সানকিপাড়ায় শিক্ষার্থীদের জন্য ২ সিট বিশিষ্ট রুম"
                  propertyType="seat"
                  areaBn="সানকিপাড়া"
                  wardNo="১৩"
                  rentPrice={2500}
                  bedrooms={1}
                  bathrooms={1}
                  availableFrom="চলতি মাস"
                  imageUrl="https://picsum.photos/seed/tolet2/600/400"
                  isVerified
                />
              </div>
            </div>

            {/* Variant C: Provider Person Card */}
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-3">
                Variant C: প্রোভাইডার / শিক্ষক / টেকনিশিয়ান কার্ড
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <ProviderPersonCard
                  id="tutor-1"
                  name="মো. তানভীর আহমেদ"
                  category="tutor"
                  titleOrSpecialty="গণিত ও পদার্থবিজ্ঞান (৯ম-১২শ শ্রেণি)"
                  institutionOrOrg="বাংলাদেশ কৃষি বিশ্ববিদ্যালয় (BAU)"
                  areaBn="চরপাড়া"
                  wardNo="১৪"
                  experienceYears="৩ বছর অভিজ্ঞতা"
                  rating={4.9}
                  reviewCount={18}
                  hourlyOrMonthlyRate="৳৫,০০০ /মাস"
                  detailHref="/home-tutor/sample-1"
                  isVerified
                />
                <ProviderPersonCard
                  id="blood-1"
                  name="আহমেদ হাসান"
                  category="blood"
                  titleOrSpecialty="স্বেচ্ছাসেবী রক্তদাতা (গোপনীয় নম্বর)"
                  bloodGroup="O+"
                  areaBn="গাঙ্গিনারপাড়"
                  wardNo="১০"
                  lastDonationDate="৩ মাস আগে"
                  detailHref="/blood-donor/sample-1"
                  ctaText="রক্তের রিকোয়েস্ট"
                  isVerified
                />
              </div>
            </div>

            {/* Variant D: Request Result Card */}
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-3">
                Variant D: বুকিং ও রিকোয়েস্ট ট্র্যাকিং কার্ড
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ServiceRequestCard
                  id="REQ-8491"
                  serviceTitle="বাসা পরিবর্তন (পিকআপ ও লেবার টিম)"
                  serviceCategory="বাসা পাল্টানো"
                  areaBn="সানকিপাড়া থেকে চরপাড়া"
                  requestedDate="২২ এপ্রিল ২০২৪"
                  scheduledTime="সকাল ৯:০০"
                  status="confirmed"
                  providerName="আনোয়ার হোসেন (ড্রাইভার) + ২ জন শ্রমিক"
                  estimatedPrice="৳২,৮০০"
                />
                <ServiceRequestCard
                  id="REQ-8492"
                  serviceTitle="সুইচ বোর্ড ওয়্যারিং মেরামত"
                  serviceCategory="ইলেক্ট্রিশিয়ান"
                  areaBn="কাঁচিঝুলি"
                  requestedDate="আজ"
                  status="pending"
                  notes="মূল মিটারের লাইন ফল্ট করছে"
                  onCancel={(id) => alert(`বাতিল করা হয়েছে: ${id}`)}
                />
              </div>
            </div>
          </div>
        </section>

        {/* 6. Filter Drawer / Bottom Sheet & Modals */}
        <section className="space-y-4">
          <div className="border-b border-slate-200 pb-2">
            <h3 className="text-lg font-bold text-slate-900">
              ৬. মডাল, বটম শিট ও ফিল্টার ড্রয়ার (Interaction Patterns)
            </h3>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-wrap gap-3">
            <Button
              variant="secondary"
              leftIcon={<SlidersHorizontal className="w-4 h-4" />}
              onClick={() => setIsFilterOpen(true)}
            >
              ফিল্টার ড্রয়ার টেস্ট করুন
            </Button>

            <Button
              variant="outline"
              leftIcon={<Eye className="w-4 h-4" />}
              onClick={() => setIsModalOpen(true)}
            >
              কনফার্মেশন মডাল টেস্ট করুন
            </Button>

            <Button
              variant="ghost"
              onClick={() => setIsSheetOpen(true)}
            >
              মোবাইল বটম শিট টেস্ট করুন
            </Button>
          </div>

          {/* Filter Drawer */}
          <FilterDrawer
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            onApply={() => alert('ফিল্টার প্রয়োগ করা হয়েছে')}
            onReset={() => alert('ফিল্টার রিসেট করা হয়েছে')}
            activeFilterCount={2}
          >
            <div className="space-y-4 text-left">
              <LocationSelector
                selectedAreaId={selectedArea?.id}
                onSelectArea={setSelectedArea}
              />
              <Select
                label="ভাড়ার সীমা / বাজেট"
                options={[
                  { value: 'all', label: 'সব বাজেট' },
                  { value: '5000', label: '৳৫,০০০ এর নিচে' },
                  { value: '10000', label: '৳৫,০০০ - ৳১০,০০০' },
                  { value: '20000', label: '৳১০,০০০ - ৳২০,০০০' },
                ]}
              />
              <Checkbox label="শুধুমাত্র ভেরিফাইড প্রোপার্টি দেখুন" defaultChecked />
              <Checkbox label="ব্যাচেলর অনুমোদিত" />
            </div>
          </FilterDrawer>

          {/* Modal */}
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="সেবা রিকোয়েস্ট নিশ্চিতকরণ"
            subtitle="অনুরোধটি সরাসরি অ্যাডমিন টিমের কাছে পৌঁছাবে"
            footer={
              <>
                <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                  বাতিল
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setIsModalOpen(false);
                    setToastMessage('আপনার সেবা অনুরোধ সফলভাবে জমা হয়েছে!');
                  }}
                >
                  কনফার্ম করুন
                </Button>
              </>
            }
          >
            <p className="text-xs sm:text-sm text-slate-600">
              আপনি কি নিশ্চিত যে আপনি এই সেবার জন্য আবেদন করতে চান? ময়মনসিংহ সিটি কর্পোরেশন এলাকার নির্ধারিত ফি অনুযায়ী সেবাটি সমন্বয় করা হবে।
            </p>
          </Modal>

          {/* Bottom Sheet */}
          <BottomSheet
            isOpen={isSheetOpen}
            onClose={() => setIsSheetOpen(false)}
            title="দ্রুত যোগাযোগ ও তথ্য"
            subtitle="অ্যাডমিন হেল্পলাইন: সকাল ৮টা - রাত ১০টা"
          >
            <div className="space-y-3 py-2 text-xs sm:text-sm text-slate-700">
              <p>
                জরুরি প্রয়োজনে সরাসরি ময়মনসিংহ সেবা হটলাইনে কল করতে পারেন: <strong>01711-XXXXXX</strong>
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                ময়মনসিংহ সিটি কর্পোরেশন এলাকার বাইরে কোনো অনুরোধ গ্রহণ করা হয় না।
              </div>
            </div>
          </BottomSheet>
        </section>

        {/* 7. Loading, Empty & Error States */}
        <section className="space-y-4">
          <div className="border-b border-slate-200 pb-2">
            <h3 className="text-lg font-bold text-slate-900">
              ৭. লোডিং, এম্পটি ও এরর স্টেট (Polished Human States)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <EmptyState
              type="search"
              actionLabel="ফিল্টার মুছুন"
              onAction={() => alert('ফিল্টার রিসেট করা হয়েছে')}
            />

            <ErrorState
              title="ইন্টারনেট সংযোগ নেই"
              message="আপনার ডিভাইসে নেটওয়ার্ক কানেকশন পরীক্ষা করে আবার চেষ্টা করুন।"
              onRetry={() => alert('পুনরায় চেষ্টা করা হচ্ছে...')}
            />

            <div className="bg-white rounded-3xl border border-slate-200/90 p-4 flex flex-col justify-center">
              <LoadingState label="তালিকা তৈরি করা হচ্ছে..." />
            </div>
          </div>
        </section>

        {/* 8. Toast Notifications */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5">
            <Toast
              variant="success"
              title="সফল হয়েছে"
              message={toastMessage}
              onDismiss={() => setToastMessage(null)}
            />
          </div>
        )}
      </main>
    </div>
  );
}
