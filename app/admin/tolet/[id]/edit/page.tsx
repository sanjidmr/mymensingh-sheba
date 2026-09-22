'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { adminFetchListingById, adminUpdateListing, uploadListingPhotos } from '@/lib/tolet-service';
import type { ToletListing, ToletListingInput } from '@/lib/tolet-types';
import { ToletWizardForm } from '@/components/tolet/ToletWizardForm';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface AdminEditToletListingPageProps {
  params: Promise<{ id: string }>;
}

export default function AdminEditToletListingPage({ params }: AdminEditToletListingPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { isAdmin, isLoading } = useAuth();

  const [listing, setListing] = useState<ToletListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    (async () => {
      const data = await adminFetchListingById(id);
      if (!active) return;
      if (!data) setError('বিজ্ঞাপন পাওয়া যায়নি।');
      setListing(data);
      setLoading(false);
    })().catch(() => {
      if (!active) return;
      setLoading(false);
      setError('তথ্য লোড করতে সমস্যা হয়েছে।');
    });
    return () => {
      active = false;
    };
  }, [id, isAdmin]);

  if (isLoading || !isAdmin || loading) {
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
              href="/admin/tolet"
              className="inline-block px-4 py-2.5 rounded-xl bg-emerald-800 text-white text-xs font-semibold"
            >
              তালিকায় ফিরে যান
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleUploadFile = async (file: File): Promise<string> => {
    const result = await uploadListingPhotos(listing.ownerId, [file], `admin-edit-${listing.id}`);
    if (!result.success || !result.urls || result.urls.length === 0) {
      throw new Error(result.error || 'ছবি আপলোড ব্যর্থ হয়েছে');
    }
    return result.urls[0];
  };

  const handleSubmit = async (input: ToletListingInput, draft: boolean) => {
    const patch: Partial<ToletListing> = {
      ...input,
      status: listing.status,
    };
    const result = await adminUpdateListing(listing.id, patch);
    return { success: result.success, error: result.error };
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFDFB]">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 sm:py-12">
        <div className="mb-4 flex items-center gap-2 text-xs text-slate-500">
          <Link href={`/admin/tolet/${listing.id}`} className="hover:text-emerald-800 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>ব্যাক টু রিভিউ</span>
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">সম্পাদনা</span>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">অ্যাডমিন — বিজ্ঞাপন সম্পাদনা</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            সংশোধন করে সংরক্ষণ করুন। বিজ্ঞাপনের অবস্থা অপরিবর্তিত থাকবে।
          </p>
        </div>

        <ToletWizardForm
          mode="admin"
          ownerId={listing.ownerId}
          ownerName={listing.ownerName || ''}
          ownerVerified={listing.ownerVerified || false}
          initialListing={listing}
          onUploadFile={handleUploadFile}
          onSubmit={handleSubmit}
          onDone={() => router.replace(`/admin/tolet/${listing.id}`)}
        />
      </main>
      <Footer />
    </div>
  );
}