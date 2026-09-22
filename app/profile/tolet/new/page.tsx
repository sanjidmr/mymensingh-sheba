'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { createListing, uploadListingPhotos } from '@/lib/tolet-service';
import type { ToletListingInput } from '@/lib/tolet-types';
import { ToletWizardForm } from '@/components/tolet/ToletWizardForm';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function NewToletListingPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FBFDFB]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center text-sm text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-700 mr-2" />
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
    <div className="min-h-screen flex flex-col bg-[#FBFDFB]">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 sm:py-12">
        <div className="mb-4 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/profile/tolet" className="hover:text-emerald-800 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>মাই প্রপার্টিজ</span>
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">নতুন বিজ্ঞাপন</span>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">নতুন বাসা ভাড়ার বিজ্ঞাপন</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            ধাপে ধাপে তথ্য দিন। জমার পর বিজ্ঞাপনটি যাচাইয়ের অপেক্ষায় থাকবে।
          </p>
        </div>

        <ToletWizardForm
          mode="owner"
          ownerId={user.id}
          ownerName={user.fullName}
          ownerVerified={user.isVerified}
          onUploadFile={handleUploadFile}
          onSubmit={handleSubmit}
          onDone={(action) =>
            router.replace(action === 'draft_saved' ? '/profile/tolet' : '/profile/tolet?created=1')
          }
        />
      </main>
      <Footer />
    </div>
  );
}