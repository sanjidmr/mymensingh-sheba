'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import {
  fetchListingById,
  updateListingOwned,
  uploadListingPhotos,
} from '@/lib/tolet-service';
import type { ToletListing, ToletListingInput } from '@/lib/tolet-types';
import { ToletWizardForm } from '@/components/tolet/ToletWizardForm';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface EditToletListingPageProps {
  params: Promise<{ id: string }>;
}

export default function EditToletListingPage({ params }: EditToletListingPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [listing, setListing] = useState<ToletListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const data = await fetchListingById(id);
      if (!active) return;
      if (!data || data.ownerId !== user.id) {
        setError('এই বিজ্ঞাপনটি সম্পাদনার অনুমতি নেই বা পাওয়া যায়নি।');
      } else {
        setListing(data);
      }
      setLoading(false);
    })().catch(() => {
      if (!active) return;
      setLoading(false);
      setError('তথ্য লোড করতে সমস্যা হয়েছে।');
    });
    return () => {
      active = false;
    };
  }, [id, user]);

  if (isLoading || !user || loading) {
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

  if (error || !listing) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FBFDFB]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-sm w-full">
            <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <h2 className="text-base font-bold text-slate-900 mb-2">সম্পাদনা সম্ভব নয়</h2>
            <p className="text-xs text-slate-600 mb-5">{error}</p>
            <Link
              href="/profile/tolet"
              className="inline-block px-4 py-2.5 rounded-xl bg-emerald-800 text-white text-xs font-semibold"
            >
              মাই প্রপার্টিজে ফিরে যান
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleUploadFile = async (file: File): Promise<string> => {
    const result = await uploadListingPhotos(listing.ownerId, [file], `edit-${listing.id}`);
    if (!result.success || !result.urls || result.urls.length === 0) {
      throw new Error(result.error || 'ছবি আপলোড ব্যর্থ হয়েছে');
    }
    return result.urls[0];
  };

  const handleSubmit = async (input: ToletListingInput, draft: boolean) => {
    const result = await updateListingOwned(
      listing.id,
      user.id,
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
          <span className="text-slate-800 font-semibold">বিজ্ঞাপন সম্পাদনা</span>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">বিজ্ঞাপন সম্পাদনা</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            তথ্য হালনাগাদ করুন এবং সংরক্ষণ করুন।
          </p>
        </div>

        <ToletWizardForm
          mode="owner"
          ownerId={user.id}
          ownerName={listing.ownerName || user.fullName}
          ownerVerified={listing.ownerVerified || user.isVerified}
          initialListing={listing}
          onUploadFile={handleUploadFile}
          onSubmit={handleSubmit}
          onDone={() => router.replace('/profile/tolet?updated=1')}
        />
      </main>
      <Footer />
    </div>
  );
}