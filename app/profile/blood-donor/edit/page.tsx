'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function BloodDonorEditRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/profile/blood-donor/setup');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#FBFDFB]">
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-20 text-center text-sm text-slate-500">
        রক্তদাতা প্রোফাইল সম্পাদনা পেজে নিয়ে যাওয়া হচ্ছে...
      </div>
      <Footer />
    </div>
  );
}