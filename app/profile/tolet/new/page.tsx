'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Phone } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { createListing, uploadListingPhotos } from '@/lib/tolet-service';
import { getToletAreaById } from '@/lib/tolet-areas';
import {
  TOLET_PROPERTY_TYPE_INFO,
  type ToletListing,
  type ToletListingInput,
} from '@/lib/tolet-types';
import { normalizeBdPhone } from '@/lib/contact-types';
import { ToletListingForm } from '@/components/tolet/ToletListingForm';
import SubmissionConfirmation from '@/components/submissions/SubmissionConfirmation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SectionCard from '@/components/forms/SectionCard';

export default function NewToletListingPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [createdPost, setCreatedPost] = React.useState<ToletListing | null>(null);
  const [ownerPhoneInput, setOwnerPhoneInput] = React.useState(
    (user?.phone || '').replace(/[০-৯]/g, (digit) =>
      String('০১২৩৪৫৬৭৮৯'.indexOf(digit))
    )
  );
  const ownerPhone = normalizeBdPhone(ownerPhoneInput);
  const hasValidOwnerPhone = /^01[3-9]\d{8}$/.test(ownerPhone);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex flex-col bg-mist-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center text-sm text-ink-400">
          <Loader2 className="w-5 h-5 animate-spin text-brand-600 mr-2" />
          লোড হচ্ছে...
        </main>
        <Footer />
      </div>
    );
  }

  const handleUploadFile = async (file: File): Promise<string> => {
    const result = await uploadListingPhotos(user.id, [file], `new-${Date.now()}`);
    if (!result.success || !result.urls || result.urls.length === 0) {
      throw new Error(result.error || 'ছবি আপলোড ব্যর্থ হয়েছে');
    }
    return result.urls[0];
  };

  const handleSubmit = async (input: ToletListingInput, draft: boolean) => {
    if (!hasValidOwnerPhone) {
      const message = 'সঠিক মোবাইল নম্বর দিন।';
      window.alert(message);
      return { success: false, error: message };
    }

    try {
      const result = await createListing(
        user.id,
        user.fullName,
        user.isVerified,
        { ...input, ownerPhone } as ToletListingInput,
        draft ? 'draft' : 'submit'
      );
      if (!result.success || !result.listing) {
        return {
          success: false,
          error: result.error || 'পোস্টের তথ্য পাওয়া যায়নি। আবার চেষ্টা করুন।',
        };
      }

      if (!draft) {
        setCreatedPost(result.listing);
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'পোস্ট জমা দিতে ব্যর্থ হয়েছে।',
      };
    }
  };

  if (createdPost) {
    return (
      <SubmissionConfirmation
        type="post"
        id={createdPost.id}
        summary={[
          `শিরোনাম: ${createdPost.title}`,
          `বাসার ধরন: ${TOLET_PROPERTY_TYPE_INFO[createdPost.propertyType].labelBn}`,
          `এলাকা: ${getToletAreaById(createdPost.areaId)?.nameBn ?? createdPost.areaId}`,
          `ঠিকানা: ${createdPost.specificAddress}`,
          `মাসিক ভাড়া: ৳${createdPost.rentPrice.toLocaleString('bn-BD')}`,
          createdPost.totalRooms != null
            ? `মোট সিট / শয্যা: ${createdPost.totalRooms}`
            : `বেডরুম: ${createdPost.bedrooms} · বাথরুম: ${createdPost.bathrooms} · বারান্দা: ${createdPost.balconies}`,
          createdPost.availableFrom ? `ভাড়া শুরু: ${createdPost.availableFrom}` : '',
          createdPost.facilities.length ? `সুবিধা: ${createdPost.facilities.join(' · ')}` : '',
          createdPost.description ? `বিবরণ: ${createdPost.description}` : '',
        ].filter(Boolean)}
        reminder="বাসা ভাড়া হয়ে গেলে অনুগ্রহ করে পোস্টটি ডিলিট করে দিন।"
        footer
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-mist-50">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-3 py-4 sm:px-4 sm:py-12">
        <div className="mb-4 flex items-center gap-2 text-xs text-ink-400">
          <Link href="/profile/tolet" className="hover:text-brand-700 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>মাই প্রপার্টিজ</span>
          </Link>
          <span>/</span>
          <span className="text-ink-800 font-semibold">নতুন বিজ্ঞাপন</span>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-ink-900">নতুন বাসা ভাড়ার বিজ্ঞাপন</h1>
          <p className="text-xs sm:text-sm text-ink-500 mt-0.5">
            একটি পেজেই সব তথ্য দিন। জমার পর বিজ্ঞাপনটি যাচাইয়ের অপেক্ষায় থাকবে।
          </p>
        </div>

        <SectionCard title="যোগাযোগ" icon={Phone} className="mb-4">
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-ink-700 mb-1">মালিকের নাম</label>
              <input
                type="text"
                defaultValue={user.fullName || ''}
                placeholder="মালিকের নাম লিখুন"
                className="w-full px-3 py-2 rounded-lg border border-brand-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-ink-700 mb-1">মোবাইল নম্বর</label>
              <input
                type="tel"
                inputMode="tel"
                value={ownerPhoneInput}
                onChange={(e) => setOwnerPhoneInput(e.target.value.replace(/[^\d০-৯]/g, ''))}
                placeholder="01XXXXXXXXX"
                className="w-full px-3 py-2 rounded-lg border border-brand-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
          {!hasValidOwnerPhone && ownerPhoneInput && (
            <p className="mt-1 text-[11px] font-semibold text-rose-700">
              সঠিক ১১-ডিজিটের মোবাইল নম্বর দিন।
            </p>
          )}
        </SectionCard>

        <ToletListingForm
          mode="owner"
          onUploadFile={handleUploadFile}
          onSubmit={handleSubmit}
          onDone={(action) => {
            if (action === 'draft_saved') router.replace('/profile/tolet?draft=1');
          }}
        />
      </main>
      <Footer />
    </div>
  );
}
