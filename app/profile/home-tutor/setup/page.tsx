'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  MapPin,
  Phone,
  BookOpen,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Video,
  Home as HomeIcon,
  RefreshCw,
  ImagePlus,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { MCC_AREAS } from '@/lib/locations';
import { uploadTutorProfilePhoto } from '@/lib/home-tutor-service';
import { TUTOR_TEACHING_MODE_LABELS, TUTOR_AVAILABILITY_LABELS } from '@/lib/home-tutor-types';
import type { TutorAvailability, TutorTeachingMode } from '@/lib/supabase/types';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const COMMON_INSTITUTIONS = [
  'আনন্দ মোহন কলেজ, ময়মনসিংহ',
  'ময়মনসিংহ মেডিকেল কলেজ',
  'বাংলাদেশ কৃষি বিশ্ববিদ্যালয় (বাকৃবি)',
  'নাসিরাবাদ সরকারি কলেজ',
  'মুমিনুন্নিসা সরকারি মহিলা কলেজ',
  'ময়মনসিংহ ইঞ্জিনিয়ারিং কলেজ',
  'কমিউনিটি বেসড মেডিকেল কলেজ',
  'অন্যান্য',
];

const AVAILABLE_CLASSES = [
  '১ম - ৫ম শ্রেণি',
  '৬ষ্ঠ - ৮ম শ্রেণি',
  '৯ম - ১০ম শ্রেণি (SSC)',
  'একাদশ - দ্বাদশ শ্রেণি (HSC)',
  'ভর্তি পরীক্ষা / এডমিশন',
];

const AVAILABLE_SUBJECTS = [
  'সাধারণ গণিত',
  'উচ্চতর গণিত',
  'পদার্থবিজ্ঞান',
  'রসায়ন',
  'জীববিজ্ঞান',
  'ইংরেজি',
  'বাংলা',
  'তথ্য ও যোগাযোগ প্রযুক্তি (ICT)',
  'সকল বিষয় (প্রাথমিক/জুনিয়র)',
];

export default function HomeTutorSetupPage() {
  const router = useRouter();
  const { user, homeTutorProfile, activateHomeTutorProfile } = useAuth();

  const [fullName, setFullName] = useState(homeTutorProfile?.fullName || user?.fullName || '');
  const [gender, setGender] = useState<'male' | 'female'>(homeTutorProfile?.gender || 'male');
  const [institution, setInstitution] = useState(
    homeTutorProfile?.institution || 'আনন্দ মোহন কলেজ, ময়মনসিংহ'
  );
  const [customInstitution, setCustomInstitution] = useState('');
  const [department, setDepartment] = useState(homeTutorProfile?.department || '');
  const [qualification, setQualification] = useState(homeTutorProfile?.qualification || '');
  const [experienceYears, setExperienceYears] = useState(homeTutorProfile?.experienceYears || 2);
  const [selectedAreas, setSelectedAreas] = useState<string[]>(
    homeTutorProfile?.preferredAreas || ['charpara', 'ganginarpar']
  );
  const [selectedClasses, setSelectedClasses] = useState<string[]>(
    homeTutorProfile?.preferredClasses || ['৯ম - ১০ম শ্রেণি (SSC)', 'একাদশ - দ্বাদশ শ্রেণি (HSC)']
  );
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    homeTutorProfile?.preferredSubjects || ['সাধারণ গণিত', 'পদার্থবিজ্ঞান']
  );
  const [salaryMin, setSalaryMin] = useState(homeTutorProfile?.expectedSalaryMin || 3000);
  const [salaryMax, setSalaryMax] = useState(homeTutorProfile?.expectedSalaryMax || 6000);
  const [daysPerWeek, setDaysPerWeek] = useState(homeTutorProfile?.daysPerWeek || 3);
  const [bio, setBio] = useState(homeTutorProfile?.bio || '');
  const [privatePhone, setPrivatePhone] = useState(
    homeTutorProfile?.privatePhone || user?.phone || ''
  );
  const [teachingMode, setTeachingMode] = useState<TutorTeachingMode>(
    homeTutorProfile?.teachingMode || 'both'
  );
  const [availability, setAvailability] = useState<TutorAvailability>(
    homeTutorProfile?.availability || 'available'
  );
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(homeTutorProfile?.profilePhotoUrl || '');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const toggleArea = (id: string) => {
    setSelectedAreas((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const toggleClass = (cls: string) => {
    setSelectedClasses((prev) =>
      prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls]
    );
  };

  const toggleSubject = (sub: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
    );
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setPhotoUploading(true);
    const res = await uploadTutorProfilePhoto(user.id, file);
    setPhotoUploading(false);
    if (res.success && res.url) {
      setProfilePhotoUrl(res.url);
    } else {
      alert(res.error || 'ছবি আপলোড ব্যর্থ হয়েছে');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !department || selectedAreas.length === 0) return;

    const finalInstitution = institution === 'অন্যান্য' ? customInstitution || 'অন্যান্য' : institution;

    setLoading(true);
    await activateHomeTutorProfile({
      fullName,
      gender,
      institution: finalInstitution,
      department,
      qualification,
      experienceYears: Number(experienceYears),
      preferredAreas: selectedAreas,
      preferredClasses: selectedClasses,
      preferredSubjects: selectedSubjects,
      expectedSalaryMin: Number(salaryMin),
      expectedSalaryMax: Number(salaryMax),
      daysPerWeek: Number(daysPerWeek),
      bio,
      privatePhone,
      isVerified: false,
      teachingMode,
      availability,
      profilePhotoUrl,
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
          <span className="text-slate-800 font-semibold">গৃহশিক্ষক (Home Tutor) প্রোফাইল সেটআপ</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3.5 mb-6 pb-6 border-b border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                গৃহশিক্ষক প্রোফাইল সেটআপ
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                ময়মনসিংহ শহরের শিক্ষার্থী ও অভিভাবকদের জন্য আপনার শিক্ষক প্রোফাইল সাজান
              </p>
            </div>
          </div>

          {success && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
<span className="text-sm font-semibold">
                গৃহশিক্ষক প্রোফাইল জমা হয়েছে! অ্যাডমিন অনুমোদনের পরে সক্রিয় হবে।
              </span>
            </div>
          )}

          {/* Strict Privacy Protection Notice */}
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-3">
            <Lock className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-sm block mb-1">
                শিক্ষকদের ব্যক্তিগত তথ্যের কঠোর সুরক্ষা:
              </span>
              আপনার মোবাইল নম্বরটি পাবলিক ডিরেক্টরিতে কখনোই সরাসরি দেখানো হবে না। কোনো অভিভাবক আপনার প্রোফাইল দেখে টিউশন রিকোয়েস্ট পাঠালে, অ্যাডমিন টিম উভয় পক্ষের ভেরিফিকেশনের পরই কেবল যোগাযোগ সমন্বয় করবে।
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile photo (optional) */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                প্রোফাইল ছবি (ঐচ্ছিক)
              </label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                  {profilePhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profilePhotoUrl} alt="প্রোফাইল ছবি" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-emerald-400">
                      {fullName.charAt(0) || '?'}
                    </div>
                  )}
                </div>
                <label className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 inline-flex items-center gap-1.5 cursor-pointer hover:bg-slate-50">
                  {photoUploading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ImagePlus className="w-3.5 h-3.5" />
                  )}
                  {photoUploading ? 'আপলোড হচ্ছে...' : 'ছবি বাছাই করুন'}
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
                {profilePhotoUrl && (
                  <button
                    type="button"
                    onClick={() => setProfilePhotoUrl('')}
                    className="text-xs text-slate-500 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> মুছুন
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                ছবিটি পাবলিক প্রোফাইলে দেখা যাবে। সর্বোচ্চ ৫MB।
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  শিক্ষকের পুরো নাম
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="যেমন: তানজিম আহমেদ"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  লিঙ্গ
                </label>
                <div className="flex gap-3 pt-1">
                  <label className="flex items-center gap-2 text-sm text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      checked={gender === 'male'}
                      onChange={() => setGender('male')}
                      className="text-emerald-800 focus:ring-emerald-700"
                    />
                    <span>পুরুষ শিক্ষক</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      checked={gender === 'female'}
                      onChange={() => setGender('female')}
                      className="text-emerald-800 focus:ring-emerald-700"
                    />
                    <span>মহিলা শিক্ষিকা</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  শিক্ষা প্রতিষ্ঠান
                </label>
                <select
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  required
                >
                  {COMMON_INSTITUTIONS.map((inst) => (
                    <option key={inst} value={inst}>
                      {inst}
                    </option>
                  ))}
                </select>
                {institution === 'অন্যান্য' && (
                  <input
                    type="text"
                    value={customInstitution}
                    onChange={(e) => setCustomInstitution(e.target.value)}
                    placeholder="প্রতিষ্ঠানের নাম লিখুন"
                    className="w-full mt-2 px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  বিভাগ / বিষয়
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="যেমন: গণিত বিভাগ / পদার্থবিজ্ঞান"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  শিক্ষাগত যোগ্যতা
                </label>
                <input
                  type="text"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  placeholder="যেমন: B.Sc Honours (3rd Year)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  শিক্ষকতার অভিজ্ঞতা (বছর)
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  সপ্তাহে পড়ানোর দিন
                </label>
                <select
                  value={daysPerWeek}
                  onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                >
                  <option value={2}>২ দিন</option>
                  <option value={3}>৩ দিন</option>
                  <option value={4}>৪ দিন</option>
                  <option value={5}>৫ দিন</option>
                </select>
              </div>
            </div>

            {/* Preferred Classes */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                যেসব শ্রেণি পড়াতে আগ্রহী (একাধিক নির্বাচন করা যাবে)
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_CLASSES.map((cls) => {
                  const active = selectedClasses.includes(cls);
                  return (
                    <button
                      type="button"
                      key={cls}
                      onClick={() => toggleClass(cls)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                        active
                          ? 'bg-emerald-800 text-white border-emerald-800'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {cls}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preferred Subjects */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                যেসব বিষয় পড়াতে আগ্রহী
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_SUBJECTS.map((sub) => {
                  const active = selectedSubjects.includes(sub);
                  return (
                    <button
                      type="button"
                      key={sub}
                      onClick={() => toggleSubject(sub)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                        active
                          ? 'bg-emerald-800 text-white border-emerald-800'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {sub}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preferred Areas within MCC */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                পছন্দের এলাকা (শুধুমাত্র ময়মনসিংহ সিটি কর্পোরেশন)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 max-h-48 overflow-y-auto">
                {MCC_AREAS.map((area) => {
                  const active = selectedAreas.includes(area.id);
                  return (
                    <label
                      key={area.id}
                      className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() => toggleArea(area.id)}
                        className="rounded border-slate-300 text-emerald-800 focus:ring-emerald-700"
                      />
                      <span className="truncate">{area.nameBn}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Expected Salary Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  সর্বনিম্ন প্রত্যাশিত বেতন (৳)
                </label>
                <input
                  type="number"
                  step="500"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  সর্বোচ্চ প্রত্যাশিত বেতন (৳)
                </label>
                <input
                  type="number"
                  step="500"
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  required
                />
              </div>
            </div>

            {/* Teaching mode */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                পড়ানোর মাধ্যম
              </label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(TUTOR_TEACHING_MODE_LABELS) as TutorTeachingMode[]).map((mode) => {
                  const active = teachingMode === mode;
                  return (
                    <button
                      type="button"
                      key={mode}
                      onClick={() => setTeachingMode(mode)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors ${
                        active
                          ? 'bg-emerald-800 text-white border-emerald-800'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {mode === 'home' && <HomeIcon className="inline w-3.5 h-3.5 mr-1" />}
                      {mode === 'online' && <Video className="inline w-3.5 h-3.5 mr-1" />}
                      {TUTOR_TEACHING_MODE_LABELS[mode]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Availability */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                বর্তমান প্রাপ্যতা
              </label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(TUTOR_AVAILABILITY_LABELS) as TutorAvailability[]).map((av) => {
                  const active = availability === av;
                  return (
                    <button
                      type="button"
                      key={av}
                      onClick={() => setAvailability(av)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors ${
                        active
                          ? 'bg-emerald-800 text-white border-emerald-800'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {TUTOR_AVAILABILITY_LABELS[av].labelBn}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                অভিজ্ঞতা ও শিক্ষাদান পদ্ধতি সম্পর্কে সংক্ষেপে
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="যেমন: বিগত ৩ বছর ধরে শিক্ষার্থীদের যত্ন নিয়ে বিজ্ঞান ও গণিত পড়াচ্ছি..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            {/* Private contact */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                যোগাযোগের মোবাইল নম্বর (সুরক্ষিত থাকবে)
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
                এই নম্বরে শুধুমাত্র ময়মনসিংহ সেবা অ্যাডমিন টিম টিউশন রিকোয়েস্ট সমন্বয় করতে যোগাযোগ করবে।
              </p>
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
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>{loading ? 'সংরক্ষণ হচ্ছে...' : 'শিক্ষক প্রোফাইল সক্রিয় করুন'}</span>
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
