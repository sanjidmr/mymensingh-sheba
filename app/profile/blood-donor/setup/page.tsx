'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Heart,
  MapPin,
  Phone,
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
  /**
   * Whether the public card may show the "রক্তদানের বর্তমান প্রস্তুতি" panel.
   *
   * Off unless the donor switches it on. Readiness is the donor's own statement,
   * so the default is "do not publish it" rather than a status inferred for them.
   */
  const [showReadiness, setShowReadiness] = useState<boolean>(
    bloodDonorProfile?.showReadiness ?? false
  );
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
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  const handlePhoto = async (f: File | undefined) => {
    if (!f || !user?.id) return;
    if (!f.type.startsWith('image/') || f.size > 5 * 1024 * 1024) return;
    setPhotoUploading(true);
    setError('');
    const res = await uploadDonorProfilePhoto(user.id, f);
    setPhotoUploading(false);
    if (res.success && res.url) {
      setProfilePhoto(res.url);
    } else {
      setError(res.error || 'ছবি আপলোড ব্যর্থ হয়েছে।');
    }
  };

  const saveProfile = async (mode: 'draft' | 'submit') => {
    if (mode === 'submit' && (!fullName || !privatePhone || !agreePolicy)) {
      setError('নাম, ফোন নম্বর এবং নীতিমালায় সম্মতি প্রয়োজন।');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await activateBloodDonorProfile({
        fullName,
        bloodGroup,
        areaId,
        gender,
        birthYear: Number(birthYear),
        weightKg: Number(weightKg),
        isAvailable,
        showReadiness,
        lastDonationDate: lastDonationDate || undefined,
        donationCount: Number(donationCount),
        privatePhone,
        isVerified: false,
        intro: intro.trim() || undefined,
        profilePhotoUrl: profilePhoto || undefined,
      }, mode);
      if (!result.success) throw new Error(result.error || 'প্রোফাইল সংরক্ষণ ব্যর্থ হয়েছে।');
      setSuccess(true);
      setSuccessMessage(
        bloodDonorProfile?.status === 'approved'
          ? 'পরিবর্তন সংরক্ষিত হয়েছে। আপনার প্রোফাইল প্রকাশিত অবস্থায় আছে।'
          : mode === 'draft'
            ? 'খসড়া সংরক্ষণ হয়েছে। পরে সম্পাদনা করে জমা দিতে পারবেন।'
            : 'রক্তদাতা প্রোফাইল জমা হয়েছে! অ্যাডমিন অনুমোদনের পরে সক্রিয় হবে।'
      );
      setTimeout(() => {
        router.push('/dashboard/posts');
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'প্রোফাইল সংরক্ষণ ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void saveProfile('submit');
  };

  return (
    <div className="min-h-screen flex flex-col bg-mist-50">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 sm:py-12">
        <div className="mb-4 flex items-center gap-2 text-xs text-ink-400">
          <Link href="/profile" className="hover:text-brand-700 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>প্রোফাইলে ফিরে যান</span>
          </Link>
          <span>/</span>
          <span className="text-ink-800 font-semibold">রক্তদাতা (Blood Donor) প্রোফাইল সেটআপ</span>
        </div>

        <div className="bg-white rounded-2xl border border-brand-100  p-6 sm:p-8">
          <div className="flex items-center gap-3.5 mb-6 pb-6 border-b border-brand-100">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-500 flex items-center justify-center shrink-0">
              <Heart className="w-6 h-6 fill-rose-500" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-ink-900">
                স্বেচ্ছাসেবক রক্তদাতা নিবন্ধন
              </h1>
              <p className="text-xs sm:text-sm text-ink-500 mt-0.5">
                ময়মনসিংহের কোনো মুমূর্ষু রোগীর প্রয়োজনে রক্ত দিতে নিজেকে তালিকাভুক্ত করুন
              </p>
            </div>
          </div>

          {error && (
            <div role="alert" className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-ink-900 flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-rose-500 shrink-0" />
              <span className="text-sm font-semibold">
                {successMessage}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Blood Group Selection */}
            <div>
              <label className="block text-xs font-semibold text-ink-800 mb-2">
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
                          ? 'bg-rose-500 text-white border-rose-500  scale-102'
                          : 'bg-white text-ink-800 border-brand-100 hover:bg-rose-50'
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
              <label className="block text-xs font-semibold text-ink-800 mb-2">
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
                className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-brand-200 hover:border-rose-400 w-full bg-mist-50 transition-colors"
              >
                {profilePhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profilePhoto} alt="প্রোফাইল" className="w-14 h-14 rounded-full object-cover ring-2 ring-rose-200" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                )}
                <span className="text-left">
                  <span className="block text-sm font-semibold text-ink-700">
                    {photoUploading ? 'আপলোড হচ্ছে...' : profilePhoto ? 'ছবি বদল করুন' : 'ছবি বাছাই করুন'}
                  </span>
                  <span className="block text-[11px] text-ink-400 mt-0.5">
                    JPG/PNG, সর্বোচ্চ ৫MB — ডিরেক্টরিতে প্রদর্শিত হবে
                  </span>
                </span>
                {photoUploading && <Loader2 className="w-4 h-4 animate-spin text-rose-500 ml-auto" />}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink-800 mb-1.5">
                  রক্তদাতার পুরো নাম
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="যেমন: ফারহান কবীর"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-800 mb-1.5">
                  এলাকা (ময়মনসিংহ সিটি কর্পোরেশন)
                </label>
                <select
                  value={areaId}
                  onChange={(e) => setAreaId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
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
              <label className="block text-xs font-semibold text-ink-800 mb-1.5">
                সংক্ষিপ্ত পরিচিতি / মন্তব্য (ঐচ্ছিক)
              </label>
              <textarea
                rows={2}
                value={intro}
                onChange={(e) => setIntro(e.target.value)}
                placeholder="যেমন: জরুরি প্রয়োজনে পাশে পাবেন, ময়মনসিংহ মেডিকেল এলাকায় সহজে পৌঁছাতে পারি... (এই লেখাটি ডিরেক্টরিতে প্রকাশিত হবে)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink-800 mb-1.5">
                  লিঙ্গ
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="male">পুরুষ</option>
                  <option value="female">নারী</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-800 mb-1.5">
                  জন্মসাল
                </label>
                <input
                  type="number"
                  min="1950"
                  max="2007"
                  value={birthYear}
                  onChange={(e) => setBirthYear(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-800 mb-1.5">
                  ওজন (কেজি - নূন্যতম ৪৫ কেজি)
                </label>
                <input
                  type="number"
                  min="45"
                  max="140"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink-800 mb-1.5">
                  সর্বশেষ রক্তদানের তারিখ (যদি দিয়ে থাকেন)
                </label>
                <input
                  type="date"
                  value={lastDonationDate}
                  onChange={(e) => setLastDonationDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-800 mb-1.5">
                  এ পর্যন্ত মোট রক্তদানের সংখ্যা
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={donationCount}
                  onChange={(e) => setDonationCount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
            </div>

            {/* Availability switch */}
            <div className="p-4 rounded-xl border border-brand-100 bg-mist-50 flex items-center justify-between">
              <div>
                <span className="font-semibold text-sm text-ink-900 block">
                  এখন রক্ত দিতে প্রস্তুত?
                </span>
                <span className="text-xs text-ink-500">
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
                <div className="w-11 h-6 bg-brand-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-brand-200 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
              </label>
            </div>

            {/* Readiness visibility — the public-card opt-in */}
            <div className="rounded-xl border border-brand-100 bg-mist-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="block text-sm font-semibold text-ink-900">
                    কার্ডে “রক্তদানের বর্তমান প্রস্তুতি” দেখান
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-ink-500">
                    চালু করলে ডিরেক্টরির কার্ডে সর্বশেষ রক্তদানের তারিখ অনুযায়ী আপনার প্রস্তুতির তথ্য
                    দেখানো হবে। বন্ধ থাকলে কার্ডে এই তথ্য কিছুই দেখানো হবে না।
                  </span>
                </div>
                <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={showReadiness}
                    onChange={(e) => setShowReadiness(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-brand-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-brand-200 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                </label>
              </div>
            </div>

            {/* Private Phone */}
            <div>
              <label className="block text-xs font-semibold text-ink-800 mb-1.5">
                জরুরি যোগাযোগের মোবাইল নম্বর
              </label>
              <input
                type="tel"
                value={privatePhone}
                onChange={(e) => setPrivatePhone(e.target.value)}
                placeholder="017xxxxxxxx"
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
              <p className="text-[11px] text-ink-400 mt-1">
                অনুমোদিত প্রোফাইলে এই নম্বরটি কোথাও লেখা হিসেবে দেখানো হয় না; রোগী বা স্বজন কার্ডের “কল করুন” চেপে সরাসরি এই নম্বরে কল করবেন।
              </p>
            </div>

            {/* Agreement */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-ink-700">
                <input
                  type="checkbox"
                  checked={agreePolicy}
                  onChange={(e) => setAgreePolicy(e.target.checked)}
                  className="mt-0.5 rounded border-brand-200 text-rose-500 focus:ring-rose-500"
                />
                <span>
                  আমি স্বেচ্ছায় ও মানবতার স্বার্থে রক্তদানে সম্মতি জানাচ্ছি এবং আমি নিশ্চিত করছি যে আমি কোনো আর্থিক সুবিধা গ্রহণ করব না।
                </span>
              </label>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3">
              {bloodDonorProfile?.status !== 'approved' && (
                <button
                  type="button"
                  onClick={() => void saveProfile('draft')}
                  disabled={loading || photoUploading}
                  className="px-4 py-2.5 rounded-xl border border-brand-200 text-brand-800 text-xs font-semibold hover:bg-brand-50 disabled:opacity-50"
                >
                  {loading ? 'সংরক্ষণ হচ্ছে...' : 'খসড়া সংরক্ষণ'}
                </button>
              )}
              <Link
                href="/profile"
                className="px-4 py-2.5 rounded-xl border border-brand-100 text-ink-700 text-xs font-medium hover:bg-mist-50"
              >
                বাতিল করুন
              </Link>
              <button
                type="submit"
                disabled={loading || !agreePolicy}
                className="px-6 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-500 text-white text-xs font-semibold  flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span>
                  {loading
                    ? 'সংরক্ষণ হচ্ছে...'
                    : bloodDonorProfile?.status === 'approved'
                      ? 'পরিবর্তন সংরক্ষণ'
                      : 'রক্তদাতা হিসেবে নিবন্ধন সম্পন্ন করুন'}
                </span>
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
