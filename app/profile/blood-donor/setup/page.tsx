'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Heart,
  MapPin,
  Phone,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Lock,
  AlertTriangle,
  Loader2,
  UploadCloud,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { BloodGroup } from '@/lib/supabase/types';
import { MCC_AREAS } from '@/lib/locations';
import { uploadDonorProfilePhoto } from '@/lib/blood-donor-service';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function BloodDonorSetupPage() {
  const router = useRouter();
  const { user, bloodDonorProfile, activateBloodDonorProfile } = useAuth();

  const [fullName, setFullName] = useState(bloodDonorProfile?.fullName || user?.fullName || '');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>(bloodDonorProfile?.bloodGroup || 'O+');
  const [areaId, setAreaId] = useState(bloodDonorProfile?.areaId || user?.primaryAreaId || 'charpara');
  const [gender, setGender] = useState<'male' | 'female'>(bloodDonorProfile?.gender || 'male');
  const [birthYear, setBirthYear] = useState<number>(bloodDonorProfile?.birthYear || 1998);
  const [weightKg, setWeightKg] = useState<number>(bloodDonorProfile?.weightKg || 65);
  const [isAvailable, setIsAvailable] = useState<boolean>(bloodDonorProfile?.isAvailable ?? true);
  const [lastDonationDate, setLastDonationDate] = useState(
    bloodDonorProfile?.lastDonationDate || ''
  );
  const [donationCount, setDonationCount] = useState(bloodDonorProfile?.donationCount || 1);
  const [privatePhone, setPrivatePhone] = useState(
    bloodDonorProfile?.privatePhone || user?.phone || ''
  );
  const [intro, setIntro] = useState(bloodDonorProfile?.intro || '');
  const [profilePhoto, setProfilePhoto] = useState(bloodDonorProfile?.profilePhotoUrl || '');
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [agreePolicy, setAgreePolicy] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePhoto = async (f: File | undefined) => {
    if (!f || !user?.id) return;
    if (!f.type.startsWith('image/') || f.size > 5 * 1024 * 1024) return;
    setPhotoUploading(true);
    const res = await uploadDonorProfilePhoto(user.id, f);
    setPhotoUploading(false);
    if (res.success && res.url) setProfilePhoto(res.url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !privatePhone || !agreePolicy) return;

    setLoading(true);
    await activateBloodDonorProfile({
      fullName,
      bloodGroup,
      areaId,
      gender,
      birthYear: Number(birthYear),
      weightKg: Number(weightKg),
      isAvailable,
      lastDonationDate: lastDonationDate || undefined,
      donationCount: Number(donationCount),
      privatePhone,
      isVerified: false,
      intro: intro.trim() || undefined,
      profilePhotoUrl: profilePhoto || undefined,
    });
    setLoading(false);
    setSuccess(true);
    setTimeout(() => {
      router.push('/profile');
    }, 1200);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFDFB]">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 sm:py-12">
        <div className="mb-4 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/profile" className="hover:text-emerald-800 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>প্রোফাইলে ফিরে যান</span>
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">রক্তদাতা (Blood Donor) প্রোফাইল সেটআপ</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3.5 mb-6 pb-6 border-b border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center shrink-0">
              <Heart className="w-6 h-6 fill-rose-800" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                স্বেচ্ছাসেবক রক্তদাতা নিবন্ধন
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                ময়মনসিংহের কোনো মুমূর্ষু রোগীর প্রয়োজনে রক্ত দিতে নিজেকে তালিকাভুক্ত করুন
              </p>
            </div>
          </div>

          {success && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-rose-700 shrink-0" />
<span className="text-sm font-semibold">
                রক্তদাতা প্রোফাইল জমা হয়েছে! অ্যাডমিন অনুমোদনের পরে সক্রিয় হবে।
              </span>
            </div>
          )}

          {/* Critical Privacy & Anti-Commercialization Banner */}
          <div className="mb-6 p-4 rounded-2xl bg-rose-50/80 border border-rose-200 text-xs text-rose-950 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-rose-900">
              <ShieldCheck className="w-4 h-4 text-rose-700" />
              <span>রক্তদাতা সুরক্ষা ও সম্পূর্ণ অ-বাণিজ্যিক সেবা নীতি</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-rose-900/90 leading-relaxed pl-1">
              <li><strong>ফোন নম্বর সম্পূর্ণ গোপন:</strong> আপনার মোবাইল নম্বর কোনো সাধারণ ইউজার দেখতে পাবে না।</li>
              <li><strong>প্রেসক্রিপশন ভেরিফিকেশন:</strong> শুধুমাত্র হাসপাতাল বা রেজিস্টার্ড ডাক্তারের প্রেসক্রিপশন অ্যাডমিন টিম যাচাই করার পর জরুরি ক্ষেত্রে আপনার সাথে যোগাযোগ সমন্বয় করা হবে।</li>
              <li><strong>রক্ত কেনা-বেচা নিষিদ্ধ:</strong> রক্তদান একটি মানবিক ও সম্পূর্ণ নিঃস্বার্থ সেবা। কোনো ধরনের অর্থ লেনদেন আইনত ও প্ল্যাটফর্মের নীতিমালায় সম্পূর্ণ নিষিদ্ধ।</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Blood Group Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-2">
                আপনার রক্তের গ্রুপ নির্বাচন করুন
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {BLOOD_GROUPS.map((bg) => {
                  const selected = bloodGroup === bg;
                  return (
                    <button
                      type="button"
                      key={bg}
                      onClick={() => setBloodGroup(bg)}
                      className={`py-3 rounded-xl font-bold text-base transition-all border ${
                        selected
                          ? 'bg-rose-700 text-white border-rose-700 shadow-sm scale-102'
                          : 'bg-white text-slate-800 border-slate-200 hover:bg-rose-50'
                      }`}
                    >
                      {bg}
                    </button>
                  );
})}
              </div>
            </div>

            {/* Profile Photo (optional, public) */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-2">
                প্রোফাইল ছবি (ঐচ্ছিক)
              </label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handlePhoto(e.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-slate-300 hover:border-rose-400 w-full bg-slate-50 transition-colors"
              >
                {profilePhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profilePhoto} alt="প্রোফাইল" className="w-14 h-14 rounded-full object-cover ring-2 ring-rose-200" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                )}
                <span className="text-left">
                  <span className="block text-sm font-semibold text-slate-700">
                    {photoUploading ? 'আপলোড হচ্ছে...' : profilePhoto ? 'ছবি বদল করুন' : 'ছবি বাছাই করুন'}
                  </span>
                  <span className="block text-[11px] text-slate-500 mt-0.5">
                    JPG/PNG, সর্বোচ্চ ৫MB — ডিরেক্টরিতে প্রদর্শিত হবে
                  </span>
                </span>
                {photoUploading && <Loader2 className="w-4 h-4 animate-spin text-rose-600 ml-auto" />}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  রক্তদাতার পুরো নাম
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="যেমন: ফারহান কবীর"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  এলাকা (ময়মনসিংহ সিটি কর্পোরেশন)
                </label>
                <select
                  value={areaId}
                  onChange={(e) => setAreaId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  required
                >
                  {MCC_AREAS.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.nameBn} {area.wardNo ? `(ওয়ার্ড ${area.wardNo})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                সংক্ষিপ্ত পরিচিতি / মন্তব্য (ঐচ্ছিক)
              </label>
              <textarea
                rows={2}
                value={intro}
                onChange={(e) => setIntro(e.target.value)}
                placeholder="যেমন: জরুরি প্রয়োজনে পাশে পাবেন, ময়মনসিংহ মেডিকেল এলাকায় সহজে পৌঁছাতে পারি... (এই লেখাটি ডিরেক্টরিতে প্রকাশিত হবে)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  লিঙ্গ
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                >
                  <option value="male">পুরুষ</option>
                  <option value="female">নারী</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  জন্মসাল
                </label>
                <input
                  type="number"
                  min="1950"
                  max="2007"
                  value={birthYear}
                  onChange={(e) => setBirthYear(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  ওজন (কেজি - নূন্যতম ৪৫ কেজি)
                </label>
                <input
                  type="number"
                  min="45"
                  max="140"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  সর্বশেষ রক্তদানের তারিখ (যদি দিয়ে থাকেন)
                </label>
                <input
                  type="date"
                  value={lastDonationDate}
                  onChange={(e) => setLastDonationDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  এ পর্যন্ত মোট রক্তদানের সংখ্যা
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={donationCount}
                  onChange={(e) => setDonationCount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  required
                />
              </div>
            </div>

            {/* Availability switch */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="font-semibold text-sm text-slate-900 block">
                  রক্তদানের বর্তমান প্রস্তুতি
                </span>
                <span className="text-xs text-slate-600">
                  {isAvailable
                    ? 'আপনি বর্তমানে শারীরিক সুস্থ আছেন এবং রক্ত দিতে প্রস্তুত'
                    : 'আপনি সাময়িক অসুস্থ বা বিরতিতে আছেন (জরুরি কলের বাইরে রাখা হবে)'}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-700"></div>
              </label>
            </div>

            {/* Private Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                জরুরি যোগাযোগের মোবাইল নম্বর (গোপন ও সুরক্ষিত)
              </label>
              <input
                type="tel"
                value={privatePhone}
                onChange={(e) => setPrivatePhone(e.target.value)}
                placeholder="017xxxxxxxx"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">
                এই নম্বরে শুধুমাত্র অ্যাডমিন মডারেটর রোগী পক্ষের প্রেসক্রিপশন যাচাই করার পরেই যোগাযোগ সমন্বয় করবেন।
              </p>
            </div>

            {/* Agreement */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={agreePolicy}
                  onChange={(e) => setAgreePolicy(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-rose-700 focus:ring-rose-700"
                />
                <span>
                  আমি স্বেচ্ছায় ও মানবতার স্বার্থে রক্তদানে সম্মতি জানাচ্ছি এবং আমি নিশ্চিত করছি যে আমি কোনো আর্থিক সুবিধা গ্রহণ করব না।
                </span>
              </label>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3">
              <Link
                href="/profile"
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50"
              >
                বাতিল করুন
              </Link>
              <button
                type="submit"
                disabled={loading || !agreePolicy}
                className="px-6 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? 'নিবন্ধন হচ্ছে...' : 'রক্তদাতা হিসেবে নিবন্ধন সম্পন্ন করুন'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
