'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { createListing, uploadListingPhotos } from '@/lib/tolet-service';
import type { ToletListing, ToletListingInput } from '@/lib/tolet-types';
import { normalizeBdPhone } from '@/lib/contact-types';
import { ToletListingForm } from '@/components/tolet/ToletListingForm';
import { calculateToletFee, loadToletFeeRules } from '@/lib/tolet-fees';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { toBengaliDigits } from '@/lib/bengali-numerals';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

function formatTaka(amount: number): string {
  return `৳${toBengaliDigits(amount.toLocaleString('en-US'))}`;
}

export default function NewToletListingPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [createdPost, setCreatedPost] = React.useState<{
    listing: ToletListing;
    platformFee: number;
  } | null>(null);
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
      if (!draft && isSupabaseConfigured) {
        await loadToletFeeRules();
      }

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
        setCreatedPost({
          listing: result.listing,
          platformFee: calculateToletFee(result.listing.rentPrice, result.listing.propertyType),
        });
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'পোস্ট জমা দিতে ব্যর্থ হয়েছে।',
      };
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-mist-50">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 sm:py-12">
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

        <div className="mb-5 rounded-xl border border-brand-100 bg-white px-4 py-3 text-xs text-ink-600">
          <p className="font-semibold text-ink-800">মালিকের পরিচিতি</p>
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
          <p className="mt-2 text-[11px] leading-relaxed text-ink-500">
            এই নাম ও ফোন বিজ্ঞাপনের মালিক হিসেবে সংযুক্ত থাকবে। ফোন নম্বর ওয়েবসাইটে লেখা হিসেবে দেখানো হবে না; অনুমোদিত বিজ্ঞাপনের “কল করুন” বোতাম থেকে সরাসরি ডায়াল করা যাবে।
          </p>
          {!hasValidOwnerPhone && ownerPhoneInput && (
            <p className="mt-1 text-[11px] font-semibold text-rose-700">
              সঠিক ১১-ডিজিটের মোবাইল নম্বর দিন।
            </p>
          )}
        </div>

        {createdPost ? (
          <section
            aria-labelledby="tolet-created-title"
            className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm"
          >
            <div className="bg-emerald-50 px-5 py-6 text-center sm:px-8">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" aria-hidden="true" />
              <h2 id="tolet-created-title" className="mt-3 text-xl font-bold text-emerald-950">
                আপনার বাসা ভাড়ার পোস্ট জমা হয়েছে
              </h2>
              <p className="mt-1 text-sm text-emerald-800">
                যাচাই শেষে বিজ্ঞাপনটি প্রকাশ করা হবে।
              </p>
            </div>
            <div className="space-y-5 p-5 sm:p-8">
              <div className="rounded-xl border border-brand-100 bg-mist-50 p-4">
                <p className="text-xs font-semibold text-ink-500">আপনার পোস্ট আইডি</p>
                <p className="mt-1 break-all font-mono text-lg font-bold text-brand-800">
                  {createdPost.listing.id}
                </p>
                {createdPost.listing.publicId && (
                  <p className="mt-2 text-xs text-ink-500">
                    পোস্ট কোড: <span className="font-semibold text-brand-800">{createdPost.listing.publicId}</span>
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
                <h3 className="font-bold text-amber-950">ভাড়া ও প্ল্যাটফর্ম ফি</h3>
                <p className="mt-2 text-sm leading-7 text-amber-950">
                  ভাড়াটিয়ার কাছ থেকে বাসা ভাড়া {formatTaka(createdPost.listing.rentPrice)} এবং
                  {' '}প্ল্যাটফর্ম ফি {formatTaka(createdPost.platformFee)} সংগ্রহ করুন।
                  প্ল্যাটফর্ম ফি Mymensingh Sheba-কে
                  {' '}<span className="whitespace-nowrap font-bold">01645832896</span> নম্বরে পাঠিয়ে দিন।
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-white/80 p-3">
                    <p className="text-xs text-amber-800">মাসিক ভাড়া</p>
                    <p className="mt-1 font-bold text-amber-950">{formatTaka(createdPost.listing.rentPrice)}</p>
                  </div>
                  <div className="rounded-lg bg-white/80 p-3">
                    <p className="text-xs text-amber-800">প্ল্যাটফর্ম ফি</p>
                    <p className="mt-1 font-bold text-amber-950">{formatTaka(createdPost.platformFee)}</p>
                  </div>
                </div>
              </div>

              <Link
                href="/profile/tolet"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-brand-700 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-800"
              >
                আমার পোস্টগুলো দেখুন
              </Link>
            </div>
          </section>
        ) : (
          <ToletListingForm
            mode="owner"
            onUploadFile={handleUploadFile}
            onSubmit={handleSubmit}
            onDone={(action) => {
              if (action === 'draft_saved') router.replace('/profile/tolet?draft=1');
            }}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}
