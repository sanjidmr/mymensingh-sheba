'use client';

import React, { useState, useEffect, use } from 'react';
import { useAuth } from '@/lib/auth-context';
import { adminFetchStaffProfileById } from '@/lib/staff-service';
import type { StaffProfile } from '@/lib/staff-types';
import StaffProfileForm from '@/components/admin/StaffProfileForm';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

interface AdminEditStaffProfilePageProps {
  params: Promise<{ id: string }>;
}

export default function AdminEditStaffProfilePage({ params }: AdminEditStaffProfilePageProps) {
  const { id } = use(params);
  const { isAdmin, isLoading } = useAuth();

  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    (async () => {
      const data = await adminFetchStaffProfileById(id);
      if (!active) return;
      if (!data) setError('প্রোফাইল পাওয়া যায়নি।');
      setProfile(data);
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

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FBFDFB]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-sm w-full">
            <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <h2 className="text-base font-bold text-slate-900 mb-2">সম্পাদনা সম্ভব নয়</h2>
            <p className="text-xs text-slate-600 mb-5">{error}</p>
            <Link
              href="/admin/services"
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

  return <StaffProfileForm mode="edit" initialProfile={profile} />;
}