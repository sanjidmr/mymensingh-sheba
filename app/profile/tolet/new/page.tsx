'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { createListing, uploadListingPhotos } from '@/lib/tolet-service';
import type { ToletListingInput } from '@/lib/tolet-types';
import { ToletListingForm } from '@/components/tolet/ToletListingForm';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function NewToletListingPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

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
    const result = await createListing(
      user.id,
      user.fullName,
      user.isVerified,
      input,
      draft ? 'draft' : 'submit'
    );
    return { success: result.success, error: result.error };
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
          <p className="mt-1">
            {user.fullName} <span className="mx-1 text-ink-300">•</span> {user.phone}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-ink-500">
            এই প্রোফাইলের নাম ও ফোন বিজ্ঞাপনের মালিক হিসেবে সংযুক্ত থাকবে। ফোন নম্বর ওয়েবসাইটে লেখা হিসেবে
            দেখানো হবে না; অনুমোদিত বিজ্ঞাপনের “কল করুন” বোতাম থেকে সরাসরি ডায়াল করা যাবে।
          </p>
        </div>

        <ToletListingForm
          mode="owner"
          onUploadFile={handleUploadFile}
          onSubmit={handleSubmit}
          onDone={(action) =>
            router.replace(action === 'draft_saved' ? '/profile/tolet?draft=1' : '/profile/tolet?created=1')
          }
        />
      </main>
      <Footer />
    </div>
  );
}
